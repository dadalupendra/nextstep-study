/* NextStep original NAT/JFT/BJT books & small practice sets.
 * No official question reproductions, scoring claims or fake audio.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),LEVELS=['5Q','4Q','3Q','2Q','1Q'],EXAMS=['NAT','JFT','BJT'];
const params=new URLSearchParams(location.search);
let exam=EXAMS.includes((params.get('exam')||'').toUpperCase())?params.get('exam').toUpperCase():'NAT';
let level=LEVELS.includes((params.get('level')||'').toUpperCase())?params.get('level').toUpperCase():'5Q';
let mode=['book','quiz'].includes(params.get('mode'))?params.get('mode'):'book';
let lang=params.get('lang')||localStorage.getItem('nextstep-exam-plus-language')||'ja';
let books=null,bank=null,position=0,bookPage=0,answers={},all=[],finished=false;
const make=(tag,className,value)=>{const x=document.createElement(tag);if(className)x.className=className;if(value!==undefined)x.textContent=String(value);return x};
const key=()=>exam+'|'+(exam==='NAT'?level:'');
const activeBooks=()=>books?.books?.[exam]?.filter(b=>exam!=='NAT'||b.level===level)||[];
const activeQuestions=()=>bank?.questions?.filter(q=>q.exam===exam&&(exam!=='NAT'||q.level===level))||[];
const explain=(data)=>data?.[lang]||data?.en||data?.ja||'';
const title=()=>exam==='NAT'?'NAT-TEST '+level:exam==='JFT'?'JFT-Basic':'BJT Business Japanese';
function changeUrl(){
 const url=new URL(location.href);
 url.searchParams.set('exam',exam);
 if(exam==='NAT')url.searchParams.set('level',level);else url.searchParams.delete('level');
 url.searchParams.set('mode',mode);url.searchParams.set('lang',lang);
 history.replaceState(null,'',url)
}
function voice(text){
 if(!('speechSynthesis'in window)){$('status').textContent='Speech synthesis is not available on this browser.';return}
 const u=new SpeechSynthesisUtterance(String(text));u.lang='ja-JP';u.rate=.8;
 const v=speechSynthesis.getVoices().find(x=>x.lang.toLowerCase().startsWith('ja'));if(v)u.voice=v;
 speechSynthesis.cancel();speechSynthesis.speak(u);
 $('status').textContent=v?'Japanese device voice selected.':'Japanese device voice requested; the installed voice may differ.'
}
function display(){
 changeUrl();
 $('examTitle').textContent=title()+' · Study Book';
 document.title=title()+' | NextStep Study';
 document.documentElement.dataset.exam=exam;
 $('levelRow').replaceChildren();$('levelRow').hidden=exam!=='NAT';
 if(exam==='NAT')for(const lv of LEVELS){const b=make('button',null,lv);b.setAttribute('aria-pressed',String(level===lv));b.onclick=()=>{level=lv;bookPage=0;reset();display()};$('levelRow').append(b)}
 $('bookTab').setAttribute('aria-selected',String(mode==='book'));$('quizTab').setAttribute('aria-selected',String(mode==='quiz'));
 $('book').hidden=mode!=='book';$('quiz').hidden=mode!=='quiz';$('language').value=lang;
 const info=$('intro');info.replaceChildren();
 info.append(make('h2',null,title()+' · Original Study Collection'));
 const details=exam==='NAT'?
 'Official NAT-TEST uses 1Q–5Q and separate language knowledge/reading/listening components. This is a short original practice set, not an official past paper.':
 exam==='JFT'?
 'Official JFT-Basic: about 50 questions, 60 minutes; Script & Vocabulary, Conversation & Expression, Listening, Reading. This is a shorter starter practice set.':
 'Official BJT: 80 items across Listening, Listening & Reading and Reading; official results use a 0–800 scaled score. Here you receive accuracy only.';
 info.append(make('p','brief',details));
 const count=activeQuestions().length,chapters=activeBooks().length;
 info.append(make('p',null,chapters+' original study chapter'+(chapters===1?'':'s')+' · '+count+' original multiple-choice questions · Japanese/English/Nepali explanations'));
 const link=make('a',null,'Official test structure ↗');link.href=books?.meta?.official?.[exam]||'#';link.target='_blank';link.rel='noopener noreferrer';info.append(link);
 $('status').textContent='Ready: '+title()+'. Your answers are saved locally in this browser.';
 if(mode==='book')renderBook();else renderQuiz()
}
function chapterText(ch){return lang==='ja'?ch.text:lang==='en'?ch.en:lang==='ne'?ch.ne:ch.text}
function renderBook(){
 const chapters=activeBooks(),toc=$('contents'),list=$('chapters');toc.replaceChildren();list.replaceChildren();
 bookPage=Math.max(0,Math.min(bookPage,Math.max(0,chapters.length-1)));
 $('bookPageNumber').textContent='Chapter '+(chapters.length?bookPage+1:0)+' / '+chapters.length+' · Original content';
 for(const id of ['bookPrev','bookPrevBottom'])$(id).disabled=bookPage===0;
 for(const id of ['bookNext','bookNextBottom'])$(id).disabled=bookPage>=chapters.length-1;
 toc.append(make('h2',null,title()+' · 日本語学習テキスト'),make('p',null,'📚 Contents · '+chapters.length+' verified lesson chapters'));
 const links=make('ol');
 chapters.forEach((ch,i)=>{const li=make('li'),a=make('a',null,ch.title);a.href='#'+ch.id;a.onclick=e=>{e.preventDefault();bookPage=i;renderBook();$('book').scrollIntoView({block:'start',behavior:'smooth'})};li.append(a);links.append(li)});
 toc.append(links);
 chapters.forEach((ch,i)=>{
  if(i!==bookPage)return;
  const card=make('article','chapter');card.id=ch.id;
  const header=make('header');header.append(make('span','chapter-number',String(i+1).padStart(2,'0')),make('h3',null,ch.title));
  card.append(header,make('p',null,ch.sub));
  const tags=make('div','topic-list');ch.topics.forEach(t=>tags.append(make('span','topic',t)));card.append(tags);
  card.append(make('p','chapter-ja',ch.text));
  const def=make('div','explain',chapterText(ch));def.lang=lang;card.append(def);
  card.append(make('h4',null,'例文 · Japanese Examples'));
  const examples=make('ul');ch.examples.forEach(jp=>{const li=make('li');li.lang='ja';li.textContent=jp;examples.append(li)});card.append(examples);
  const ctr=make('div','chapter-controls');
  const speak=make('button',null,'🔊 Read examples');speak.type='button';speak.onclick=()=>voice(ch.examples.join('。'));
  const translate=make('button',null,'🌍 Translate to another language');translate.type='button';
  const out=make('div','translated');out.setAttribute('role','status');out.setAttribute('aria-live','polite');
  translate.onclick=async()=>{
   const target=lang;
   if(!target)return;
   translate.disabled=true;out.textContent='Translating with an internet service…';
   try{
    if(!window.NextStepTranslate?.requestTranslation)throw Error('Translation provider unavailable');
    out.textContent=await window.NextStepTranslate.requestTranslation(ch.text+'\n'+ch.examples.join('\n'),'ja',target)
   }catch(e){out.replaceChildren(make('span',null,'Online translation unavailable ('+e.message+'). '));const link=make('a',null,'Open translator ↗');link.href='https://translate.google.com/?'+new URLSearchParams({sl:'ja',tl:target,text:(ch.text+'\n'+ch.examples.join('\n')).slice(0,3500),op:'translate'});link.target='_blank';link.rel='noopener noreferrer';out.append(link)}
   finally{translate.disabled=false}
  };
  ctr.append(speak,translate);card.append(ctr,out);list.append(card)
 })
}
function storageKey(){return 'nextstep-exam-plus-v1-'+key()}
function loadAnswers(){try{const value=JSON.parse(localStorage.getItem(storageKey())||'{}');answers=value&&typeof value==='object'?value:{}}catch{answers={}}}
function saveAnswers(){try{localStorage.setItem(storageKey(),JSON.stringify(answers))}catch{}}
function reset(){position=0;finished=false;answers={}}
function renderQuiz(){
 all=activeQuestions();if(!all.length){$('question').textContent='No original questions available for this collection.';$('questionControls').hidden=true;return}
 $('questionControls').hidden=false;position=Math.min(position,all.length-1);
 $('quizCount').textContent='Question '+(position+1)+' / '+all.length+' · '+title();
 $('progressBar').style.width=((position+1)/all.length*100)+'%';
 $('results').hidden=!finished;
 const q=all[position],chosen=answers[q.id],answered=Number.isInteger(chosen);
 const root=$('question');root.replaceChildren();
 const card=make('article','question-card');card.append(make('span','section-label',q.section+' · '+q.id),make('h2',null,q.prompt));
 if(q.audioPractice){const speak=make('button',null,'🔊 Listen with device voice (unofficial)');speak.type='button';speak.onclick=()=>voice(q.prompt);card.append(speak)}
 const choices=make('div','answers');q.options.forEach((option,i)=>{
  const btn=make('button',null,String.fromCharCode(65+i)+'. '+option);btn.type='button';btn.setAttribute('aria-pressed',String(chosen===i));btn.disabled=finished;
  btn.onclick=()=>{answers[q.id]=i;saveAnswers();renderQuiz()};choices.append(btn)
 });card.append(choices);
 if(finished){
  const fb=make('div','feedback'+(chosen!==q.answer?' wrong':''));
  const correct=chosen===q.answer;
  fb.append(make('strong',null,correct?'✓ Correct':'✗ '+(answered?'Incorrect':'Not answered')));
  fb.append(make('p',null,'Answer: '+String.fromCharCode(65+q.answer)+'. '+q.options[q.answer]));
  fb.append(make('p',null,explain(q.explanation)));card.append(fb)
 }else if(answered){
  card.append(make('p',null,'✓ Answer saved. Explanation and correct answer appear after Finish practice.'))
 }
 root.append(card);
 $('previous').disabled=position===0;
 $('next').disabled=position===all.length-1;
 $('finish').hidden=finished;
 if(finished){
  const count=all.reduce((n,q)=>n+(answers[q.id]===q.answer?1:0),0);
  $('results').replaceChildren(make('h2',null,'Practice Results'),make('p',null,count+' / '+all.length+' correct ('+Math.round(100*count/all.length)+'%). This is practice accuracy, not an official NAT/JFT/BJT score.'));
  const review=make('button',null,'🔁 Review all explanations');review.type='button';review.onclick=()=>{position=0;renderQuiz()};$('results').append(review)
 }
}
async function init(){
 try{
  const [b,q]=await Promise.all([fetch('./books.json'),fetch('./questions.json')]);
  if(!b.ok||!q.ok)throw Error('Could not download book or question materials');
  books=await b.json();bank=await q.json();
  if(!books.books?.NAT||!Array.isArray(bank.questions))throw Error('Invalid study data');
  const names={ja:'日本語',en:'English',ne:'नेपाली',hi:'हिन्दी',bn:'বাংলা',ur:'اردو',ko:'한국어','zh-CN':'中文'};
  const codes='ja en ne hi bn zh-CN ko fr es de ar th vi id pt ru it tr uk pl nl sv fi da no el he fa ur ta te mr gu pa ms sw fil my km lo af sq am hy az eu be bs bg ca hr cs et gl ka ht hu is ig ga jv kk ku ky lv lt mk mn ps ro sr sk sl so su tg uz cy zu yo xh si or as tk fy lb mt ny st sd yi ceb'.split(' ');
  const select=$('language');select.replaceChildren();
  for(const code of codes){let name=names[code]||code;try{if(!names[code])name=new Intl.DisplayNames(['en'],{type:'language'}).of(code)||code}catch{}
   const option=make('option',null,name+' ('+code+')');option.value=code;select.append(option)}
  if(!codes.includes(lang))lang='ja';
  // Exam category is fixed by the home card; never show a different exam inside this book.
  $('bookTab').onclick=()=>{mode='book';display()};$('quizTab').onclick=()=>{mode='quiz';loadAnswers();display()};
  $('language').onchange=e=>{lang=e.target.value;try{localStorage.setItem('nextstep-exam-plus-language',lang)}catch{}display()};
  for(const [id,step] of [['bookPrev',-1],['bookPrevBottom',-1],['bookNext',1],['bookNextBottom',1]]){
   $(id).onclick=()=>{bookPage=Math.max(0,Math.min(activeBooks().length-1,bookPage+step));renderBook();$('book').scrollIntoView({block:'start',behavior:'smooth'})};
  }
  $('translatePage').onclick=()=>{if(mode!=='book'){mode='book';display()}$('chapters .chapter-controls button:nth-child(2)')?.click()};
  $('saveBook').onclick=()=>{mode='book';display();window.print()};
  $('previous').onclick=()=>{if(position>0){position--;renderQuiz()}};
  $('next').onclick=()=>{if(position<all.length-1){position++;renderQuiz()}};
  $('finish').onclick=()=>{finished=true;renderQuiz()};
  $('retry').onclick=()=>{if(confirm('Restart the questions? Previous answers for this exam will be cleared.')){reset();saveAnswers();renderQuiz()}};
  loadAnswers();display()
 }catch(error){$('status').textContent='Unable to load study materials: '+error.message}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init()
})();