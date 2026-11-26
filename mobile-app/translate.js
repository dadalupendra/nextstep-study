/* NextStep Study Phase 2: in-app translation of existing lesson explanations.
   Uses MyMemory public API (https://mymemory.translated.net/doc/spec.php).
   This is best-effort, opt-in translation; original Japanese remains authoritative. */
(()=>{'use strict';
const CACHE_KEY='nextstep-inapp-translations-v2',MAX_CACHE=120;
let cache={};try{cache=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')||{}}catch{cache={}}
const $=id=>document.getElementById(id);
const decodeHtml=text=>{const e=document.createElement('textarea');e.innerHTML=String(text);return e.value};
const utf8Bytes=text=>new TextEncoder().encode(text).length;
function chunks(text,maxBytes=450){
 const sentences=String(text).split(/(?<=[.!?。！？\n])\s*/u).filter(Boolean);
 const all=[];let current='';
 for(const sentence of sentences){
   for(const character of sentence){
     if(utf8Bytes(current+character)>maxBytes){if(current)all.push(current);current=''}
     current+=character
   }
 }
 if(current.trim())all.push(current.trim());return all
}
let last=0;
async function requestTranslation(text,source,target){
 if(!text.trim()||source===target)return text;
 const parts=chunks(text);
 if(parts.length>6)throw new Error('Text too long for free translation. Select a smaller passage.');
 const output=[];
 for(const part of parts){
   const delay=Math.max(0,400-(Date.now()-last));if(delay)await new Promise(r=>setTimeout(r,delay));last=Date.now();
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),11000);
   try{
     const url='https://api.mymemory.translated.net/get?'+new URLSearchParams({q:part,langpair:source+'|'+target,mt:'1'});
     const response=await fetch(url,{signal:controller.signal,headers:{'Accept':'application/json'}});
     if(!response.ok)throw new Error('Translation service unavailable ('+response.status+')');
     const data=await response.json();
     if(Number(data.responseStatus)!==200||data.quotaFinished)throw new Error(String(data.responseDetails||'Translation unavailable or daily limit reached.'));
     const translated=decodeHtml(data.responseData?.translatedText||'');
     if(!translated.trim()||(/MYMEMORY WARNING/i.test(translated)))throw new Error('Translation quota reached or this language pair is unavailable.');
     output.push(translated);
   } finally{clearTimeout(timer)}
 }
 return output.join(' ');
}
function currentLanguage(){return $('lang')?.value||'ne'}
function externalUrl(text,source,target){return 'https://translate.google.com/?'+new URLSearchParams({sl:source,tl:target,text:text.slice(0,4500),op:'translate'})}
function storeCache(key,value){cache[key]=value;const entries=Object.entries(cache).slice(-MAX_CACHE);cache=Object.fromEntries(entries);try{localStorage.setItem(CACHE_KEY,JSON.stringify(cache))}catch{}}
function show(container,translation,lang){container.replaceChildren();const tag=document.createElement('div');tag.className='translation-tag';tag.textContent='🌐 '+lang+' · automatic translation';const text=document.createElement('p');text.className='translation-output';text.lang=lang;text.textContent=translation;container.append(tag,text)}
function status(container,message,error=false){container.replaceChildren();const x=document.createElement('p');x.className=error?'translation-error':'translation-status';x.textContent=message;container.append(x)}
async function translateCard(article){
 if(!article)return false;
 const source=decodeURIComponent(article.getAttribute('data-source')||'');
 const sourceLang=article.getAttribute('data-source-lang')||'en',target=currentLanguage();
 const output=article.querySelector('.translation-result');if(!output)return false;
 if(!source.trim()){status(output,'No source explanation available.');return false}
 if(sourceLang===target){show(output,source,target);return true}
 const key=sourceLang+'|'+target+'|'+source;
 if(cache[key]){show(output,cache[key],target);return true}
 status(output,'⏳ Translating inside NextStep Study…');
 try{
   const translation=await requestTranslation(source,sourceLang,target);
   if(article.isConnected&&target===currentLanguage()){storeCache(key,translation);show(output,translation,target)}
   return true;
 }catch(error){
   if(!article.isConnected)return false;
   status(output,'Translation unavailable: '+(error?.message||'Network error')+'. Try a different language or use the external translation option.',true);
   const a=document.createElement('a');a.className='translation-external';a.href=externalUrl(source,sourceLang,target);a.target='_blank';a.rel='noopener noreferrer';a.textContent='🌐 Open Google Translate ↗';output.append(a);return false
 }
}
function clearOnLanguageChange(){
 document.querySelectorAll('.translation-result').forEach(e=>e.replaceChildren());
 const button=$('translateAll');if(button)button.textContent='🌍 Translate this entire page ↗'
}
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-translate-inline]');
 if(button){button.disabled=true;try{await translateCard(button.closest('[data-translatable]'))}finally{button.disabled=false}return}
 const all=event.target.closest('[data-translate-visible]');
 if(all){const articles=[...document.querySelectorAll('[data-translatable]')].slice(0,12);if(!articles.length)return;all.disabled=true;all.textContent='⏳ Translating '+articles.length+' cards…';let done=0;
 try{for(const article of articles){const ok=await translateCard(article);if(!ok)break;done++;all.textContent='⏳ '+done+' / '+articles.length}}finally{all.disabled=false;all.textContent='🌐 Translate visible cards ('+done+'/'+articles.length+')'}
 }
});
document.addEventListener('change',e=>{if(e.target.id==='lang')clearOnLanguageChange()});
window.NextStepTranslate={requestTranslation,clearOnLanguageChange};
})();