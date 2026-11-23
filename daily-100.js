/* NextStep Study Daily 100
 * Shared daily-review functionality for the existing N1–N5 Master Books.
 * Builds source-backed MCQ exercises; not official or individually verified JLPT papers.
 * At least 30 Kanji + 40 vocabulary + 30 grammar source entries per day.
 * Uses deterministic Tokyo calendar-date rotation and browser-local progress.
 */
(function(global){
'use strict';
const TARGETS=[['kanji',30,'漢字 / Kanji'],['vocab',40,'語彙 / Vocabulary'],['grammar',30,'文法 / Grammar']];
const MAX=100;
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const hash=str=>{let h=2166136261>>>0;for(const ch of String(str)){h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0}return h;};
function shuffle(values,seed){const a=values.slice();let state=hash(seed)||1;for(let i=a.length-1;i>0;i--){state^=state<<13;state^=state>>>17;state^=state<<5;const j=(state>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function ordinal(day){
 if(!/^\d{4}-\d\d-\d\d$/.test(day))throw Error('Unexpected Tokyo date: '+day);
 const n=Date.parse(day+'T00:00:00+09:00');if(!Number.isFinite(n))throw Error('Invalid Tokyo date');return Math.floor((n+9*3600000)/86400000);
}
function keyOf(type,item){return type==='kanji'?String(item.character||''):type==='grammar'?String(item.pattern||''):String(item.word||'')+'|'+String(item.reading||'');}
function isGood(q){
 return q&&typeof q.stem==='string'&&q.stem.trim().length>9&&
 Array.isArray(q.options)&&q.options.length===4&&
 q.options.every(x=>typeof x.text==='string'&&x.text.trim()&&x.item)&&
 new Set(q.options.map(x=>x.text)).size===4&&
 q.options.filter(x=>x.correct).length===1&&q.answer===q.options.find(x=>x.correct).text;
}
function build({level,day,data,makeQuestion}){
 if(!/^N[1-5]$/.test(level)||typeof makeQuestion!=='function')throw Error('Daily 100 configuration missing');
 const dayNo=ordinal(day),usedStems=new Set(),output=[],sourceCounts={};
 for(const [type,quantity] of TARGETS){
  const records=data?.[type];
  if(!Array.isArray(records))throw Error(level+' '+type+' study source was not loaded');
  const seen=new Set(),pool=[];
  const shuffled=shuffle(records,level+'|'+type+'|daily100-source-v1');
  for(let i=0;i<shuffled.length;i++){
   const item=shuffled[i],key=keyOf(type,item);
   if(!key||seen.has(key))continue;seen.add(key);
   // Choose one valid, source-derived question for each distinct study entry.
   let q=null;
   const preferred=hash(key+'|'+type)%2;
   const variants=preferred===0?[0,1,2]:[1,0,2];
   for(const variant of variants){
    const candidate=makeQuestion(type,item,i*19+97,variant);
    if(isGood(candidate)){q=candidate;break;}
   }
   if(q&&!usedStems.has(q.stem)){usedStems.add(q.stem);pool.push({key,item,q});}
  }
  sourceCounts[type]=pool.length;
  if(pool.length<quantity){
   throw Error(level+' '+type+' has only '+pool.length+' usable questions; '+quantity+
   ' are required. Source data cannot safely supply 100 distinct daily questions.');
  }
  // Non-overlapping consecutive-day selections when each pool has >= 2*quantity.
  const offset=((dayNo*quantity)%pool.length+pool.length)%pool.length;
  for(let i=0;i<quantity;i++){
   const row=pool[(offset+i)%pool.length];
   const mixed=shuffle(row.q.options,level+'|'+day+'|'+type+'|'+row.key+'|choices');
   const correct=mixed.find(o=>o.correct);
   output.push({
    id:level+'|'+day+'|'+type+'|'+row.key,sourceKey:row.key,type,item:row.item,
    mode:row.q.mode,stem:row.q.stem,options:mixed,
    choices:mixed.map(o=>o.text),answer:correct.text
   });
  }
 }
 if(output.length!==MAX||new Set(output.map(x=>x.id)).size!==MAX||new Set(output.map(x=>x.stem)).size!==MAX){
  throw Error(level+' Daily Challenge integrity check failed: repeated stems or wrong count');
 }
 return {level,day,questions:output,sourceCounts,counts:Object.fromEntries(TARGETS.map(([k,n])=>[k,n]))};
}
function storeKey(level,day){return 'nextstep-daily100-v1-'+level+'-'+day;}
function loadProgress(level,day){
 try{const raw=JSON.parse(localStorage.getItem(storeKey(level,day))||'null');
  if(raw&&typeof raw==='object')return{answers:raw.answers&&typeof raw.answers==='object'?raw.answers:{},flagged:raw.flagged&&typeof raw.flagged==='object'?raw.flagged:{},index:Math.max(0,Math.min(99,Number(raw.index)||0))};
 }catch(e){}
 return{answers:{},flagged:{},index:0};
}
function saveProgress(level,day,state){try{localStorage.setItem(storeKey(level,day),JSON.stringify({answers:state.answers,flagged:state.flagged,index:state.index}));return true;}catch(e){return false;}}
function streak(level,day,hasToday){
 let n=0,d=ordinal(day)-(hasToday?0:1);
 // Entries count toward streak once ALL 100 have answers.
 for(let i=0;i<365;i++){
  const dt=new Date((d-i)*86400000).toISOString().slice(0,10);
  try{const record=JSON.parse(localStorage.getItem(storeKey(level,dt))||'null');
   if(record?.answers&&Object.keys(record.answers).length===100)n++;else break;
  }catch(e){break}
 }
 return n;
}
function mount({level,day,data,makeQuestion,feedbackHTML,container,legacyHTML='',speak}){
 if(!container||typeof feedbackHTML!=='function')throw Error('Daily Challenge UI is not available');
 let built;
 try{built=build({level,day,data,makeQuestion});}catch(error){
  container.innerHTML='<div class="quiz-shell"><h2>⚠ Daily Challenge source incomplete</h2><p class="notice">'+esc(error.message)+'</p><p>Duplicated or invented questions will not be inserted. You can still study the existing Kanji, Vocabulary and Grammar books.</p><details><summary>📖 Original 10 Flashcards</summary>'+legacyHTML+'</details></div>';
  return {error:String(error.message)};
 }
 const questions=built.questions,state=loadProgress(level,day);
 const valid=new Set(questions.map(x=>x.id));
 for(const key of Object.keys(state.answers)){
  const q=questions.find(x=>x.id===key);
  if(!valid.has(key)||!q||!q.options.some(o=>o.text===state.answers[key]))delete state.answers[key];
 }
 let answered=()=>questions.filter(q=>typeof state.answers[q.id]==='string').length;
 let correct=()=>questions.filter(q=>state.answers[q.id]===q.answer).length;
 function redraw(){
  const q=questions[state.index],selected=state.answers[q.id],complete=answered()===MAX,done=answered(),score=correct();
  const localSummary=TARGETS.map(([type,,title])=>{
   const set=questions.filter(q=>q.type===type),count=set.filter(x=>state.answers[x.id]!==undefined).length;
   return '<button class="d100-section" data-d100-section="'+type+'" type="button">'+esc(title)+' <b>'+count+'/'+set.length+'</b></button>';
  }).join('');
  const opts=q.options.map((o,i)=>{
   const chosen=selected===o.text,graded=selected!==undefined;
   return '<button type="button" class="d100-choice'+(chosen?' selected':'')+(graded&&o.correct?' is-correct':'')+(graded&&chosen&&!o.correct?' is-wrong':'')+
     '" data-d100-answer="'+i+'" aria-pressed="'+chosen+'" '+(graded?'disabled':'')+'>'+
     '<span class="d100-num">'+('ABCD'[i])+'</span><span>'+esc(o.text)+'</span></button>';
  }).join('');
  const detail=selected!==undefined?'<div class="d100-feedback" role="status">'+feedbackHTML(q,selected)+'</div>':'';
  const typeText={kanji:'漢字',vocab:'語彙',grammar:'文法'}[q.type]||q.type;
  const scoreNote=complete?'🎉 今日の100問を完了！ '+score+'/100 正解 · '+Math.round(score)+'%':(MAX-done)+' remaining / बाँकी · '+score+' correct so far';
  container.innerHTML='<div class="quiz-shell d100-shell" id="nextstep-daily-100">'+
   '<header class="d100-top"><div><p class="d100-kicker">NEXTSTEP STUDY · DAILY PRACTICE</p><h2>📅 '+esc(level)+' · 今日の100問チャレンジ</h2><p>'+esc(day)+' (Asia/Tokyo) · 漢字 30 · 語彙 40 · 文法 30</p><p class="small">毎日新しい教材ベースの練習問題を表示します。同じ日は同じ問題です。これは公式JLPT問題ではありません。</p></div>'+
   '<div class="d100-pill"><b>'+done+' / 100</b><span>Answered</span></div></header>'+
   '<progress class="d100-progress" max="100" value="'+done+'" aria-label="Daily practice progress"></progress>'+
   '<div class="d100-categories">'+localSummary+'</div>'+
   '<div class="d100-layout"><div class="d100-paper">'+
   '<div class="d100-meta"><span>'+esc(typeText)+' · 問題 '+(state.index+1)+'/100</span><button type="button" data-d100-flag="1">'+(state.flagged[q.id]?'🚩 Marked':'⚑ Review later')+'</button></div>'+
   '<h3 class="d100-stem" lang="ja">'+esc(q.stem)+'</h3>'+
   '<div class="d100-choices" role="group" aria-label="Answer choices">'+opts+'</div>'+detail+
   '<div class="d100-bottom"><button type="button" data-d100-prev="1" '+(state.index===0?'disabled':'')+'>← Previous</button>'+
   '<button type="button" class="d100-next" data-d100-next="1" '+(state.index===99?'disabled':'')+'>Next →</button></div></div>'+
   '<aside class="d100-panel"><h3>✅ Answer Sheet</h3><p>'+esc(scoreNote)+'</p>'+
   '<div class="d100-nums">'+questions.map((x,i)=>'<button type="button" data-d100-jump="'+i+'" class="'+(i===state.index?' current':'')+(state.answers[x.id]!==undefined?' answered':'')+(state.flagged[x.id]?' marked':'')+'" aria-label="Question '+(i+1)+'">'+(i+1)+'</button>').join('')+'</div>'+
   '<p class="small">Green = answered · Gold = marked</p>'+
   (complete?'<div class="d100-result">🎓 Today: <b>'+score+'/100</b> · '+Math.round(score)+'%<br>🔥 Completed streak: '+streak(level,day,true)+' days</div>':'')+
   '<p class="small">Answers are saved in this browser. If browser storage is cleared or you change devices, progress is not synchronized.</p></aside></div>'+
   '<details class="d100-flashcards"><summary>📖 Original 10 Daily Flashcards (5 Kanji + 5 Vocabulary)</summary>'+legacyHTML+'</details>'+
   '</div>';
  const root=container.querySelector('#nextstep-daily-100');
  root.addEventListener('click',async event=>{
   const button=event.target.closest('button');
   if(!button)return;
   if(button.hasAttribute('data-d100-answer')){
    if(state.answers[q.id]!==undefined)return;
    const index=Number(button.dataset.d100Answer);
    if(!Number.isInteger(index)||index<0||index>3)return;
    state.answers[q.id]=q.options[index].text;
    saveProgress(level,day,state);redraw();return;
   }
   if(button.hasAttribute('data-d100-next')||button.hasAttribute('data-d100-prev')){
    state.index=Math.max(0,Math.min(99,state.index+(button.hasAttribute('data-d100-next')?1:-1)));
   }else if(button.hasAttribute('data-d100-jump')){
    state.index=Math.max(0,Math.min(99,Number(button.dataset.d100Jump)));
   }else if(button.hasAttribute('data-d100-section')){
    const index=questions.findIndex(x=>x.type===button.dataset.d100Section);
    if(index>=0)state.index=index;
   }else if(button.hasAttribute('data-d100-flag')){
    if(state.flagged[q.id])delete state.flagged[q.id];else state.flagged[q.id]=true;
   }else return;
   saveProgress(level,day,state);redraw();
   // Prevent a previous answer causing a jump back to the top of a long document.
   const rootNow=container.querySelector('#nextstep-daily-100');
   if(rootNow&&button.hasAttribute('data-d100-next'))rootNow.scrollIntoView({behavior:'smooth',block:'start'});
  });
 }
 redraw();
 return {total:MAX,countBySection:built.counts,sourceCounts:built.sourceCounts,day,level};
}
global.NextStepDaily100={build,mount};
})(window);
