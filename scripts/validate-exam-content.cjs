'use strict';
/* Static audit for existing N1–N5 Paper 01–20 indices.
 * Never generates a question and never counts template-generated questions
 * as independently reviewed content. Run with --strict to require all 10,000. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(process.argv[2]||'.'),STRICT=process.argv.includes('--strict');
const LEVELS=['N5','N4','N3','N2','N1'],PAPERS=20,TOTAL=100;
const COUNTS={N5:[45,25,15,15],N4:[45,25,15,15],N3:[40,25,20,15],N2:[35,25,25,15],N1:[30,25,30,15]};
const context={window:{}};
for(const f of ['verified-language-01.js','verified-reading-01.js']){
 const full=path.join(ROOT,'exams',f);
 if(!fs.existsSync(full))throw Error('Missing authored content file '+full);
 vm.runInNewContext(fs.readFileSync(full,'utf8'),context,{filename:f});
}
const language=context.window.NextStepVerifiedLanguage,reading=context.window.NextStepVerifiedReading;
if(!language||!reading)throw Error('Authored content APIs are missing');
const errors=[],duplicatePrompts=new Map(),duplicatePassages=new Map();
const summary={totalExistingPaperCards:100,totalRequiredQuestionSlots:10000,verifiedQuestions:0,
 verifiedPapers:0,unverifiedQuestionSlots:0,incompletePapers:[],audioAssets:0,pictureAssets:0,missingAudioAssets:0,
 duplicates:0,invalidQuestionCount:0,recordsByLevel:{},format:'NextStep Existing Paper 01–20 Content Audit',complete:false};
function problem(level,paper,index,kind,reason){errors.push({level,paper,question:index+1,kind,reason});summary.invalidQuestionCount++;}
function localAsset(filename,kind,level,paper,i){
 if(typeof filename!=='string'||!filename||filename.startsWith('data:')||/^https?:/i.test(filename)){problem(level,paper,i,kind,'Missing or non-local '+kind+' file reference');return false;}
 const resolved=path.resolve(ROOT,'exams',filename);
 if(!resolved.startsWith(path.resolve(ROOT,'exams')+path.sep)||!fs.existsSync(resolved)){
  problem(level,paper,i,kind,'Broken local asset '+filename);return false;
 }
 return true;
}
for(const level of LEVELS){
 const [vc,gc,rc,lc]=COUNTS[level];if(vc+gc+rc+lc!==TOTAL)throw Error('Invalid original section layout '+level);
 const levelStats={papers:20,verifiedQuestions:0,incompletePapers:0,reading:0,grammar:0,vocabulary:0,listening:0,missingAudio:0};
 for(let paper=1;paper<=PAPERS;paper++){
  let verified=0;
  for(let i=0;i<TOTAL;i++){
   let q=null,kind;
   if(i<vc){kind='vocabulary';q=language.word(level,paper,i);}
   else if(i<vc+gc){kind='grammar';q=language.grammar(level,paper,i-vc);}
   else if(i<vc+gc+rc){kind='reading';q=reading.build(level,paper,i-vc-gc);}
   else{kind='listening';/* No verified original recorded audio files yet. */}
   if(!q){summary.unverifiedQuestionSlots++;if(kind==='listening'){summary.missingAudioAssets++;levelStats.missingAudio++;}continue;}
   const valid=typeof q.prompt==='string'&&q.prompt.trim().length>=12&&Array.isArray(q.options)&&q.options.length===4&&
     q.options.every(x=>typeof x==='string'&&x.trim().length>0)&&
     new Set(q.options).size===4&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4&&
     q.verified===true&&Array.isArray(q.choiceExplanations)&&q.choiceExplanations.length===4&&
     q.choiceExplanations.every(x=>x&&['ja','en','ne'].every(k=>typeof x[k]==='string'&&x[k].trim().length>4));
   if(!valid){problem(level,paper,i,kind,'Missing/invalid question, key, four choices, or trilingual option explanations');continue;}
   const key=q.prompt.trim();
   if(duplicatePrompts.has(key)){problem(level,paper,i,kind,'Duplicate question shared with '+duplicatePrompts.get(key));summary.duplicates++;continue;}
   duplicatePrompts.set(key,level+' Paper '+paper+' Q'+(i+1));
   if(kind==='reading'){
    if(typeof q.passage!=='string'||q.passage.trim().length<50){problem(level,paper,i,kind,'Reading passage missing or too short');continue;}
    if(duplicatePassages.has(q.passage)){problem(level,paper,i,kind,'Repeated reading passage');summary.duplicates++;continue;}
    duplicatePassages.set(q.passage,level+' Paper '+paper);
    if(!q.prompt.includes(q.passage)){problem(level,paper,i,kind,'Reading passage not shown in question');continue;}
   }
   if(kind==='listening'){
    if(!q.passage||!q.audio||!localAsset(q.audio,'audio',level,paper,i)){summary.missingAudioAssets++;continue;}
    summary.audioAssets++;
    if(q.picture&&!localAsset(q.picture,'picture',level,paper,i))continue;
    if(q.picture)summary.pictureAssets++;
   }
   verified++;summary.verifiedQuestions++;levelStats.verifiedQuestions++;
   if(kind==='vocabulary')levelStats.vocabulary++;
   if(kind==='grammar')levelStats.grammar++;
   if(kind==='reading')levelStats.reading++;
   if(kind==='listening')levelStats.listening++;
  }
  if(verified===TOTAL)summary.verifiedPapers++;
  else{levelStats.incompletePapers++;summary.incompletePapers.push({level,paper,verified,missing:TOTAL-verified});}
 }
 summary.recordsByLevel[level]=levelStats;
}
summary.complete=summary.verifiedPapers===100&&summary.verifiedQuestions===10000&&summary.invalidQuestionCount===0&&summary.missingAudioAssets===0;
if(!summary.complete)console.log('INCOMPLETE CONTENT: Do not advertise 100 complete JLPT mock exams.');
console.log(JSON.stringify({totalExistingPaperCards:summary.totalExistingPaperCards,verifiedQuestions:summary.verifiedQuestions,
 verifiedPapers:summary.verifiedPapers,incompletePapers:summary.incompletePapers.length,
 missingSlots:summary.unverifiedQuestionSlots,recordedListeningFiles:summary.audioAssets,
 listeningPictureFiles:summary.pictureAssets,questionErrors:errors.length,duplicateQuestions:summary.duplicates,byLevel:summary.recordsByLevel},null,2));
if(errors.length)console.error('VALIDATION ERRORS',JSON.stringify(errors.slice(0,30),null,2));
const dest=process.env.NEXTSTEP_AUDIT_REPORT;
if(dest){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify({summary,errors},null,2)+'\n','utf8');}
if(errors.length||STRICT&&!summary.complete)process.exitCode=1;
