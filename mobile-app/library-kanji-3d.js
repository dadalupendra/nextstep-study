/* 3D Kanji study embedded directly in NextStep's existing JLPT Library.
   Uses existing N1–N5 lesson datasets. Never fabricates vocabulary or sentences. */
(function(global){'use strict';
const doc=document,API=global.NextStepDailySource,COMPOUNDS=global.NextStepKanjiCompounds;
const node=(tag,cls,label)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(label!==undefined)e.textContent=String(label);return e};
const getGloss=x=>API.getGloss(x||{}),getRead=x=>[...(x.onyomi||[]),...(x.kunyomi||[])].join(' · ');
const state={level:'N2',items:[],lang:'ne',furigana:true,page:0,query:'',reviewMode:'all',current:null,related:[],request:0,learned:{}};
function key(){return 'nextstep-kanji-3d-progress-v1-'+state.level}
function getProgress(){try{state.learned=JSON.parse(localStorage.getItem(key())||'{}')||{}}catch{state.learned={}}}
function saveProgress(){try{localStorage.setItem(key(),JSON.stringify(state.learned))}catch{}}
function safeText(text){return String(text??'')}
function showExample(container,ex){
 const wrapper=node('div','library-kanji-example');
 const ja=node('p');ja.lang='ja';
 if(state.furigana&&ex.furigana){
  const f=String(ex.furigana),r=/\{([^{}|]+)\|([^{}|]+)\}/g;let i=0,m;
  while((m=r.exec(f))){ja.append(doc.createTextNode(f.slice(i,m.index)));const ruby=node('ruby',null,m[1]);ruby.append(node('rt',null,m[2]));ja.append(ruby);i=m.index+m[0].length}
  ja.append(doc.createTextNode(f.slice(i)))
 }else ja.textContent=ex.ja||'';
 wrapper.append(ja);
 if(ex.en)wrapper.append(node('small',null,ex.en));
 container.append(wrapper)
}
function field(parent,label,value){
 if(value===null||value===undefined||value===''||(Array.isArray(value)&&!value.length))return;
 const line=node('div','library-kanji-field');line.append(node('strong',null,label),node('span',null,Array.isArray(value)?value.join(' · '):value));parent.append(line)
}
function card(x){
 const article=node('article','library-kanji-card'+(state.learned[x.character]?' mastered':''));
 const button=node('button','library-kanji-flip');button.type='button';button.setAttribute('aria-label','Open '+x.character+' Kanji and compound words');
 const inside=node('span','library-kanji-inner');
 const face=node('span','library-kanji-front');face.append(node('small',null,state.level+' · 漢字'),node('b',null,x.character),node('small',null,'Tap → related words & examples'));
 const back=node('span','library-kanji-back');back.append(node('small',null,'音読み / 訓読み'),node('strong',null,getRead(x)||'No source reading'),node('small',null,getGloss(x).slice(0,100)));
 inside.append(face,back);button.append(inside);button.onclick=()=>openKanji(x);
 const actions=node('div','library-kanji-actions');
 const flip=node('button',null,'↻ Flip');flip.type='button';flip.onclick=()=>{article.classList.toggle('flipped');flip.setAttribute('aria-pressed',String(article.classList.contains('flipped')))};
 const full=node('button',null,'📖 Full details');full.type='button';full.onclick=()=>openKanji(x);
 const learn=node('button',state.learned[x.character]?'active':'',state.learned[x.character]?'✓ Learned':'＋ Learn');learn.type='button';learn.setAttribute('aria-pressed',String(!!state.learned[x.character]));
 learn.onclick=()=>{if(state.learned[x.character])delete state.learned[x.character];else state.learned[x.character]=true;saveProgress();draw()};
 actions.append(flip,full,learn);article.append(button,actions);return article
}
function addReviewControls(root){
 const S=global.NextStepSRS;if(!S)return;
 const stats=S.status(state.level,'kanji',state.items,x=>x.character);
 const wrap=node('section','ns-smart-review');
 wrap.append(node('strong',null,'🧠 Smart Review · spaced learning'));
 wrap.append(node('p',null,'📅 '+stats.due+' due · 🆕 '+stats.new+' new · 🔁 '+stats.weak+' hard/again · '+stats.scheduled+' scheduled'));
 const tabs=node('div','ns-review-filters');
 for(const [value,label] of [['all','All Kanji'],['due','Due now'],['new','New'],['weak','Hard / Again']]){
  const btn=node('button',null,label);btn.type='button';btn.setAttribute('aria-pressed',String(state.reviewMode===value));
  btn.onclick=()=>{state.reviewMode=value;state.page=0;draw()};tabs.append(btn)
 }
 wrap.append(tabs);root.append(wrap)
}
function addRating(body,item){
 const S=global.NextStepSRS;if(!S)return;
 const group=node('section','ns-review-rating');
 group.append(node('strong',null,'🧠 How well did you remember '+item.character+'?'));
 const buttons=node('div','ns-review-grade-buttons');
 for(const [grade,label] of [['again','↻ Again · 10 min'],['hard','😅 Hard · 1 day'],['good','✓ Good · 3 days'],['easy','⭐ Easy · 7 days']]){
  const btn=node('button',null,label);btn.type='button';btn.dataset.grade=grade;
  btn.onclick=()=>{const entry=S.rate(state.level,'kanji',item.character,grade);message.textContent='Saved on this device. '+S.printable(entry);draw()};buttons.append(btn)
 }
 const message=node('p','ns-review-message',S.printable(S.get(state.level,'kanji',item.character)));
 group.append(buttons,message);body.append(group)
}
function draw(){
 const root=doc.getElementById('content');if(!root)return;
 const candidates=global.NextStepSRS?.candidates(state.level,'kanji',state.items,x=>x.character,state.reviewMode)||state.items;
 const matches=candidates.filter(x=>!state.query||[x.character,getGloss(x),getRead(x)].join(' ').toLowerCase().includes(state.query.toLowerCase()));
 const pages=Math.max(1,Math.ceil(matches.length/24));
 state.page=Math.min(state.page,pages-1);root.replaceChildren();
 const head=node('div','section-head');head.append(node('h2',null,'🧊 '+state.level+' Kanji · 3D Study'));
 head.append(node('span','pill',state.items.length+' unique Kanji'));root.append(head);
 root.append(node('p','library-kanji-note','Tap a Kanji to explore real compound words, Japanese example sentences, readings and meanings. Flip cards to review, and save what you learned.'));
 addReviewControls(root);
 const searchLabel=node('label','field','🔍 Search Kanji, meaning or reading');
 const search=node('input');search.type='search';search.placeholder='例: 学、まなぶ、study';search.value=state.query;search.setAttribute('aria-label','Search this JLPT Kanji collection');
 search.oninput=event=>{const cursor=event.target.selectionStart;state.query=event.target.value;state.page=0;draw();const next=doc.getElementById('libraryKanjiSearch');if(next){next.focus();next.setSelectionRange(cursor,cursor)}};
 search.id='libraryKanjiSearch';searchLabel.append(search);root.append(searchLabel);
 const summary=node('p','library-kanji-summary','✅ '+Object.keys(state.learned).filter(k=>state.learned[k]).length+' learned · '+matches.length+' found');root.append(summary);
 const grid=node('div','library-kanji-grid');for(const x of matches.slice(state.page*24,(state.page+1)*24))grid.append(card(x));
 if(!matches.length)grid.append(node('p','empty','No matching Kanji in the original level source.'));
 root.append(grid);
 const bar=node('div','pagebar');const previous=node('button',null,'← Previous');
 previous.disabled=state.page===0;previous.onclick=()=>{state.page--;draw();root.scrollIntoView({block:'start'})};
 const next=node('button',null,'Next →');next.disabled=state.page+1>=pages;next.onclick=()=>{state.page++;draw();root.scrollIntoView({block:'start'})};
 bar.append(previous,node('strong',null,'Page '+(state.page+1)+' / '+pages),next);root.append(bar);
 root.append(node('p','hint','Original Kanji and vocabulary data are preserved. Related words are limited to what exists in the available N5–N1 lesson files.'))
}
function openDialog(){
 const dialog=doc.getElementById('detailDialog');if(!dialog.open)dialog.showModal();
}
function prepareDetail(item,type){
 const body=doc.getElementById('detailBody');body.replaceChildren();
 const title=type==='kanji'?item.character:item.word;
 body.append(node('h2',null,title));
 const grid=node('div','library-kanji-details');
 field(grid,'English meaning / 意味',getGloss(item));
 if(type==='kanji'){
  field(grid,'音読み / On-yomi',item.onyomi);field(grid,'訓読み / Kun-yomi',item.kunyomi);
  field(grid,'部首 / Radical',item.radical);field(grid,'画数 / Strokes',item.strokes);
 }else{
  field(grid,'読み方 / Reading',item.reading);
  field(grid,'品詞 / Part of speech',Array.isArray(item.pos)?item.pos.join(', '):item.pos||item.part_of_speech)
 }
 body.append(grid);
 const ex=node('section','library-kanji-examples');ex.append(node('h3',null,'📝 Example sentences / 例文'));
 const available=API.validExamples(item);if(!available.length)ex.append(node('p','hint','No complete example sentence in this study source.'));
 available.slice(0,5).forEach(e=>showExample(ex,e));body.append(ex);
 const controls=node('div','library-kanji-detail-actions');
 const sound=node('button','btn soft','🔊 Japanese reading');sound.type='button';sound.onclick=()=>{
  if(!('speechSynthesis'in global))return;
  speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(type==='kanji'?item.character:item.word);
  voice.lang='ja-JP';voice.rate=.8;speechSynthesis.speak(voice)
 };
 const translate=node('button','btn','🌍 Translate in '+state.lang);translate.type='button';
 const output=node('div','library-kanji-translated');output.setAttribute('role','status');
 translate.onclick=async()=>{
  translate.disabled=true;output.textContent='Translating source definitions and examples…';
  const source=['Japanese: '+title,'Reading: '+(type==='kanji'?getRead(item):item.reading),
  'Meaning: '+getGloss(item),...API.validExamples(item).slice(0,3).map(e=>e.ja+(e.en?' — '+e.en:''))].join('\n');
  try{output.textContent=await global.NextStepTranslate.requestTranslation(source,'en',state.lang)}
  catch(e){output.textContent='Online translation unavailable. Source text remains above. ';const link=node('a','btn alt','External translation ↗');
   link.href='https://translate.google.com/?'+new URLSearchParams({sl:'en',tl:state.lang,text:source.slice(0,4500),op:'translate'});link.target='_blank';link.rel='noopener noreferrer';output.append(link)}
  finally{translate.disabled=false}
 };
 controls.append(sound,translate);body.append(controls,output);
 openDialog();return body
}
function openWord(item){
 ++state.request;state.current={type:'vocab',item};prepareDetail(item,'vocab')
}
function openKanji(item){
 const version=++state.request;state.current={type:'kanji',item};state.related=[];
 const body=prepareDetail(item,'kanji');addRating(body,item);
 const heading=node('h3',null,'📚 '+item.character+' — Related compounds / 関連語');body.append(heading);
 const notice=node('p','hint','Searching the existing N5–N1 vocabulary files…');body.append(notice);
 const area=node('div','library-kanji-compounds');body.append(area);
 const more=node('button','btn soft','Show more words →');more.hidden=true;body.append(more);
 const show=(words,checked,missing)=>{
  if(version!==state.request||!body.isConnected)return;
  state.related=words;let limit=20;
  const render=()=>{
   area.replaceChildren();
   words.slice(0,limit).forEach(item=>{
    const box=node('article','library-kanji-compound');
    box.append(node('strong',null,item.word),node('span','library-kanji-reading',item.reading||''),node('small','pill',item.levels.join(' · ')));
    box.append(node('p',null,getGloss(item)));
    const example=API.validExamples(item);
    if(example.length)example.slice(0,2).forEach(e=>showExample(box,e));
    else box.append(node('p','hint','No verified full example in source.'));
    const open=node('button','btn','📖 Details / Translate');open.onclick=()=>openWord(item);box.append(open);area.append(box)
   });
   if(!words.length)area.append(node('p','hint','No compound entry in the sources checked; this does not mean none exist in Japanese.'));
   more.hidden=limit>=words.length;more.textContent='Show more ('+limit+'/'+words.length+') →';
  };
  more.onclick=()=>{limit=Math.min(words.length,limit+20);render()};
  notice.textContent='Found '+words.length+' unique words in '+checked.join(', ')+(missing.length?'; unavailable: '+missing.join(', '):'');
  render()
 };
 if(!COMPOUNDS||!API){notice.textContent='Compound study module unavailable. Reload the Library.';return}
 show(COMPOUNDS.fromCurrent(item.character,state.level,{vocab:[]}),[state.level],[]);
 API.load(state.level).then(src=>{if(version!==state.request)return;
  show(COMPOUNDS.fromCurrent(item.character,state.level,src),[state.level],[]);
  return COMPOUNDS.all(item.character,state.level,src).then(res=>show(res.words,res.checked,res.unavailable))
 }).catch(error=>{if(version===state.request)notice.textContent='Some source files could not load: '+error.message})
}
function show({level,items,language,furigana}){
 state.level=level;state.items=items.filter(x=>x&&typeof x.character==='string'&&x.character.length===1);
 state.lang=language;state.furigana=furigana;state.page=0;state.query='';getProgress();draw()
}
global.NextStepLibraryKanji3D={show};
})(window);