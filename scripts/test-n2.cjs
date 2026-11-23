"use strict";
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const p=f=>path.join(__dirname,'..','N2',f);
const context={window:{},document:{getElementById:()=>null},localStorage:{getItem:()=>null},location:{search:''},URLSearchParams};
vm.createContext(context);
for(const file of ['data.js','grammar-data.js','business-data.js','reader.js','quiz.js']){
 vm.runInContext(fs.readFileSync(p(file),'utf8'),context,{filename:file,timeout:60000});
}
const D=context.window.NEXTSTEP_N2_DATA,G=context.window.NEXTSTEP_N2_GRAMMAR;
assert.equal(D.kanji.length,398);assert.equal(D.words.length,1778);assert.equal(G.patterns.length,123);
assert.ok(D.words.every(w=>w[0]&&w[1]&&w[2]));assert.ok(G.patterns.every(g=>g[0]&&g[1]&&g[2]&&g[5]));
const pageFn=context.window.N2MakePage,quiz=context.window.NEXTSTEP_N2_MAKE_QUIZ;
assert.equal(typeof pageFn,'function');assert.equal(typeof quiz,'function');
let pages=0;
for(const [book,count] of [['kanji',400],['vocab',300],['grammar',300]])for(let n=1;n<=count;n++){
 const v=pageFn(book,n,false);assert.ok(typeof v==='string'&&v.length>450,book+':'+n);pages++;
}
let total=0,seenId=new Set;
for(const exam of ['JLPT','BJT','JPT','JTEST','NAT']){
 const books=exam==='JLPT'?['kanji','vocab','grammar']:['kanji'];
 for(const book of books)for(let chapter=1;chapter<=10;chapter++){
  const paper=quiz(exam,book,chapter);
  assert.equal(paper.length,50,exam+'/'+book+'/'+chapter);
  const inPaper=new Set();
  for(const q of paper){
   total++;assert.equal(q.options.length,4);assert.ok(q.options[q.answer]?.correct);
   assert.equal(new Set(q.options.map(o=>o.jp)).size,4);
   assert.ok(q.why.ja&&q.why.en&&q.why.ne);
   assert.ok(!seenId.has(q.id),'Duplicate ID: '+q.id);seenId.add(q.id);
   const signature=q.prompt+'|'+q.source+'|'+q.options[q.answer].jp;
   assert.ok(!inPaper.has(signature),'Repeated item in paper: '+q.id);inPaper.add(signature);
  }
 }
}
assert.equal(pages,1000);assert.equal(total,3500);
const page=fs.readFileSync(p('quiz.html'),'utf8');
for(const key of ['id="furiganatoggle"','id="examselect"','id="quizroot"','src="business-data.js"'])assert.ok(page.includes(key),key);
console.log('PASS: 398 N2 kanji; 1778 N2 words; 123 N2 grammar; 1000 notebook pages; 3500 generated question slots; Japanese choices; four unique options; immediate-feedback UI and multilingual explanations; 5 practice modes.');
