'use strict';
/* Checks N1-style individual Kanji and Vocabulary readers without external network. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'.');
const targets={N5:{kanji:84,grammar:81,vocab:674},N4:{kanji:169,grammar:98,vocab:630},N3:{kanji:387,grammar:101,vocab:null},N2:{kanji:398,grammar:123,vocab:1778}};
for(const [level,expected] of Object.entries(targets)){
 const dir=path.join(root,level);
 const html=fs.readFileSync(path.join(dir,'master.html'),'utf8'),js=fs.readFileSync(path.join(dir,'master.js'),'utf8');
 assert(html.includes('master.js')&&html.includes('../N1/style.css'),level+' master reader missing');
 assert(html.includes('section=kanji')&&html.includes('section=vocab'),level+' separate links missing');
 new vm.Script(js,{filename:level+'/master.js'});
 for(const type of ['kanji','grammar']){
  const data=JSON.parse(fs.readFileSync(path.join(dir,'data',type+'.json'),'utf8'));
  assert.equal(data.length,expected[type],level+' '+type+' count mismatch');
  assert(data.every(item=>item.level===level),level+' contains wrong-level '+type);
 }
 const vocabPath=path.join(dir,'data','vocab.json');
 if(expected.vocab!==null&&fs.existsSync(vocabPath)){
  const data=JSON.parse(fs.readFileSync(vocabPath,'utf8'));
  assert.equal(data.length,expected.vocab);
  assert(data.every(v=>v.level===level),level+' wrong-level vocabulary');
 }else if(level==='N2'){
  const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dir,'data.js'),'utf8'),sandbox);
  assert.equal(sandbox.window.NEXTSTEP_N2_DATA.words.length,1778);
  assert.equal(sandbox.window.NEXTSTEP_N2_DATA.level,'N2');
  assert(html.includes('data.js')&&js.includes('NEXTSTEP_N2_DATA'));
 }else if(level==='N3'){
  assert(js.includes('/n3.json'),'N3 must use only the N3 dataset');
 }
 console.log('PASS',level,'separate master books / Kanji',expected.kanji,'Vocab',expected.vocab??'external N3 source');
}
for(const type of ['kanji','vocab']){
 const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const level of ['N1','N2','N3','N4','N5'])assert(home.includes('section='+type)&&home.includes(level+'/'),level+' '+type+' homepage link missing');
}
console.log('PASS all N1–N5 Master Book links');
