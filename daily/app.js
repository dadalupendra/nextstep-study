/* NextStep Daily 3D cards — no demo content, no quiz duplicates. */
(()=>{'use strict';
const API=window.NextStepDailySource,LEVELS=API.LEVELS;
const CODES='ne en ja hi bn zh-CN ko fr es de ar th vi id pt ru it tr uk pl nl sv fi da no el he fa ur ta te mr gu pa ms sw fil my km lo af sq am hy az eu be bs bg ca hr cs et gl ka ht hu is ig ga jv kk ku ky lv lt mk mn ps ro sr sk sl so su tg uz cy zu yo xh si or as tk fy lb mt ny st sd yi ceb'.split(' ');
const NAMES={ne:'नेपाली',en:'English',ja:'日本語',hi:'हिन्दी',bn:'বাংলা','zh-CN':'中文',ko:'한국어',ar:'العربية',ur:'اردو',ta:'தமிழ்',te:'తెలుగు'};
const $=id=>document.getElementById(id),getName=x=>{try{return new Intl.DisplayNames(['en'],{type:'language'}).of(x)||x}catch{return x}};
const WORD_CLASS={'n':'Noun / 名詞','n-adv':'Adverbial noun','n-pr':'Proper noun','n-t':'Temporal noun','pron':'Pronoun / 代名詞','adv':'Adverb / 副詞','adj-i':'I-adjective / イ形容詞','adj-na':'Na-adjective / ナ形容詞','v1':'Ichidan verb / 一段動詞','vs':'Suru verb','v5u':'Godan verb','v5r':'Godan verb','v5k':'Godan verb','v5s':'Godan verb','v5m':'Godan verb','v5t':'Godan verb','v5g':'Godan verb','vi':'Intransitive verb','vt':'Transitive verb','prt':'Particle / 助詞','conj':'Conjunction / 接続詞','int':'Interjection / 感動詞','exp':'Expression / 表現','ctr':'Counter / 助数詞','num':'Number','suf':'Suffix','pref':'Prefix'};
const safeStorage={read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}},write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const sharedKey='nextstep-unified-prefs',savedPrefs=safeStorage.read(sharedKey)||{};
const url=new URL(location.href);
let level=LEVELS.includes(url.searchParams.get('level'))?url.searchParams.get('level'):(LEVELS.includes(savedPrefs.level)?savedPrefs.level:'N2');
let language=CODES.includes(savedPrefs.lang)?savedPrefs.lang:'ne';
let dark=!!savedPrefs.dark,furigana=savedPrefs.furi!==false,filter='all',day=API.tokyoDay(),loaded=null,cards=[],progress={},current=null;
const text=(tag,str,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;n.textContent=str??'';return n};
const brief=item=>API.getGloss(item);
const reading=(item,type)=>type==='kanji'?[...(item.onyomi||[]),...(item.kunyomi||[])].join(' · '):item.reading||'';
const entryName=card=>card.type==='kanji'?card.item.character:card.item.word;
const marker=card=>card.id;
function progressKey(){return 'nextstep-3d-daily-v1-'+level+'-'+day}
function readProgress(){progress=safeStorage.read(progressKey())||{}}
function persist(){safeStorage.write(progressKey(),progress)}
function savePrefs(){safeStorage.write(sharedKey,{...savedPrefs,lang:language,level,dark,furi:furigana})}
function applyPrefs(){
 document.body.classList.toggle('dark',dark);
 $('theme').textContent=dark?'☀️ Light mode':'🌙 Dark mode';
 $('furigana').textContent=furigana?'ふりがな ON':'ふりがな OFF';
 $('furigana').setAttribute('aria-pressed',String(furigana));
 $('lang').value=language;$('level').value=level;$('filter').value=filter;
}
function element(tag,cls){const x=document.createElement(tag);if(cls)x.className=cls;return x}
function appendRow(container,label,value){
 if(value===null||value===undefined||value===''||(Array.isArray(value)&&!value.length))return;
 const wrap=element('div','detail-group');wrap.append(text('strong',label),text('span',Array.isArray(value)?value.join(' · '):String(value)));container.append(wrap)
}
function formatWordClass(value){
 const parts=Array.isArray(value)?value:String(value||'').split(',');
 return parts.map(x=>{const key=String(x).trim();return WORD_CLASS[key]||key}).filter(Boolean).join(', ')
}
function kanjiRelated(card){
 const related=API.relatedWords(card.item.character,loaded.vocab,12);
 return related
}
function showFurigana(node,item){
 // Source furigana uses {漢字|かんじ}; untrusted HTML is never inserted.
 const original=String(item.furigana||item.ja||'');
 if(!furigana||!item.furigana){node.textContent=item.ja||'';return}
 const re=/\{([^{}|]+)\|([^{}|]+)\}/g;let previous=0,match;
 while((match=re.exec(original))){
  node.append(document.createTextNode(original.slice(previous,match.index)));
  const ruby=document.createElement('ruby');ruby.textContent=match[1];ruby.append(text('rt',match[2]));node.append(ruby);previous=match.index+match[0].length;
 }
 node.append(document.createTextNode(original.slice(previous)))
}
function flipCard(card){
 const wrap=element('article','flipcard'+(progress[marker(card)]?' learned-card':''));
 wrap.dataset.card=marker(card);
 const flip=element('button','flip-button');flip.type='button';flip.setAttribute('aria-label','Flip '+entryName(card)+' study card');
 flip.setAttribute('aria-pressed','false');
 const inner=element('div','flip-inner');
 const front=element('div','face front '+card.type);
 front.append(text('small',card.type==='kanji'?'🈶 KANJI · '+level:'📘 VOCAB · '+level),text('div',entryName(card),'word'),text('small','Tap to flip in 3D ↻'));
 const back=element('div','face back');back.append(text('small','読み方 · Reading'),text('div',reading(card.item,card.type),'meaning'),text('small',brief(card.item).slice(0,95)));
 inner.append(front,back);flip.append(inner);
 flip.onclick=()=>{wrap.classList.toggle('flipped');flip.setAttribute('aria-pressed',String(wrap.classList.contains('flipped')))};
 const actions=element('div','card-actions');const open=element('button','details');open.textContent='📖 Details';open.onclick=()=>openDetails(card);
 const learn=element('button','learned'+(progress[marker(card)]?' active':''));learn.textContent=progress[marker(card)]?'✓ Learned':'＋ Learn';
 learn.setAttribute('aria-pressed',String(!!progress[marker(card)]));
 learn.onclick=()=>{if(progress[marker(card)])delete progress[marker(card)];else progress[marker(card)]=true;persist();render();};
 actions.append(open,learn);wrap.append(flip,actions);return wrap
}
function streak(){
 let days=0;const d=new Date(day+'T00:00:00Z');
 for(let i=0;i<365;i++){
  const k='nextstep-3d-daily-v1-'+level+'-'+d.toISOString().slice(0,10);
  const record=safeStorage.read(k)||{};
  if(Object.keys(record).length>=20)days++;else if(i>0||Object.keys(progress).length<20)break;
  d.setUTCDate(d.getUTCDate()-1)
 }
 return days
}
function render(){
 if(!loaded)return;
 const total=cards.length,learned=cards.filter(x=>progress[marker(x)]).length;
 $('day').textContent='📅 '+day+' · Tokyo';
 $('count').textContent='📚 '+total+' unique study cards';
 $('learned').textContent='✅ '+learned+'/'+total+' learned';
 $('streak').textContent='🔥 '+streak()+' day streak';
 for(const type of ['kanji','vocab']){
  const container=$(type+'Cards');container.replaceChildren();
  const subset=cards.filter(x=>x.type===type&&(filter==='all'||filter===type||filter==='pending'&&!progress[marker(x)]));
  subset.forEach(x=>container.append(flipCard(x)));
  if(!subset.length)container.append(text('p',filter==='pending'?'All '+type+' cards learned today!':'No cards match this filter.','placeholder'));
  $(type+'Section').hidden=(filter!=='all'&&filter!=='pending'&&filter!==type);
 }
}
function detailEnglish(card,related){
 const item=card.item,parts=[
  'Japanese '+(card.type==='kanji'?'Kanji':'Vocabulary')+': '+entryName(card),
  'Reading: '+(reading(item,card.type)||'Not provided'),
  'Definition: '+brief(item)
 ];
 if(card.type==='kanji'){
  if(item.onyomi?.length)parts.push('On-yomi (Chinese-derived reading): '+item.onyomi.join(', '));
  if(item.kunyomi?.length)parts.push('Kun-yomi (Japanese reading): '+item.kunyomi.join(', '));
  if(item.radical)parts.push('Radical: '+item.radical);
  if(item.strokes)parts.push('Stroke count: '+item.strokes);
  if(item.words?.length)parts.push('Other associated kanji compounds: '+item.words.slice(0,10).join(', '));
  if(related.length)parts.push('Related real vocabulary with this Kanji: '+related.slice(0,6).map(w=>w.word+' ('+w.reading+') — '+brief(w)).join('; '))
 }else{
  const pos=formatWordClass(item.pos||item.part_of_speech);if(pos)parts.push('Part of speech: '+pos);
  if(item.romaji)parts.push('Romaji: '+item.romaji);
 }
 for(const [i,ex] of API.validExamples(item).slice(0,3).entries()){
  if(ex.en)parts.push('Example '+(i+1)+' meaning: '+ex.en);
  parts.push('Japanese example '+(i+1)+': '+ex.ja);
 }
 return parts.join('\n')
}
function openDetails(card){
 current=card;
 const item=card.item,related=card.type==='kanji'?kanjiRelated(card):[];
 $('detailLabel').textContent=level+' · '+(card.type==='kanji'?'Kanji detail':'Vocabulary detail');
 const root=$('detailBody');root.replaceChildren();root.append(text('h2',entryName(card),'detail-main'));
 const grid=element('div','detail-grid');
 appendRow(grid,'読み方 / Reading',reading(item,card.type));
 appendRow(grid,'English meaning / 意味',brief(item));
 if(card.type==='vocab'){
  appendRow(grid,'Part of speech / 品詞',formatWordClass(item.pos||item.part_of_speech));
  appendRow(grid,'Romaji',item.romaji);
 }else{
  appendRow(grid,'音読み / On-yomi',item.onyomi);
  appendRow(grid,'訓読み / Kun-yomi',item.kunyomi);
  appendRow(grid,'部首 / Radical',item.radical);
  appendRow(grid,'画数 / Strokes',item.strokes);
  appendRow(grid,'Other compounds / 関連熟語',item.words);
 }
 root.append(grid);
 const examples=API.validExamples(item).slice(0,5);
 root.append(text('h3','📝 Full Japanese example sentences'));
 const exRoot=element('div','examples');
 if(!examples.length)exRoot.append(text('p','No verified full example sentence is supplied for this entry.','small'));
 examples.forEach((ex,i)=>{
  const block=element('div','detail-group');block.append(text('strong','Example '+(i+1)+' / 例文'));
  const japanese=text('p','');japanese.lang='ja';showFurigana(japanese,ex);block.append(japanese);
  if(ex.en)block.append(text('p',ex.en));exRoot.append(block)
 });root.append(exRoot);
 if(related.length){
  root.append(text('h3','🔗 Related real vocabulary containing '+item.character));
  const chips=element('div','related-list');
  for(const word of related){const b=element('button');b.type='button';b.textContent=word.word+' · '+word.reading;
    b.onclick=()=>openDetails({type:'vocab',level,item:word,id:level+'-vocab-'+word.word+'|'+word.reading});chips.append(b)}
  root.append(chips)
 }
 root.append(text('p','Source-backed details only. Translation is generated automatically and may need correction.','small'));
 $('translate').textContent='🌍 Explain everything in '+(NAMES[language]||getName(language));
 $('translated').hidden=true;$('translated').textContent='';
 $('detail').showModal();
}
async function translateCurrent(){
 if(!current)return;
 const target=language,source=detailEnglish(current,current.type==='kanji'?kanjiRelated(current):[]);
 const out=$('translated'),button=$('translate');
 out.hidden=false;out.textContent='⏳ Translating meaning, grammar categories, examples and related words…';button.disabled=true;
 try{
  const translated=await window.NextStepTranslate.requestTranslation(source,'en',target);
  if(target===language)out.textContent=translated
 }catch(e){
  out.textContent='Translation unavailable: '+e.message+'. Original Japanese and English details remain visible. ';
  const a=text('a','🌐 Open Google Translate ↗','action');a.href='https://translate.google.com/?'+new URLSearchParams({sl:'en',tl:target,text:source.slice(0,4500),op:'translate'});
  a.target='_blank';a.rel='noopener noreferrer';out.append(a)
 }finally{button.disabled=false}
}
function speak(){
 if(!current||!('speechSynthesis'in window))return;
 speechSynthesis.cancel();const msg=new SpeechSynthesisUtterance(entryName(current));msg.lang='ja-JP';msg.rate=.8;
 const japanese=speechSynthesis.getVoices().find(x=>x.lang.toLowerCase().startsWith('ja'));if(japanese)msg.voice=japanese;
 speechSynthesis.speak(msg)
}
async function load(){
 $('ready').hidden=true;$('status').hidden=false;$('status').className='loader';$('status').textContent='Loading original '+level+' Kanji and vocabulary sources…';
 url.searchParams.set('level',level);history.replaceState(null,'',url.pathname+url.search);
 try{
  loaded=await API.load(level);cards=API.dayCards(level,day,loaded,10);readProgress();render();
  $('ready').hidden=false;$('status').hidden=true
 }catch(e){
  loaded=null;$('status').className='placeholder';$('status').replaceChildren();
  $('status').append(text('strong','⚠ Study source unavailable'),text('p',e.message),text('p','No duplicate or demo entries were added. Check your connection and retry.'));
  const retry=text('button','↻ Retry','action');retry.onclick=load;$('status').append(retry)
 }
}
function init(){
 for(const code of CODES){const opt=document.createElement('option');opt.value=code;opt.textContent=(NAMES[code]||getName(code))+' ('+code+')';$('lang').append(opt)}
 applyPrefs();
 $('level').onchange=e=>{level=e.target.value;savePrefs();load()};
 $('lang').onchange=e=>{language=e.target.value;savePrefs();$('translated').hidden=true;
   if(current)$('translate').textContent='🌍 Explain everything in '+(NAMES[language]||getName(language))};
 $('filter').onchange=e=>{filter=e.target.value;render()};
 $('theme').onclick=()=>{dark=!dark;savePrefs();applyPrefs()};
 $('furigana').onclick=()=>{furigana=!furigana;savePrefs();applyPrefs();if(current)openDetails(current)};
 $('close').onclick=()=>$('detail').close();
 $('detail').addEventListener('click',e=>{if(e.target===$('detail'))$('detail').close()});
 $('translate').onclick=translateCurrent;$('speak').onclick=speak;
 load()
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();