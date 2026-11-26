/* Related vocabulary for any selected kanji, across the existing JLPT N5–N1 data sources.
   Never invent readings, meanings, example sentences, or missing words. */
(function(global){'use strict';
const levels=['N5','N4','N3','N2','N1'];
const memo=new Map();
const normalize=s=>String(s||'').normalize('NFC');
function collect(character,sources){
 const seen=new Map();
 for(const [level,vocab] of sources){
  for(const item of vocab||[]){
   if(!item||typeof item.word!=='string'||!normalize(item.word).includes(character))continue;
   const key=normalize(item.word)+'|'+normalize(item.reading);
   if(!seen.has(key))seen.set(key,{...item,levels:[level]});
   else{
    const current=seen.get(key);
    if(!current.levels.includes(level))current.levels.push(level);
    const sourceExamples=Array.isArray(item.examples)?item.examples:[];
    if(sourceExamples.length>(current.examples||[]).length)current.examples=sourceExamples;
   }
  }
 }
 return [...seen.values()].sort((a,b)=>{
  const aDirect=a.word===character?0:1,bDirect=b.word===character?0:1;
  return aDirect-bDirect||a.word.length-b.word.length||a.word.localeCompare(b.word,'ja')
 });
}
function fromCurrent(character,level,source){
 return collect(character,[[level,source.vocab]]);
}
async function all(character,level,source){
 const key=normalize(character);
 if(!/^[\u3400-\u9fff\uF900-\uFAFF]$/u.test(key))throw Error('Select one kanji.');
 if(memo.has(key))return memo.get(key);
 const promise=(async()=>{
  const available=[[level,source.vocab]];
  const unavailable=[];
  const other=levels.filter(x=>x!==level);
  const checked=await Promise.allSettled(other.map(x=>global.NextStepDailySource.load(x)));
  checked.forEach((result,i)=>{
   if(result.status==='fulfilled')available.push([other[i],result.value.vocab]);
   else unavailable.push(other[i]);
  });
  return {words:collect(key,available),checked:available.map(x=>x[0]),unavailable}
 })();
 memo.set(key,promise);
 try{return await promise}catch(error){memo.delete(key);throw error}
}
global.NextStepKanjiCompounds={collect,fromCurrent,all};
})(window);
