/* Read existing level Master Books as a Japanese-style textbook.
 * The book, lesson navigation, answer keys and study data remain untouched.
 * Selected-language explanations are opt-in; free translation has limits.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const book=document.getElementById('itemsView'),study=$('studyView'),control=$('targetLang');
if(!book||!study)return;
document.body.classList.add('ns-japanese-book');
const level=(location.pathname.match(/\/(N[1-5])\//)||[])[1]||'JLPT';
let generation=0,busy=false,scheduled=false;
const create=(tag,cls,str)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(str!==undefined)el.textContent=str;return el};
const toolbar=create('section','ns-book-toolbar');
toolbar.setAttribute('aria-label','Japanese textbook reading and language options');
toolbar.append(create('h2','ns-book-title','📖 '+level+' 日本語教科書 · Complete Book'));
toolbar.append(create('p','ns-book-subtitle','原文の日本語を残したまま、章ごとに学習できます。 Read Kanji, Vocabulary, Grammar, examples and lessons in a familiar Japanese textbook layout.'));
const actions=create('div','ns-book-actions');
const selectLabel=create('label',null,'🌍 Explanation: ');
const langSelect=create('select');langSelect.id='nsBookLanguage';langSelect.setAttribute('aria-label','Select textbook explanation language');
const codes='ne en ja hi bn zh-CN ko fr es de ar th vi id pt ru it tr uk pl nl sv fi da no el he fa ur ta te mr gu pa ms sw fil my km lo af sq am hy az eu be bs bg ca hr cs et gl ka ht hu is ig ga jv kk ku ky lv lt mk mn ps ro sr sk sl so su tg uz cy zu yo xh si or as tk fy lb mt ny st sd yi ceb'.split(' ');
const nativeNames={ne:'नेपाली',en:'English',ja:'日本語',hi:'हिन्दी','zh-CN':'中文',ko:'한국어',bn:'বাংলা',ar:'العربية',ur:'اردو',ta:'தமிழ்'};
const offered=codes.map(code=>{let name=nativeNames[code]||code;try{if(!nativeNames[code])name=new Intl.DisplayNames(['en'],{type:'language'}).of(code)||code}catch{}return [code,name+' ('+code+')']});
for(const [code,name] of offered){const option=create('option',null,name);option.value=code;langSelect.append(option)}
let prefs={};try{prefs=JSON.parse(localStorage.getItem('nextstep-unified-prefs')||'{}')||{}}catch{}
const saved=localStorage.getItem('ns-book-lang')||prefs.lang||control?.value||'ne';
langSelect.value=[...langSelect.options].some(o=>o.value===saved)?saved:'en';
if(control&&[...control.options].some(o=>o.value===langSelect.value))control.value=langSelect.value;
selectLabel.append(langSelect);actions.append(selectLabel);
const translateChapter=create('button','ns-book-primary','🌐 Translate visible lesson');translateChapter.type='button';
const stop=create('button',null,'■ Stop');stop.type='button';stop.hidden=true;
const focusBtn=create('button',null,'📄 Reading mode ON');focusBtn.type='button';focusBtn.setAttribute('aria-pressed','true');
const status=create('p','ns-book-state','Japanese is kept as the original. Translate each study item or the current chapter on request; internet and provider limits apply.');
status.id='nsBookStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
actions.append(translateChapter,stop,focusBtn);
toolbar.append(actions,status);
study.insertBefore(toolbar,$('itemsView'));
langSelect.onchange=()=>{
 try{localStorage.setItem('ns-book-lang',langSelect.value);const old=JSON.parse(localStorage.getItem('nextstep-unified-prefs')||'{}');localStorage.setItem('nextstep-unified-prefs',JSON.stringify({...old,lang:langSelect.value}))}catch{}
 if(control&&[...control.options].some(o=>o.value===langSelect.value)){control.value=langSelect.value;control.dispatchEvent(new Event('change',{bubbles:true}))}
 status.textContent='Selected '+langSelect.options[langSelect.selectedIndex].textContent+'. Press Translate to view a lesson explanation in this language.';
};
control?.addEventListener('change',()=>{
 if([...langSelect.options].some(o=>o.value===control.value)){langSelect.value=control.value}
});
focusBtn.onclick=()=>{
 const on=!document.body.classList.toggle('ns-japanese-book');
 focusBtn.setAttribute('aria-pressed',String(on));focusBtn.textContent=on?'📄 Reading mode ON':'📖 Reading mode OFF';
};
function selectedEnglish(card){
 const source=[...card.querySelectorAll('h3,.meaning,.card-info,.field,.en,.small,.badge')];
 const out=[],seen=new Set();
 for(const x of source){
  const text=String(x.textContent||'').replace(/\s+/g,' ').trim();
  if(!text||seen.has(text))continue;
  seen.add(text);out.push(text)
 }
 return out.join('\n').slice(0,1700)
}
function selectedJapanese(card){
 const text=[...card.querySelectorAll('.example .ja')].map(e=>e.textContent.trim()).filter(Boolean);
 return [...new Set(text)].slice(0,3).join('\n')
}
async function translateCard(card){
 if(!card.isConnected)throw Error('This chapter changed; reopen the lesson.');
 const block=card.querySelector('.ns-lesson-translation');
 const button=card.querySelector('.ns-chapter-trans-btn');
 if(!block||!button)return;
 const language=langSelect.value;
 const english=selectedEnglish(card),japanese=selectedJapanese(card);
 button.disabled=true;block.hidden=false;
 try{
  if(language==='ja'){
   block.textContent=japanese||'日本語の例文は、この教材にありません。 English meanings remain above as supplied in the original source.';
   return
  }
  if(language==='en'){
   block.textContent=english||'No original English explanation supplied.';
   return
  }
  if(!navigator.onLine)throw Error('Translation requires internet.');
  const request=window.NextStepTranslate?.requestTranslation;
  if(!request)throw Error('Translation provider is not available.');
  block.textContent='⏳ Translating source details and Japanese example sentences…';
  const answers=[];
  if(english)answers.push(await request(english,'en',language));
  if(japanese)answers.push(await request(japanese,'ja',language));
  block.textContent=answers.filter(Boolean).join('\n\n')||'No translatable detail was available.';
 }catch(e){
  block.replaceChildren(create('span',null,'Machine translation unavailable: '+String(e.message||e)+'. Original text remains above. '));
  const text=[english,japanese].filter(Boolean).join('\n').slice(0,3800);
  if(text){const link=create('a',null,'Open Google Translate ↗');link.href='https://translate.google.com/?'+new URLSearchParams({sl:'auto',tl:language,text,op:'translate'});link.target='_blank';link.rel='noopener noreferrer';block.append(link)}
  throw e
 }finally{button.disabled=false}
}
function decorate(){
 const cards=book.querySelectorAll('.cards > .card');
 for(const card of cards){
  if(card.dataset.nsBookTranslated==='1')continue;
  card.dataset.nsBookTranslated='1';
  const button=create('button','ns-chapter-trans-btn','🌐 Translate full item · '+langSelect.value);
  button.type='button';
  const translation=create('div','ns-lesson-translation');translation.hidden=true;translation.setAttribute('role','status');
  button.onclick=()=>translateCard(card).catch(()=>{});
  card.append(button,translation)
 }
}
const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;decorate()})});
observer.observe(book,{childList:true,subtree:true});
decorate();
translateChapter.onclick=async()=>{
 if(busy)return;
 const cards=[...book.querySelectorAll('.cards > .card')];
 if(!cards.length){status.textContent='Open a Kanji, Vocabulary or Grammar lesson first.';return}
 busy=true;translateChapter.disabled=true;stop.hidden=false;const token=++generation;let completed=0,failed=0;
 try{
  for(const card of cards){
   if(token!==generation||!card.isConnected)break;
   status.textContent='Translating current lesson: '+completed+'/'+cards.length+' items · '+langSelect.value;
   try{await translateCard(card);completed++}
   catch{failed++;if(failed>=2&&completed===0){status.textContent='Free translation provider is unavailable. Translate individual items or use the external link.';break}}
  }
  if(token===generation)status.textContent='Current lesson: '+completed+' translated · '+failed+' unavailable. Original Japanese and chapter content preserved.'
 }finally{busy=false;translateChapter.disabled=false;stop.hidden=true}
};
stop.onclick=()=>{generation++;status.textContent='Stopped after the current item. Earlier translations remain on the page.'};
})();
