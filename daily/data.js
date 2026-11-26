/* NextStep 3D Daily Library — source-backed, deterministic daily selection.
   Existing original N1–N5 lesson datasets are the ONLY content sources. */
(function(global){'use strict';
const LEVELS=['N5','N4','N3','N2','N1'];
const CACHE=new Map();
function tokyoDay(date=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 return parts.year+'-'+parts.month+'-'+parts.day;
}
function hash(input){let h=2166136261>>>0;for(const char of String(input)){h=Math.imul(h^char.charCodeAt(0),16777619)>>>0}return h}
function ordered(list,seed){const array=list.slice();let x=hash(seed)||1;for(let i=array.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;const j=(x>>>0)%(i+1);[array[i],array[j]]=[array[j],array[i]]}return array}
const getGloss=(item)=>Array.isArray(item.meanings)?item.meanings.filter(x=>typeof x==='string').join(', '):String(item.meaning||item.meaning_en||item.english||'');
function validExamples(item){return(Array.isArray(item.examples)?item.examples:[]).filter(x=>x&&typeof x==='object'&&typeof x.ja==='string'&&x.ja.length>=7&&/[。！？!?]$/.test(x.ja.trim()))}
function unique(list,key){
 const seen=new Set();return list.filter(x=>{const k=String(key(x)||'').trim();if(!k||seen.has(k))return false;seen.add(k);return true})
}
function normalizeKanji(data){
 return unique(data.filter(x=>x&&typeof x.character==='string'&&/^[\u3400-\u9fff\uF900-\uFAFF]$/u.test(x.character)&&getGloss(x).trim()),x=>x.character)
}
function normalizeVocab(data){
 return unique(data.filter(x=>x&&typeof x.word==='string'&&x.word.length>0&&
 typeof x.reading==='string'&&x.reading.trim()&&getGloss(x).trim()&&
 (x.word!==x.reading||/^[ぁ-ゖァ-ヺー・]+$/u.test(x.word))),x=>x.word+'|'+x.reading)
}
async function getJson(url){const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw Error('Source unavailable ('+response.status+'): '+url);const result=await response.json();if(!Array.isArray(result))throw Error('Study source is not an array: '+url);return result}
async function load(level){
 if(!LEVELS.includes(level))throw Error('Unknown JLPT level');
 if(CACHE.has(level))return CACHE.get(level);
 const vocabSource=async()=>{
   try{return await getJson('../'+level+'/data/vocab.json')}
   catch(error){
     if(level!=='N2')throw error;
     // N2 has a separately licensed, compact source pack in data.js.
     if(!global.NEXTSTEP_N2_DATA?.words){
       await new Promise((resolve,reject)=>{
         const script=document.createElement('script');script.src='../N2/data.js';
         script.onload=resolve;script.onerror=()=>reject(new Error('N2 vocabulary source unavailable'));document.head.append(script);
       });
     }
     const words=global.NEXTSTEP_N2_DATA?.words;
     if(!Array.isArray(words))throw Error('N2 source pack is invalid');
     return words.map(w=>({word:w[0],reading:w[1],meanings:[w[2]],id:w[3],pos:String(w[4]||'').split(', '),
       examples:[{ja:w[5],en:w[6],furigana:w[9]},{ja:w[7],en:w[8],furigana:w[10]}].filter(x=>x.ja)}))
   }
 };
 const files=Promise.all([getJson('../'+level+'/data/kanji.json'),vocabSource()]);
 const promise=files.then(([kanji,vocab])=>{
  const data={kanji:normalizeKanji(kanji),vocab:normalizeVocab(vocab)};
  if(data.kanji.length<10||data.vocab.length<10)throw Error('Not enough verified '+level+' study source entries. No demo cards inserted.');
  return data
 });
 CACHE.set(level,promise);
 try{return await promise}catch(e){CACHE.delete(level);throw e}
}
function dayCards(level,day,source,each=10){
 if(!LEVELS.includes(level)||!/^\d{4}-\d\d-\d\d$/.test(day))throw Error('Invalid daily card parameters');
 const dayNumber=Math.floor(Date.parse(day+'T00:00:00+09:00')/86400000);
 if(!Number.isFinite(dayNumber))throw Error('Invalid day');
 const results=[];
 for(const type of ['kanji','vocab']){
  const pool=ordered(source[type],level+'|'+type+'|source-v2');
  if(pool.length<each)throw Error('Insufficient '+type+' records');
  // Consecutive day blocks walk a fixed source pool; this avoids same-day duplicates.
  const offset=(dayNumber*each%pool.length+pool.length)%pool.length;
  const selected=Array.from({length:Math.min(each,pool.length)},(_,i)=>pool[(offset+i)%pool.length]);
  selected.forEach((item,i)=>results.push({id:level+'-'+type+'-'+(type==='kanji'?item.character:item.word+'|'+item.reading),type,level,item,index:i}));
 }
 return results
}
function relatedWords(character,vocab,limit=14){
 return unique(vocab.filter(x=>x.word.includes(character)),x=>x.word+'|'+x.reading).slice(0,limit)
}
global.NextStepDailySource={LEVELS,tokyoDay,load,dayCards,relatedWords,validExamples,getGloss};
})(window);
