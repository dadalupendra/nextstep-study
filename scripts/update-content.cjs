'use strict';
/**
 * NextStep scheduled source sync.
 * Source: evanclan/OpenJLPT (CC BY-SA 4.0). Existing NextStep editorial work is preserved.
 * This deliberately does NOT invent new JLPT lessons or reassign chapters when sources change.
 * If an upstream level changes its target list, the sync stops for human review.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const URL_ROOT = 'https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json';
const TYPES = ['kanji', 'vocab', 'grammar'];
const LEVELS = ['n1', 'n2'];
const changedFiles = [];
const checkOnly = process.argv.includes('--check');

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, text) => {
  const full = path.join(ROOT, p);
  if (fs.readFileSync(full, 'utf8') !== text) {
    changedFiles.push(p);
    if (!checkOnly) fs.writeFileSync(full, text, 'utf8');
  }
};
function assert(ok, message) {
  if (!ok) throw new Error(message);
}
function ensureUnique(collection, key, label) {
  const result = new Map();
  for (const item of collection) {
    assert(item && typeof item === 'object', label + ': invalid item');
    const id = String(item[key] || '');
    assert(id && !result.has(id), label + ': missing/duplicate ' + key + ' ' + id);
    result.set(id, item);
  }
  return result;
}
async function download(type, level) {
  const url = URL_ROOT + '/' + type + '/' + level + '.json';
  let failure;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'NextStep-Study-Safe-Source-Sync' },
        signal: AbortSignal.timeout(30000),
        cache: 'no-store'
      });
      assert(response.ok, 'upstream status ' + response.status + ': ' + url);
      const data = await response.json();
      assert(Array.isArray(data) && data.length >= 100,
        'source too short: ' + type + '/' + level);
      assert(data.every(item => item.level === level.toUpperCase()),
        'mixed JLPT levels in ' + type + '/' + level);
      return data;
    } catch (error) {
      failure = error;
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 1500));
    }
  }
  throw new Error('Download failed: ' + url + '\n' + failure);
}
function identical(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function limitChanged(before, after, max, label) {
  assert(before.length === after.length,
    label + ': source target count changed; review this level manually first (' +
    before.length + ' → ' + after.length + ')');
  let modified = 0;
  for (let i = 0; i < before.length; i++) if (!identical(before[i], after[i])) modified++;
  assert(modified <= max,
    label + ': unusually large change (' + modified + ' entries). Review before publishing.');
  console.log(label + ': ' + modified + ' existing entries changed');
}
function readN2Assignment(file, name) {
  const code = read(file);
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { timeout: 10000, filename: file });
  const data = sandbox.window[name];
  assert(data && typeof data === 'object', 'Unable to parse ' + file);
  return data;
}
function jsonScript(file, variable, value, header) {
  write(file, header + '\nwindow.' + variable + '=' + JSON.stringify(value) + ';\n');
}
function alignByIdentifier(current, fresh, idField, label) {
  const lookup = ensureUnique(fresh, idField, label + ' source');
  ensureUnique(current, idField, label + ' stored');
  assert(lookup.size === current.length,
    label + ': new or deleted target items require review; refusing to reorder chapters.');
  return current.map(item => {
    const updated = lookup.get(String(item[idField]));
    assert(updated, label + ': missing original target ' + item[idField]);
    return updated;
  });
}
function updateN1(remote) {
  for (const type of TYPES) {
    const file = 'N1/data/' + type + '.json';
    const existing = JSON.parse(read(file));
    const source = remote.n1[type];
    const key = type === 'kanji' ? 'character' : type === 'grammar' ? 'pattern' : 'id';
    const next = alignByIdentifier(existing, source, key, 'N1 ' + type);
    const minimum = type === 'kanji' ? 700 : type === 'grammar' ? 123 : 1000;
    assert(next.length >= minimum, 'N1 ' + type + ': book target count insufficient');
    limitChanged(existing, next, Math.max(15, Math.ceil(next.length * 0.07)), 'N1 ' + type);
    if (!identical(existing, next)) write(file, JSON.stringify(next, null, 2) + '\n');
  }
}
function updateN2(remote) {
  const wd = readN2Assignment('N2/data.js', 'NEXTSTEP_N2_DATA');
  const gd = readN2Assignment('N2/grammar-data.js', 'NEXTSTEP_N2_GRAMMAR');
  const newWords = remote.n2.vocab;
  const newKanji = remote.n2.kanji;
  const newGrammar = remote.n2.grammar;

  assert(wd.words.length === 1778 && newWords.length === 1778, 'N2 vocabulary target count changed');
  assert(wd.kanji.length === 398 && newKanji.length === 398, 'N2 kanji target count changed');
  assert(gd.patterns.length === 123 && newGrammar.length === 123, 'N2 grammar target count changed');

  const vocabById = ensureUnique(newWords, 'id', 'N2 vocabulary');
  const storedWordIds = new Set();
  const words = wd.words.map(word => {
    const id = word[3];
    assert(!storedWordIds.has(id), 'N2 duplicate stored word ' + id);
    storedWordIds.add(id);
    const item = vocabById.get(id);
    assert(item && item.level === 'N2', 'N2 word removed/releveled: ' + id);
    const ex = Array.isArray(item.examples) ? item.examples : [];
    return [
      item.word, item.reading, (item.meanings || []).join('; '), item.id,
      (item.pos || []).join(', '),
      ex[0]?.ja || '', ex[0]?.en || '', ex[1]?.ja || '', ex[1]?.en || '',
      ex[0]?.furigana || '', ex[1]?.furigana || ''
    ];
  });
  assert(storedWordIds.size === vocabById.size, 'N2 source added new vocabulary targets');
  limitChanged(wd.words, words, 160, 'N2 vocabulary');
  const kanjiToWordIndexes = new Map(wd.kanji.map(row => [row[0], []]));
  words.forEach((word, index) => {
    const chars = new Set(word[0].match(/[\u3400-\u9FFF]/gu) || []);
    for (const char of chars) {
      if (kanjiToWordIndexes.has(char)) kanjiToWordIndexes.get(char).push(index);
    }
  });
  const kanjiByCharacter = ensureUnique(newKanji, 'character', 'N2 kanji');
  const chars = wd.kanji.map(row => {
    const character = row[0], item = kanjiByCharacter.get(character);
    assert(item && item.level === 'N2', 'N2 kanji removed/releveled ' + character);
    return [
      character, kanjiToWordIndexes.get(character), item.meanings,
      item.onyomi, item.kunyomi, item.strokes, item.radical,
      (item.words || []).slice(0, 6), item.grade, item.freq, item.supplementary || false
    ];
  });
  assert(new Set(chars.map(k => k[0])).size === kanjiByCharacter.size,
    'N2 source added new kanji targets');
  limitChanged(wd.kanji, chars, 90, 'N2 kanji');

  const grammarByPattern = ensureUnique(newGrammar, 'pattern', 'N2 grammar');
  const patterns = gd.patterns.map(row => {
    const item = grammarByPattern.get(row[0]);
    assert(item && item.level === 'N2', 'N2 grammar removed/releveled ' + row[0]);
    const ex = Array.isArray(item.examples) ? item.examples : [];
    return [
      item.pattern, item.meaning, ex[0]?.ja || '', ex[0]?.en || '',
      item.notes || '', row[5], // PRESERVE personally edited Nepali grammar explanation.
      item.formation || '', ex[1]?.ja || '', ex[1]?.en || '',
      item.tags || [], item.reading || '', ex[2]?.ja || '', ex[2]?.en || '',
      ex[0]?.furigana || '', ex[1]?.furigana || '', ex[2]?.furigana || ''
    ];
  });
  assert(new Set(patterns.map(g => g[0])).size === grammarByPattern.size,
    'N2 source added new grammar targets');
  assert(patterns.every(g => typeof g[5] === 'string' && g[5]),
    'N2 original Nepali explanations were lost');
  limitChanged(gd.patterns, patterns, 30, 'N2 grammar');

  if (!identical(wd.words, words) || !identical(wd.kanji, chars)) {
    wd.words = words;
    wd.kanji = chars;
    jsonScript('N2/data.js', 'NEXTSTEP_N2_DATA', wd,
      '/* Auto-synced, N2-only OpenJLPT tagged vocabulary and kanji (CC BY-SA 4.0). See CREDITS.md. */');
  }
  if (!identical(gd.patterns, patterns)) {
    gd.patterns = patterns;
    jsonScript('N2/grammar-data.js', 'NEXTSTEP_N2_GRAMMAR', gd,
      '/* Auto-synced, N2-only OpenJLPT grammar; existing Nepali notes retained. See CREDITS.md. */');
  }
}
async function main() {
  const remote = {};
  for (const level of LEVELS) {
    remote[level] = {};
    for (const type of TYPES) remote[level][type] = await download(type, level);
  }
  updateN1(remote);
  updateN2(remote);
  if (changedFiles.length) console.log((checkOnly ? 'Would update:\n' : 'Updated:\n') + changedFiles.join('\n'));
  else console.log('No upstream changes affecting current N1/N2 targets. Nothing to publish.');
  console.log(checkOnly ? 'Check-only mode: no files written.' : 'Safe content refresh finished.');
}
main().catch(error => {
  console.error('SAFE UPDATE STOPPED: ' + (error?.stack || error));
  process.exitCode = 1;
});
