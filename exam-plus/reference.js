/* Supplementary 600-page vocabulary reference for NAT/JFT/BJT readers.
   Every page is one distinct entry loaded from existing NextStep JLPT vocab
   dictionary files. Not an exam-specific word list or official 600-page book.
   Never duplicate an entry to reach 600 or invent example sentences.
*/
(function(global){'use strict';
const $=id=>document.getElementById(id),MAX=600;
const state={exam:'NAT',level:'5Q',items:[],filtered:[],page:0,language:'ja',loadId:0};
const make=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x};
const vocabPaths={N5:'../N5/data/vocab.json',N4:'../N4/data/vocab.json',N3:'../N3/data/vocab.json',N2:'../N2/data/vocab.json',N1:'../N1/data/vocab.json'};
const NAT_MAP={'5Q':['N5','N4'],'4Q':['N4','N5'],'3Q':['N3','N4'],'2Q':['N2','N3'],'1Q':['N1','N2']};
const origins=(exam,level)=>exam==='NAT'?(NAT_MAP[level]||NAT_MAP['5Q']):exam==='JFT'?['N4','N5']:['N2','N1'];
function fixed(item,level){
 const x=Array.isArray(item)?{word:item[0],reading:item[1],meanings:[item[2]],pos:String(item[4]||'').split(','),examples:[{ja:item[5],en:item[6],furigana:item[9]},{ja:item[7],en:item[8],furigana:item[10]}]}:item;
 if(!x||typeof x.word!=='string'||!x.word.trim()||typeof x.reading!=='string'||!x.reading.trim())return null;
 const meanings=Array.isArray(x.meanings)?x.meanings.filter(y=>typeof y==='string'&&y.trim()):typeof x.meaning==='string'?[x.meaning]:[];
 if(!meanings.length)return null;
 const examples=Array.isArray(x.examples)?x.examples.filter(y=>y&&typeof y.ja==='string'&&y.ja.trim()&&!/^\s*[?？]+\s*$/.test(y.ja)).slice(0,3):[];
 return {word:x.word.trim(),reading:x.reading.trim(),meanings,pos:Array.isArray(x.pos)?x.pos:[],examples,level}
}
async function levelSource(level){
 let data=null;try{const res=await fetch(vocabPaths[level]);if(res.ok){data=await res.json();if(!Array.isArray(data))data=null}}catch{}
 if(data)return data;
 if(level==='N2'){
  if(!global.NEXTSTEP_N2_DATA?.words)await new Promise((resolve,reject)=>{const tag=document.createElement('script');tag.src='../N2/data.js';tag.onload=resolve;tag.onerror=()=>reject(Error('N2 source unavailable'));document.head.append(tag)});
  if(Array.isArray(global.NEXTSTEP_N2_DATA?.words))return global.NEXTSTEP_N2_DATA.words
 }
 throw Error(level+' dictionary source unavailable')
}
function visible(){const term=$('referenceSearch').value.trim().toLowerCase();state.filtered=state.items.filter(x=>!term||[x.word,x.reading,...x.meanings].join(' ').toLowerCase().includes(term));state.page=Math.max(0,Math.min(state.page,Math.max(0,state.filtered.length-1)));render()}
function originalExample(parent,example){
 const row=make('div','reference-example');row.append(make('p','reference-japanese',example.ja));
 if(example.en)row.append(make('p','reference-example-meaning',example.en));
 parent.append(row)
}
function render(){
 const root=$('referencePage');root.replaceChildren();
 const item=state.filtered[state.page],count=state.filtered.length;
 $('referenceIndex').textContent=count?(state.page+1)+' / '+count+' study pages':'0 / 0';
 $('referencePrev').disabled=state.page===0||!count;$('referenceNext').disabled=state.page>=count-1||!count;
 $('referenceStatus').textContent=state.items.length+' distinct real words loaded · '+count+' match search. Vocabulary may include general Japanese beyond the target exam.';
 if(!item){root.append(make('p',null,'No real source word matches this search. Try another word.'));return}
 const card=make('article','reference-word-page');
 card.append(make('div','reference-page-meta','REFERENCE PAGE '+(state.page+1)+' · JLPT '+item.level+' SOURCE'));
 card.append(make('h3','reference-main-word',item.word));
 const read=make('p','reference-reading','📖 '+item.reading);read.lang='ja';card.append(read);
 const gloss=make('div','explain',item.meanings.join(' · '));gloss.lang='en';card.append(gloss);
 if(item.pos.length)card.append(make('p','reference-pos','品詞 · '+item.pos.join(' · ')));
 const voice=make('button','reference-action','🔊 Japanese pronunciation');voice.type='button';voice.onclick=()=>{
  if(!('speechSynthesis'in global))return;
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(item.word);u.lang='ja-JP';u.rate=.82;speechSynthesis.speak(u)
 };card.append(voice);
 const sample=make('div','reference-examples');sample.append(make('h4',null,'例文 · Verified source examples'));
 if(!item.examples.length)sample.append(make('p',null,'No complete example sentence was provided by this source.'));
 item.examples.forEach(ex=>originalExample(sample,ex));card.append(sample);
 const translate=make('button','reference-action','🌍 Translate this word and examples');translate.type='button';
 const result=make('div','reference-result');result.setAttribute('aria-live','polite');
 translate.onclick=async()=>{
  const target=state.language;
  const source=['Word: '+item.word,'Reading: '+item.reading,'Meanings: '+item.meanings.join(', '),...item.examples.map(ex=>ex.ja+(ex.en?' — '+ex.en:''))].join('\n');
  translate.disabled=true;result.textContent='Translation in progress…';
  try{
   if(target==='en')result.textContent=item.meanings.join('; ')+(item.examples.length?'\n'+item.examples.map(x=>x.en||x.ja).join('\n'):'');
   else if(target==='ja')result.textContent=item.examples.map(x=>x.ja).join('\n')||'日本語の例文はありません。';
   else{
    if(!global.NextStepTranslate?.requestTranslation)throw Error('Free provider unavailable');
    // Translate meanings (English) and example sentences (Japanese) separately for accuracy.
    const meaning=await global.NextStepTranslate.requestTranslation(item.meanings.join('; '),'en',target);
    let example='';
    if(item.examples.length)example=await global.NextStepTranslate.requestTranslation(item.examples.map(x=>x.ja).join('\n'),'ja',target);
    result.textContent=[meaning,example].filter(Boolean).join('\n\n')
   }
  }catch(e){
   result.replaceChildren(make('span',null,'Automatic translation is unavailable for this language or the free limit was reached. '));
   const link=make('a',null,'Open translator ↗');link.href='https://translate.google.com/?'+new URLSearchParams({sl:'auto',tl:target,text:source.slice(0,3500),op:'translate'});link.target='_blank';link.rel='noopener noreferrer';result.append(link)
  }finally{translate.disabled=false}
 };card.append(translate,result);root.append(card)
}
function updateLanguage(language){state.language=language}
async function select(exam,level,language){
 updateLanguage(language);
 const current=++state.loadId;
 state.exam=exam;state.level=level;state.items=[];state.filtered=[];state.page=0;
 $('referenceStatus').textContent='Loading source-backed vocabulary…';$('referenceSearch').value='';
 $('referenceTitle').textContent=(exam==='NAT'?'NAT-TEST '+level:exam==='JFT'?'JFT-Basic':'BJT')+' · Supplementary Vocabulary Reference';
 try{
  const levels=origins(exam,level);const results=await Promise.allSettled(levels.map(levelSource));
  if(current!==state.loadId)return;
  const data=[],seen=new Set(),used=[],missing=[];
  results.forEach((r,i)=>{
   const lv=levels[i];if(r.status!=='fulfilled'){missing.push(lv);return}
   used.push(lv);
   for(const raw of r.value){
    const x=fixed(raw,lv);if(!x)continue;
    const id=x.word+'|'+x.reading;if(seen.has(id))continue;seen.add(id);data.push(x)
   }
  });
  if(!data.length)throw Error('Original vocabulary datasets not currently available');
  state.items=data.slice(0,MAX);state.filtered=state.items;
  $('referenceIntro').textContent='This appendix contains '+state.items.length+' different source-backed Japanese word pages from '+used.join(' + ')+' dictionaries'+(missing.length?' (unavailable: '+missing.join(', ')+')':'')+'. They supplement exam-specific lessons and are NOT official NAT/JFT/BJT lists or a complete specialized 600-page textbook.';
  render()
 }catch(e){
  $('referenceStatus').textContent='Vocabulary could not be loaded: '+e.message;render()
 }
}
function next(step){state.page=Math.max(0,Math.min(state.filtered.length-1,state.page+step));render();$('reference').scrollIntoView({behavior:'smooth',block:'start'})}
function init(){
 $('referenceSearch').addEventListener('input',()=>{state.page=0;visible()});
 $('referencePrev').onclick=()=>next(-1);$('referenceNext').onclick=()=>next(1)
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
global.NextStepExamReference={select,updateLanguage};
})(window);