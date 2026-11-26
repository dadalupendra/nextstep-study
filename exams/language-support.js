/* NextStep — unified, opt-in translation controls on all exam question views.
   Keeps original Japanese visible and explains all four original answer options.
   Uses the publicly limited MyMemory API; no false promise of guaranteed translations. */
(()=>{'use strict';
const codes='ne en ja hi bn zh-CN ko fr es de ar th vi id pt ru it tr uk pl nl sv fi da no el he fa ur ta te mr gu pa ms sw fil my km lo af sq am hy az eu be bs bg ca hr cs et gl ka ht hu is ig ga jv kk ku ky lv lt mk mn ps ro sr sk sl so su tg uz cy zu yo xh si or as tk fy lb mt ny st sd yi ceb'.split(' ');
const names={ne:'नेपाली',en:'English',ja:'日本語',hi:'हिन्दी',bn:'বাংলা','zh-CN':'中文',ko:'한국어',ar:'العربية',ur:'اردو',ta:'தமிழ்',te:'తెలుగు'};
const STORE='nextstep-unified-prefs',CACHE='nextstep-exam-translations-v1';
let prefs={};try{prefs=JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{}
let lang=prefs.lang&&codes.includes(prefs.lang)?prefs.lang:'ne',cache={};try{cache=JSON.parse(localStorage.getItem(CACHE)||'{}')||{}}catch{}
const displayName=code=>{try{return new Intl.DisplayNames(['en'],{type:'language'}).of(code)||code}catch{return code}};
function getLanguage(){return lang}
function setLanguage(v){if(!codes.includes(v))return;lang=v;prefs.lang=v;try{localStorage.setItem(STORE,JSON.stringify(prefs))}catch{};document.querySelectorAll('.ns-translation-output').forEach(node=>node.textContent='');document.querySelectorAll('.ns-exam-translate-language').forEach(x=>x.value=v);document.dispatchEvent(new CustomEvent('nextstep-language-changed',{detail:{language:v}}))}
function languagePicker(){const outer=document.createElement('label');outer.className='ns-exam-language-label';outer.textContent='🌍 Explanation language: ';const select=document.createElement('select');select.className='ns-exam-translate-language';select.setAttribute('aria-label','Language for Japanese question and explanation translations');for(const code of codes){const opt=document.createElement('option');opt.value=code;opt.textContent=(names[code]||displayName(code))+' ('+code+')';select.append(opt)}select.value=lang;select.addEventListener('change',e=>setLanguage(e.target.value));outer.append(select);return outer}
async function translate(text,source='en',target=lang){
 text=String(text||'').trim();if(!text)return '';
 if(target===source)return text;
 const key=source+'|'+target+'|'+text;if(cache[key])return cache[key];
 if(!window.NextStepTranslate?.requestTranslation)throw Error('Translation service is not loaded.');
 // Explanations of all choices are performed on demand to avoid abusive API traffic.
 const value=await window.NextStepTranslate.requestTranslation(text,source,target);
 if(value.trim()){cache[key]=value;const entries=Object.entries(cache).slice(-180);cache=Object.fromEntries(entries);try{localStorage.setItem(CACHE,JSON.stringify(cache))}catch{}}
 return value
}
function external(source,sourceLang='en',target=lang){const a=document.createElement('a');a.href='https://translate.google.com/?'+new URLSearchParams({sl:sourceLang,tl:target,text:String(source).slice(0,4500),op:'translate'});a.target='_blank';a.rel='noopener noreferrer';a.className='ns-external-translation';a.textContent='Open Google Translate ↗';return a}
function explanationText(q,index,api){
 // Preserve actual explanation in full, not simply "correct"/"wrong".
 const html=api.explain(q,index);const node=document.createElement('div');node.innerHTML=html;
 const full=node.textContent.replace(/\s+/g,' ').trim();
 // Prefer English part: Japanese/English mixed text is still shown below if needed.
 const raw=html.split(/🇬🇧|🇺🇸/)[1]||'';
 const enBox=document.createElement('div');enBox.innerHTML=raw;
 const english=enBox.textContent.trim();
 return {english:english||full,full};
}
function translationSection(q,api,{includeQuestion=true,includeReview=true}={}){
 const panel=document.createElement('section');panel.className='ns-translation-panel';
 panel.append(languagePicker());
 const hint=document.createElement('p');hint.className='ns-translation-hint';hint.textContent='The original Japanese text stays visible. Automatic translations can be inaccurate; third-party rate limits and network access apply.';panel.append(hint);
 const actions=document.createElement('div');actions.className='ns-translation-actions';
 if(includeQuestion){
  const question=document.createElement('button');question.type='button';question.textContent='📖 Translate question & all 4 choices';
  const qout=document.createElement('div');qout.className='ns-translation-output';qout.setAttribute('aria-live','polite');
  question.onclick=async()=>{question.disabled=true;const target=lang;qout.textContent='⏳ Translating full question…';
   try{const original=[q.prompt||'',...q.options.map((o,i)=>String(i+1)+'. '+o)].join('\n');
     const value=await translate(original,'ja',target);if(target===lang)qout.textContent=value;
   }catch(e){qout.textContent='Translation unavailable: '+e.message+'.';qout.append(external([q.prompt,...q.options].join('\n'),'ja',target))}
   finally{question.disabled=false}};
  actions.append(question);panel.append(actions,qout);
 }
 const review=document.createElement('button');review.type='button';review.textContent='✅ Explain ALL 4 answers in '+displayName(lang);
 const result=document.createElement('div');result.className='ns-translation-output';result.setAttribute('aria-live','polite');const correct=q.answer;
 review.onclick=async()=>{review.disabled=true;const target=lang;result.textContent='⏳ Translating why each choice is right or wrong…';
  const nodes=[];
  for(let j=0;j<4;j++){
   const {english}=explanationText(q,j,api);
   const item=document.createElement('div');item.className='ns-translation-choice';
   const h=document.createElement('strong');h.textContent=(j+1)+'. '+q.options[j]+' — '+(j===correct?'✓ Correct':'✗ Incorrect');
   const p=document.createElement('p');p.textContent='⏳';item.append(h,p);nodes.push({p,english});result.append(item);
  }
  try{
    // Translate all four actual choice explanations separately, with each
    // result displayed under its option. Requests are opt-in and sequential.
    for(const item of nodes){
      if(target!==lang)break;
      try{item.p.textContent=await translate(item.english,'en',target)}
      catch(e){
        item.p.textContent='Translation unavailable: '+e.message+'. ';
        item.p.append(external(item.english,'en',target));
      }
    }
  }catch(e){result.append(external(nodes.map((n,j)=>(j+1)+'. '+n.english).join('\\n'),'en',target))}
  finally{review.disabled=false}
 };
 if(includeReview){actions.append(review);panel.append(result)}if(!includeQuestion)panel.append(actions);return panel
}
function addExamToolbar(){
 const root=document.getElementById('exam-studio')||document.querySelector('main');if(!root||document.getElementById('ns-language-bar'))return;
 const panel=document.createElement('div');panel.id='ns-language-bar';panel.className='ns-translation-panel';panel.append(languagePicker());
 const para=document.createElement('p');para.className='ns-translation-hint';para.textContent='Translate questions, answer choices and their explanations in your chosen language. This is on-demand translation, not a replacement for Japanese JLPT exam text.';panel.append(para);root.prepend(panel);
}
function decorateClassic(container,q,api){if(!container||container.querySelector('.ns-translation-panel'))return;container.append(translationSection(q,api))}
window.NextStepExamLanguage={getLanguage,setLanguage,languagePicker,translationSection,decorateClassic,addExamToolbar,translate,external,codes};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addExamToolbar,{once:true});else addExamToolbar();
})();
