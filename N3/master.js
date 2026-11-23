/* NextStep N3 Study Book • open-source study lists, not official JLPT questions.
   Data: https://github.com/evanclan/OpenJLPT (CC BY-SA 4.0)
   See THIRD-PARTY-NOTICE.txt for upstream attributions. All level-tagged records are kept in their own level folder. */
(()=>{'use strict';
const ROOT='./';
const TYPES=['kanji','grammar','vocab'];
const CONFIG={kanji:{size:20,title:'Kanji',max:387},grammar:{size:10,title:'Grammar',max:101},vocab:{size:25,title:'Vocabulary',max:100000}};
const STORE='nextstep-n3-progress-2026';
const DAILY_STORE='nextstep-n3-daily-v2';
const TRANS_STORE='nextstep-n3-translations-v2';
const app={section:'kanji',chapter:0,data:{kanji:[],grammar:[],vocab:[]},loaded:false,quiz:[],quizSection:'kanji',quizChapter:0,progress:{},cache:{},showingResults:false,vocabCategory:'all',showFurigana:(()=>{try{return localStorage.getItem('n3-furigana')!=='off'}catch(e){return true}})(),dailyReveal:{},dailyProgress:{}};
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const arr=x=>Array.isArray(x)?x:[];
const fmt=n=>Number(n).toLocaleString('en-US');
const first=x=>arr(x).filter(Boolean)[0]||'';
const shorten=(str,n=160)=>{str=String(str??'');return str.length>n?str.slice(0,n-1)+'…':str};
const valOf=(item,type)=>type==='kanji'?item.character:type==='grammar'?item.pattern:item.word;
const meanings=(item,type)=>type==='grammar'?(item.meaning||''):(arr(item.meanings).slice(0,5).join('; ')||'');
function saveProgress(){try{localStorage.setItem(STORE,JSON.stringify(app.progress))}catch(e){}}
try{app.progress=JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch(e){app.progress={}}
// Word classes follow JMdict POS codes. Unsupported/absent POS remain unclassified.
const POS_GROUPS=[['noun','名詞','संज्ञा / Noun'],['pronoun','代名詞','सर्वनाम / Pronoun'],['proper-noun','固有名詞','व्यक्तिवाचक संज्ञा / Proper noun'],['verb','動詞','क्रिया / Verb'],['i-adj','イ形容詞','इ-विशेषण / i-Adjective'],['na-adj','ナ形容詞','ना-विशेषण / na-Adjective'],['other-adj','その他の形容詞','अन्य विशेषण / Other Adjective'],['adverb','副詞','क्रियाविशेषण / Adverb'],['conjunction','接続詞','संयोजक / Conjunction'],['particle','助詞','निपात / Particle'],['interjection','感動詞','विस्मयादिबोधक / Interjection'],['counter','助数詞','गणक / Counter'],['number','数詞','संख्यावाचक / Number'],['auxiliary','助動詞','सहायक क्रिया / Auxiliary'],['prefix','接頭辞','उपसर्ग / Prefix'],['suffix','接尾辞','प्रत्यय / Suffix'],['expression','表現','अभिव्यक्ति / Expression'],['unclassified','未分類','वर्ग नदिइएको / Unclassified']];
const POS_MAP={n:'noun',n1:'noun',n2:'noun',n3:'noun',n4:'noun',n5:'noun','n-adv':'noun','n-t':'noun','n-pref':'noun','n-suf':'noun',noun:'noun','n-pr':'proper-noun',propernoun:'proper-noun',pron:'pronoun',pn:'pronoun',pronoun:'pronoun',v1:'verb',v5u:'verb',v5k:'verb',v5g:'verb',v5s:'verb',v5t:'verb',v5n:'verb',v5b:'verb',v5m:'verb',v5r:'verb',v5aru:'verb',v5u_s:'verb',vs:'verb','vs-i':'verb','vs-s':'verb',vk:'verb',vz:'verb',vi:'verb',vt:'verb',verb:'verb','adj-i':'i-adj',adji:'i-adj','i-adjective':'i-adj','adj-na':'na-adj','adj-nari':'na-adj',naadj:'na-adj','adj-no':'na-adj','adj-f':'other-adj','adj-t':'other-adj','adj-ku':'other-adj','adj-shiku':'other-adj',adv:'adverb','adv-to':'adverb',adverb:'adverb',conj:'conjunction',conjunction:'conjunction',prt:'particle',particle:'particle',int:'interjection',interjection:'interjection',ctr:'counter',counter:'counter',num:'number',number:'number',aux:'auxiliary','aux-v':'auxiliary','aux-adj':'auxiliary',pref:'prefix',prefix:'prefix',suf:'suffix',suffix:'suffix',exp:'expression',expression:'expression'};
function posCodes(item){let v=item.pos??item.part_of_speech??item.partOfSpeech??[];return Array.isArray(v)?v:(typeof v==='string'?[v]:[])}
function posGroups(item){let found=new Set();posCodes(item).forEach(code=>{let k=String(code).toLowerCase().replace(/\s+/g,'-');let group=POS_MAP[k];if(!group&&/^v(1|2|4|5|s|k|z)/.test(k))group='verb';if(group)found.add(group)});return found.size?[...found]:['unclassified']}
function posTitle(group){const p=POS_GROUPS.find(x=>x[0]===group);return p?`${p[1]} · ${p[2]}`:group}
function filteredItems(type){return type==='vocab'&&app.vocabCategory!=='all'?app.data.vocab.filter(x=>posGroups(x).includes(app.vocabCategory)):app.data[type]}
function nowTokyo(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
try{app.dailyProgress=JSON.parse(localStorage.getItem(DAILY_STORE)||'{}')||{}}catch(e){app.dailyProgress={}}
let translationCache={};try{translationCache=JSON.parse(localStorage.getItem(TRANS_STORE)||'{}')||{}}catch(e){}
function trLink(text,to='ne',from='en'){return 'https://translate.google.com/?sl='+encodeURIComponent(from)+'&tl='+encodeURIComponent(to)+'&text='+encodeURIComponent(String(text).slice(0,2500))+'&op=translate'}
async function translateText(text,to,from='en'){
 text=String(text||'').trim();if(!text)return'';if(to===from)return text;
 const cacheKey=from+'|'+to+'|'+text;if(translationCache[cacheKey])return translationCache[cacheKey];
 // MyMemory public translation is limited and requires internet. Never pass untranslated gloss as translated text.
 if(text.length>430)text=text.slice(0,430);
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),7000);
 try{let r=await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+encodeURIComponent(from+'|'+to),{signal:ctl.signal});if(!r.ok)throw Error('offline');let data=await r.json();let t=String(data?.responseData?.translatedText||'').trim();if(!t||/^(QUERY LENGTH LIMIT|MYMEMORY WARNING|INVALID LANGUAGE)/i.test(t)||t.toLowerCase()===text.toLowerCase()&&to!=='ja')throw Error('not translated');translationCache[cacheKey]=t;
 if(Object.keys(translationCache).length>280)translationCache=Object.fromEntries(Object.entries(translationCache).slice(-200));
 try{localStorage.setItem(TRANS_STORE,JSON.stringify(translationCache))}catch(e){}return t;
 }finally{clearTimeout(timer)}
}
function furiganaMarked(source){return String(source||'').replace(/\{([^{}|]+)\|([^{}|]+)\}/g,(_m,k,r)=>app.showFurigana?`<ruby>${esc(k)}<rt>${esc(r)}</rt></ruby>`:esc(k)).split(/(\{[^{}]+\})/).map(part=>part.startsWith('{')?esc(part):part).join('')}
function rubyWord(word,reading){word=String(word||'');reading=String(reading||'');return app.showFurigana&&reading&&/[\u3400-\u9fff]/.test(word)?`<ruby>${esc(word)}<rt>${esc(reading)}</rt></ruby>`:esc(word)}
function sentenceHtml(ex){return ex?.furigana?furiganaMarked(ex.furigana):esc(ex?.ja||'')}
function tripleDetails(item,type){
 let jp,ne,en=glossFor(item,type),notes='';
 if(type==='kanji'){jp=`${item.character}：音読み ${arr(item.onyomi).join('・')||'記載なし'}、訓読み ${arr(item.kunyomi).join('・')||'記載なし'}。部首 ${item.radical||'不明'}、${item.strokes||'不明'}画。語例：${arr(item.words).slice(0,5).join('、')||'記載なし'}。`;ne=`यो कान्जीको ओनयोमि ${arr(item.onyomi).join('、')||'उपलब्ध छैन'} र कुनयोमि ${arr(item.kunyomi).join('、')||'उपलब्ध छैन'} हो। ${item.strokes??'अज्ञात'} स्ट्रोक हुन्छ।`}
 else if(type==='grammar'){jp=`文型「${item.pattern}」。接続：${item.formation||'資料に記載なし'}。例文を読み、接続・文脈・ニュアンスを確認してください。`;ne=`「${item.pattern}」 N3 व्याकरण हो। Formation र उदाहरणका वाक्यहरू तुलना गरी प्रयोग बुझ्नुहोस्।`;notes=item.notes||''}
 else{jp=`「${item.word}」の読みは「${item.reading||'記載なし'}」。品詞：${posGroups(item).map(k=>POS_GROUPS.find(x=>x[0]===k)?.[1]||k).join('・')}。`;ne=`「${item.word}」 को पढाइ 「${item.reading||'उपलब्ध छैन'}」 हो। शब्दवर्ग: ${posGroups(item).map(k=>POS_GROUPS.find(x=>x[0]===k)?.[2]||k).join(' / ')}।`}
 const code=type+'_'+app.data[type].indexOf(item);
 return `<div class="triple-detail" id="three_${code}"><div><b>🇯🇵 日本語（構造・使い方）</b><p>${esc(jp)}</p><p class="meaning-translation" data-lang="ja">日本語の意味・詳細を読み込みたい場合は「3言語の解説を表示」を押してください。</p></div><div><b>🇬🇧 English (source meanings)</b><p>${esc(en)}</p>${notes?`<p>${esc(notes)}</p>`:''}</div><div><b>🇳🇵 नेपाली (व्याख्या)</b><p>${esc(ne)}</p><p class="meaning-translation" data-lang="ne">नेपालीमा वास्तविक अर्थ हेर्न तलको बटन थिच।</p></div></div><button type="button" class="btn tr-button" data-triple="${code}">🌐 3言語の詳しい意味 / Full meaning / नेपाली अर्थ</button>`
}
async function translateCard(button){
 let [type,index]=button.dataset.triple.split('_'),item=app.data[type][Number(index)],div=$('three_'+button.dataset.triple);if(!div||!item)return;button.disabled=true;button.textContent='🌐 Translating…';let raw=glossFor(item,type)+(type==='grammar'&&item.notes?' — '+item.notes:'');
 await Promise.all(['ja','ne'].map(async lang=>{let el=div.querySelector(`[data-lang="${lang}"]`);try{let result=await translateText(raw,lang,'en');el.textContent=result+' (machine translation; verify with examples)'}catch(e){el.innerHTML=`⚠️ Online translation unavailable. <a href="${esc(trLink(raw,lang))}" target="_blank" rel="noopener">Google Translate ↗</a>`}}));
 button.disabled=false;button.textContent='↻ Refresh translation';
}
const key=(type,item)=>type+':'+(item.id||item.character||item.word);
const done=(type,item)=>Boolean(app.progress[key(type,item)]);
function toggleDone(type,index){let item=app.data[type][index];if(!item)return;let k=key(type,item);if(app.progress[k])delete app.progress[k];else app.progress[k]=true;saveProgress();refreshView()}
function usedCount(type,items){return items.reduce((sum,i)=>sum+(done(type,i)?1:0),0)}
const sourceUrl=type=>`https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/${type}/n3.json`;
const mirrorUrl=type=>`https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json/${type}/n3.json`;
async function fetchJson(url){
 const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),30000);
 try{const res=await fetch(url,{signal:abort.signal});if(!res.ok)throw new Error('HTTP '+res.status);let raw=await res.json();if(!Array.isArray(raw)||raw.length<50)throw new Error('Unexpected dataset');return raw}
 finally{clearTimeout(timeout)}
}
async function fetchType(type){
 const urls=[`${ROOT}data/${type}.json`,sourceUrl(type),mirrorUrl(type)];let error;
 for(let idx=0;idx<urls.length;idx++){
   const url=urls[idx];
   try{
    if(idx>0&&('caches' in window)){
      let c=await caches.open('nextstep-n3-data-v1');let hit=await c.match(url);
      if(hit){let obj=await hit.json();if(Array.isArray(obj)&&obj.length>50)return obj}
    }
    let data=await fetchJson(url);
    if(idx>0&&('caches' in window)){
     try{let c=await caches.open('nextstep-n3-data-v1');await c.put(url,new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}}))}catch(e){}
    }
    return data;
   }catch(e){error=e}
 }
 throw new Error(`${type}: ${String(error?.message||'data unavailable')}`)
}
async function load(){
 $('stateBox').hidden=false;$('studyView').hidden=true;
 $('stateBox').innerHTML='📚 Loading N3 Japanese study data… <small>पहिलो पटक इन्टरनेट चाहिन्छ।</small>';
 try{
  const [kanji,grammar,vocab]=await Promise.all(TYPES.map(fetchType));
  if(kanji.length<387||grammar.length<101||vocab.length<50)throw new Error('Level-specific source data is incomplete.');
  app.data.kanji=kanji.slice(0,CONFIG.kanji.max);
  app.data.grammar=grammar.slice(0,CONFIG.grammar.max);
  app.data.vocab=vocab.slice(0,CONFIG.vocab.max);
  if(app.data.vocab.some(v=>String(v.level||'').toUpperCase()!=="N3"))throw new Error('Vocabulary data belongs to a different JLPT level.');
  app.loaded=true;
  $('statKanji').textContent=fmt(app.data.kanji.length);$('statGrammar').textContent=fmt(app.data.grammar.length);$('statVocab').textContent=fmt(app.data.vocab.length);
  $('networkBadge').textContent='● N3 data ready';$('stateBox').hidden=true;$('studyView').hidden=false;
  const target=new URLSearchParams(location.search).get('section');
  chooseSection(['kanji','vocab','grammar'].includes(target)?target:'kanji');
 }catch(e){
  console.error(e);$('networkBadge').textContent='Offline: first download needed';
  $('stateBox').classList.add('error');
  $('stateBox').innerHTML=`<strong>Data could not load.</strong><p>${esc(e.message)}</p><p>इन्टरनेट जाँच गर। GitHub Pages मा वेबसाइट खोल। पहिलो पटक data डाउनलोड भएपछि browser cache मा सुरक्षित हुन सक्छ।</p><p>💡 Windows मा <code>Download_N3_Data.ps1</code> चलाएर JSON फाइलहरू राख्न पनि मिल्छ।</p><button type="button" class="btn btn-primary" id="retryLoad">↻ Try again</button>`;
  $('retryLoad').addEventListener('click',()=>{ $('stateBox').classList.remove('error');load() });
 }
}
function chapters(type){let cfg=CONFIG[type];return Math.ceil(filteredItems(type).length/cfg.size)}
function chunk(type,index){const cfg=CONFIG[type];return filteredItems(type).slice(index*cfg.size,(index+1)*cfg.size)}
function chapterTitle(type,index){const cfg=CONFIG[type], start=index*cfg.size+1,end=Math.min((index+1)*cfg.size,filteredItems(type).length);return `${cfg.title} Lesson ${String(index+1).padStart(2,'0')} · ${start}-${end}`}
function chooseSection(type){
 app.section=type;app.chapter=0;app.showingResults=false;$('searchBox').value='';
 $('vocabFilterLabel').hidden=(type!=='vocab');$('vocabCategory').hidden=(type!=='vocab');
 document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.section===type));
 $('studyView').hidden=false;
 refreshNav();refreshView();
}
function refreshNav(){
 const type=app.section;
 if(!TYPES.includes(type)){$('lessonCount').textContent='';$('lessonNav').innerHTML='';$('searchBox').disabled=true;$('printChapter').hidden=true;$('openQuiz').hidden=true;return}
 $('searchBox').disabled=false;$('printChapter').hidden=false;$('openQuiz').hidden=false;
 $('lessonCount').textContent=chapters(type)+' lessons';
 $('lessonNav').innerHTML=Array.from({length:chapters(type)},(_,i)=>{
 const es=chunk(type,i);let n=usedCount(type,es);
 return `<button class="lesson-btn ${i===app.chapter?'active':''}" data-lesson="${i}" type="button"><span>Lesson ${String(i+1).padStart(2,'0')}</span><small>${n}/${es.length} ✓</small></button>`
 }).join('');
}
function glossFor(item,type){return meanings(item,type)||'No English gloss supplied';}
function extractWordsForKanji(item){return arr(item.words).slice(0,9)}
function exampleHTML(example){if(!example)return'';return `<div class="example"><div class="ja" lang="ja">${sentenceHtml(example)}</div>${example.en?`<div class="en">${esc(example.en)}</div>`:''}</div>`}
function cardActions(type,item,index){
 let id=type+'_'+index;let txt=type==='grammar'?`${item.pattern}. ${item.meaning}. ${item.notes||''}`:`${valOf(item,type)}. ${glossFor(item,type)}`;
 return `<div class="card-actions"><button type="button" data-done="${type}:${index}" class="${done(type,item)?'done':''}">${done(type,item)?'✓ Studied':'○ Mark studied'}</button><button type="button" data-translate="${id}" data-text="${esc(txt)}">🌐 Translate / नेपाली</button><button type="button" data-singlepdf="${type}:${index}">⬇ Item PDF</button><button type="button" data-speak="${esc(valOf(item,type))}">🔊 Listen</button></div><div class="translated" id="translation_${id.replace(/[^a-zA-Z0-9]/g,'_')}" hidden></div>`
}
function kanjiCard(item,index){
 const on=arr(item.onyomi).slice(0,5).join('、')||'—',kun=arr(item.kunyomi).slice(0,5).join('、')||'—';
 const words=extractWordsForKanji(item).map(w=>`<button type="button" class="kanji-chip" data-kanji-open="${esc(item.character)}" data-kanji-word="${esc(w)}" lang="ja" title="Open reading, meaning and examples for ${esc(w)}">${esc(w)} ↗</button>`).join('');
 return `<article class="card"><div class="badge">漢字 #${index+1} • N3</div><div class="headline"><button type="button" class="bigkanji kanji-main-link" data-kanji-open="${esc(item.character)}" aria-label="Open all available compound words for ${esc(item.character)}" title="熟語・関連語を見る" lang="ja">${esc(item.character)}</button><div class="card-info"><h3>${esc(arr(item.meanings)[0]||'—')}</h3><div class="field"><b>音読み:</b> ${esc(on)}</div><div class="field"><b>訓読み:</b> ${esc(kun)}</div></div></div><div class="meaning"><b>English meaning:</b> ${esc(glossFor(item,'kanji'))}</div><div class="field"><b>部首 / Radical:</b> ${esc(item.radical||'—')} • <b>画数 / Strokes:</b> ${esc(item.strokes??'—')}</div><div class="field"><b>熟語・関連語 / Click each word:</b> <span class="small">漢字 थिचेर यसबाट बनेका शब्द, पढाइ, अर्थ र उदाहरण खोल।</span></div><div class="wordchips">${words||'<span>—</span>'}</div>${tripleDetails(item,'kanji')}${cardActions('kanji',item,index)}</article>`
}
function grammarCard(item,index){
 const examples=arr(item.examples).slice(0,3).map(exampleHTML).join('');
 return `<article class="card"><div class="badge">文法 #${index+1} • N3</div><h3 lang="ja">${esc(item.pattern)}</h3><div class="small">${esc(item.romaji||item.reading||'')}</div><div class="meaning"><b>English meaning:</b> ${esc(glossFor(item,'grammar'))}</div><div class="field"><b>接続 / Formation:</b> ${esc(item.formation||'—')}</div><div class="field"><b>例文 / Examples:</b></div>${examples||'<p class="small">Source example unavailable.</p>'}${arr(item.tags).length?`<div class="wordchips">${item.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}${tripleDetails(item,'grammar')}${cardActions('grammar',item,index)}</article>`
}
function vocabCard(item,index){let examples=arr(item.examples).slice(0,3).map(exampleHTML).join('');let roles=posGroups(item).map(posTitle).join(' / ');return `<article class="card"><div class="badge">語彙 #${index+1} • N3</div><h3 lang="ja">${rubyWord(item.word,item.reading)}</h3><div class="field"><b>読み方:</b> ${esc(item.reading||'—')} <span class="small">${esc(item.romaji||'')}</span></div><div class="meaning"><b>English meaning:</b> ${esc(glossFor(item,'vocab'))}</div><div class="field"><b>品詞 / Word class:</b> ${esc(roles)} (${esc(posCodes(item).join(', ')||'not in source')})</div><div class="field"><b>例文 / Examples:</b></div>${examples||'<p class="small">Example unavailable in source.</p>'}${tripleDetails(item,'vocab')}${cardActions('vocab',item,index)}</article>`}

function cardsHTML(type,items){return `<div class="cards">${items.map(item=>{let index=app.data[type].indexOf(item);return type==='kanji'?kanjiCard(item,index):type==='grammar'?grammarCard(item,index):vocabCard(item,index)}).join('')}</div>`}
function refreshView(){
 const type=app.section;
 if(type==='grammarcards'){return}
 if(type==='daily'){renderDaily();return}
 if(type==='guide'){renderGuide();return}
 if(type==='quiz'){renderQuizDashboard();return}
 let selected=chunk(type,app.chapter);
 const q=$('searchBox').value.trim().toLowerCase();
 if(q){let hit=filteredItems(type).filter(x=>[valOf(x,type),glossFor(x,type),x.reading,x.romaji,x.formation,arr(x.onyomi).join(' '),arr(x.kunyomi).join(' ')].some(v=>String(v||'').toLowerCase().includes(q)));selected=hit.slice(0,50);$('chapterSummary').textContent=`${hit.length} results${hit.length>50?' (first 50 shown)':''}`}
 else{$('chapterSummary').textContent=`${chapterTitle(type,app.chapter)} · ${usedCount(type,selected)}/${selected.length} studied`}
 $('itemsView').innerHTML=`<div class="section-title"><div><h2>${q?'Search Results':chapterTitle(type,app.chapter)}</h2><p>${type==='kanji'?'Readings • meanings • compounds • practice':type==='grammar'?'Patterns • formation • 2–3 examples • usage notes':'Reading • English meanings • example sentences'} · ${selected.length} entries</p></div></div>${selected.length?cardsHTML(type,selected):'<div class="empty">No entries found. अर्को शब्द Search गर।</div>'}`;
 const count=chapters(type),prev=Math.max(0,app.chapter-1),next=Math.min(count-1,app.chapter+1);
 $('bottomNav').innerHTML=`<button class="btn" type="button" data-navto="${prev}" ${app.chapter===0?'disabled':''}>← Previous</button><span class="small">${app.chapter+1} / ${count}</span><button class="btn" type="button" data-navto="${next}" ${app.chapter===count-1?'disabled':''}>Next →</button><button class="btn btn-warm" type="button" data-quiz="${type}:${app.chapter}">📝 50 Questions</button>`;
 refreshNav();
}
function randOrder(a,seed){let out=[...a];let x=(seed>>>0)||1234567;for(let i=out.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;let j=(x>>>0)%(i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
function makeQuestion(type,item,serial,variant,sourceOverride){
 const all=(sourceOverride&&sourceOverride.length>3)?sourceOverride:app.data[type],options=[];
 if(!all?.length)return null;
 const v=type==='kanji'?variant%3:type==='grammar'?variant%2:variant%3;
 let mode,prompt,target,field;
 if(type==='kanji'){
  if(v===0||v===2){mode='reading';field=x=>first(arr(x.onyomi).length?x.onyomi:x.kunyomi);target=field(item);prompt=`「${item.character}」の読み方として正しいものを一つ選びなさい。`}
  else {mode='strokes';field=x=>x.strokes==null?'':`${x.strokes}画`;target=field(item);prompt=`漢字「${item.character}」の総画数はどれですか。`}
 }else if(type==='grammar'){
  let examples=arr(item.examples).filter(e=>e?.ja);
  if(!examples.length)return null;
  if(v===0){mode='grammar-pattern';field=x=>x.pattern;target=field(item);prompt=`次の例文で使われている文型はどれですか。\n「${examples[serial%examples.length].ja}」`}
  else{mode='grammar-example';field=x=>first(x.examples)?.ja||'';target=field(item);prompt=`文型「${item.pattern}」の例文として、資料に載っている文を選びなさい。`}
 }else{
  if(v===0||v===2){mode='vocab-reading';field=x=>x.reading||'';target=field(item);prompt=`「${item.word}」の読み方はどれですか。`}
  else{mode='vocab-spelling';field=x=>x.word||'';target=field(item);prompt=`「${item.reading||item.word}」と読む語はどれですか。`}
 }
 if(!target)return null;
 options.push({text:String(target),item,correct:true});
 // Distinct display values only. Never replace a Japanese answer with an English gloss.
 let indexes=randOrder(Array.from({length:all.length},(_,i)=>i),serial*13+variant*109+21);
 for(const idx of indexes){let other=all[idx],c=String(field(other)||'');if(c&&c!==String(target)&&!(mode==='reading'&&[...arr(item.onyomi),...arr(item.kunyomi)].includes(c))&&!options.some(o=>o.text===c)){options.push({text:c,item:other,correct:false});if(options.length>=4)break}}
 if(options.length!==4)return null;
 let mixed=randOrder(options,serial*29+variant*73+5);
 return {id:serial,type,item,mode,stem:prompt,choices:mixed.map(x=>x.text),options:mixed,answer:String(target)};
}
function buildQ(type,item,serial,variant){return makeQuestion(type,item,serial,variant)}
function makeQuestions(type,lesson,count=50){let source=chunk(type,lesson),out=[];if(!source.length)return out;for(let i=0;i<count;i++){let item=source[i%source.length];let variant=Math.floor(i/source.length);let q=makeQuestion(type,item,i+lesson*1133,variant);if(q)out.push(q)}return out}
function explanation(q,o){
 let item=o.item,pass=o.correct,label=o.text;
 let jp,en,ne,meaning=glossFor(item,q.type),more='';
 if(q.mode==='reading'){
  jp=`${pass?'正解です。':'違います。'}「${item.character}」には、音読み「${arr(item.onyomi).join('・')||'—'}」、訓読み「${arr(item.kunyomi).join('・')||'—'}」が記録されています。選択肢「${label}」は${pass?'この漢字に対応します':'別の漢字「'+item.character+'」の読みです'}。`;
  en=`${pass?'Correct':'Incorrect'} for 「${q.item.character}」. 「${item.character}」: on-yomi ${arr(item.onyomi).join(', ')||'—'}, kun-yomi ${arr(item.kunyomi).join(', ')||'—'}. Meaning: ${meaning}.`;
  ne=`${pass?'सही उत्तर।':'गलत विकल्प।'} 「${item.character}」 को ओनयोमि ${arr(item.onyomi).join('・')||'—'} र कुनयोमि ${arr(item.kunyomi).join('・')||'—'} हो। यो विकल्प ${pass?'लक्षित कान्जीसँग मिल्छ।':'अर्को कान्जीको पढाइ हो।'}`;
 }else if(q.mode==='strokes'){
  jp=`${pass?'正解':'不正解'}。「${item.character}」は${item.strokes??'不明'}画です。${pass?'問われている漢字です。':'対象の「'+q.item.character+'」とは異なります。'}`;
  en=`${pass?'Correct':'Incorrect'}. 「${item.character}」 has ${item.strokes??'unknown'} strokes. Meaning: ${meaning}. Compare with target 「${q.item.character}」.`;
  ne=`${pass?'सही।':'गलत।'} 「${item.character}」 मा ${item.strokes??'अज्ञात'} स्ट्रोक छन्। लक्षित कान्जी 「${q.item.character}」 सँग तुलना गर।`;
 }else if(q.mode==='grammar-pattern'){
  jp=`${pass?'正解':'不正解'}。文型「${item.pattern}」の例文と用法を確認してください。接続：${item.formation||'記載なし'}。${pass?'提示した文の出典上の文型と一致します。':'この文型は別の項目に属します。'}`;
  en=`${pass?'Correct':'Incorrect'}. Pattern 「${item.pattern}」. Meaning: ${meaning}. Formation: ${item.formation||'not specified'}. ${item.notes||''}`;
  ne=`${pass?'सही व्याकरण।':'यो अर्को व्याकरण हो।'} 「${item.pattern}」 को बनावट ${item.formation||'स्रोतमा छैन'} हो। उदाहरणको सन्दर्भसँग तुलना गर।`;
 }else if(q.mode==='grammar-example'){
  jp=`${pass?'正解':'不正解'}。この例文は文型「${item.pattern}」の資料中の例です。${pass?'指定した文型に一致します。':'指定した文型「'+q.item.pattern+'」の例とは異なります。'} 接続：${item.formation||'記載なし'}。`;
  en=`${pass?'Correct':'Incorrect'}. This sentence is a source example of 「${item.pattern}」 (meaning: ${meaning}; formation: ${item.formation||'—'}).`;
  ne=`${pass?'यो सही उदाहरण हो।':'यो फरक व्याकरणको उदाहरण हो।'} 「${item.pattern}」 को स्रोतमा रहेको उदाहरण हो। बनावट: ${item.formation||'उपलब्ध छैन'}।`;
 }else if(q.mode==='vocab-reading'){
  jp=`${pass?'正解':'不正解'}。「${item.word}」は「${item.reading||'読み不明'}」と読みます。品詞：${posGroups(item).map(k=>POS_GROUPS.find(x=>x[0]===k)?.[1]).join('・')}。${pass?'問題の語の読みです。':'別の語「'+item.word+'」の読みです。'}`;
  en=`${pass?'Correct':'Incorrect'} for 「${q.item.word}」. 「${item.word}」 is read 「${item.reading||'—'}」. Meaning: ${meaning}. Part of speech: ${posCodes(item).join(', ')||'unspecified'}.`;
  ne=`${pass?'सही पढाइ।':'गलत पढाइ।'} 「${item.word}」 लाई 「${item.reading||'—'}」 पढिन्छ। शब्दवर्ग: ${posGroups(item).map(k=>POS_GROUPS.find(x=>x[0]===k)?.[2]).join('/')}।`;
 }else{
  jp=`${pass?'正解':'不正解'}。「${item.word}」の読みは「${item.reading||'不明'}」です。${pass?'問題の読み方と一致します。':'別の語です。'}`;
  en=`${pass?'Correct':'Incorrect'}. 「${item.word}」: reading ${item.reading||'—'}; meanings: ${meaning}; POS: ${posCodes(item).join(', ')||'unspecified'}.`;
  ne=`${pass?'सही शब्द।':'फरक शब्द।'} 「${item.word}」 को पढाइ 「${item.reading||'—'}」 हो। शब्दवर्ग: ${posGroups(item).map(k=>POS_GROUPS.find(x=>x[0]===k)?.[2]).join('/')}।`;
 }
 return {jp,en,ne,meaning};
}
function feedbackHTML(q,selected){
 let good=q.answer===selected;
 return `<div class="grade-banner ${good?'correct':'incorrect'}"><b>${good?'✅ 正解 · Correct · सही':'❌ 不正解 · Incorrect · गलत'}</b> <span>正解：${esc(q.answer)}</span></div><div class="option-explain">${q.options.map((o,i)=>{let info=explanation(q,o);return `<section class="option-detail ${o.correct?'is-correct':''}"><h4>${'ABCD'[i]}. ${esc(o.text)} — ${o.correct?'✅ 正解':'❌ 不正解'}</h4><p><b>🇯🇵 日本語：</b>${esc(info.jp)} <span class="option-ja" data-meaning="${esc(info.meaning)}"></span></p><p><b>🇬🇧 English:</b> ${esc(info.en)}</p><p><b>🇳🇵 नेपाली:</b> ${esc(info.ne)} <span class="option-ne" data-meaning="${esc(info.meaning)}"></span></p></section>`}).join('')}</div><p class="small">🇳🇵 अर्थको पूर्ण अनुवाद इन्टरनेटमार्फत लोड हुन्छ; अनुवाद नआए Google Translate प्रयोग गर्न सकिन्छ। स्रोतका English अर्थ र जापानी Reading जाँचेर अभ्यास गर्नुहोस्।</p>`
}
async function enrichAnswer(box,q){
 if(!box?.isConnected)return;
 // Request only one translation per distinct option, reuse cached values in later chapters.
 for(const node of box.querySelectorAll('.option-ja,.option-ne')){
  let text=node.dataset.meaning,lang=node.classList.contains('option-ja')?'ja':'ne'; if(!text||!box.isConnected)continue;
  try{const translated=await translateText(text,lang);if(box.isConnected)node.textContent=(lang==='ja'?'意味（機械翻訳）：':'अर्थ (मेसिन अनुवाद): ')+translated}
  catch(e){if(box.isConnected)node.innerHTML=`<a target="_blank" rel="noopener" href="${esc(trLink(text,lang))}">${lang==='ja'?'意味を日本語に翻訳 ↗':'नेपाली अर्थ ↗'}</a>`}
 }
}
function showQuiz(type,lesson){
 app.section='quiz';app.quizSection=type;app.quizChapter=lesson;app.quiz=makeQuestions(type,lesson,50);app.showingResults=false;
 document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.section==='quiz'));
 refreshNav();renderQuiz();window.scrollTo({top:0,behavior:'smooth'});
}
function renderQuiz(){
 $('chapterSummary').textContent=`${app.quiz.length} 問 • ${chapterTitle(app.quizSection,app.quizChapter)}`;$('bottomNav').innerHTML='';
 $('itemsView').innerHTML=`<div class="quiz-shell"><h2>📝 ${esc(chapterTitle(app.quizSection,app.quizChapter))} — 日本語の問題</h2><p class="notice">問題文・選択肢・正解は日本語です。答えを選ぶと、正誤と四つの選択肢の日本語・英語・ネパール語の解説を表示します。非公式・自作の練習問題です。</p><div class="controlrow"><button type="button" class="btn btn-primary" id="printPaper">⬇ 問題と詳しい解説をPDF保存</button><button type="button" class="btn" id="returnStudy">← レッスンへ</button></div><div id="quizQuestions">${app.quiz.map((q,i)=>`<section class="quiz-question" data-qindex="${i}"><h3>${i+1}. ${esc(q.stem)}</h3><div class="quiz-options">${q.options.map((o,j)=>`<label class="quiz-option"><input type="radio" name="q${i}" value="${j}"/><span>${'ABCD'[j]}. ${esc(o.text)}</span></label>`).join('')}</div><div class="quiz-feedback" id="feedback${i}" aria-live="polite"></div></section>`).join('')}</div><div class="controlrow"><button class="btn btn-primary" id="gradeAll">✅ 結果を見る / Score</button><span class="small" id="liveScore">0 / ${app.quiz.length} answered</span></div><div id="gradeResult" aria-live="polite"></div></div>`;
 $('printPaper').addEventListener('click',()=>printChapter(app.quizSection,app.quizChapter,'paper'));
 $('returnStudy').addEventListener('click',()=>chooseSection(app.quizSection));
 const answers=new Map();
 $('quizQuestions').addEventListener('change',e=>{let input=e.target.closest('input[type="radio"]');if(!input)return;let section=input.closest('[data-qindex]'),idx=Number(section.dataset.qindex),q=app.quiz[idx],j=Number(input.value);answers.set(idx,j);section.querySelectorAll('.quiz-option').forEach((label,k)=>label.classList.toggle('chosen',k===j));let feedback=$('feedback'+idx);feedback.innerHTML=feedbackHTML(q,q.options[j].text);enrichAnswer(feedback,q);$('liveScore').textContent=answers.size+' / '+app.quiz.length+' answered'});
 $('gradeAll').addEventListener('click',()=>{let score=0;app.quiz.forEach((q,i)=>{if(answers.has(i)&&q.options[answers.get(i)].correct)score++});$('gradeResult').innerHTML=`<h2>結果：${score}/${app.quiz.length}（${app.quiz.length?Math.round(100*score/app.quiz.length):0}%）</h2><p>${answers.size} 問解答済み。各設問の解説をご確認ください。 / ${answers.size} answered. Review every option above.</p>`;$('gradeResult').scrollIntoView({block:'center',behavior:'smooth'})});
}

function renderQuizDashboard(){
 $('chapterSummary').textContent='Select a chapter to generate an original 50-question paper';
 $('bottomNav').innerHTML='';
 $('itemsView').innerHTML=`<div class="guide"><section><h2>📝 JLPT N3 Practice Papers</h2><p>प्रत्येक Kanji, Grammar र Vocabulary Lesson मा <b>50 अभ्यास प्रश्न</b> छन्। प्रश्न र 4 विकल्प जापानीमा छन्। कुनै विकल्प छान्नेबित्तिकै सही/गलत अनि <b>चारै विकल्पको Japanese, English र नेपाली व्याख्या</b> देखिन्छ। English स्रोतको अर्थ जापानी र नेपालीमा मेसिन अनुवाद गर्न इन्टरनेट चाहिन्छ।</p><p><b>Grammar note:</b> The N3 source contains <b>123 distinct N3 patterns</b>, not 500 official grammar points. The book includes <b>500 N3 grammar practice cards/questions</b> derived from those patterns. It does not invent 377 extra grammar patterns.</p></section>${TYPES.map(type=>`<section><h2>${CONFIG[type].title} • ${chapters(type)} chapter papers</h2><div class="wordchips">${Array.from({length:chapters(type)},(_,i)=>`<button class="btn" type="button" data-quiz="${type}:${i}">Lesson ${i+1} — 50 Q</button>`).join('')}</div></section>`).join('')}<section><h2>🎓 500 N3 Grammar Study Cards</h2><p>123 source-based N3 grammar patterns become 500 original review and multiple-choice exercises (meaning, construction, recognition, examples and usage notes). These are practice cards, not 500 separate N3 grammar structures.</p><button type="button" class="btn btn-primary" id="grammar500">Open 500 Grammar Cards</button></section><section><h2>📗 N3 full-book N3 printable book</h2><p>Click to compose exactly <b>full-book printable study pages</b>: Kanji, Grammar and Vocabulary sheets. Then choose <b>Save as PDF</b> in the browser print dialog. For speed, printing a single chapter is recommended.</p><button type="button" class="btn btn-primary" id="printFullBook">⬇ Create N3 full-book PDF / Print</button></section></div>`;
 $('printFullBook').addEventListener('click',printFullBook);$('grammar500').addEventListener('click',()=>renderGrammarCards(0))
}
function renderGrammarCards(page=0){
 app.section='grammarcards';const all=app.data.grammar;
 const questions=Array.from({length:500},(_,i)=>makeQuestion('grammar',all[i%all.length],i+22000,Math.floor(i/all.length))).filter(Boolean);
 const size=25,start=page*size,part=questions.slice(start,start+size);
 $('chapterSummary').textContent=`文法 • 500枚の復習カード • ${start+1}–${start+part.length}`;
 $('bottomNav').innerHTML=`<button type="button" class="btn" id="cardsPrev" ${page===0?'disabled':''}>← 前の25枚</button><span class="small">Page ${page+1}/${Math.ceil(questions.length/25)}</span><button type="button" class="btn" id="cardsNext" ${start+size>=questions.length?'disabled':''}>次の25枚 →</button><button type="button" class="btn" id="cardsReturn">← 問題一覧</button>`;
 $('itemsView').innerHTML=`<div class="quiz-shell"><h2>🎓 N3 文法 • 500練習カード</h2><p class="notice">出典の文型123種類から作成した500問です。各選択肢の説明は日本語・英語・ネパール語で確認できます。</p>${part.map((q,i)=>`<section class="quiz-question"><h3>Card ${start+i+1}. ${esc(q.stem)}</h3><div class="quiz-options">${q.options.map((o,j)=>`<div class="quiz-option">${'ABCD'[j]}. ${esc(o.text)}</div>`).join('')}</div><details><summary>正解と四択の解説 / Explain all options</summary>${feedbackHTML(q,q.answer)}</details></section>`).join('')}</div>`;
 $('cardsPrev').addEventListener('click',()=>{renderGrammarCards(page-1);window.scrollTo(0,0)});
 $('cardsNext').addEventListener('click',()=>{renderGrammarCards(page+1);window.scrollTo(0,0)});
 $('cardsReturn').addEventListener('click',()=>chooseSection('quiz'));
}
function dailySelection(){let day=nowTokyo(),seed=day.split('-').join('')*1,selection=[];
 for(const type of ['kanji','vocab']){let data=app.data[type];if(!data.length)continue;let shuffled=randOrder(Array.from({length:data.length},(_,i)=>i),seed+(type==='kanji'?1:9876));shuffled.slice(0,5).forEach(index=>selection.push({type,index,item:data[index],id:day+':'+type+':'+index}))}return selection
}
function renderDaily(){app.section='daily';document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.section==='daily'));refreshNav();$('chapterSummary').textContent='東京時間：'+nowTokyo();$('bottomNav').innerHTML='';
 let tasks=dailySelection(),day=nowTokyo(),doneCount=tasks.filter(x=>app.dailyProgress[x.id]).length;
 $('itemsView').innerHTML=`<div class="quiz-shell"><h2>📅 今日のチャレンジ / Daily Challenge / दैनिक चुनौती</h2><p class="notice">${esc(day)}（Japan Time） • 漢字 5枚 + 語彙 5枚 · 完了 ${doneCount}/${tasks.length} · Save to this browser. रोज नयाँ कार्ड आउँछ।</p><div class="daily-grid">${tasks.map(x=>{let title=x.type==='kanji'?x.item.character:x.item.word,reading=x.type==='kanji'?[...arr(x.item.onyomi),...arr(x.item.kunyomi)].join('・'):x.item.reading,show=app.dailyReveal[x.id];return `<article class="daily-flash"><div class="badge">${x.type==='kanji'?'漢字':'語彙'} • N3</div><div class="daily-main" lang="ja">${esc(title)}</div>${show?`<div class="daily-answer"><p>読み方：${esc(reading||'—')}</p><p><b>English:</b> ${esc(glossFor(x.item,x.type))}</p><p><b>नेपाली:</b> ${x.type==='kanji'?'ओनयोमि / कुनयोमि':'शब्दको पढाइ'}: ${esc(reading||'—')}। <a target="_blank" rel="noopener" href="${esc(trLink(glossFor(x.item,x.type),'ne'))}">अर्थ अनुवाद ↗</a></p><p><b>日本語:</b> ${esc(x.type==='kanji'?`「${title}」の音読み・訓読みと意味を復習してください。`:`「${title}」は「${reading}」と読みます。`)}</p></div>`:`<p>答えを考えてからカードをめくりましょう。</p>`}<div class="controlrow"><button type="button" class="btn" data-daily-reveal="${esc(x.id)}">${show?'隠す / Hide':'👁 答えを見る / Reveal'}</button><button type="button" class="btn ${app.dailyProgress[x.id]?'daily-complete':''}" data-daily-done="${esc(x.id)}">${app.dailyProgress[x.id]?'✅ 完了 / Done':'✓ 覚えた / Learned'}</button></div></article>`}).join('')}</div><div class="notice">${doneCount===tasks.length&&tasks.length?'🎉 今日のチャレンジ完了！ भोलि फेरि नयाँ कार्ड आउँछन्।':'10枚のカードを確認して、学習できたら「覚えた」を押してください。'}</div></div>`;
}

function renderGuide(){
 $('chapterSummary').textContent='JLPT N3 · N1-style study guide';$('bottomNav').innerHTML='';
 $('itemsView').innerHTML=`<div class="guide"><section><h2>📘 JLPT N3 Master Book · प्रयोग गर्ने तरिका</h2><p>Kanji, Vocabulary, Grammar अलग-अलग ट्याबबाट पढ्न सकिन्छ। प्रत्येक Level को आफ्नै स्रोत डाटा छ। यो N1 Book जस्तै डिजाइन हो।</p><p>漢字：${app.data.kanji.length} · 語彙：${app.data.vocab.length} · 文法：${app.data.grammar.length}。</p></section><section><h2>🔤 Japanese / नेपाली / English</h2><p>Japanese उदाहरण, reading, English meanings, नेपाली व्याख्या र थप अनुवाद लिंक। <b>Furigana ON/OFF</b> प्रयोग गर्न सकिन्छ। अनलाइन मेशिन अनुवाद गलत हुन सक्छ र इन्टरनेट आवश्यक पर्न सक्छ।</p></section><section><h2>🧠 Practice & Daily Challenge</h2><p>पाठको अन्त्यमा Practice Questions, उत्तरको Feedback र Daily Kanji/Vocabulary Challenge उपलब्ध छन्। प्रश्नहरू मूल अध्ययनका लागि बनाइएका हुन्, आधिकारिक JLPT Paper होइनन्।</p></section><section><h2>📄 PDF</h2><p>Book बाट <b>Save Chapter as PDF</b> थिच। Browser को Print dialog मा <b>Save as PDF</b> छान।</p></section><section><h2>📖 Other Levels</h2><p><a href="../N5/master.html">N5</a> · <a href="../N4/master.html">N4</a> · <a href="../N3/master.html">N3</a> · <a href="../N2/master.html">N2</a> · <a href="../N1/">N1</a></p><p>Licensed third-party study data: OpenJLPT (CC BY-SA 4.0); not an exhaustive official JLPT word list.</p></section></div>`;
 refreshNav();
}
function japaneseSpeak(text){if(!('speechSynthesis' in window)){alert('Speech is not supported on this browser.');return}window.speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=.78;window.speechSynthesis.speak(u)}
function langCode(){let code=$('targetLang').value;if(code!=='custom')return code;let custom=prompt('Enter a Google Translate language code, e.g. ur, ta, ms, tr, it, sw, etc.','ur');return custom&&/^[a-z]{2,3}(-[A-Za-z]+)?$/.test(custom)?custom:'ne'}
async function doTranslate(button){
 const id=button.dataset.translate;const div=$('translation_'+id.replace(/[^a-zA-Z0-9]/g,'_'));if(!div)return;
 const to=langCode();const content=button.dataset.text||'';
 div.hidden=false;
 const url=`https://translate.google.com/?sl=auto&tl=${encodeURIComponent(to)}&text=${encodeURIComponent(shorten(content,1600))}&op=translate`;
 div.innerHTML=`<span class="small">Translating online… </span> <a target="_blank" rel="noopener noreferrer" href="${esc(url)}">🌐 Open in Google Translate</a>`;
 if(to==='en'){div.innerHTML=`<b>English:</b> ${esc(content)}`;return}
 try{
   let text=shorten(content,450);const pair=(/^[\u3040-\u30ff\u3400-\u9faf]/.test(text)?'ja':'en')+'|'+to;
   const endpoint='https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+encodeURIComponent(pair);
   const ac=new AbortController();let timeout=setTimeout(()=>ac.abort(),9000);
   let res;try{res=await fetch(endpoint,{signal:ac.signal})}finally{clearTimeout(timeout)}
   if(!res.ok)throw new Error('translation service offline');let js=await res.json();let translated=js?.responseData?.translatedText;
   if(!translated||/^(QUERY LENGTH LIMIT|MYMEMORY WARNING)/i.test(translated))throw new Error('translation not available');
   div.innerHTML=`<b>${esc(to.toUpperCase())} (machine translation):</b> ${esc(translated)}<br><a target="_blank" rel="noopener noreferrer" href="${esc(url)}">Compare with Google Translate ↗</a>`;
 }catch(e){div.innerHTML=`⚠ Online translation unavailable here. <a target="_blank" rel="noopener noreferrer" href="${esc(url)}">Translate in Google Translate ↗</a>`}
}
function printStart(html){let root=$('printRoot');root.innerHTML=html;root.setAttribute('aria-hidden','false');
 document.body.classList.add('printing');
 // Print includes 1000 separate A4 sheets in the full-book mode. Allow browser layout to settle.
 setTimeout(()=>{window.print()},250);
}
window.addEventListener('afterprint',()=>{let r=$('printRoot');r.innerHTML='';r.setAttribute('aria-hidden','true');document.body.classList.remove('printing')});
const printHeader=(type,num,label)=>`<div class="print-header"><b>NextStep N3 • ${esc(type.toUpperCase())}</b> — ${esc(label)}</div>`;
const printFooter=(p,total)=>`<div class="print-footer">NextStep N3 • Based on OpenJLPT (CC BY-SA 4.0) • Unofficial JLPT preparation <span style="float:right">${p} / ${total}</span></div>`;
const printSheet=(inner,p,total,header)=>`<section class="print-sheet">${printHeader(header,p,header)}${inner}${printFooter(p,total)}</section>`;
function kanjiPrint(item,p,total){let words=extractWordsForKanji(item).map(w=>`<li lang="ja">${esc(w)}</li>`).join('');return printSheet(`<h1>Kanji #${p}: <span lang="ja" class="print-main-kanji">${esc(item.character)}</span></h1><p class="print-gloss"><b>English meanings:</b> ${esc(glossFor(item,'kanji'))}</p><p><b>On'yomi:</b> ${esc(arr(item.onyomi).join('、')||'—')}<br><b>Kun'yomi:</b> ${esc(arr(item.kunyomi).join('、')||'—')}<br><b>Radical / 部首:</b> ${esc(item.radical||'—')} &nbsp; <b>Strokes:</b> ${esc(item.strokes||'—')}</p><p><b>नेपालीमा:</b> कान्जीको English अर्थ र दुवै reading हेर्नुहोस्। शब्दको प्रसङ्गअनुसार सही उच्चारण चुन्नुपर्छ।</p><h3>Example compounds (熟語)</h3><ol class="print-quiz">${words||'<li>No source compounds</li>'}</ol><h3>JLPT-style self-check</h3><p>1. Write an appropriate reading for one of the compounds above.</p><div class="answer-line"></div><p>2. Explain the main meaning of <b>${esc(item.character)}</b> in your own words.</p><div class="answer-line"></div><p class="print-meta">Check readings in actual words; different compounds may use different pronunciations.</p>`,p,total,'N3 Kanji Book')}
function grammarPrint(item,p,total){let examples=arr(item.examples).slice(0,3).map(e=>`<div class="print-example"><div lang="ja">${esc(e.ja)}</div><div style="color:#506779;font-size:10pt">${esc(e.en||'')}</div></div>`).join('');return printSheet(`<h1>Grammar ${p}: <span lang="ja">${esc(item.pattern)}</span></h1><p class="print-gloss"><b>Meaning (English):</b> ${esc(item.meaning)}</p><p><b>Formation / 文型:</b> ${esc(item.formation||'—')}</p><h3>Detailed usage / ニュアンス</h3><p>${esc(item.notes||'Read the context and contrast how the pattern is used in the sample sentences.')}</p><p><b>नेपालीमा:</b> Formation अनुसार प्रयोग मिलाउनुहोस्। तलका उदाहरणमा शब्दको रूप र अर्थको सन्दर्भ जाँच्नुहोस्।</p><h3>Example sentences</h3>${examples}<h3>Self-check</h3><p>Write one original sentence using this N3 pattern.</p><div class="answer-line"></div><p>Explain when this pattern is preferred to a simpler expression.</p><div class="answer-line"></div>`,p,total,'N3 Grammar Book')}
function vocabPrint(items,p,total){let start=items[0]?.word||'—';let content=items.map((v,i)=>`<div class="print-word"><b lang="ja">${esc(v.word)}</b> &nbsp; <span lang="ja">${esc(v.reading||'')}</span><div>${esc(glossFor(v,'vocab'))}</div>${first(v.examples)?`<div class="print-meta" lang="ja">${esc(shorten(first(v.examples).ja,86))}</div>`:''}</div>`).join('');return printSheet(`<h1>N3 Vocabulary • Page ${p-823}</h1><p class="print-meta">Start: ${esc(start)} • Read aloud and use each word in context.</p><div class="print-words">${content}</div><h3>Quick self-test</h3><p>Choose two words above. Write their readings and make one sentence each.</p><div class="answer-line"></div>`,p,total,'N3 Vocabulary Book')}
function paperSheets(type,lesson,offset=1){let qs=makeQuestions(type,lesson,50),pages=[];
 for(let i=0;i<qs.length;i+=10){let part=qs.slice(i,i+10),body=`<h1>${esc(chapterTitle(type,lesson))} • 模擬問題</h1><p class="print-meta">第${i+1}～${i+part.length}問 / ${qs.length}問。正しい答えを一つ選びなさい。</p><ol start="${i+1}" class="print-quiz">${part.map(q=>`<li><b>${esc(q.stem)}</b><div>${q.options.map((a,j)=>`${'ABCD'[j]}. ${esc(a.text)}`).join('<br>')}</div></li>`).join('')}</ol>`;pages.push({body,header:'N3 日本語模擬問題'})}
 qs.forEach((q,i)=>{let body=`<h1>第${i+1}問 • 正解・全選択肢の解説</h1><p><b>${esc(q.stem)}</b></p><p><b>正解：${esc(q.answer)}</b></p>${q.options.map((o,j)=>{let e=explanation(q,o);return `<section class="print-explain"><b>${'ABCD'[j]}. ${esc(o.text)} — ${o.correct?'正解':'不正解'}</b><p>🇯🇵 ${esc(e.jp)}</p><p>🇬🇧 ${esc(e.en)}</p><p>🇳🇵 ${esc(e.ne)}</p></section>`}).join('')}<p class="print-meta">ネパール語の語義翻訳はオンラインの「3言語の解説を表示」をご利用ください。</p>`;pages.push({body,header:'N3 解答解説'} )});
 return pages
}

function printChapter(type,lesson,mode='chapter'){
 if(!app.loaded)return;
 const items=mode==='paper'?[]:chunk(type,lesson);
 const pages=[];
 items.forEach((item,i)=>{
 const index=app.data[type].indexOf(item);
 if(type==='kanji')pages.push({kind:'kanji',item,header:chapterTitle(type,lesson),num:index+1});
 else if(type==='grammar')pages.push({kind:'grammar',item,header:chapterTitle(type,lesson),num:index+1});
 else pages.push({kind:'vocab',items:[item],header:chapterTitle(type,lesson),num:index+1});
 });
 paperSheets(type,lesson).forEach(v=>pages.push({kind:'paper',...v}));
 let html=pages.map((v,i)=>{
  if(v.kind==='kanji')return kanjiPrint(v.item,i+1,pages.length);
  if(v.kind==='grammar')return grammarPrint(v.item,i+1,pages.length);
  if(v.kind==='vocab')return printSheet(`<h1>Word ${v.num}: ${esc(v.items[0].word)}</h1><h2 lang="ja">${esc(v.items[0].reading||'')}</h2><p class="print-gloss">${esc(glossFor(v.items[0],'vocab'))}</p><p><b>POS:</b> ${esc(arr(v.items[0].pos).join(', ')||'—')}</p>${arr(v.items[0].examples).slice(0,3).map(e=>`<div class="print-example"><b lang="ja">${esc(e.ja)}</b><p>${esc(e.en||'')}</p></div>`).join('')}<h3>Your sentence</h3><div class="answer-line"></div>`,i+1,pages.length,chapterTitle(type,lesson));
  return printSheet(v.body,i+1,pages.length,v.header)
 }).join('');printStart(html)
}
function printOne(type,index){const item=app.data[type][index];if(!item)return;
 let html=type==='kanji'?kanjiPrint(item,1,1):type==='grammar'?grammarPrint(item,1,1):printSheet(`<h1>Vocabulary: ${esc(item.word)}</h1><h2>${esc(item.reading)}</h2><p class="print-gloss">${esc(glossFor(item,'vocab'))}</p>${arr(item.examples).slice(0,3).map(e=>`<div class="print-example"><b>${esc(e.ja)}</b><div>${esc(e.en||'')}</div></div>`).join('')}<h3>Practice: Write a new sentence</h3><div class="answer-line"></div>`,1,1,'N3 Vocabulary');printStart(html)}
function printFullBook(){
 if(!app.loaded)return;
 const each=10,total=app.data.kanji.length+app.data.grammar.length+Math.ceil(app.data.vocab.length/each);
 if(!window.confirm('Prepare '+total+' printable pages for N3? For a smaller PDF use Save Chapter as PDF.'))return;
 let html='',current=0;
 for(const k of app.data.kanji)html+=kanjiPrint(k,++current,total);
 for(const g of app.data.grammar)html+=grammarPrint(g,++current,total);
 for(let i=0;i<app.data.vocab.length;i+=each)html+=vocabPrint(app.data.vocab.slice(i,i+each),++current,total);
 if(current!==total){alert('Page count verification failed.');return;}
 printStart(html);
}
function setup(){
 document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{if(!app.loaded)return;if(btn.dataset.section==='daily'){renderDaily();return}chooseSection(btn.dataset.section)}));
 $('lessonNav').addEventListener('click',e=>{const b=e.target.closest('[data-lesson]');if(b){app.chapter=Number(b.dataset.lesson);$('searchBox').value='';refreshView()}});
 $('searchBox').addEventListener('input',()=>{if(TYPES.includes(app.section))refreshView()});
 $('furiganaToggle').checked=app.showFurigana;
 $('furiganaToggle').addEventListener('change',e=>{app.showFurigana=e.target.checked;localStorage.setItem('n3-furigana',app.showFurigana?'on':'off');if(app.loaded&&app.section!=='quiz')refreshView()});
 $('vocabCategory').innerHTML='<option value="all">すべて / All vocabulary</option>'+POS_GROUPS.map(p=>`<option value="${p[0]}">${esc(p[1])} · ${esc(p[2])}</option>`).join('');
 $('vocabCategory').addEventListener('change',e=>{app.vocabCategory=e.target.value;app.chapter=0;$('searchBox').value='';refreshView()});
 $('printChapter').addEventListener('click',()=>printChapter(app.section,app.chapter));
 $('openQuiz').addEventListener('click',()=>showQuiz(app.section,app.chapter));
 $('themeBtn').addEventListener('click',()=>{document.body.classList.toggle('light')});
 const sizeInput=$('readerFontSize');
 if(sizeInput){
   let textSize='normal';
   try{textSize=localStorage.getItem('nextstep-n3-reader-size')||'normal'}catch(e){}
   if(!['small','normal','large'].includes(textSize))textSize='normal';
   sizeInput.value=textSize;
   document.body.dataset.readerSize=textSize;
   sizeInput.addEventListener('change',e=>{
     const selected=['small','normal','large'].includes(e.target.value)?e.target.value:'normal';
     document.body.dataset.readerSize=selected;
     try{localStorage.setItem('nextstep-n3-reader-size',selected)}catch(e){}
   });
 }

 document.addEventListener('click',e=>{
  let btn=e.target.closest('button');if(!btn||!app.loaded)return;
  if(btn.hasAttribute('data-kanji-open')){
    const selected=app.data.kanji.find(x=>x.character===btn.dataset.kanjiOpen);
    if(selected&&window.NextStepCompounds)window.NextStepCompounds.open({
     item:selected,level:'N3',localVocabulary:app.data.vocab,
     initialWord:btn.dataset.kanjiWord||''
    });
    return;
   }
  if(btn.hasAttribute('data-navto')){app.chapter=Number(btn.dataset.navto);$('searchBox').value='';refreshView();window.scrollTo({top:0,behavior:'smooth'})}
  else if(btn.hasAttribute('data-quiz')){let[t,n]=btn.dataset.quiz.split(':');showQuiz(t,Number(n))}
  else if(btn.hasAttribute('data-done')){let[t,n]=btn.dataset.done.split(':');toggleDone(t,Number(n))}
  else if(btn.hasAttribute('data-singlepdf')){let[t,n]=btn.dataset.singlepdf.split(':');printOne(t,Number(n))}
  else if(btn.hasAttribute('data-translate'))doTranslate(btn)
  else if(btn.hasAttribute('data-speak'))japaneseSpeak(btn.dataset.speak)
  else if(btn.hasAttribute('data-triple'))translateCard(btn)
  else if(btn.hasAttribute('data-daily-reveal')){const k=btn.dataset.dailyReveal;app.dailyReveal[k]=!app.dailyReveal[k];renderDaily()}
  else if(btn.hasAttribute('data-daily-done')){const k=btn.dataset.dailyDone;app.dailyProgress[k]=!app.dailyProgress[k];try{localStorage.setItem(DAILY_STORE,JSON.stringify(app.dailyProgress))}catch(e){}renderDaily()}
 });
 if('serviceWorker' in navigator&&location.protocol.startsWith('http')){navigator.serviceWorker.register('../sw.js').catch(()=>{})}
}
setup();load();
})();
