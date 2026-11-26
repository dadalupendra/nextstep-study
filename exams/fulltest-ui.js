/* NextStep FullTest selector. UI-only redesign over the EXISTING 20 JLPT papers.
   NAT/JFT/BJT have their own independent original study books and starter quizzes.
   Never claim official pass scores or invent practice-paper IDs. */
(function(){
'use strict';
const LEVELS=['N5','N4','N3','N2','N1'];
const DESCRIPTIONS={N5:'Beginner Japanese',N4:'Basic Japanese',N3:'Intermediate Japanese',N2:'Upper-intermediate Japanese',N1:'Advanced Japanese'};
const $=id=>document.getElementById(id);
const create=(tag,className,label)=>{const x=document.createElement(tag);if(className)x.className=className;if(label!==undefined)x.textContent=label;return x};
const params=new URLSearchParams(location.search);
let category='JLPT',selectedLevel=LEVELS.includes((params.get('level')||'').toUpperCase())?params.get('level').toUpperCase():null;
const root=$('fulltest-root'),paperCollection=$('paper-collection'),papers=$('papers'),exam=$('exam-studio');
if(!root||!papers||!paperCollection||!exam)return;
document.body.classList.add('nextstep-fulltest');
const tabs=create('nav','fulltest-tabs');tabs.setAttribute('aria-label','Exam test category');
const allTabs=[['SIM','Simulation'],['JLPT','JLPT'],['NAT','NAT'],['JFT','JFT'],['BJT','BJT']];
const chooser=create('div','fulltest-levels');chooser.id='fulltest-levels';
const empty=create('section','fulltest-empty');empty.hidden=true;empty.setAttribute('role','status');
const head=create('div','fulltest-head');head.hidden=true;
const back=create('button','fulltest-back','← All JLPT Levels');back.type='button';
const name=create('h2',null,'JLPT practice papers');
head.append(back,name);
const disclosure=create('p','fulltest-note','20 original NextStep Study practice papers per JLPT level, 100 practice questions each. These are NOT official JLPT past papers; no official passing score is claimed.');
root.append(tabs,chooser,empty,head,disclosure);
function addPaperIcons(){
 for(const button of papers.querySelectorAll('.studio-paper-card')){
  if(button.querySelector('.fulltest-paper-icon'))continue;
  const icon=create('span','fulltest-paper-icon','📄');icon.setAttribute('aria-hidden','true');
  button.insertBefore(icon,button.firstChild);
  const action=button.querySelector('.studio-paper-action');if(action)action.textContent='›';
  const details=button.querySelector('.studio-paper-count');if(details)details.textContent='100 practice questions · Timed exam';
 }
}
let decoratePending=false;
const observer=new MutationObserver(()=>{if(decoratePending)return;decoratePending=true;queueMicrotask(()=>{decoratePending=false;addPaperIcons()})});
observer.observe(papers,{childList:true});
addPaperIcons();
function renderChooser(){
 chooser.replaceChildren();
 for(const level of LEVELS){
  const row=create('button','fulltest-level');row.type='button';row.dataset.level=level;
  row.setAttribute('aria-label','Choose JLPT '+level+' and see its existing 20 practice papers');
  const icon=create('span','fulltest-level-icon',level);icon.setAttribute('aria-hidden','true');
  const info=create('span','fulltest-level-body');
  info.append(create('span','fulltest-level-name',DESCRIPTIONS[level]));
  info.append(create('span','fulltest-level-info','Exam papers: 20'));
  info.append(create('span','fulltest-level-meta','100 independent practice questions per paper · No official passing score'));
  row.append(icon,info,create('span','fulltest-level-arrow','›'));
  row.onclick=()=>chooseLevel(level);
  chooser.append(row);
 }
}
function setUrl(){
 const url=new URL(location.href);
 if(category==='JLPT'||category==='SIM')url.searchParams.delete('category');
 else url.searchParams.set('category',category.toLowerCase());
 if(selectedLevel)url.searchParams.set('level',selectedLevel);
 else url.searchParams.delete('level');
 if(!document.body.classList.contains('fulltest-testing')){url.searchParams.delete('paper');url.searchParams.delete('view')}
 history.replaceState(null,'',url);
}
function showCategory(next){
 category=next;
 tabs.querySelectorAll('button').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.category===next)));
 const jlpt=category==='JLPT'||category==='SIM';
 chooser.hidden=!jlpt||!!selectedLevel;
 paperCollection.hidden=!jlpt||!selectedLevel;
 head.hidden=!jlpt||!selectedLevel;
 empty.hidden=jlpt;
 disclosure.hidden=!jlpt;
 if(!jlpt){
  empty.replaceChildren();
  const title=category==='NAT'?'NAT-TEST · 1Q–5Q':category==='JFT'?'JFT-Basic':'BJT · Business Japanese';
  empty.append(create('h2',null,title+' · Original Study Books'));
  empty.append(create('p',null,'Independent Japanese study chapters and short original practice sets with Japanese, English and Nepali explanations. Not official questions or complete mock tests.'));
  const link=create('a','fulltest-study-link','📖 Open '+title+' Books & Practice →');
  link.href='../exam-plus/?exam='+category;
  empty.append(link);
  empty.append(create('p',null,'Full official-format simulations require separately developed and verified complete question and audio material.'));
 }else if(selectedLevel){
  name.textContent=(category==='SIM'?'Simulation · ':'')+'JLPT '+selectedLevel+' · 20 Practice Papers';
 }else{
  disclosure.textContent='Choose a JLPT level to open its 20 available timed practice papers. All questions and saved paper IDs remain unchanged.';
 }
 setUrl();
}
function chooseLevel(level){
 if(!LEVELS.includes(level))return;
 selectedLevel=level;
 const original=[...$('levels').querySelectorAll('button')].find(b=>b.textContent.trim()===level);
 if(original)original.click();
 const studioLevel=$('studio-level');if(studioLevel)studioLevel.value=level;
 showCategory(category);
 paperCollection.scrollIntoView({behavior:'smooth',block:'start'});
}
for(const [value,label] of allTabs){
 const button=create('button',null,label);button.type='button';button.dataset.category=value;button.setAttribute('role','tab');
 button.setAttribute('aria-selected','false');
 button.onclick=()=>{if(document.body.classList.contains('fulltest-testing'))return;category=value;selectedLevel=(value==='JLPT'||value==='SIM')?selectedLevel:null;showCategory(value)};
 tabs.append(button);
}
tabs.setAttribute('role','tablist');
back.onclick=()=>{selectedLevel=null;showCategory(category);chooser.scrollIntoView({behavior:'smooth',block:'start'})};
papers.addEventListener('click',event=>{
 if(!event.target.closest('.studio-paper-card'))return;
 document.body.classList.add('fulltest-testing');
 exam.hidden=false;
},true);
$('studio-start')?.addEventListener('click',()=>{document.body.classList.add('fulltest-testing');exam.hidden=false},true);
$('studio-exit')?.addEventListener('click',()=>{
 document.body.classList.remove('fulltest-testing');exam.hidden=true;
 selectedLevel=$('studio-level')?.value||selectedLevel;category='JLPT';showCategory(category);
},false);
const directTest=params.get('view')==='exam'||params.get('view')==='classic';
if(directTest){document.body.classList.add('fulltest-testing');exam.hidden=false}
else{exam.hidden=true}
const initial=params.get('category')?.toUpperCase();
if(['NAT','JFT','BJT'].includes(initial))category=initial;
renderChooser();showCategory(category);
})();
