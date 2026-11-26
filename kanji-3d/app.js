/* Dedicated JLPT N5–N1 3D Kanji reader, connected to the original
   source dictionaries. No generated example sentences or fake compounds. */
(()=>{'use strict';
const DATA=window.NextStepDailySource,COMPOUNDS=window.NextStepKanjiCompounds;
const LEVELS=DATA.LEVELS,PER_PAGE=24;
const LANGS='ne en ja hi bn zh-CN ko fr es de ar th vi id pt ru it tr uk pl nl sv fi da no el he fa ur ta te mr gu pa ms sw fil my km lo af sq am hy az eu be bs bg ca hr cs et gl ka ht hu is ig ga jv kk ku ky lv lt mk mn ps ro sr sk sl so su tg uz cy zu yo xh si or as tk fy lb mt ny st sd yi ceb'.split(' ');
const NAMES={ne:'नेपाली',en:'English',ja:'日本語',hi:'हिन्दी','zh-CN':'中文',ko:'한국어',bn:'বাংলা',ur:'اردو'};
const $=id=>document.getElementById(id);
const u=new URL(location.href);
let level=LEVELS.includes(u.searchParams.get('level'))?u.searchParams.get('level'):'N2';
let prefs={};try{prefs=JSON.parse(localStorage.getItem('nextstep-unified-prefs')||'{}')||{}}catch{}
let lang=LANGS.includes(prefs.lang)?prefs.lang:'ne',dark=!!prefs.dark,furi=prefs.furi!==false;
let source=null,items=[],page=0,search='',learned={},active=null,detailVersion=0,allRelated=[];
const node=(tag,str,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(str!==undefined)n.textContent=String(str);return n};
const gloss=x=>DATA.getGloss(x||{});
const readings=x=>[...(Array.isArray(x.onyomi)?x.onyomi:[]),...(Array.isArray(x.kunyomi)?x.kunyomi:[])].join(' · ');
const readName=code=>{try{return new Intl.DisplayNames(['en'],{type:'language'}).of(code)||code}catch{return code}};
const localKey=()=> 'nextstep-kanji-3d-progress-v1-'+level;
const storePrefs=()=>{try{localStorage.setItem('nextstep-unified-prefs',JSON.stringify({...prefs,lang,level,dark,furi}))}catch{}};
const storeLearned=()=>{try{localStorage.setItem(localKey(),JSON.stringify(learned))}catch{}};
const term=x=>active?.type==='kanji'?x.character:x.word;
function line(parent,label,val){
 if(val===undefined||val===null||val===''||(Array.isArray(val)&&!val.length))return;
 const box=node('div',undefined,'detail-group');
 box.append(node('strong',label),node('span',Array.isArray(val)?val.join(' · '):val));
 parent.append(box)
}
function japanese(parent,example){
 const jp=node('p',undefined);jp.lang='ja';
 if(furi&&example.furigana){
  const raw=String(example.furigana),regex=/\{([^{}|]+)\|([^{}|]+)\}/g;let position=0,match;
  while((match=regex.exec(raw))){
   jp.append(document.createTextNode(raw.slice(position,match.index)));
   const ruby=node('ruby',match[1]);ruby.append(node('rt',match[2]));jp.append(ruby);position=match.index+match[0].length
  }
  jp.append(document.createTextNode(raw.slice(position)))
 }else jp.textContent=example.ja;
 parent.append(jp);
}
function realExamples(item){
 return DATA.validExamples(item||[]).slice(0,3)
}
function examples(parent,item){
 const actual=realExamples(item);
 if(!actual.length){parent.append(node('p','No verified full example sentence is supplied in the source.','small'));return}
 actual.forEach((ex,i)=>{
  const box=node('div',undefined,'compound-example');box.append(node('strong','例文 '+(i+1)));
  japanese(box,ex);if(ex.en)box.append(node('p',ex.en,'small'));parent.append(box)
 })
}
function cardForKanji(item){
 const character=item.character;
 const outer=node('article',undefined,'flipcard kanji-3d-card'+(learned[character]?' learned-card':''));
 const flip=node('button',undefined,'flip-button');flip.type='button';flip.setAttribute('aria-label','Open full details and compounds for '+character);
 const inner=node('div',undefined,'flip-inner');
 const front=node('div',undefined,'face front kanji');
 front.append(node('small',level+' · KANJI'),node('div',character,'word'),node('small','Tap → すべての関連語を表示'));
 const back=node('div',undefined,'face back');
 back.append(node('small','音読み・訓読み'),node('div',readings(item)||'No reading in source','meaning'),node('div',gloss(item).slice(0,120),'meaning'));
 inner.append(front,back);flip.append(inner);
 flip.onclick=()=>openKanji(item);
 const controls=node('div',undefined,'card-actions');
 const detail=node('button','📚 All Words','details');detail.onclick=()=>openKanji(item);
 const turn=node('button','↻ Flip','card-turn');
 turn.setAttribute('aria-label','Flip 3D card for '+character);
 turn.onclick=()=>{outer.classList.toggle('flipped');turn.setAttribute('aria-pressed',String(outer.classList.contains('flipped')))};
 const learnt=node('button',learned[character]?'✓ Learned':'＋ Learn','learned'+(learned[character]?' active':''));
 learnt.setAttribute('aria-pressed',String(!!learned[character]));
 learnt.onclick=()=>{if(learned[character])delete learned[character];else learned[character]=true;storeLearned();render()};
 controls.append(detail,turn,learnt);outer.append(flip,controls);return outer;
}
function filtered(){const q=search.trim().toLocaleLowerCase();return items.filter(x=>!q||[x.character,gloss(x),readings(x),x.radical].join(' ').toLocaleLowerCase().includes(q))}
function render(){
 const matches=filtered(),totalPage=Math.max(1,Math.ceil(matches.length/PER_PAGE));
 page=Math.min(page,totalPage-1);
 $('total').textContent='🈶 '+items.length+' Kanji';
 $('completed').textContent='✅ '+Object.keys(learned).filter(k=>learned[k]).length+' learned';
 $('resultCount').textContent='🔍 '+matches.length+' found';
 $('levelName').textContent=level;
 $('pageCount').textContent='Page '+(page+1)+' / '+totalPage;
 $('prev').disabled=page===0;$('next').disabled=page>=totalPage-1;
 $('kanjiCards').replaceChildren();
 if(!matches.length){$('kanjiCards').append(node('p','No Kanji match. Try another reading or English meaning.','placeholder'));return}
 for(const item of matches.slice(page*PER_PAGE,(page+1)*PER_PAGE))$('kanjiCards').append(cardForKanji(item));
}
function setStatus(message){$('status').className='placeholder';$('status').textContent=message}
async function load(){
 $('library').hidden=true;$('status').hidden=false;$('status').className='loader';$('status').textContent='Loading the original '+level+' Kanji study collection…';
 $('backToLevel').href='../mobile-app/learn.html?level='+level;
 u.searchParams.set('level',level);history.replaceState(null,'',u.pathname+u.search);
 try{
  source=await DATA.load(level);items=source.kanji;
  if(items.length===0)throw Error('No verified Kanji entries in this source');
  try{learned=JSON.parse(localStorage.getItem(localKey())||'{}')||{}}catch{learned={}}
  page=0;search='';$('search').value='';render();$('status').hidden=true;$('library').hidden=false;
  const word=u.searchParams.get('kanji');
  if(word){const selected=items.find(x=>x.character===word);if(selected)openKanji(selected)}
 }catch(e){
  source=null;setStatus('Could not load real '+level+' Kanji data: '+e.message+'. Check your connection, then reload. No demo data was inserted.')
 }
}
function wordClass(item){
 const value=Array.isArray(item.pos)?item.pos:String(item.pos||item.part_of_speech||'').split(',');
 const names={n:'Noun',pron:'Pronoun',adv:'Adverb','adj-i':'い-adjective','adj-na':'な-adjective',v1:'Ichidan verb',vs:'する-verb',exp:'Expression',conj:'Conjunction',prt:'Particle'};
 return value.map(v=>names[String(v).trim()]||String(v).trim()).filter(Boolean).join(' · ')
}
function appendCompounds(character,root,version){
 const heading=node('h3','📚 '+character+' を使う単語 · Compound words across N5–N1');
 root.append(heading);
 const notice=node('p','Loading words from N5–N1 original vocabulary files…','small');notice.setAttribute('role','status');root.append(notice);
 const container=node('div',undefined,'compound-results');root.append(container);
 const more=node('button','Show more words →','action light compound-more');more.hidden=true;root.append(more);
 const populate=(words,checked,unavailable)=>{
  if(detailVersion!==version||!root.isConnected)return;
  allRelated=words;if(window.NextStepOfflineAI)window.NextStepOfflineAI.setRelated(words);
  let count=24;
  const draw=()=>{
   container.replaceChildren();
   for(const word of words.slice(0,count)){
    const entry=node('article',undefined,'compound-entry');
    const top=node('div',undefined,'compound-head');
    top.append(node('strong',word.word,'compound-word'),node('span',word.reading,'compound-reading'),node('span',(word.levels||[]).join(' · '),'compound-levels'));
    entry.append(top,node('p',gloss(word),'compound-meaning'));
    const ex=node('div',undefined,'compound-examples');examples(ex,word);entry.append(ex);
    const open=node('button','📖 Full meaning + translation','action indigo compound-translate');
    open.onclick=()=>openWord(word);entry.append(open);container.append(entry)
   }
   if(!words.length)container.append(node('p','No matching compound was found in the available source files. This does not mean no such Japanese word exists.','placeholder'));
   more.hidden=count>=words.length;
   more.textContent='Show more ('+count+'/'+words.length+') →';
  };
  more.onclick=()=>{count=Math.min(count+24,words.length);draw()};
  notice.textContent=words.length+' unique source-backed words found · searched '+checked.join(', ')+(unavailable.length?' · unavailable: '+unavailable.join(', '):'');
  draw()
 };
 populate(COMPOUNDS.fromCurrent(character,level,source),[level],[]);
 COMPOUNDS.all(character,level,source).then(r=>populate(r.words,r.checked,r.unavailable))
 .catch(e=>{if(version===detailVersion)notice.textContent='Some levels failed to load: '+e.message})
}
function initDetail(item,type){
 active={type,item,id:level+'-'+type+'-'+(type==='kanji'?item.character:item.word+'|'+item.reading)};
 const root=$('detailBody');root.replaceChildren();$('detailLabel').textContent=level+' · '+(type==='kanji'?'漢字 Kanji':'語彙 Vocabulary');
 root.append(node('h2',type==='kanji'?item.character:item.word,'detail-main'));
 const grid=node('div',undefined,'detail-grid');
 if(type==='kanji'){
  line(grid,'意味 · Meaning',gloss(item));line(grid,'音読み · On-yomi',item.onyomi);line(grid,'訓読み · Kun-yomi',item.kunyomi);
  line(grid,'部首 · Radical',item.radical);line(grid,'画数 · Stroke count',item.strokes);line(grid,'Other known compounds',item.words)
 }else{
  line(grid,'意味 · Meaning',gloss(item));line(grid,'よみかた · Reading',item.reading);line(grid,'品詞 · Word class',wordClass(item))
 }
 root.append(grid);
 root.append(node('h3','📝 Original example sentences'));
 const sample=node('div',undefined,'compound-examples');examples(sample,item);root.append(sample);
 root.append(node('p','Explanations are based on existing JLPT study files. Only available compounds and sentences are shown.','small'));
 $('translated').hidden=true;$('translated').replaceChildren();
 $('translate').textContent='🌍 Explain in '+(NAMES[lang]||readName(lang));
 if(window.NextStepOfflineAI)window.NextStepOfflineAI.select(active,{level,language:lang,progress:learned,related:allRelated});
 if(!$('detail').open)$('detail').showModal();
 return root;
}
function openKanji(item){
 const version=++detailVersion;allRelated=[];
 const root=initDetail(item,'kanji');appendCompounds(item.character,root,version)
}
function openWord(item){
 ++detailVersion;initDetail(item,'vocab')
}
function explanationText(){
 if(!active)return '';
 const item=active.item;const rows=[
  (active.type==='kanji'?'Kanji':'Vocabulary')+': '+(active.type==='kanji'?item.character:item.word),
  'English definitions: '+gloss(item),
  'Readings: '+(active.type==='kanji'?readings(item):item.reading)
 ];
 if(item.onyomi?.length)rows.push('On-yomi: '+item.onyomi.join(', '));
 if(item.kunyomi?.length)rows.push('Kun-yomi: '+item.kunyomi.join(', '));
 if(item.radical)rows.push('Radical: '+item.radical);
 if(item.strokes)rows.push('Stroke count: '+item.strokes);
 if(active.type==='vocab')rows.push('Part of speech: '+wordClass(item));
 const related=active.type==='kanji'?allRelated.slice(0,20):[];
 if(related.length)rows.push('Related existing words: '+related.map(x=>x.word+' ('+x.reading+'): '+gloss(x)).join('; '));
 for(const e of realExamples(item))rows.push('Japanese example: '+e.ja+(e.en?' — English: '+e.en:''));
 return rows.join('\n')
}
async function translate(){
 if(!active)return;
 const btn=$('translate'),output=$('translated'),material=explanationText(),target=lang;
 btn.disabled=true;output.hidden=false;output.textContent='⏳ Translating the original Kanji / word explanation…';
 try{
  const result=await window.NextStepTranslate.requestTranslation(material,'en',target);
  if(target===lang)output.textContent=result
 }catch(e){
  output.textContent='Machine translation unavailable: '+e.message+'. ';
  const a=node('a','Google Translate ↗','action');a.target='_blank';a.rel='noopener noreferrer';
  a.href='https://translate.google.com/?'+new URLSearchParams({sl:'en',tl:target,text:material.slice(0,4500),op:'translate'});
  output.append(a)
 }finally{btn.disabled=false}
}
function speak(){
 if(!active||!('speechSynthesis' in window))return;
 speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(active.type==='kanji'?active.item.character:active.item.word);
 utterance.lang='ja-JP';utterance.rate=.8;const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('ja'));if(voice)utterance.voice=voice;speechSynthesis.speak(utterance)
}
function init(){
 for(const code of LANGS){const opt=node('option',(NAMES[code]||readName(code))+' ('+code+')');opt.value=code;$('lang').append(opt)}
 $('level').value=level;$('lang').value=lang;
 $('level').onchange=e=>{level=e.target.value;storePrefs();u.searchParams.delete('kanji');load()};
 $('lang').onchange=e=>{lang=e.target.value;storePrefs();if(active){$('translate').textContent='🌍 Explain in '+(NAMES[lang]||readName(lang));$('translated').hidden=true;window.NextStepOfflineAI?.setLanguage(lang)}};
 $('search').oninput=e=>{search=e.target.value;page=0;render()};
 $('prev').onclick=()=>{if(page>0){page--;render();$('kanjiCards').scrollIntoView({block:'start'})}};
 $('next').onclick=()=>{if((page+1)*PER_PAGE<filtered().length){page++;render();$('kanjiCards').scrollIntoView({block:'start'})}};
 const apply=()=>{document.body.classList.toggle('dark',dark);$('theme').textContent=dark?'☀ Light':'🌙 Dark';$('furi').textContent=furi?'ふりがな ON':'ふりがな OFF';$('furi').setAttribute('aria-pressed',String(furi))};
 $('theme').onclick=()=>{dark=!dark;storePrefs();apply()};
 $('furi').onclick=()=>{furi=!furi;storePrefs();apply();if(active){const x=active;if(x.type==='kanji')openKanji(x.item);else openWord(x.item)}};
 $('close').onclick=()=>$('detail').close();
 $('detail').onclick=e=>{if(e.target===$('detail'))$('detail').close()};
 $('translate').onclick=translate;$('speak').onclick=speak;
 window.NextStepOfflineAI?.initialize();
 if('serviceWorker'in navigator)navigator.serviceWorker.register('../sw.js',{scope:'../'}).catch(()=>{});
 apply();load()
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init()
})();