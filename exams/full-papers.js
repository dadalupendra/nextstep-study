/* NextStep Study: existing 20 x 5 paper IDs with original-content-only loading.
 * Preserves every paper ID and existing UI, but never substitutes synthetic demo questions.
 * Incomplete slots remain visibly unavailable until individually authored content and audio exist. */
"use strict";
(() => {
 const TOTAL=100,TOPIC='nextstep-original-only-v1';
 const escText=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 let page=0,paper=1,items=[],answers={},pending=false,sectionMode='all';
 const LEVEL_ALLOCATION={N1:{vocab:30,grammar:25,reading:30,listening:15},N2:{vocab:35,grammar:25,reading:25,listening:15},N3:{vocab:40,grammar:25,reading:20,listening:15},N4:{vocab:45,grammar:25,reading:15,listening:15},N5:{vocab:45,grammar:25,reading:15,listening:15}};
let SECTIONS={};
function applyLevelLayout(level){
 const config=LEVEL_ALLOCATION[level]||LEVEL_ALLOCATION.N5,labels={vocab:'Kanji / Vocabulary · 文字・語彙',grammar:'Grammar · 文法',reading:'Reading · 読解',listening:'Listening · 聴解'};
 let offset=0;SECTIONS={all:{name:'All Sections',start:0,end:TOTAL}};
 for(const key of ['vocab','grammar','reading','listening']){
  SECTIONS[key]={name:labels[key],start:offset,end:offset+config[key]};offset+=config[key];
  const btn=document.querySelector('#exam-sections [data-section="'+key+'"]');
  if(btn)btn.textContent=({vocab:'🈶 Kanji / Vocabulary',grammar:'📝 Grammar',reading:'📖 Reading',listening:'🎧 Listening'})[key]+' · '+config[key];
  const overview=document.querySelector('[data-overview="'+key+'"] small');
  if(overview)overview.textContent=({vocab:'Kanji / Vocabulary',grammar:'Grammar',reading:'Reading',listening:'Listening'})[key]+' · '+config[key];
 }
 if(offset!==TOTAL)throw Error('Level question allocation must total 100');
 const subtitle=document.getElementById('current-description');
 if(subtitle&&window.NextStepExamTypes){
  const types=window.NextStepExamTypes.TYPES[level];
  subtitle.textContent='JLPT '+level+' · Paper 01–20 · 100 original PRACTICE items each. 読解：'+types.reading.join(' / ')+'。聴解：'+types.listening.join(' / ')+'。※公式の出題数ではありません。';
 }
}
 const paperGrid=document.getElementById('papers'),list=document.getElementById('questions'),score=document.getElementById('score'),test=document.getElementById('test');
 const note=document.createElement('p');note.className='muted';note.textContent='Paper 01 has partially reviewed original Japanese questions. Incomplete questions are explicitly marked UNAVAILABLE; no repeated demo passage or synthetic listening script is shown. The 100 existing paper cards and question positions are retained, but none is yet a complete real JLPT-style mock exam with recorded listening audio.';paperGrid.parentElement.append(note);
 function makePaper(level,num){
  // Content-first: never silently populate the 100 existing slots with
  // algorithmically generated filler or a repeating template.
  const config=LEVEL_ALLOCATION[level];
  if(!config||!Number.isInteger(num)||num<1||num>20)throw Error('Invalid existing JLPT paper identifier');
  const types=[['vocab',config.vocab,'文字・語彙'],['grammar',config.grammar,'文法'],['reading',config.reading,'読解'],['listening',config.listening,'聴解']];
  const slots=types.flatMap(([section,n,label])=>Array.from({length:n},()=>({
   type:label,section,pending:true,options:[],answer:null,
   prompt:'この問題の日本語本文・選択肢・解答はまだ確認されていません。',
   missingReason:section==='listening'?'Audio recording and reviewed transcript not supplied.':'Original reviewed examination question not supplied.'
  })));
  // These are individually authored questions in the existing Paper 01.
  // Other numbered papers remain present but explicitly incomplete.
  if(num===1){
   const sources=window.NextStepVerifiedLanguage,readings=window.NextStepVerifiedReading;
   if(!sources||!readings)throw Error('Verified Japanese question files failed to load');
   for(let i=0;i<5;i++){
    const w=sources.word(level,num,i),g=sources.grammar(level,num,i),rd=readings.build(level,num,i);
    if(!w||!g||!rd)throw Error('Reviewed question data missing: '+level+' Paper '+num);
    slots[i]=w;slots[config.vocab+i]=g;slots[config.vocab+config.grammar+i]=rd;
   }
  }
  if(num===2){
   const batch=window.NextStepVerifiedReading02,language=window.NextStepVerifiedLanguage02;
   if(!batch||!language)throw Error('Paper 02 reviewed Japanese data failed to load');
   for(let i=0;i<5;i++){
    const w=language.word(level,num,i),g=language.grammar(level,num,i),rd=batch.build(level,num,i);
    if(!w||!g||!rd)throw Error('Missing reviewed content '+level+' Paper 02 Question '+(i+1));
    slots[i]=w;slots[config.vocab+i]=g;slots[config.vocab+config.grammar+i]=rd;
   }
  }
  if(slots.length!==TOTAL)throw Error('Original paper slot layout changed unexpectedly');
  for(const [index,q] of slots.entries()){
   if(q.pending)continue;
   if(q.options.length!==4||new Set(q.options).size!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)
    throw Error('Reviewed content failed integrity check at question '+(index+1));
  }
  return slots;
 }
 function explanation(q,j){
  if(!q.verified||!q.choiceExplanations?.[j])return '<strong>この設問は未完成です。</strong>';
  const right=j===q.answer,why=q.choiceExplanations[j];
  return '<strong>'+escText(q.options[j])+(right?' ✅':' ❌')+'</strong><br>🇯🇵 '+
   (right?'正解。':'不正解。')+escText(why.ja)+'<br>🇬🇧 '+
   (right?'Correct. ':'Incorrect. ')+escText(why.en)+'<br>🇳🇵 '+
   (right?'सही उत्तर। ':'गलत उत्तर। ')+escText(why.ne);
 }
 function playJapanese(script,rate){
  if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){window.alert('Japanese Text-to-Speech is not available on this device. Try Chrome, Edge or Safari with a Japanese voice installed.');return;}
  try{speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(script);utterance.lang='ja-JP';utterance.rate=rate;const voices=speechSynthesis.getVoices();const japanese=voices.find(v=>v.lang.toLowerCase().startsWith('ja'));if(japanese)utterance.voice=japanese;speechSynthesis.speak(utterance);}catch(e){window.alert('Unable to play Japanese audio: '+e.message);}
 }
 function save(){try{localStorage.setItem(TOPIC+'-'+active+'-'+paper,JSON.stringify(answers));}catch{}}
 function load(){try{const a=JSON.parse(localStorage.getItem(TOPIC+'-'+active+'-'+paper)||'{}');return a&&typeof a==='object'?a:{};}catch{return {};}}
 function render(){
  list.replaceChildren();const chosen=SECTIONS[sectionMode]||SECTIONS.all;const visible=Array.from({length:chosen.end-chosen.start},(_,n)=>n+chosen.start);const start=page*10;const end=Math.min(start+10,visible.length);const maxPage=Math.ceil(visible.length/10)-1;
  document.querySelectorAll('#exam-sections button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.section===sectionMode));});
  document.getElementById('section-status').textContent=chosen.name+' · Questions '+(chosen.start+1)+'–'+chosen.end+' · '+visible.length+' Questions';
  const top=document.createElement('div');top.className='panel grid no-print';top.innerHTML='<span class="tag">'+active+' · Paper '+String(paper).padStart(2,'0')+' · '+chosen.name+' · Showing '+(start+1)+'–'+end+' / '+visible.length+'</span>';list.append(top);
  for(let offset=start;offset<end;offset++){const i=visible[offset];const q=items[i];const wrap=document.createElement('article');wrap.className='question';wrap.dataset.questionIndex=String(i);const h=document.createElement('h3');h.textContent='問題 '+(i+1)+' · '+q.type+(q.pending?' · ⏳ CONTENT NOT READY':' · ✅ ORIGINAL');wrap.append(h);const p=document.createElement('p');p.textContent=q.prompt;p.style.whiteSpace='pre-wrap';wrap.append(p);if(q.pending){const warning=document.createElement('div');warning.className='explain';warning.setAttribute('role','status');warning.innerHTML='<strong>⏳ 未完成 / Content not ready</strong><p>この設問は現在作成中です。推測した問題や繰り返しのデモ問題は表示しません。</p><p>Reviewed Japanese question, correct answer, option explanations'+(q.section==='listening'?', and a real recorded Japanese audio file':'')+' have not been supplied. This slot is deliberately unavailable.</p>';wrap.append(warning);list.append(wrap);continue;}if(q.subtype){const subtitle=document.createElement('p');subtitle.className='tag';subtitle.textContent='問題形式：'+q.subtype;wrap.append(subtitle);}if(q.visual){const diagram=document.createElement('div');diagram.className='audio-diagram';diagram.setAttribute('role','img');diagram.setAttribute('aria-label','Schedule illustration for listening');diagram.innerHTML='<div class="audio-diagram-title">🗓 '+escText(q.visual.label)+'</div><svg aria-hidden="true" viewBox="0 0 330 100" style="width:100%;max-width:330px;height:auto;border-radius:12px;background:#d9eef7;margin:6px 0"><path d="M0 80H330" stroke="#6e9e97" stroke-width="4"/><rect x="52" y="24" width="116" height="56" rx="6" fill="#24618d"/><path d="M42 24L110 2L180 24" fill="#e98b55"/><rect x="100" y="44" width="25" height="36" fill="#d6f6ff"/><rect x="64" y="38" width="19" height="18" fill="#d6f6ff"/><circle cx="253" cy="48" r="28" fill="#fff" stroke="#21425f" stroke-width="5"/><path d="M253 48V32M253 48L267 55" stroke="#21425f" stroke-width="4" stroke-linecap="round"/><circle cx="253" cy="48" r="3" fill="#21425f"/></svg><div><b>開催日</b><span>'+escText(q.visual.day)+'</span></div><div><b>会場</b><span>'+escText(q.visual.place)+'</span></div><div><b>以前の時刻</b><span>変更あり</span></div><p>🎧 音声を聞いて変更後の予定を選んでください。</p>';wrap.append(diagram);}if(!q.listen){const audio=document.createElement('button');audio.type='button';audio.className='no-print';audio.textContent='🔊 問題を聞く / Listen to this question';audio.setAttribute('aria-label','Read question aloud in Japanese');audio.addEventListener('click',()=>playJapanese(q.scenario?q.passage:q.prompt,0.92));wrap.append(audio);}if(q.listen){const box=document.createElement('div');box.className='grid no-print';const listen=document.createElement('button');listen.textContent='🔊 再生 / Play audio';listen.type='button';listen.addEventListener('click',()=>playJapanese(q.passage,1));const slow=document.createElement('button');slow.type='button';slow.textContent='🐢 Slow audio';slow.addEventListener('click',()=>playJapanese(q.passage,0.75));box.append(listen,slow);wrap.append(box);if(answers[i]!==undefined){const transcript=document.createElement('p');transcript.textContent='Script: '+q.passage;wrap.append(transcript);}}for(let j=0;j<4;j++){const b=document.createElement('button');b.className='option'+(answers[i]!==undefined&&j===q.answer?' correct':'')+(answers[i]===j&&j!==q.answer?' wrong':'');b.textContent=(j+1)+'. '+q.options[j];b.disabled=answers[i]!==undefined;b.addEventListener('click',()=>{const position=wrap.getBoundingClientRect().top;answers[i]=j;save();render();const updated=list.querySelector('[data-question-index="'+i+'"]');if(updated){const delta=updated.getBoundingClientRect().top-position;if(Math.abs(delta)>1)window.scrollBy(0,delta);}});wrap.append(b);}
   if(answers[i]!==undefined){const exp=document.createElement('div');exp.className='explain';const heading=document.createElement('strong');heading.textContent='解説 — 全４選択肢 / चारै विकल्प / all four choices';exp.append(heading);for(let j=0;j<4;j++){const div=document.createElement('p');div.innerHTML=explanation(q,j);exp.append(div);}wrap.append(exp);}list.append(wrap);}
  // Navigation appears ONLY after the final question on the current page.
  const pager=document.createElement('nav');pager.className='panel grid no-print';pager.setAttribute('aria-label','Question page navigation');
  const previous=document.createElement('button');previous.type='button';previous.textContent='← Previous 10';previous.disabled=page===0;
  previous.addEventListener('click',()=>{page--;render();list.scrollIntoView({block:'start',behavior:'smooth'});});
  const next=document.createElement('button');next.type='button';next.textContent='Next 10 →';next.disabled=page>=maxPage;
  next.addEventListener('click',()=>{page++;render();list.scrollIntoView({block:'start',behavior:'smooth'});});
  pager.append(previous,next);list.append(pager);
  const available=items.filter(q=>q.verified).length,answered=items.reduce((n,q,i)=>n+(q.verified&&Number.isInteger(answers[i])?1:0),0),correct=items.reduce((n,q,i)=>n+(q.verified&&answers[i]===q.answer?1:0),0);document.getElementById('progress').textContent='Reviewed questions answered: '+answered+'/'+available+' · '+chosen.name+' · Page '+(page+1)+'/'+(maxPage+1);
  score.textContent='Reviewed content: '+available+'/100 · Answered: '+answered+' · Correct: '+correct+' · '+(TOTAL-available)+' questions are NOT READY. This is not a complete exam score.';
 }
 async function openPaper(num){
  if(pending)return;pending=true;paper=num;paperGrid.querySelectorAll('button').forEach(b=>b.disabled=true);test.classList.remove('hidden');document.getElementById('test-title').textContent=active+' — Paper '+String(num).padStart(2,'0')+' · Checking original content…';list.replaceChildren();score.textContent='Checking reviewed Japanese content for the selected paper…';
  try{items=makePaper(active,num);answers=load();for(const key of Object.keys(answers))if(!items[Number(key)]?.verified||!Number.isInteger(answers[key])||answers[key]<0||answers[key]>3)delete answers[key];page=0;sectionMode='all';const verified=items.filter(q=>q.verified).length;document.getElementById('test-title').textContent=active+' — Practice Paper '+String(num).padStart(2,'0')+' · '+verified+'/100 original questions available (not a complete exam)';render();}
  catch(e){test.classList.add('hidden');score.textContent='';window.alert('Cannot load paper: '+e.message+'. Please connect to internet and retry. No fake questions were substituted.');}
  finally{pending=false;choosePapers(active);}
 }
 function choosePapers(level){
   applyLevelLayout(level);
   paperGrid.replaceChildren();for(let i=1;i<=20;i++){let b=document.createElement('button');b.type='button';b.className='paper';b.textContent=level+' — Paper '+String(i).padStart(2,'0')+(i===1?' · 15/100 ready':i===2?' · 15/100 ready':' · Content pending');b.setAttribute('aria-label','JLPT '+level+' Paper '+i+', '+(i===1?'15 original questions available':i===2?'15 original questions available':'original question content pending'));b.addEventListener('click',()=>openPaper(i));paperGrid.append(b);}
 }
 // Shared, validated source for the optional exam-mode UI.
 // Keeps the existing practice pages and printable questions intact.
 window.NextStepExamAPI={
   async load(level,num,options={}){
    if(!LEVEL_ALLOCATION[level]||!Number.isInteger(num)||num<1||num>20)throw Error('Invalid level or paper number');
    const paperQuestions=makePaper(level,num);
    const verified=paperQuestions.filter(q=>q.verified).length;
    if(options.requireVerified&&verified!==paperQuestions.length)throw Error('Missing reviewed JLPT-style content: '+(paperQuestions.length-verified)+' / '+paperQuestions.length+' questions are not verified; audio assets also missing. Paper stays unavailable in real exam mode.');
    return paperQuestions;
   },
   explain:explanation,
   speak:playJapanese,
   allocation:LEVEL_ALLOCATION
 };
 const sectionButtons=Array.from(document.querySelectorAll('#exam-sections button'));
 sectionButtons.forEach(b=>b.addEventListener('click',()=>{
  if(!items.length)return;
  sectionMode=b.dataset.section in SECTIONS?b.dataset.section:'all';page=0;render();
 }));
 const levelButtons=Array.from(document.getElementById('levels').querySelectorAll('button'));
 levelButtons.forEach(btn=>btn.addEventListener('click',()=>{test.classList.add('hidden');choosePapers(btn.textContent);}));
 choosePapers(active);
 document.getElementById('reset').addEventListener('click',()=>{if(!items.length)return;answers={};save();page=0;render();});
 // Existing Print button prints only the current ten-question page. Provide a full paper export as browser print.
 const fullPrint=document.createElement('button');fullPrint.type='button';fullPrint.textContent='🖨 Print all 100 Questions';fullPrint.className='no-print';document.getElementById('print').after(fullPrint);
 const withExplanation=document.createElement('button');withExplanation.type='button';withExplanation.textContent='📖 Print answer key + all explanations';withExplanation.className='no-print';fullPrint.after(withExplanation);
 withExplanation.addEventListener('click',()=>{if(items.length!==100)return;const tab=window.open('','_blank');if(!tab){window.alert('Allow popups to print the answer explanations.');return;}const body=items.map((q,i)=>'<article style="break-inside:avoid;margin:20px 0 34px"><h3>問題 '+(i+1)+' · '+escText(q.type)+'</h3><p>'+escText(q.prompt)+'</p><p><strong>正解：'+(q.answer+1)+'. '+escText(q.options[q.answer])+'</strong></p>'+q.options.map((o,j)=>'<p><strong>選択肢 '+(j+1)+'</strong><br>'+explanation(q,j)+'</p>').join('')+'</article>').join('');tab.document.write('<!doctype html><html lang="ja"><meta charset="utf-8"><title>'+active+' Paper '+paper+' — answer explanations</title><style>body{font:15px/1.6 sans-serif;max-width:880px;margin:20px auto;padding:20px}article{border-bottom:1px solid #aaa}p{margin:8px 0}</style><h1>NextStep Study '+active+' — Paper '+paper+' / Answer Key</h1><p>100 question explanations (日本語 / नेपाली / English) · Unofficial vocab-focused review</p>'+body+'</html>');tab.document.close();tab.focus();});
 fullPrint.addEventListener('click',()=>{if(items.length!==100)return;const tab=window.open('','_blank');if(!tab){window.alert('Allow popups to print the paper.');return;}const body=items.map((q,i)=>'<article style="break-inside:avoid;margin:20px 0"><h3>問題 '+(i+1)+' · '+escText(q.type)+'</h3><p>'+escText(q.prompt)+'</p>'+q.options.map((o,j)=>'<p>'+(j+1)+'. '+escText(o)+'</p>').join('')+'</article>').join('');tab.document.write('<!doctype html><html lang="ja"><meta charset="utf-8"><title>'+active+' Paper '+paper+'</title><style>body{font:16px/1.6 sans-serif;max-width:850px;margin:20px auto;padding:20px}</style><h1>NextStep Study '+active+' — Paper '+paper+'</h1><p>Unofficial vocabulary-focused practice · 100 questions</p>'+body+'</html>');tab.document.close();tab.focus();});
})();