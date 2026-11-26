/* NextStep Study: 20 x 100 four-section JLPT-inspired practice papers for each JLPT level.
 * Original authored examples from app.js + source vocabulary from OpenJLPT (CC BY-SA 4.0).
 * Independent original reading/listening templates with browser speech synthesis; not an official recording or actual past exam.
 * Data reference: https://github.com/evanclan/OpenJLPT  */
"use strict";
(() => {
 const CACHE=new Map(),GRAMMAR_CACHE=new Map(),TOTAL=100,TOPIC='nextstep-section-papers-v3';
 const kana=/^[ぁ-ゖァ-ヺー・\s]+$/u;
 const escText=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const distinct=a=>[...new Set(a.filter(Boolean))];
 const hash=s=>{let h=2166136261;for(const ch of s){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return h>>>0};
 const mix=(list,key)=>{let a=[...list],state=hash(key);for(let i=a.length-1;i>0;i--){state^=state<<13;state^=state>>>17;state^=state<<5;let j=(state>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
 const endpoint=level=>'https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/vocab/'+level.toLowerCase()+'.json';
 async function grammarSource(level){
 if(GRAMMAR_CACHE.has(level))return GRAMMAR_CACHE.get(level);
 const url='https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/grammar/'+level.toLowerCase()+'.json';
 const res=await fetch(url,{cache:'force-cache'});if(!res.ok)throw Error('Grammar data unavailable '+res.status);
 const data=await res.json(),pool=[],used=new Set();
 for(const g of data){
  const forms=String(g.pattern||'').split('/').map(t=>t.replace(/^〜+/,'').replace(/[()（）].*/,'').trim()).filter(t=>t.length>0&&t.length<=14);
  for(const e of g.examples||[]){
   if(typeof e.ja!=='string')continue;
   const form=forms.find(x=>e.ja.includes(x));if(!form)continue;
   const id=e.ja+'|'+form;if(used.has(id))continue;used.add(id);
   pool.push({sentence:e.ja,form,meaning:String(g.meaning||'')});
  }
 }
 if(pool.length<25)throw Error('Not enough grammar examples: '+level);
 GRAMMAR_CACHE.set(level,pool);return pool;
}
function variedGrammar(level,num,serial,pool){
 const order=mix(pool,level+'|grammar-source-v3');
 const item=order[(((num-1)*25)+serial)%order.length],position=item.sentence.indexOf(item.form);
 const masked=item.sentence.slice(0,position)+'（　）'+item.sentence.slice(position+item.form.length);
 const candidates=[{form:item.form,correct:true,meaning:item.meaning}];
 const alternatives=mix(pool.filter(x=>x.form!==item.form&&!item.sentence.includes(x.form)),level+num+serial+'alts');
 for(const alt of alternatives){if(candidates.some(x=>x.form===alt.form))continue;candidates.push({form:alt.form,correct:false,meaning:alt.meaning});if(candidates.length===4)break;}
 if(candidates.length!==4)throw Error('Grammar choices could not be generated');
 const opts=mix(candidates,level+num+serial+'choices');
 return {type:'文法',prompt:'【文法】次の文の（　）には、教材の原文でどの表現が使われていますか。\n'+masked,
  options:opts.map(x=>x.form),answer:opts.findIndex(x=>x.correct),grammarSource:true,grammarTarget:item,grammarOptions:opts,generated:false};
}
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
 const note=document.createElement('p');note.className='muted';note.textContent='Original four-section JLPT-inspired practice sets. The section question counts are DIFFERENT for each level and are user-requested practice allocations, not official JLPT counts. Grammar uses distinct examples from the original level-specific grammar study data. Reading/listening scenarios still reuse common templates. Listening uses device Japanese text-to-speech (not official recorded audio). No past JLPT questions are copied; these papers are not official full-length mock tests.';paperGrid.parentElement.append(note);
 async function source(level){
  if(CACHE.has(level))return CACHE.get(level);
  const res=await fetch(endpoint(level),{cache:'force-cache'});if(!res.ok)throw Error('Vocabulary download failed ('+res.status+').');
  const data=await res.json();if(!Array.isArray(data))throw Error('Invalid vocabulary data.');
  const cleaned=data.filter(w=>w&&typeof w.word==='string'&&typeof w.reading==='string'&&w.reading.trim()&&w.word.trim()&&w.word!==w.reading&&!kana.test(w.word)).map(w=>({word:w.word,reading:w.reading,meaning:Array.isArray(w.meanings)?String(w.meanings[0]||''):'',example:Array.isArray(w.examples)?String((w.examples.find(e=>e&&typeof e.ja==='string'&&e.ja.includes(w.word)&&/[。！？!?]$/.test(e.ja.trim()))||{}).ja||''):''})).filter(w=>w.example&&w.example.length>=9);
  const dedup=new Map();for(const w of cleaned){const id=w.word;if(!dedup.has(id))dedup.set(id,w);}
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
  const usableExample=word.example&&word.example.includes(word.word)&&/[。！？!?]$/.test(word.example.trim());
  const context=usableExample?'\n【例文】'+(mode==='spelling'?word.example.replaceAll(word.word,'（　）'):word.example):'';
  const question=(mode==='reading'?'「'+word.word+'」の読み方として正しいものはどれですか。':'「'+word.reading+'」の正しい漢字表記はどれですか。')+context;
  return{type:'語彙・漢字',prompt:question,options:rotated.map(o=>o.text),answer:rotated.findIndex(o=>o.correct),source:rotated,word,mode,generated:true};
 }

 const notices={
  N5:['図書館','友だち','学校'],N4:['図書館','市役所','公民館'],N3:['受付','教室','図書館'],N2:['窓口','研修室','会議室'],N1:['広報室','調査室','研究会']
 };
 const days=['月曜日','火曜日','水曜日','木曜日','金曜日','土曜日','日曜日'];
 const hours=['午前9時','午前10時','午前11時','午後1時','午後2時','午後3時','午後4時'];
 const verbs=['開きます','始まります','行われます'];
 function scenario(level,num,serial,kind){
  const listening=kind==='聴解',seq=(num-1)*(listening?15:20)+serial;
  const locations=[...notices[level],'駅の前','ホール'];
  const events=['説明会','勉強会','展示会','日本語教室','相談会','発表会','交流会','研修'];
  const day=days[Math.floor(seq/7)%7],hour=hours[seq%7];
  const place=locations[Math.floor(seq/49)%locations.length],event=events[Math.floor(seq/245)%events.length];
  const previousHour=hours[(seq%7+2)%7];
  const questionKind=seq%3;
  const word={
   N5:'今日の予定をお知らせします。',
   N4:'イベントの予定が変わりました。',
   N3:'イベントの予定についてお知らせします。以前の予定と違うのでご注意ください。',
   N2:'今回の開催予定につきまして、変更後の内容をご案内いたします。',
   N1:'運営上の調整を踏まえ、開催概要の一部を下記のとおり改訂いたしました。'
  }[level];
  const plain='「'+event+'」は'+day+'、'+place+'で行います。開始は'+hour+'です。以前お知らせした'+previousHour+'ではありません。';
  const passage=listening?'もしもし。'+word+plain+'参加する方は変更後の予定を確認してください。':'【案内】'+word+plain+'参加をご希望の方は、日時と会場をご確認ください。';
  let options,correctValue,prompt,property;
  if(questionKind===0){property='time';correctValue=hour;options=[hour,previousHour,...hours.filter(v=>v!==hour&&v!==previousHour)].slice(0,4);prompt='変更後の開始時間はいつですか。';}
  else if(questionKind===1){property='day';correctValue=day;options=[day,...days.filter(v=>v!==day)].slice(0,4);prompt='いつ開催されますか。';}
  else{property='place';correctValue=place;options=[place,...locations.filter(v=>v!==place)].slice(0,4);prompt='会場はどこですか。';}
  const shuffled=mix(options,level+'|'+num+'|'+serial+'|'+kind+'|choices');
  const heading=listening?'【聴解】音声を聞いて答えてください。':'【読解】次の文章を読んで答えてください。';
  return{type:kind,prompt:heading+(listening?'':'\n'+passage)+'\n【質問】'+prompt,
   passage,options:shuffled,answer:shuffled.indexOf(correctValue),generated:false,scenario:true,listen:listening,
   correctValue,place,day,property,locale:level};
 }
 function grammar(level,num,serial){
  const base=bank[level].filter(q=>q[0]==='文法');
  const selected=base[(serial+num)%base.length];
  const opt=mix(selected[3].map((v,i)=>({data:v,correct:i===selected[2]})),level+'|'+num+'|grammar|'+serial);
  const out=[...selected];out[2]=opt.findIndex(o=>o.correct);out[3]=opt.map(o=>o.data);
  return{type:'文法',prompt:out[1],options:out[3].map(o=>o[0]),answer:out[2],original:out,generated:false};
 }
 function makePaper(level,num,vocab,grammarPool){
  const words=mix(vocab,level+'|vocab-source-v3');
  const config=LEVEL_ALLOCATION[level];const chosen=Array.from({length:config.vocab},(_,i)=>words[(((num-1)*config.vocab)+i)%words.length]);
  if(words.length<40)throw Error('Insufficient level-specific words.');
  const sections=[
   ...chosen.map((word,i)=>selection(word,i%2===0?'reading':'spelling',vocab,level,num,i)),
   ...Array.from({length:config.grammar},(_,i)=>variedGrammar(level,num,i,grammarPool)),
   ...Array.from({length:config.reading},(_,i)=>window.NextStepExamTypes?window.NextStepExamTypes.buildReading(level,num,i):scenario(level,num,i,'読解')),
   ...Array.from({length:config.listening},(_,i)=>window.NextStepExamTypes?window.NextStepExamTypes.buildListening(level,num,i):scenario(level,num,i,'聴解'))
  ];
  if(sections.length!==TOTAL||sections.some(q=>new Set(q.options).size!==4||q.answer<0||q.answer>3))throw Error('Paper integrity check failed.');
  return sections;
 }
 function explanation(q,j){
  if(q.sourceType){const good=j===q.answer;return '<strong>'+escText(q.options[j])+(good?' ✅':' ❌')+'</strong><br>🇯🇵 '+(good?'正解。':'不正解。')+escText(q.explanation.ja)+'<br>🇳🇵 '+(good?'सही उत्तर। ':'गलत उत्तर। ')+escText(q.explanation.ne)+'<br>🇬🇧 '+(good?'Correct. ':'Incorrect. ')+escText(q.explanation.en);}

  if(q.grammarSource){const good=j===q.answer,item=q.grammarTarget,option=q.grammarOptions[j];return '<strong>'+escText(option.form)+(good?' ✅':' ❌')+'</strong><br>🇯🇵 '+(good?'正解です。':'不正解です。')+'教材の原文は「'+escText(item.sentence)+'」で、文法表現は「'+escText(item.form)+'」です。<br>🇳🇵 '+(good?'सही विकल्प। ':'गलत विकल्प। ')+'मूल उदाहरणमा प्रयोग भएको व्याकरण '+escText(item.form)+' हो।<br>🇬🇧 '+(good?'Correct. ':'Incorrect. ')+'The source sentence uses '+escText(item.form)+' ('+escText(item.meaning)+').';}

  if(q.scenario){const good=j===q.answer,choice=q.options[j];return '<strong>'+escText(choice)+(good?' ✅':' ❌')+'</strong><br>🇯🇵 '+(good?'正解です。':'不正解です。')+'案内の答えは「'+escText(q.correctValue)+'」です。'+(good?'':'この選択肢は案内された開始時間ではありません。')+'<br>🇳🇵 '+(good?'सही उत्तर हो।':'गलत उत्तर हो।')+' सूचनाअनुसार सही विकल्प '+escText(q.correctValue)+' हो।'+'<br>🇬🇧 '+(good?'Correct. ':'Incorrect. ')+'The announcement identifies the correct answer as '+escText(q.correctValue)+'.';}
  if(!q.generated){const opt=q.original[3][j],good=j===q.answer;return '<strong>'+escText(opt[0])+(good?' ✅':' ❌')+'</strong><br>🇯🇵 '+escText(opt[1])+'. '+(good?escText(q.original[4]):'この設問の正答ではありません。')+'<br>🇳🇵 '+escText(opt[2])+'। '+(good?escText(q.original[5]):'यस प्रश्नमा यो विकल्प सही होइन।')+'<br>🇬🇧 '+escText(opt[3])+'. '+(good?escText(q.original[6]):'This is not the correct option here.');}
  const item=q.source[j],right=item.correct,target=q.word;const english=target.meaning?' / Meaning: '+target.meaning:'';
  return '<strong>'+escText(item.text)+(right?' ✅':' ❌')+'</strong><br>'+
    '🇯🇵 '+(right?'正解です。':'不正解です。')+'「'+escText(target.word)+'」の読みは「'+escText(target.reading)+'」です。'+(right?'':'この選択肢は「'+escText(item.word.word)+'」（'+escText(item.word.reading)+'）に対応します。')+
    '<br>🇳🇵 '+(right?'यो सही विकल्प हो। ':'यो गलत विकल्प हो। ')+'「'+escText(target.word)+'」 को पढाइ 「'+escText(target.reading)+'」 हो।'+(right?'':' यो विकल्प 「'+escText(item.word.word)+'」（'+escText(item.word.reading)+'）सँग सम्बन्धित छ।')+
    '<br>🇬🇧 '+(right?'Correct. ':'Incorrect. ')+'The reading of '+escText(target.word)+' is '+escText(target.reading)+escText(english)+'.'+(right?'':' This option is associated with '+escText(item.word.word)+' ('+escText(item.word.reading)+').');
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
  for(let offset=start;offset<end;offset++){const i=visible[offset];const q=items[i];const wrap=document.createElement('article');wrap.className='question';wrap.dataset.questionIndex=String(i);const h=document.createElement('h3');h.textContent='問題 '+(i+1)+' · '+q.type;wrap.append(h);const p=document.createElement('p');p.textContent=q.prompt;p.style.whiteSpace='pre-wrap';wrap.append(p);if(q.subtype){const subtitle=document.createElement('p');subtitle.className='tag';subtitle.textContent='問題形式：'+q.subtype;wrap.append(subtitle);}if(q.visual){const diagram=document.createElement('div');diagram.className='audio-diagram';diagram.setAttribute('role','img');diagram.setAttribute('aria-label','Schedule illustration for listening');diagram.innerHTML='<div class="audio-diagram-title">🗓 '+escText(q.visual.label)+'</div><svg aria-hidden="true" viewBox="0 0 330 100" style="width:100%;max-width:330px;height:auto;border-radius:12px;background:#d9eef7;margin:6px 0"><path d="M0 80H330" stroke="#6e9e97" stroke-width="4"/><rect x="52" y="24" width="116" height="56" rx="6" fill="#24618d"/><path d="M42 24L110 2L180 24" fill="#e98b55"/><rect x="100" y="44" width="25" height="36" fill="#d6f6ff"/><rect x="64" y="38" width="19" height="18" fill="#d6f6ff"/><circle cx="253" cy="48" r="28" fill="#fff" stroke="#21425f" stroke-width="5"/><path d="M253 48V32M253 48L267 55" stroke="#21425f" stroke-width="4" stroke-linecap="round"/><circle cx="253" cy="48" r="3" fill="#21425f"/></svg><div><b>開催日</b><span>'+escText(q.visual.day)+'</span></div><div><b>会場</b><span>'+escText(q.visual.place)+'</span></div><div><b>以前の時刻</b><span>変更あり</span></div><p>🎧 音声を聞いて変更後の予定を選んでください。</p>';wrap.append(diagram);}if(!q.listen){const audio=document.createElement('button');audio.type='button';audio.className='no-print';audio.textContent='🔊 問題を聞く / Listen to this question';audio.setAttribute('aria-label','Read question aloud in Japanese');audio.addEventListener('click',()=>playJapanese(q.scenario?q.passage:q.prompt,0.92));wrap.append(audio);}if(q.listen){const box=document.createElement('div');box.className='grid no-print';const listen=document.createElement('button');listen.textContent='🔊 再生 / Play audio';listen.type='button';listen.addEventListener('click',()=>playJapanese(q.passage,1));const slow=document.createElement('button');slow.type='button';slow.textContent='🐢 Slow audio';slow.addEventListener('click',()=>playJapanese(q.passage,0.75));box.append(listen,slow);wrap.append(box);if(answers[i]!==undefined){const transcript=document.createElement('p');transcript.textContent='Script: '+q.passage;wrap.append(transcript);}}for(let j=0;j<4;j++){const b=document.createElement('button');b.className='option'+(answers[i]!==undefined&&j===q.answer?' correct':'')+(answers[i]===j&&j!==q.answer?' wrong':'');b.textContent=(j+1)+'. '+q.options[j];b.disabled=answers[i]!==undefined;b.addEventListener('click',()=>{const position=wrap.getBoundingClientRect().top;answers[i]=j;save();render();const updated=list.querySelector('[data-question-index="'+i+'"]');if(updated){const delta=updated.getBoundingClientRect().top-position;if(Math.abs(delta)>1)window.scrollBy(0,delta);}});wrap.append(b);}
   if(answers[i]!==undefined){const exp=document.createElement('div');exp.className='explain';const heading=document.createElement('strong');heading.textContent='解説 — 全４選択肢 / चारै विकल्प / all four choices';exp.append(heading);for(let j=0;j<4;j++){const div=document.createElement('p');div.innerHTML=explanation(q,j);exp.append(div);}wrap.append(exp);if(window.NextStepExamLanguage)exp.append(window.NextStepExamLanguage.translationSection(q,window.NextStepExamAPI,{includeQuestion:false}));}else if(window.NextStepExamLanguage){wrap.append(window.NextStepExamLanguage.translationSection(q,window.NextStepExamAPI,{includeReview:false}));}list.append(wrap);}
  // Navigation appears ONLY after the final question on the current page.
  const pager=document.createElement('nav');pager.className='panel grid no-print';pager.setAttribute('aria-label','Question page navigation');
  const previous=document.createElement('button');previous.type='button';previous.textContent='← Previous 10';previous.disabled=page===0;
  previous.addEventListener('click',()=>{page--;render();list.scrollIntoView({block:'start',behavior:'smooth'});});
  const next=document.createElement('button');next.type='button';next.textContent='Next 10 →';next.disabled=page>=maxPage;
  next.addEventListener('click',()=>{page++;render();list.scrollIntoView({block:'start',behavior:'smooth'});});
  pager.append(previous,next);list.append(pager);
  const count=Object.keys(answers).length,correct=items.reduce((n,q,i)=>n+(answers[i]===q.answer?1:0),0);document.getElementById('progress').textContent='Answered: '+count+'/'+TOTAL+' · '+chosen.name+' · Page '+(page+1)+'/'+(maxPage+1);
  score.textContent=count===TOTAL?'Your practice result: '+correct+'/100. This is NOT an official JLPT scaled score.':'Answered: '+count+'/100 · Correct so far: '+correct+' · Wrong so far: '+(count-correct);
 }
 async function openPaper(num){
  if(pending)return;pending=true;paper=num;paperGrid.querySelectorAll('button').forEach(b=>b.disabled=true);test.classList.remove('hidden');document.getElementById('test-title').textContent=active+' — Paper '+String(num).padStart(2,'0')+' · Loading vocabulary…';list.replaceChildren();score.textContent='Loading verified, level-specific vocabulary...';
  try{const [vocabulary,grammarPool]=await Promise.all([source(active),grammarSource(active)]);items=makePaper(active,num,vocabulary,grammarPool);answers=load();page=0;sectionMode='all';document.getElementById('test-title').textContent=active+' — Practice Paper '+String(num).padStart(2,'0')+' · 100 questions';render();}
  catch(e){test.classList.add('hidden');score.textContent='';window.alert('Cannot load paper: '+e.message+'. Please connect to internet and retry. No fake questions were substituted.');}
  finally{pending=false;choosePapers(active);}
 }
 function choosePapers(level){
   applyLevelLayout(level);
   paperGrid.replaceChildren();
   for(let i=1;i<=20;i++){
    const button=document.createElement('button');button.type='button';button.className='paper studio-paper-card';
    button.dataset.paper=String(i);button.dataset.level=level;
    button.setAttribute('aria-label','Start '+level+' Practice Paper '+String(i).padStart(2,'0')+' in single-question exam view');
    const title=document.createElement('strong');title.textContent=level+' · Paper '+String(i).padStart(2,'0');
    const details=document.createElement('span');details.className='studio-paper-count';details.textContent='100 practice questions · ⏱ Timed';
    const action=document.createElement('span');action.className='studio-paper-action';action.textContent='Start exam →';
    const progress=document.createElement('small');progress.className='studio-paper-progress';
    try{
     const saved=JSON.parse(localStorage.getItem('ns-studio-'+level+'-'+i)||'null');
     if(saved?.answers){const n=Object.values(saved.answers).filter(v=>Number.isInteger(v)&&v>=0&&v<4).length;
      if(n)progress.textContent=(saved.submitted?'Reviewed':'Resume')+' · '+n+'/100 answered';}
    }catch(e){}
    button.append(title,details,action,progress);
    button.addEventListener('click',()=>{
     const url=new URL(location.href);
     if(url.searchParams.get('view')==='classic'||!window.NextStepExamStudio)openPaper(i);
     else window.NextStepExamStudio.open(level,i);
    });
    paperGrid.append(button);
   }
 }
 // Keep the original 10-question interface accessible without duplicating cards.
 window.NextStepClassicExam={async open(level,num){
  if(!LEVEL_ALLOCATION[level]||!Number.isInteger(num)||num<1||num>20)throw Error('Invalid paper');
  if(active!==level){choose(level);choosePapers(level);}
  await openPaper(num);
  document.getElementById('test').scrollIntoView({behavior:'smooth',block:'start'});
 }};
 // Shared, validated source for the optional exam-mode UI.
 // Keeps the existing practice pages and printable questions intact.
 window.NextStepExamAPI={
   async load(level,num){
    if(!LEVEL_ALLOCATION[level]||!Number.isInteger(num)||num<1||num>20)throw Error('Invalid level or paper number');
    const [vocabulary,grammarPool]=await Promise.all([source(level),grammarSource(level)]);
    return makePaper(level,num,vocabulary,grammarPool);
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