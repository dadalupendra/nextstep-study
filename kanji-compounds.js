/* NextStep Study | Single Kanji → related 熟語 / vocabulary explorer.
   Uses level-tagged OpenJLPT data (CC BY-SA 4.0), plus each Kanji's
   upstream sample words. Not an exhaustive Japanese dictionary. */
(function(){
'use strict';
const root=new URL('./',document.currentScript?.src||location.href);
const LEVELS=['N5','N4','N3','N2','N1'];
const dataPromises=new Map(),translationCache=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const han=/\p{Script=Han}/gu;
const sourceRoot='https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/vocab/';
let shell=null,current=null,known=[],limit=40,subset='all',search='',loadGeneration=0,doneSources=0,failed=[];
function wordItem(raw,level){
 if(!raw||typeof raw.word!=='string'||!raw.word)return null;
 const word=raw.word;
 return {word,reading:String(raw.reading||''),meanings:Array.isArray(raw.meanings)?raw.meanings.filter(x=>typeof x==='string'):[],
  examples:Array.isArray(raw.examples)?raw.examples.filter(x=>x&&typeof x.ja==='string'):[],
  pos:Array.isArray(raw.pos)?raw.pos:[],level:String(raw.level||level||''),curated:false};
}
function validateData(rows,level){
 if(!Array.isArray(rows)||rows.length<30)throw new Error('Missing level-specific dictionary data');
 const result=rows.map(x=>wordItem(x,level)).filter(Boolean);
 // Only use explicitly level-tagged entries from this source.
 return result.filter(r=>r.level.toUpperCase()===level);
}
async function oneSource(level){
 if(dataPromises.has(level))return dataPromises.get(level);
 const promise=(async()=>{
  const urls=[new URL(level+'/data/vocab.json',root).href,sourceRoot+level.toLowerCase()+'.json','https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json/vocab/'+level.toLowerCase()+'.json'];
  let last;
  for(const url of urls){
   try{
    const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),19000);
    let response;
    try{response=await fetch(url,{signal:ac.signal,cache:'force-cache'});}finally{clearTimeout(timer)}
    if(!response.ok)throw new Error('HTTP '+response.status);
    const rows=validateData(await response.json(),level);
    if(rows.length<30)throw new Error('No level-matching entries');
    return rows;
   }catch(e){last=e}
  }
  throw new Error(level+' data unavailable: '+(last?.message||'unknown error'));
 })();
 dataPromises.set(level,promise);
 return promise;
}
function merge(kanji, local, fetched){
 const entries=new Map();
 function add(row){
  const r=wordItem(row,row.level);
  if(!r||!r.word.includes(kanji)||r.word===kanji||r.word.length<2)return;
  const key=r.word+'|'+r.reading;
  const existing=entries.get(key);
  if(existing){
   if(!existing.meanings.length&&r.meanings.length)existing.meanings=r.meanings;
   if(!existing.examples.length&&r.examples.length)existing.examples=r.examples;
   if(!existing.pos.length&&r.pos.length)existing.pos=r.pos;
   if(r.level)existing.levels.add(r.level);
   return;
  }
  entries.set(key,{...r,levels:new Set(r.level?[r.level]:[])});
 }
 for(const item of local) add(item);
 for(const [lv,words] of fetched)for(const item of words)add({...item,level:lv});
 // Kanji data includes some dictionary headwords not in the available level lists.
 for(const name of current?.item?.words||[]){
  if(typeof name!=='string'||name===kanji||!name.includes(kanji)||name.length<2)continue;
  if([...entries.values()].some(x=>x.word===name))continue;
  const key=name+'|';
  entries.set(key,{word:name,reading:'',meanings:[],examples:[],pos:[],level:'',levels:new Set(),curated:true});
 }
 return [...entries.values()].sort((a,b)=>(b.levels.has(current.level)?1:0)-(a.levels.has(current.level)?1:0)||b.meanings.length-a.meanings.length||a.word.localeCompare(b.word,'ja'));
}
function furigana(text){
 const words=String(text||'').split(/(\{[^{}]+\|[^{}]+\})/g);
 return words.map(part=>{
  const match=part.match(/^\{([^{}|]+)\|([^{}|]+)\}$/);
  return match?'<ruby>'+esc(match[1])+'<rt>'+esc(match[2])+'</rt></ruby>':esc(part);
 }).join('');
}
function ensure(){
 if(shell)return shell;
 const backdrop=document.createElement('div');backdrop.id='nextstep-kanji-explorer';backdrop.className='ns-compounds-backdrop';backdrop.hidden=true;
 backdrop.innerHTML='<section class="ns-compounds-panel" role="dialog" aria-modal="true" aria-label="Kanji compounds and vocabulary" tabindex="-1">'+
 '<header class="ns-compounds-header"><div><div class="ns-compounds-kicker">熟語・関連語 · Kanji word explorer</div><h2 id="ns-compound-heading"></h2><div id="ns-compound-info"></div></div><button class="ns-compounds-close" type="button" aria-label="Close Kanji word explorer">✕ Close</button></header>'+
 '<p id="ns-compounds-status" role="status" aria-live="polite"></p>'+
 '<div class="ns-compounds-controls"><label for="ns-compounds-filter">🔎 Find a word <input id="ns-compounds-filter" type="search" placeholder="漢字・かな・English meaning" /></label>'+
 '<label for="ns-compounds-kind">種類 / Type<select id="ns-compounds-kind"><option value="all">All related words</option><option value="compound">熟語 — 2+ Kanji characters</option><option value="mixed">漢字+かな — related words</option></select></label></div>'+
 '<div id="ns-compounds-count"></div><div id="ns-compounds-list"></div>'+
 '<div class="ns-compounds-footer"><button type="button" id="ns-compounds-more" hidden>More words / थप शब्द</button></div>'+
 '<p class="ns-compounds-note">Source: OpenJLPT (CC BY-SA 4.0) and source Kanji word examples. Shows matching words available in these sources, not every word in Japanese. Empty meanings are not guessed; optional online translations are machine-generated.</p></section>';
 document.body.append(backdrop);
 const close=()=>{backdrop.hidden=true;document.body.classList.remove('ns-compounds-open');current=null;loadGeneration++;};
 backdrop.querySelector('.ns-compounds-close').addEventListener('click',close);
 backdrop.addEventListener('click',e=>{if(e.target===backdrop)close()});
 backdrop.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}});
 const input=backdrop.querySelector('#ns-compounds-filter');
 input.addEventListener('input',()=>{search=input.value.trim().toLowerCase();limit=40;renderList()});
 backdrop.querySelector('#ns-compounds-kind').addEventListener('change',e=>{subset=e.target.value;limit=40;renderList()});
 backdrop.querySelector('#ns-compounds-more').addEventListener('click',()=>{limit+=40;renderList()});
 backdrop.addEventListener('click',async e=>{
  const speak=e.target.closest('button[data-ns-speak]');
  if(speak){if(!('speechSynthesis' in window)){alert('Japanese speech is not supported by this browser.');return}
   speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(speak.dataset.nsSpeak);utterance.lang='ja-JP';
   const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('ja'));if(voice)utterance.voice=voice;speechSynthesis.speak(utterance);return;}
  const translate=e.target.closest('button[data-ns-translate]');
  if(translate){
   const id=Number(translate.dataset.nsTranslate),r=known[id],target=translate.closest('.ns-compound-item')?.querySelector('.ns-compound-translations');
   if(!r||!target)return;translate.disabled=true;translate.textContent='🌐 Translating…';target.hidden=false;
   const src=r.meanings.join('; ');
   if(!src){target.textContent='Meaning is not included in the available source data. 語義データなし。 स्रोतमा अर्थ उपलब्ध छैन।';translate.disabled=false;translate.textContent='🌐 Translate';return;}
   try{
    const results=await Promise.all(['ne','ja'].map(lang=>translateMeaning(src,lang)));
    target.innerHTML='<p><b>नेपाली (machine):</b> '+esc(results[0])+'</p><p><b>日本語 (機械翻訳):</b> '+esc(results[1])+'</p><p class="ns-compounds-note">Automatic translation can contain mistakes.</p>';
   }catch(error){target.innerHTML='<p>Translation service unavailable. <a target="_blank" rel="noopener noreferrer" href="https://translate.google.com/?sl=en&tl=ne&text='+encodeURIComponent(src)+'&op=translate">Open Nepali translation ↗</a></p>'}
   translate.disabled=false;translate.textContent='🌐 नेपाली・日本語 Meaning';return;
  }
 });
 shell=backdrop;return backdrop;
}
async function translateMeaning(src,lang){
 const key=lang+'|'+src;if(translationCache.has(key))return translationCache.get(key);
 const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),8500);
 try{const url='https://api.mymemory.translated.net/get?q='+encodeURIComponent(src.slice(0,350))+'&langpair=en%7C'+encodeURIComponent(lang);
 const response=await fetch(url,{signal:ac.signal});if(!response.ok)throw Error('Translate HTTP '+response.status);
 const json=await response.json();const translated=json?.responseData?.translatedText;
 if(typeof translated!=='string'||!translated.trim())throw Error('No translation');
 translationCache.set(key,translated);return translated;
 }finally{clearTimeout(timer)}
}
function drawHeader(){
 const rootEl=ensure(),i=current.item;
 rootEl.querySelector('#ns-compound-heading').textContent=i.character+' — '+current.level+' Kanji';
 rootEl.querySelector('#ns-compound-info').innerHTML='<div><b>音読み:</b> '+esc((i.onyomi||[]).join('・')||'—')+'　<b>訓読み:</b> '+esc((i.kunyomi||[]).join('・')||'—')+'</div>'+
 '<div><b>English:</b> '+esc((i.meanings||[]).join('; ')||'—')+'　<b>部首:</b> '+esc(i.radical||'—')+'　<b>画数:</b> '+esc(i.strokes??'—')+'</div>';
}
function renderList(){
 if(!current)return;
 const rootEl=ensure(),all=known.filter(item=>{
  if(subset==='compound'&&[...item.word.matchAll(han)].length<2)return false;
  if(subset==='mixed'&&([ ...item.word.matchAll(han)].length>=2))return false;
  return !search||[item.word,item.reading,item.meanings.join('; ')].some(x=>x.toLowerCase().includes(search));
 });
 const shown=all.slice(0,limit),hasFurigana=document.getElementById('furiganaToggle')?.checked!==false;
 rootEl.querySelector('#ns-compounds-count').textContent=all.length+' matches · '+shown.length+' displayed';
 const list=rootEl.querySelector('#ns-compounds-list');
 list.innerHTML=shown.length?shown.map(item=>{
  const id=known.indexOf(item),mean=item.meanings.join('; '),description=item.reading?
   '「'+item.word+'」の読み方は「'+item.reading+'」です。'+(mean?' 英語の意味: '+mean+'。':''):
   'この熟語の読み方・意味は、現在の語彙データにありません。';
  const sentence=item.examples.find(x=>x?.ja);
  return '<details class="ns-compound-item"><summary><span class="ns-compound-word" lang="ja">'+esc(item.word)+'</span><span class="ns-compound-reading" lang="ja">'+esc(item.reading||'読み未収録')+'</span>'+
  '<span class="ns-compound-gloss">'+esc(mean||'Meaning not in source')+'</span></summary>'+
  '<div class="ns-compound-details"><p>🇯🇵 '+esc(description)+'</p>'+
  '<p>🇬🇧 '+esc(item.word)+': '+esc(mean||'English meaning not supplied by dataset.')+'</p>'+
  '<p>🇳🇵 「'+esc(item.word)+'」 को पढाइ '+esc(item.reading||'स्रोतमा छैन')+' हो। '+(mean?'English अर्थ: '+esc(mean)+'।':'यस शब्दको अर्थ स्रोतमा छैन।')+'</p>'+
  '<p><b>JLPT source level(s):</b> '+esc([...item.levels].join(', ')||'Kanji examples only')+'</p>'+
  (sentence?'<div class="ns-compound-example"><b>例文:</b><div lang="ja">'+(hasFurigana&&sentence.furigana?furigana(sentence.furigana):esc(sentence.ja))+'</div>'+(sentence.en?'<div>'+esc(sentence.en)+'</div>':'')+'</div>':'<p class="ns-compounds-note">Example sentence not provided in source.</p>')+
  '<div class="ns-compound-actions"><button type="button" data-ns-speak="'+esc(item.word)+'">🔊 Japanese</button><button type="button" data-ns-translate="'+id+'">🌐 नेपाली・日本語 Meaning</button></div><div class="ns-compound-translations" hidden></div></div></details>';
 }).join(''):'<p>यो खोजमा शब्द भेटिएन। 該当する語が見つかりませんでした。</p>';
 const more=rootEl.querySelector('#ns-compounds-more');more.hidden=shown.length>=all.length;
}
function renderStatus(){
 if(!current)return;
 const msg='Available words: '+known.length+'. Sources checked: '+doneSources+'/5.'+
 (failed.length?' Could not load: '+failed.join(', ')+'. Some words may be missing.':'')+
 (doneSources<5?' Loading additional JLPT levels…':' Showing all matches available in loaded datasets (not an exhaustive dictionary).');
 ensure().querySelector('#ns-compounds-status').textContent=msg;
}
async function open({item,level,localVocabulary=[],initialWord='' }){
 if(!item||!item.character||!LEVELS.includes(level))return;
 const element=ensure(),version=++loadGeneration;
 current={item,level,localVocabulary:Array.isArray(localVocabulary)?localVocabulary:[],fetched:new Map()};
 search=initialWord||'';subset='all';limit=40;doneSources=0;failed=[];
 element.querySelector('#ns-compounds-filter').value=search;
 element.querySelector('#ns-compounds-kind').value='all';
 element.hidden=false;document.body.classList.add('ns-compounds-open');
 drawHeader();known=merge(item.character,current.localVocabulary,current.fetched);renderList();renderStatus();
 element.querySelector('.ns-compounds-panel').focus();
 // Fetch on demand, never pre-load entire dictionaries for every Kanji card.
 await Promise.all(LEVELS.map(async lv=>{
  try{const rows=await oneSource(lv);if(version!==loadGeneration)return;current.fetched.set(lv,rows);}
  catch(e){if(version!==loadGeneration)return;failed.push(lv);}
  if(version!==loadGeneration)return;doneSources++;known=merge(item.character,current.localVocabulary,current.fetched);renderList();renderStatus();
 }));
}
window.NextStepCompounds={open};
})();
