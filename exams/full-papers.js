/* NextStep Study: 20 x 100 generated vocabulary-focused practice papers for each JLPT level.
 * Original authored examples from app.js + source vocabulary from OpenJLPT (CC BY-SA 4.0).
 * Practice structure is NOT a reproduction of JLPT full test: no audio or complete reading sections.
 * Data reference: https://github.com/evanclan/OpenJLPT  */
"use strict";
(() => {
 const CACHE=new Map(),TOTAL=100,TOPIC='nextstep-vocab-papers-v1';
 const kana=/^[ぁ-ゖァ-ヺー・\s]+$/u;
 const escText=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const distinct=a=>[...new Set(a.filter(Boolean))];
 const hash=s=>{let h=2166136261;for(const ch of s){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return h>>>0};
 const mix=(list,key)=>{let a=[...list],state=hash(key);for(let i=a.length-1;i>0;i--){state^=state<<13;state^=state>>>17;state^=state<<5;let j=(state>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
 const endpoint=level=>'https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/vocab/'+level.toLowerCase()+'.json';
 let page=0,paper=1,items=[],answers={},pending=false;
 const paperGrid=document.getElementById('papers'),list=document.getElementById('questions'),score=document.getElementById('score'),test=document.getElementById('test');
 const note=document.createElement('p');note.className='muted';note.textContent='Original, automatically assembled 100-item kanji/word-reading practice sets. The 20 papers use overlapping vocabulary. They are NOT full official-format JLPT tests: listening audio and realistic reading passages are not included. Nepali explanations explain the reading rule, while English dictionary meanings come from OpenJLPT.';paperGrid.parentElement.append(note);
 async function source(level){
  if(CACHE.has(level))return CACHE.get(level);
  const res=await fetch(endpoint(level),{cache:'force-cache'});if(!res.ok)throw Error('Vocabulary download failed ('+res.status+').');
  const data=await res.json();if(!Array.isArray(data))throw Error('Invalid vocabulary data.');
  const cleaned=data.filter(w=>w&&typeof w.word==='string'&&typeof w.reading==='string'&&w.reading.trim()&&w.word.trim()&&w.word!==w.reading&&!kana.test(w.word)).map(w=>({word:w.word,reading:w.reading,meaning:Array.isArray(w.meanings)?String(w.meanings[0]||''):''}));
  const dedup=new Map();for(const w of cleaned){const id=w.word+'|'+w.reading;if(!dedup.has(id))dedup.set(id,w);}
  const vocabulary=[...dedup.values()];if(vocabulary.length<94)throw Error('Not enough verified kanji-reading items for this level: '+vocabulary.length+'.');
  CACHE.set(level,vocabulary);return vocabulary;
 }
 function selection(word,mode,all,level,paper,serial){
  const target=mode==='reading'?word.reading:word.word;
  const wrongs=mix(all.filter(w=>w.word!==word.word&&w.reading!==word.reading&&Math.abs(w.word.length-word.word.length)<=2),level+'|'+paper+'|'+serial+'|wrong');
  const opts=[{text:target,word,correct:true}];
  for(const w of wrongs){const candidate=mode==='reading'?w.reading:w.word;if(opts.some(o=>o.text===candidate))continue;opts.push({text:candidate,word:w,correct:false});if(opts.length===4)break;}
  if(opts.length!==4)throw Error('Not enough unique distractors for '+word.word);
  const rotated=mix(opts,level+'|'+paper+'|'+serial+'|options');
  const question=mode==='reading'?'「'+word.word+'」の読み方として正しいものはどれですか。':'「'+word.reading+'」を漢字で書くとき、正しいものはどれですか。';
  return{type:'語彙・漢字',prompt:question,options:rotated.map(o=>o.text),answer:rotated.findIndex(o=>o.correct),source:rotated,word,mode,generated:true};
 }
 function makePaper(level,num,vocab){
  const seed=level+'|paper-'+num;
  const words=mix(vocab,seed+'|vocab');
  const needed=TOTAL-bank[level].length;
  const selected=words.slice(0,needed);
  if(selected.length<needed)throw Error('Insufficient level-specific vocabulary.');
  const generated=selected.map((word,i)=>selection(word,i%2===0?'reading':'spelling',vocab,level,num,i));
  const original=bank[level].map((q,i)=>({type:q[0],prompt:q[1],options:q[3].map(o=>o[0]),answer:q[2],original:q,generated:false,index:i}));
  const result=mix([...generated,...original],seed+'|paper-order');
  if(result.length!==TOTAL||result.some(q=>new Set(q.options).size!==4||q.answer<0||q.answer>3))throw Error('Paper integrity check failed.');
  return result;
 }
 function explanation(q,j){
  if(!q.generated){const opt=q.original[3][j],good=j===q.answer;return '<strong>'+escText(opt[0])+(good?' ✅':' ❌')+'</strong><br>🇯🇵 '+escText(opt[1])+'. '+(good?escText(q.original[4]):'この設問の正答ではありません。')+'<br>🇳🇵 '+escText(opt[2])+'। '+(good?escText(q.original[5]):'यस प्रश्नमा यो विकल्प सही होइन।')+'<br>🇬🇧 '+escText(opt[3])+'. '+(good?escText(q.original[6]):'This is not the correct option here.');}
  const item=q.source[j],right=item.correct,target=q.word;const english=target.meaning?' / Meaning: '+target.meaning:'';
  return '<strong>'+escText(item.text)+(right?' ✅':' ❌')+'</strong><br>'+
    '🇯🇵 '+(right?'正解です。':'不正解です。')+'「'+escText(target.word)+'」の読みは「'+escText(target.reading)+'」です。'+(right?'':'この選択肢は「'+escText(item.word.word)+'」（'+escText(item.word.reading)+'）に対応します。')+
    '<br>🇳🇵 '+(right?'यो सही विकल्प हो। ':'यो गलत विकल्प हो। ')+'「'+escText(target.word)+'」 को पढाइ 「'+escText(target.reading)+'」 हो।'+(right?'':' यो विकल्प 「'+escText(item.word.word)+'」（'+escText(item.word.reading)+'）सँग सम्बन्धित छ।')+
    '<br>🇬🇧 '+(right?'Correct. ':'Incorrect. ')+'The reading of '+escText(target.word)+' is '+escText(target.reading)+escText(english)+'.'+(right?'':' This option is associated with '+escText(item.word.word)+' ('+escText(item.word.reading)+').');
 }
 function save(){try{localStorage.setItem(TOPIC+'-'+active+'-'+paper,JSON.stringify(answers));}catch{}}
 function load(){try{const a=JSON.parse(localStorage.getItem(TOPIC+'-'+active+'-'+paper)||'{}');return a&&typeof a==='object'?a:{};}catch{return {};}}
 function render(){
  list.replaceChildren();const start=page*10;const end=Math.min(start+10,items.length);
  const top=document.createElement('div');top.className='panel grid no-print';top.innerHTML='<span class="tag">Questions '+(start+1)+'–'+end+' / '+TOTAL+'</span>';const prev=document.createElement('button');prev.textContent='← Previous 10';prev.disabled=page===0;prev.onclick=()=>{page--;render();};const next=document.createElement('button');next.textContent='Next 10 →';next.disabled=end===TOTAL;next.onclick=()=>{page++;render();};top.append(prev,next);list.append(top);
  for(let i=start;i<end;i++){const q=items[i];const wrap=document.createElement('article');wrap.className='question';const h=document.createElement('h3');h.textContent='問題 '+(i+1)+' · '+q.type;wrap.append(h);const p=document.createElement('p');p.textContent=q.prompt;p.style.whiteSpace='pre-wrap';wrap.append(p);for(let j=0;j<4;j++){const b=document.createElement('button');b.className='option'+(answers[i]!==undefined&&j===q.answer?' correct':'')+(answers[i]===j&&j!==q.answer?' wrong':'');b.textContent=(j+1)+'. '+q.options[j];b.disabled=answers[i]!==undefined;b.addEventListener('click',()=>{answers[i]=j;save();render();});wrap.append(b);}
   if(answers[i]!==undefined){const exp=document.createElement('div');exp.className='explain';const heading=document.createElement('strong');heading.textContent='解説 — 全４選択肢 / चारै विकल्प / all four choices';exp.append(heading);for(let j=0;j<4;j++){const div=document.createElement('p');div.innerHTML=explanation(q,j);exp.append(div);}wrap.append(exp);}list.append(wrap);}
  const count=Object.keys(answers).length,correct=items.reduce((n,q,i)=>n+(answers[i]===q.answer?1:0),0);document.getElementById('progress').textContent='Answered: '+count+'/'+TOTAL+' · Page '+(page+1)+'/10';
  score.textContent=count===TOTAL?'Your practice result: '+correct+'/100. This is NOT an official JLPT scaled score.':'Answered: '+count+'/100 · Correct so far: '+correct+' · Wrong so far: '+(count-correct);
  window.scrollTo({top:test.getBoundingClientRect().top+window.scrollY-20,behavior:'instant'});
 }
 async function openPaper(num){
  if(pending)return;pending=true;paper=num;paperGrid.querySelectorAll('button').forEach(b=>b.disabled=true);test.classList.remove('hidden');document.getElementById('test-title').textContent=active+' — Paper '+String(num).padStart(2,'0')+' · Loading vocabulary…';list.replaceChildren();score.textContent='Loading verified, level-specific vocabulary...';
  try{items=makePaper(active,num,await source(active));answers=load();page=0;document.getElementById('test-title').textContent=active+' — Practice Paper '+String(num).padStart(2,'0')+' · 100 questions';render();}
  catch(e){test.classList.add('hidden');score.textContent='';window.alert('Cannot load paper: '+e.message+'. Please connect to internet and retry. No fake questions were substituted.');}
  finally{pending=false;choosePapers(active);}
 }
 function choosePapers(level){
   paperGrid.replaceChildren();for(let i=1;i<=20;i++){let b=document.createElement('button');b.type='button';b.className='paper';b.textContent='Paper '+String(i).padStart(2,'0')+' · 100 Q';b.addEventListener('click',()=>openPaper(i));paperGrid.append(b);}
 }
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