/* Exam Paper Kanji & Vocabulary Glossary — all JLPT N5–N1 papers.
 * Read-only sourced dictionary aids, immediately below each question.
 * Exam mode: question stem ONLY, never answer choices / listening transcript
 * until submitted. Option words are available after review or opt-in
 * Practice Mode answer reveal. No answer keys referenced here.
 */
(function(global){'use strict';
const LEVELS=['N5','N4','N3','N2','N1'];
const cache=new Map(),LIMIT=28;
const knownKanji=/[\u3400-\u9fff\uf900-\ufaff]/u;
const validLevel=level=>LEVELS.includes(level);
const vocabValid=x=>x&&typeof x.word==='string'&&x.word.trim()&&typeof x.reading==='string'&&x.reading.trim()&&(Array.isArray(x.meanings)?x.meanings.length:Boolean(x.meaning));
const gloss=x=>Array.isArray(x.meanings)?x.meanings.filter(v=>typeof v==='string').join(', '):String(x.meaning||'');
const el=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=String(value);return node};
function kanjiValid(item){return item&&typeof item.character==='string'&&knownKanji.test(item.character)&&Array.isArray(item.meanings)}
async function sourceJson(url){const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();if(!Array.isArray(data))throw Error('Expected word list');return data}
async function loadVocab(level){
 try{return await sourceJson('../'+level+'/data/vocab.json')}
 catch(error){
  if(level==='N2'){
   if(!global.NEXTSTEP_N2_DATA?.words)await new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='../N2/data.js';
    script.onload=resolve;script.onerror=()=>reject(Error('N2 vocabulary source failed'));document.head.append(script)
   });
   const words=global.NEXTSTEP_N2_DATA?.words;
   if(!Array.isArray(words))throw Error('Invalid N2 vocabulary source');
   return words.map(w=>({word:w[0],reading:w[1],meanings:[w[2]],pos:String(w[4]||'').split(', ')}))
  }
  if(level==='N3'){
   try{return await sourceJson('https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/vocab/n3.json')}
   catch{throw Error('N3 dictionary unavailable; Kanji details still work')}
  }
  throw error
 }
}
async function load(level){
 if(!validLevel(level))throw Error('Unknown JLPT level');
 if(cache.has(level))return cache.get(level);
 const job=(async()=>{
  const [kanji,vocab]=await Promise.allSettled([sourceJson('../'+level+'/data/kanji.json'),loadVocab(level)]);
  if(kanji.status==='rejected'&&vocab.status==='rejected')throw Error('No level dictionary available');
  const k=kanji.status==='fulfilled'?kanji.value.filter(kanjiValid):[];
  const byKanji=new Map(k.map(x=>[x.character,x]));
  const v=vocab.status==='fulfilled'?vocab.value.filter(vocabValid):[];
  const vocabulary=new Map();
  for(const entry of v){
   const word=entry.word.trim();
   // A single kana character is too ambiguous to match in Japanese prose.
   if([...word].length<2&&!knownKanji.test(word))continue;
   if(!vocabulary.has(word))vocabulary.set(word,entry);
  }
  // Include all actual source entries; do not insert demo definitions.
  const terms=[...vocabulary.values()].sort((a,b)=>b.word.length-a.word.length||a.word.localeCompare(b.word,'ja'));
  return {kanji:byKanji,terms,vocabAvailable:vocab.status==='fulfilled',kanjiAvailable:kanji.status==='fulfilled'};
 })();
 cache.set(level,job);
 try{return await job}catch(error){cache.delete(level);throw error}
}
function recognized(input,source){
 let text=String(input||'');
 // Trim synthetic prompt section markers; retain the original Japanese words.
 text=text.replace(/【(?:文法|文字|語彙|質問|読解|聴解|お知らせ|例文)】/g,' ');
 const words=[],ranges=[];
 for(const item of source.terms){
  const term=item.word,at=text.indexOf(term);
  if(at<0)continue;
  // One matching instance is enough to display vocabulary meaning.
  for(let pos=at;pos>=0;pos=text.indexOf(term,pos+term.length)){
   const end=pos+term.length;
   if(ranges.some(([start,stop])=>pos<stop&&end>start))continue;
   words.push({type:'vocab',word:term,entry:item,offset:pos});
   ranges.push([pos,end]);break
  }
  if(words.length>=LIMIT*3)break;
 }
 const kanji=[],seen=new Set();
 for(const c of text){
  if(!knownKanji.test(c)||seen.has(c)||!source.kanji.has(c))continue;
  seen.add(c);
  kanji.push({type:'kanji',word:c,entry:source.kanji.get(c),offset:text.indexOf(c)})
 }
 return [...words,...kanji].sort((a,b)=>a.offset-b.offset||b.word.length-a.word.length);
}
function reading(match){const a=match.entry;return match.type==='kanji'?
 [...(a.onyomi||[]),...(a.kunyomi||[])].join(' · '):a.reading}
function japanesePronunciation(word){
 if(!('speechSynthesis'in global))return;
 global.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(word);speech.lang='ja-JP';speech.rate=.85;
 const voice=global.speechSynthesis.getVoices().find(x=>x.lang.toLowerCase().startsWith('ja'));if(voice)speech.voice=voice;
 global.speechSynthesis.speak(speech)
}
function sourceText(q,{review=false}={}){
 // No hidden listening transcript is provided before review.
 const question=String(q.prompt||'');
 if(!review)return question;
 return question+'\n'+(Array.isArray(q.options)?q.options.join('　'):'')+'\n'+String(q.passage||'')
}
function translationTarget(){
 const value=global.NextStepExamLanguage?.getLanguage?.();
 return value||'ne'
}
function listRow(match){
 const item=match.entry,row=el('article','ns-glossary-entry');
 const left=el('div','ns-glossary-entry-head');
 left.append(el('strong','ns-glossary-word',match.word));
 left.append(el('span','ns-glossary-reading',reading(match)||'Reading not in source'));
 const type=match.type==='kanji'?'漢字 Kanji':'語彙 Vocabulary';
 left.append(el('small','ns-glossary-type',type));row.append(left);
 row.append(el('p','ns-glossary-meaning',gloss(item)));
 const buttons=el('div','ns-glossary-buttons');
 const speak=el('button','ns-glossary-action','🔊 Read');speak.type='button';speak.onclick=()=>japanesePronunciation(match.word);
 const translate=el('button','ns-glossary-action','🌍 Translate');translate.type='button';
 const output=el('div','ns-glossary-translation');output.setAttribute('role','status');output.setAttribute('aria-live','polite');
 translate.onclick=async()=>{
  const target=translationTarget();
  const base=['Japanese '+type+': '+match.word,'Reading: '+reading(match),'Meaning: '+gloss(item),
   ...(match.type==='kanji'?['On-yomi: '+(item.onyomi||[]).join(', '),'Kun-yomi: '+(item.kunyomi||[]).join(', '),'Radical: '+(item.radical||'')]:[])].join('\n');
  translate.disabled=true;output.textContent='⏳ Translating into '+target+'…';
  try{
   const provider=global.NextStepExamLanguage?.translate||global.NextStepTranslate?.requestTranslation;
   if(!provider)throw Error('Translation service unavailable');
   const translated=await provider(base,'en',target);
   output.textContent=translated||base;
  }catch(e){
   output.textContent='Translation unavailable. The source meaning is shown above. ';
   const link=el('a','ns-external-translation','Translate in browser ↗');
   link.href='https://translate.google.com/?'+new URLSearchParams({sl:'en',tl:target,text:base.slice(0,4000),op:'translate'});
   link.target='_blank';link.rel='noopener noreferrer';output.append(link)
  }finally{translate.disabled=false}
 };
 buttons.append(speak,translate);
 const url='../mobile-app/learn.html?'+new URLSearchParams({level:row.dataset.level||'',section:'vocab',word:match.word});
 // Use an explicit level chosen by the exam screen, not untrusted URL content.
 row.dataset.word=match.word;
 row.append(buttons,output);return row
}
function mount(q,level,{review=false}={}){
 const section=el('section','ns-exam-glossary');
 section.setAttribute('aria-label','Kanji and vocabulary meanings below question');
 section.dataset.level=level;
 const head=el('div','ns-glossary-heading');
 const title=el('h3',null,'📖 Question Words & Kanji · 単語と漢字の意味');
 head.append(title);
 const summary=el('p','ns-glossary-note',review?
 'Study words from the question, all choices and listening script after review.':
 'Study words from the question only. Answer choices and hidden listening audio are not analyzed before review.');
 section.append(head,summary);
 const area=el('div','ns-glossary-entries');
 section.append(area);
 const status=el('p','ns-glossary-status','Loading verified '+level+' word meanings…');
 status.setAttribute('role','status');area.append(status);
 const detail=el('details','ns-glossary-info');detail.append(el('summary',null,'How is this glossary generated?'),el('p',null,
  'Vocabulary and Kanji are matched from existing JLPT study dictionaries. Not all grammatical forms, short words or every Kanji will have a matching definition. Missing words are not invented. This educational glossary is separate from the answer key.'));
 section.append(detail);
 load(level).then(source=>{
  if(!section.isConnected)return;
  const matches=recognized(sourceText(q,{review}),source);
  area.replaceChildren();
  if(!matches.length){
   area.append(el('p','ns-glossary-status','No verified matching Kanji or vocabulary was found in this question.'));
   return
  }
  const vocab=matches.filter(m=>m.type==='vocab'),kanji=matches.filter(m=>m.type==='kanji');
  const all=[...vocab,...kanji];
  let shown=LIMIT;
  function draw(){
   area.replaceChildren();
   const summary=el('p','ns-glossary-count',vocab.length+' words · '+kanji.length+' Kanji found in source');
   area.append(summary);
   for(const match of all.slice(0,shown))area.append(listRow(match));
   if(shown<all.length){
    const more=el('button','ns-glossary-more','Show more meanings ('+shown+'/'+all.length+') →');
    more.type='button';more.onclick=()=>{shown=Math.min(shown+LIMIT,all.length);draw()};area.append(more)
   }
  }draw();
  if(!source.vocabAvailable)summary.textContent+=' Vocabulary source is temporarily unavailable; showing available Kanji.';
 }).catch(error=>{
  if(section.isConnected){area.replaceChildren(el('p','ns-glossary-status','Dictionary unavailable: '+error.message+'. Question and answers still work normally.'))}
 });
 return section
}
global.NextStepExamGlossary={mount,load,recognized,sourceText};
})(window);