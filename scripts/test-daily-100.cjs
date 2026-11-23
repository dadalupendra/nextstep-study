'use strict';
/* Source-backed content audit: 100 daily questions per JLPT level,
 * no repeated targets within a day, stable date, new targets next day.
 * N3 has optional remote data; if not packaged, other tests still run.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(process.argv[2]||'public-site');
const script=fs.readFileSync(path.join(root,'daily-100.js'),'utf8');
const globals={window:{}};
vm.runInNewContext(script,globals,{filename:'daily-100.js'});
const api=globals.window.NextStepDaily100;
assert(api&&typeof api.build==='function');
function readJSON(filename){return JSON.parse(fs.readFileSync(path.join(root,filename),'utf8'))}
function getVocab(level){
 const relative=level+'/data/vocab.json';
 if(fs.existsSync(path.join(root,relative)))return readJSON(relative);
 if(level==='N2'){
  const sandbox={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'N2/data.js'),'utf8'),sandbox);
  const pack=sandbox.window.NEXTSTEP_N2_DATA;
  assert(pack?.level==='N2'&&pack.words.length>100);
  return pack.words.map((w,i)=>({word:w[0],reading:w[1],meanings:[w[2]],id:'n2-'+i,level:'N2',examples:[]}));
 }
 return null;
}
function makeMaker(level,data){
 const p=path.join(root,level,level==='N1'?'app.js':'master.js');
 const source=fs.readFileSync(p,'utf8');
 const start=source.indexOf('function randOrder('),middle=source.indexOf('function makeQuestion(',start),end=source.indexOf('function buildQ(',middle);
 assert(start>=0&&middle>start&&end>middle,level+' source question generator missing');
 return new Function('app','arr','first',source.slice(start,end)+'\nreturn makeQuestion;')(
  {data},x=>Array.isArray(x)?x:[],x=>Array.isArray(x)?x[0]:undefined
 );
}
let checked=0,unavailable=[];
for(const level of ['N5','N4','N3','N2','N1']){
 const data={kanji:readJSON(level+'/data/kanji.json'),grammar:readJSON(level+'/data/grammar.json'),vocab:getVocab(level)};
 if(!data.vocab){unavailable.push(level+' vocabulary is not locally packaged; website still needs online source');continue}
 const makeQuestion=makeMaker(level,data);
 const yesterday=api.build({level,day:'2026-11-22',data,makeQuestion});
 const today=api.build({level,day:'2026-11-23',data,makeQuestion});
 const today2=api.build({level,day:'2026-11-23',data,makeQuestion});
 const tomorrow=api.build({level,day:'2026-11-24',data,makeQuestion});
 assert.equal(today.questions.length,100,level+' not 100 questions');
 assert.equal(new Set(today.questions.map(q=>q.id)).size,100,level+' repeated question ID');
 assert.equal(new Set(today.questions.map(q=>q.stem)).size,100,level+' repeated prompt');
 assert.deepEqual(today.questions.map(q=>q.id),today2.questions.map(q=>q.id),level+' same day not stable');
 assert.deepEqual(Object.fromEntries(['kanji','vocab','grammar'].map(type=>[type,today.questions.filter(q=>q.type===type).length])),{kanji:30,vocab:40,grammar:30});
 for(const question of today.questions){
  assert.equal(question.options.length,4,level+' answer options');
  assert.equal(new Set(question.choices).size,4,level+' duplicate option choices');
  assert.equal(question.options.filter(o=>o.correct).length,1);
  assert.equal(question.options.find(o=>o.correct).text,question.answer);
 }
 for(const type of ['kanji','vocab','grammar']){
  const todayKeys=new Set(today.questions.filter(q=>q.type===type).map(q=>q.sourceKey));
  const prevKeys=new Set(yesterday.questions.filter(q=>q.type===type).map(q=>q.sourceKey));
  const nextKeys=new Set(tomorrow.questions.filter(q=>q.type===type).map(q=>q.sourceKey));
  assert.equal([...todayKeys].filter(key=>prevKeys.has(key)).length,0,level+' '+type+' repeated from previous day');
  assert.equal([...todayKeys].filter(key=>nextKeys.has(key)).length,0,level+' '+type+' repeated tomorrow');
 }
 checked++;
 console.log('PASS',level,'100 questions per day, no next-day overlap, section counts 30/40/30, sources:',JSON.stringify(today.sourceCounts));
}
assert(checked>=4,'At least 4 level datasets must be available locally to verify Daily 100');
console.log('Daily 100 validation:',checked,'levels verified.',unavailable.join('; '));
