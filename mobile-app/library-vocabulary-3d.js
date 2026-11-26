/* NextStep Study • 3D vocabulary cards within the existing N5–N1 Library.
 * Preserve original dictionary classes (JMdict POS codes), readings, and examples.
 * No synthetic vocabulary or machine-generated example sentences. */
(function(global){'use strict';
const $=id=>document.getElementById(id),API=global.NextStepDailySource;
const CLASSES=[
 ['noun','Nouns · 名詞','n n-adv n-t n-pr n-suf n-pref n-unc n-adv n-t n-suf n-pr num'],
 ['pronoun','Pronouns · 代名詞','pn pron'],
 ['verb','Verbs · 動詞','v1 v1-s v2a-s v2b-k v2b-s v2d-k v2d-s v2g-k v2g-s v2h-k v2h-s v2k-k v2k-s v2m-k v2m-s v2n-s v2r-k v2r-s v2s-s v2t-k v2t-s v2w-s v2y-k v2y-s v2z-s v4b v4g v4h v4k v4m v4n v4r v4s v4t v5aru v5b v5g v5k v5k-s v5m v5n v5r v5r-i v5s v5t v5u v5u-s v5uru vi vk vn vr vs vs-c vs-i vs-s vt vz'],
 ['adjective','Adjectives · 形容詞','adj-f adj-i adj-ix adj-kari adj-ku adj-na adj-nari adj-no adj-pn adj-shiku adj-t'],
 ['adverb','Adverbs · 副詞','adv adv-to'],
 ['particle','Particles · 助詞','prt'],
 ['conjunction','Conjunctions · 接続詞','conj'],
 ['counter','Counters · 助数詞','ctr'],
 ['interjection','Interjections · 感動詞','int'],
 ['auxiliary','Auxiliaries · 助動詞','aux aux-adj aux-v'],
 ['prefix','Prefixes · 接頭辞','pref'],
 ['suffix','Suffixes · 接尾辞','suf'],
 ['expression','Expressions · 表現','exp'],
 ['other','Other / unclassified · その他','']
];
const parsed=CLASSES.map(([id,label,values])=>({id,label,codes:new Set(values.split(' ').filter(Boolean))}));
const known=new Set(parsed.flatMap(x=>[...x.codes]));
const labelFor=code=>({n:'Noun',pn:'Pronoun',pron:'Pronoun',adv:'Adverb',vi:'Intransitive verb',vt:'Transitive verb',
 v1:'Ichidan verb',vs:'Suru verb',vk:'Kuru verb','adj-i':'I-adjective','adj-na':'Na-adjective',prt:'Particle',
 conj:'Conjunction',ctr:'Counter',int:'Interjection',exp:'Expression',pref:'Prefix',suf:'Suffix'})[code]||code;
const pos=item=>Array.isArray(item.pos)?item.pos.map(String):String(item.pos||item.part_of_speech||'').split(/[,\s]+/).filter(Boolean);
function classify(item){
 const codes=pos(item);const names=parsed.filter(x=>x.id!=='other'&&codes.some(code=>x.codes.has(code)||x.id==='verb'&&/^v[1254]|^vs|^vk/.test(code))).map(x=>x.id);
 // Do not infer a grammatical category when no supported source POS marker exists.
 return names.length?names:['other']
}
const srcGloss=item=>API?.getGloss(item)|| (Array.isArray(item.meanings)?item.meanings.join(', '):String(item.meaning||''));
const examples=item=>API?.validExamples(item)||[];
const dom=(tag,className,label)=>{const n=document.createElement(tag);if(className)n.className=className;if(label!==undefined)n.textContent=String(label);return n};
function jp(node,example,showFuri){
 const p=dom('p','v3-japanese');p.lang='ja';
 if(showFuri&&example.furigana){
  const f=String(example.furigana),re=/\{([^{}|]+)\|([^{}|]+)\}/g;let last=0,m;
  while((m=re.exec(f))){p.append(document.createTextNode(f.slice(last,m.index)));const ruby=dom('ruby',null,m[1]);ruby.append(dom('rt',null,m[2]));p.append(ruby);last=m.index+m[0].length}
  p.append(document.createTextNode(f.slice(last)))
 }else p.textContent=example.ja||'';
 node.append(p);
 if(example.en)node.append(dom('p','v3-example-en',example.en));
}
function readWord(text){
 if(!('speechSynthesis'in global))return false;
 global.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='ja-JP';utterance.rate=.78;
 const v=global.speechSynthesis.getVoices().find(x=>x.lang.toLowerCase().startsWith('ja'));if(v)utterance.voice=v;global.speechSynthesis.speak(utterance);return true
}
const state={level:'N2',items:[],lang:'ne',furigana:true,category:'all',reviewMode:'all',query:'',page:0,chosen:null,request:0,learned:{},host:null};
const key=()=> 'nextstep-library-vocab-3d-v1-'+state.level;
const loadProgress=()=>{try{state.learned=JSON.parse(localStorage.getItem(key())||'{}')||{}}catch{state.learned={}}};
const saveProgress=()=>{try{localStorage.setItem(key(),JSON.stringify(state.learned))}catch{}};
const token=item=>item.word+'|'+item.reading;
const safeItems=arr=>{
 const seen=new Set();
 return arr.filter(item=>{
  if(!item||typeof item.word!=='string'||!item.word.trim()||typeof item.reading!=='string'||!item.reading.trim())return false;
  const k=token(item);if(seen.has(k))return false;seen.add(k);return true
 });
};
function filtered(){
 const q=state.query.toLocaleLowerCase().trim();
 const candidates=global.NextStepSRS?.candidates(state.level,'vocab',state.items,token,state.reviewMode)||state.items;
 return candidates.filter(item=>(state.category==='all'||classify(item).includes(state.category))&&
 (!q||[item.word,item.reading,item.romaji,srcGloss(item),...pos(item)].join(' ').toLocaleLowerCase().includes(q)))
}
function preview(item){
 const outer=dom('article','v3-card'+(state.learned[token(item)]?' v3-learned':''));
 const flip=dom('button','v3-flip');flip.type='button';flip.setAttribute('aria-label','Read details and related vocabulary for '+item.word);
 const inner=dom('span','v3-inner');
 const front=dom('span','v3-front');front.append(dom('small',null,state.level+' · '+classify(item).join(', ')),dom('strong',null,item.word),dom('small',null,'Tap → details / examples'));
 const back=dom('span','v3-back');back.append(dom('small',null,'読み方'),dom('strong',null,item.reading),dom('small',null,srcGloss(item).slice(0,100)));
 inner.append(front,back);flip.append(inner);flip.onclick=()=>open(item);
 const actions=dom('div','v3-actions');
 const turn=dom('button',null,'↻ Flip');turn.onclick=()=>outer.classList.toggle('flipped');
 const detail=dom('button',null,'📖 Explain');detail.onclick=()=>open(item);
 const learned=dom('button',state.learned[token(item)]?'active':'',state.learned[token(item)]?'✓ Learned':'＋ Learn');
 learned.onclick=()=>{if(state.learned[token(item)])delete state.learned[token(item)];else state.learned[token(item)]=true;saveProgress();draw()};
 actions.append(turn,detail,learned);outer.append(flip,actions);return outer
}
function addReviewControls(root){
 const S=global.NextStepSRS;if(!S)return;
 const stats=S.status(state.level,'vocab',state.items,token);
 const group=dom('section','ns-smart-review');
 group.append(dom('strong',null,'🧠 Smart Review · vocabulary'));
 group.append(dom('p',null,'📅 '+stats.due+' due · 🆕 '+stats.new+' new · 🔁 '+stats.weak+' hard/again · '+stats.scheduled+' scheduled'));
 const tabs=dom('div','ns-review-filters');
 for(const [mode,label] of [['all','All words'],['due','Due now'],['new','New'],['weak','Hard / Again']]){
  const btn=dom('button',null,label);btn.type='button';btn.setAttribute('aria-pressed',String(state.reviewMode===mode));
  btn.onclick=()=>{state.reviewMode=mode;state.page=0;draw()};tabs.append(btn)
 }
 group.append(tabs);root.append(group)
}
function addRating(body,item){
 const S=global.NextStepSRS;if(!S)return;
 const section=dom('section','ns-review-rating');section.append(dom('strong',null,'🧠 How well did you remember '+item.word+'?'));
 const buttons=dom('div','ns-review-grade-buttons');
 for(const [grade,label] of [['again','↻ Again · 10 min'],['hard','😅 Hard · 1 day'],['good','✓ Good · 3 days'],['easy','⭐ Easy · 7 days']]){
  const btn=dom('button',null,label);btn.type='button';btn.dataset.grade=grade;
  btn.onclick=()=>{const entry=S.rate(state.level,'vocab',token(item),grade);message.textContent='Saved on this device. '+S.printable(entry);draw()};buttons.append(btn)
 }
 const message=dom('p','ns-review-message',S.printable(S.get(state.level,'vocab',token(item))));
 section.append(buttons,message);body.append(section)
}
function draw(){
 const host=$('content');if(!host)return;
 state.host=host;const matches=filtered(),pages=Math.max(1,Math.ceil(matches.length/24));state.page=Math.min(state.page,pages-1);
 host.replaceChildren();
 const heading=dom('div','section-head');heading.append(dom('h2',null,'🧊 '+state.level+' 3D Vocabulary'),dom('span','pill',state.items.length+' unique words'));host.append(heading);
 host.append(dom('p','v3-intro','Categories are based on source part-of-speech tags. Tap a word for readings, detailed examples, related real words, translation and pronunciation.'));
 addReviewControls(host);
 const controls=dom('div','v3-controls');
 const categoryLabel=dom('label','field','📚 Word class / 品詞');
 const category=dom('select');category.id='v3Class';
 const counts=Object.fromEntries(parsed.map(x=>[x.id,state.items.filter(w=>classify(w).includes(x.id)).length]));
 for(const x of [{id:'all',label:'All vocabulary'},...parsed]){const option=dom('option',null,x.label+' ('+(x.id==='all'?state.items.length:counts[x.id])+')');option.value=x.id;category.append(option)}
 category.value=state.category;category.onchange=e=>{state.category=e.target.value;state.page=0;draw()};categoryLabel.append(category);
 const searchLabel=dom('label','field','🔎 Search word / reading / meaning');
 const search=dom('input');search.id='v3Search';search.type='search';search.placeholder='学校、がっこう、school';search.value=state.query;
 search.oninput=e=>{const c=e.target.selectionStart;state.query=e.target.value;state.page=0;draw();const next=$('v3Search');next.focus();next.setSelectionRange(c,c)};
 searchLabel.append(search);controls.append(categoryLabel,searchLabel);host.append(controls);
 const learnedCount=state.items.filter(x=>state.learned[token(x)]).length;
 host.append(dom('div','v3-summary','📘 '+matches.length+' words · ✅ '+learnedCount+'/'+state.items.length+' learned'));
 const grid=dom('div','v3-grid');matches.slice(state.page*24,(state.page+1)*24).forEach(x=>grid.append(preview(x)));
 if(!matches.length)grid.append(dom('div','empty','No words are tagged as this category in the current source. Try All vocabulary.'));
 host.append(grid);
 const pager=dom('div','pagebar');
 const prev=dom('button',null,'← Previous');prev.disabled=state.page===0;prev.onclick=()=>{state.page--;draw()};
 const next=dom('button',null,'Next →');next.disabled=state.page+1>=pages;next.onclick=()=>{state.page++;draw()};
 pager.append(prev,dom('strong',null,(state.page+1)+' / '+pages),next);host.append(pager)
}
function detailField(parent,label,value){
 if(value===undefined||value===null||value===''||(Array.isArray(value)&&value.length===0))return;
 const row=dom('div','v3-info');row.append(dom('strong',null,label),dom('span',null,Array.isArray(value)?value.join(' · '):value));parent.append(row)
}
function related(item){
 const shared=[...item.word].filter(c=>/[\u3400-\u9fff]/u.test(c));
 const same=state.items.filter(x=>token(x)!==token(item)&&
 (shared.some(c=>x.word.includes(c))||(shared.length===0&&classify(x).some(c=>classify(item).includes(c))&&x.word[0]===item.word[0])));
 const unique=new Set();return same.filter(x=>{const k=token(x);if(unique.has(k))return false;unique.add(k);return true})
}
function open(item){
 state.chosen=item;const version=++state.request,body=$('detailBody');body.replaceChildren();
 const close=$('detailDialog');if(!close.open)close.showModal();
 body.append(dom('h2',null,item.word));const meta=dom('div','v3-metadata');
 detailField(meta,'読み方 / Reading',item.reading);detailField(meta,'Romaji',item.romaji);
 detailField(meta,'Meaning (source English)',srcGloss(item));
 detailField(meta,'Part of speech / 品詞',pos(item).map(labelFor).join(' · ')||'Not classified in source');
 detailField(meta,'Categories',classify(item).map(x=>parsed.find(k=>k.id===x)?.label).filter(Boolean).join(' · '));
 body.append(meta);addRating(body,item);
 const buttons=dom('div','v3-detail-actions');
 const play=dom('button','btn soft','🔊 Japanese reading');play.onclick=()=>readWord(item.word);
 const speakReading=dom('button','btn soft','🔉 Kana reading');speakReading.onclick=()=>readWord(item.reading);
 buttons.append(play,speakReading);body.append(buttons);
 const usage=dom('section','v3-examples');usage.append(dom('h3',null,'📝 Complete Japanese examples / 例文'));
 const sourceExamples=examples(item);if(!sourceExamples.length)usage.append(dom('p','hint','This source contains no complete example sentence for this word.'));
 sourceExamples.slice(0,5).forEach((ex,i)=>{const box=dom('div','v3-example');box.append(dom('strong',null,'例文 '+(i+1)));jp(box,ex,state.furigana);usage.append(box)});body.append(usage);
 const translate=dom('button','btn','🌍 Translate complete details');translate.type='button';
 const translation=dom('div','v3-translation');translation.setAttribute('role','status');translation.setAttribute('aria-live','polite');
 translate.onclick=async()=>{
  translate.disabled=true;translation.textContent='⏳ Translating meanings, grammatical class and examples…';
  const full=['Word: '+item.word,'Reading: '+item.reading,'Meaning: '+srcGloss(item),
   'Word class: '+pos(item).map(labelFor).join(', '),...sourceExamples.slice(0,4).map((x,i)=>
   'Example '+(i+1)+': '+x.ja+(x.en?' — '+x.en:''))].join('\n');
  try{if(!global.NextStepTranslate?.requestTranslation)throw Error('Translation service is unavailable');
   const answer=await global.NextStepTranslate.requestTranslation(full,'en',state.lang);
   if(version===state.request)translation.textContent=answer
  }catch(e){
   if(version===state.request){translation.textContent='Translation unavailable: '+e.message+'. ';
    const link=dom('a','btn alt','Open Google Translate ↗');
    link.href='https://translate.google.com/?'+new URLSearchParams({sl:'auto',tl:state.lang,text:full.slice(0,4500),op:'translate'});
    link.target='_blank';link.rel='noopener noreferrer';translation.append(link)}
  }finally{translate.disabled=false}
 };
 body.append(translate,translation);
 const words=related(item);
 const title=dom('h3',null,'🔗 More related vocabulary ('+words.length+' available in '+state.level+')');body.append(title);
 body.append(dom('p','hint','Related words share a written Kanji, or for kana-only words the same first character and source word class. Only real entries are shown.'));
 const grid=dom('div','v3-related');body.append(grid);
 const more=dom('button','btn soft','Show more words');more.type='button';more.hidden=true;body.append(more);
 let visible=12;
 const showRelated=()=>{
  grid.replaceChildren();
  words.slice(0,visible).forEach(x=>{
   const b=dom('button','v3-related-item');
   b.append(dom('strong',null,x.word),dom('span',null,x.reading),dom('small',null,srcGloss(x).slice(0,100)));
   b.onclick=()=>open(x);grid.append(b)
  });
  if(!words.length)grid.append(dom('p','hint','No related word was found in the current level dictionary.'));
  more.hidden=visible>=words.length;more.textContent='Show more ('+visible+'/'+words.length+')';
 };
 more.onclick=()=>{visible=Math.min(visible+12,words.length);showRelated()};showRelated()
}
function show({level,items,language,furigana}){
 const changing=level!==state.level;state.level=level;state.lang=language||'ne';state.furigana=furigana!==false;state.items=safeItems(items);
 if(changing){state.page=0;state.category='all';state.query=''}loadProgress();draw()
}
global.NextStepLibraryVocabulary3D={show,classify,classes:parsed};
})(window);
