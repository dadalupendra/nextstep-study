/* NextStep Exam Studio — original Bunpro-inspired examination UI.
   No Bunpro content is reused. Questions are supplied by NextStepExamAPI.
   This is educational practice, NOT an official JLPT mock exam. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const api=()=>window.NextStepExamAPI;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LEVELS=['N5','N4','N3','N2','N1'];
const labels={vocab:'文字・語彙',grammar:'文法',reading:'読解',listening:'聴解'};
const minutes={N1:165,N2:155,N3:140,N4:115,N5:90};
let state=null,timerId=null,started=false;
function typeOf(q){return q.type==='文法'?'grammar':q.type==='読解'?'reading':q.type==='聴解'?'listening':'vocab';}
function save(){if(!state)return;try{localStorage.setItem('ns-studio-'+state.level+'-'+state.paper,JSON.stringify({answers:state.answers,index:state.index,startedAt:state.startedAt,submitted:state.submitted,flagged:state.flagged}));}catch(e){}}
function restore(){try{const s=JSON.parse(localStorage.getItem('ns-studio-'+state.level+'-'+state.paper)||'null');if(!s||typeof s!=='object')return;state.answers=s.answers||{};state.index=Number.isInteger(s.index)?Math.max(0,Math.min(99,s.index)):0;state.startedAt=Number(s.startedAt)||Date.now();state.flagged=s.flagged||{};state.submitted=Boolean(s.submitted);}catch(e){}}
function count(){return Object.keys(state.answers).filter(k=>Number.isInteger(state.answers[k])&&state.answers[k]>=0&&state.answers[k]<4).length;}
function time(){if(!state)return;const seconds=Math.max(0,Math.round(minutes[state.level]*60-(Date.now()-state.startedAt)/1000)),m=String(Math.floor(seconds/60)).padStart(2,'0'),s=String(seconds%60).padStart(2,'0');$('studio-timer').textContent='⏱ '+m+':'+s;if(seconds===0)$('studio-timer').setAttribute('title','Suggested practice time elapsed. You may still finish.');}
function position(i){state.index=Math.max(0,Math.min(state.questions.length-1,i));save();render();}
function sectionButton(qtype,label,count){const b=document.createElement('button');b.type='button';b.className='studio-section';b.dataset.section=qtype;b.textContent=label+' · '+count;b.addEventListener('click',()=>{const i=state.questions.findIndex(q=>typeOf(q)===qtype);if(i>=0)position(i);});return b;}
function renderSheet(){
 const buttons=$('studio-answers');buttons.replaceChildren();
 for(let i=0;i<state.questions.length;i++){
  const b=document.createElement('button');b.type='button';b.textContent=String(i+1);b.setAttribute('aria-label','Question '+(i+1));
  b.title=typeOf(state.questions[i])+(state.flagged[i]?' • Flagged':'');
  b.className='studio-number'+(i===state.index?' current':'')+(state.answers[i]!==undefined?' answered':'')+(state.flagged[i]?' flagged':'');
  b.addEventListener('click',()=>position(i));buttons.append(b);
 }
 $('studio-progress').textContent='Answered '+count()+'/'+state.questions.length;
 $('studio-progressbar').value=count();$('studio-progressbar').max=state.questions.length;
 $('studio-current').textContent='問題 '+(state.index+1)+' / '+state.questions.length;
}
function renderQuestion(){
 const q=state.questions[state.index],type=typeOf(q),isListening=type==='listening';
 $('studio-kind').textContent=labels[type]+' · '+(q.subtype||({'vocab':'語彙問題','grammar':'文法問題'})[type]);
 const container=$('studio-question');container.replaceChildren();
 const title=document.createElement('h2');title.textContent='問題 '+(state.index+1);container.append(title);
 const prompt=document.createElement('div');prompt.className='studio-prompt';prompt.lang='ja';
 // During listening, show the task, not the hidden dialogue transcript.
 const raw=String(q.prompt||'');const parts=raw.split('【質問】');
 const body=document.createElement('div');body.textContent=parts[0];body.style.whiteSpace='pre-wrap';prompt.append(body);
 if(parts.length>1){const question=document.createElement('p');question.className='studio-prompt-question';question.textContent='【質問】'+parts.slice(1).join('【質問】');prompt.append(question);}
 container.append(prompt);
 if(isListening){
  const box=document.createElement('div');box.className='studio-audio';
  const play=document.createElement('button');play.type='button';play.textContent='▶ 音声を再生 / Play Japanese';play.addEventListener('click',()=>api().speak(q.passage||'',1));
  const slow=document.createElement('button');slow.type='button';slow.className='studio-secondary';slow.textContent='🐢 Slow';slow.addEventListener('click',()=>api().speak(q.passage||'',0.78));
  box.append(play,slow);
  const note=document.createElement('small');note.textContent='Japanese device voice (TTS), not a human exam recording.';box.append(note);container.append(box);
  if(q.visual){const visual=document.createElement('div');visual.className='studio-visual';visual.innerHTML='<strong>🗓 '+esc(q.visual.label)+'</strong><span>日付：'+esc(q.visual.day)+'</span><span>場所：'+esc(q.visual.place)+'</span><span>時間は音声で確認してください。</span>';container.append(visual);}
 }else{
  const play=document.createElement('button');play.type='button';play.className='studio-secondary studio-speech';play.textContent='🔊 Read Japanese';play.addEventListener('click',()=>api().speak(q.passage||q.prompt||'',0.93));container.append(play);
 }
 const options=document.createElement('div');options.className='studio-options';options.setAttribute('role','group');options.setAttribute('aria-label','Choose one answer');
 q.options.forEach((option,j)=>{
  const button=document.createElement('button');button.type='button';button.className='studio-choice';if(state.answers[state.index]===j)button.classList.add('selected');
  if(state.submitted&&j===q.answer)button.classList.add('correct');
  if(state.submitted&&state.answers[state.index]===j&&j!==q.answer)button.classList.add('incorrect');
  button.innerHTML='<span class="studio-choice-digit">'+(j+1)+'</span><span>'+esc(option)+'</span>';
  button.setAttribute('aria-pressed',String(state.answers[state.index]===j));
  button.disabled=state.submitted;
  button.addEventListener('click',()=>{state.answers[state.index]=j;save();renderQuestion();renderSheet();});options.append(button);
 });container.append(options);
 if(state.submitted){
  const explanation=document.createElement('div');explanation.className='studio-explanation';
  const h=document.createElement('h3');h.textContent='解説 / व्याख्या / Explanation';explanation.append(h);
  const summary=document.createElement('p');summary.textContent='正解：'+(q.answer+1)+' — '+q.options[q.answer];explanation.append(summary);
  for(let j=0;j<4;j++){const opt=document.createElement('div');opt.className='studio-explain-option';opt.innerHTML=api().explain(q,j);explanation.append(opt);}
  if(isListening){const transcript=document.createElement('details');transcript.open=true;const label=document.createElement('summary');label.textContent='🎧 Listening Script (日本語)';const text=document.createElement('p');text.textContent=q.passage||'';text.style.whiteSpace='pre-wrap';transcript.append(label,text);explanation.append(transcript);}
  container.append(explanation);
 }
 $('studio-prev').disabled=state.index===0;
 $('studio-next').disabled=state.index===state.questions.length-1;
 $('studio-flag').setAttribute('aria-pressed',String(Boolean(state.flagged[state.index])));
 $('studio-flag').textContent=state.flagged[state.index]?'🚩 Flagged':'⚑ Mark for review';
 $('studio-submit').hidden=state.submitted;
 $('studio-return').hidden=!state.submitted;
 document.querySelectorAll('#studio-sections .studio-section').forEach(b=>b.setAttribute('aria-pressed',String(type===b.dataset.section)));
}
function render(){if(!state)return;renderSheet();renderQuestion();time();}
function stats(){
 const section={vocab:{total:0,right:0},grammar:{total:0,right:0},reading:{total:0,right:0},listening:{total:0,right:0}};
 state.questions.forEach((q,i)=>{const s=section[typeOf(q)];s.total++;if(state.answers[i]===q.answer)s.right++;});
 return section;
}
function summary(){
 const result=$('studio-results');result.replaceChildren();const sections=stats();
 const correct=Object.values(sections).reduce((a,b)=>a+b.right,0);
 const heading=document.createElement('h2');heading.textContent='📊 '+state.level+' · Paper '+String(state.paper).padStart(2,'0')+' — Practice Results';
 result.append(heading);
 const intro=document.createElement('p');intro.textContent='Correct: '+correct+'/'+state.questions.length+' ('+Math.round(correct/state.questions.length*100)+'%). This is not an official JLPT scaled score or a pass prediction.';result.append(intro);
 for(const [name,s] of Object.entries(sections)){
  const row=document.createElement('div');row.className='studio-stat';row.innerHTML='<span>'+labels[name]+'</span><b>'+s.right+' / '+s.total+'</b>';result.append(row);
 }
 const desc=document.createElement('p');desc.textContent='Choose any question in the Answer Sheet to review the correct answer, detailed explanations for all four choices, and listening transcripts.';result.append(desc);
 result.hidden=false;result.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function submit(){
 if(state.submitted){summary();return;}
 const missing=state.questions.length-count();
 if(missing&&!window.confirm('There are '+missing+' unanswered questions. Submit anyway?'))return;
 state.submitted=true;save();render();summary();
}
async function start(){
 const level=$('studio-level').value,paper=Number($('studio-paper').value);
 if(!LEVELS.includes(level)||paper<1||paper>20)return;
 $('studio-start').disabled=true;$('studio-loader').textContent='Checking verified Japanese questions and audio for '+level+' Paper '+paper+'…';
 try{
  const questions=await api().load(level,paper,{requireVerified:true});
  if(questions.length!==100)throw Error('Expected 100 questions; received '+questions.length);
  state={level,paper,questions,answers:{},flagged:{},startedAt:Date.now(),index:0,submitted:false};
  restore();started=true;
  $('studio-test').hidden=false;$('studio-results').hidden=true;
  $('studio-loader').textContent='Ready · 100 practice questions. Listening uses system Japanese voice.';
  const sections=$('studio-sections');sections.replaceChildren();
  for(const [type,title] of Object.entries(labels))sections.append(sectionButton(type,title,questions.filter(q=>typeOf(q)===type).length));
  render();if(state.submitted)summary();
  clearInterval(timerId);timerId=setInterval(time,1000);
  $('studio-test').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){$('studio-loader').textContent='Unable to load paper: '+String(e.message||e)+'. Check connection and retry.';}
 finally{$('studio-start').disabled=false;}
}
function setup(){
 if(!$('studio-start'))return;
 const query=new URLSearchParams(location.search);
 const level=(query.get('level')||'N5').toUpperCase();
 $('studio-level').value=LEVELS.includes(level)?level:'N5';
 $('studio-start').addEventListener('click',start);
 $('studio-prev').addEventListener('click',()=>position(state.index-1));
 $('studio-next').addEventListener('click',()=>position(state.index+1));
 $('studio-flag').addEventListener('click',()=>{if(state.flagged[state.index])delete state.flagged[state.index];else state.flagged[state.index]=true;save();render();});
 $('studio-submit').addEventListener('click',submit);
 $('studio-return').addEventListener('click',summary);
 $('studio-level').addEventListener('change',()=>{const url=new URL(location.href);url.searchParams.set('level',$('studio-level').value);history.replaceState(null,'',url);});
 document.addEventListener('keydown',e=>{if(!started||!state||e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||''))return;
  if(['1','2','3','4'].includes(e.key)&&!state.submitted){const b=$('studio-question').querySelectorAll('.studio-choice')[Number(e.key)-1];if(b){e.preventDefault();b.click();}}
  else if(e.key==='ArrowRight'){e.preventDefault();position(state.index+1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();position(state.index-1);}
 });
}
setup();
})();