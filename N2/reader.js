
"use strict";
(function(){
const D=window.NEXTSTEP_N2_DATA,G=window.NEXTSTEP_N2_GRAMMAR;
const LIMITS={kanji:400,vocab:300,grammar:300};
const LABELS={kanji:"N2 Kanji Notebook · 漢字",vocab:"N2 Vocabulary Notebook · 語彙",grammar:"N2 Grammar Notebook · 文法"};
const KEY="nextstep-n2-study-v1";
let storage={page:{kanji:1,vocab:1,grammar:1},done:{kanji:[],vocab:[],grammar:[]},marks:{kanji:[],vocab:[],grammar:[]},notes:{},size:22,showEnglish:true,showNepali:true,book:"kanji"};
try{const saved=JSON.parse(localStorage.getItem(KEY)||"null");if(saved){storage={...storage,...saved,page:{...storage.page,...saved.page},done:{...storage.done,...saved.done},marks:{...storage.marks,...saved.marks},notes:saved.notes||{}}}}catch(e){}
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const words=D?.words||[],kanji=D?.kanji||[],grammar=G?.patterns||[];
const key=(book,page)=>book+"-"+page;
const en=x=>'<span class="meaning-en">'+esc(x)+'</span>';
const ne=x=>'<span class="guidance-ne ne" lang="ne">'+esc(x)+'</span>';
function range(book,page){
 const n=words.length;
 return words.slice(Math.floor((page-1)*n/300),Math.floor(page*n/300));
}

function card(w,printing=false,expanded=false){
 const [word,reading,meaning,id,pos,ja,enExample,ja2,en2]=w;
 let examples=(ja?'<p class="ja" lang="ja">'+esc(ja)+'</p><p class="gloss">'+en(enExample)+'</p>':'')+
 (ja2?'<p class="ja" lang="ja">'+esc(ja2)+'</p><p class="gloss">'+en(en2)+'</p>':'');
 return '<tr><td><span class="word ja" lang="ja">'+esc(word)+'</span><br><span class="reading ja" lang="ja">'+esc(reading)+'</span><div class="mini">'+esc(pos||"")+'</div></td><td class="meaning">'+en(meaning)+
 (examples?(printing?'<div class="mini">'+examples+'</div>':'<details '+(expanded?'open':'')+'><summary>Examples · 例文</summary>'+examples+'</details>'):'')+
 '</td></tr>';
}

function sayButton(txt){
 return '<button type="button" data-say="'+esc(txt)+'" aria-label="Speak Japanese">🔊 日本語を聞く</button>';
}
function commonFooter(book,page,printing){
 return '<hr><div class="mini"><b>Notebook reflection · 振り返り</b><br>'+
 ne("आज सिकेको कुरा आफ्नै शब्दमा लेख्नुहोस्।")+
 '<p class="meaning-en">Explain what you learned, then create an example from your own life.</p></div>'+
 (printing?'<div class="task mini">My notes: ___________________________________________________________<br><br>__________________________________________________________________<br><br>__________________________________________________________________</div>':
 '<label for="mynotes" class="mini">Personal notes / आफ्ना नोटहरू</label><textarea id="mynotes" class="note" placeholder="Type a Japanese example or notes in Nepali / English …"></textarea>')+
 '<p class="mini">NextStep Study · '+esc(LABELS[book])+' · '+page+'/'+LIMITS[book]+
 ' · Editorial study material, not an official JLPT syllabus.</p>';
}

function kanjiPage(page,printing){
 if(page>398){
   const start=page===399?360:379,end=page===399?379:398;
   const focus=kanji.slice(start,end);
   return '<div class="eyebrow">N2 Kanji Revision · Page '+page+' / 400</div><h1>漢字 復習 · Review</h1>'+
   '<p class="high">Revision of N2-tagged characters '+(start+1)+'–'+end+'. There are 398 distinct N2-tagged kanji in this sourced list; these two pages are additional practice, not invented N2 kanji.</p>'+
   ne("यी दुई पृष्ठमा N2 का वास्तविक कान्जी दोहोर्याएर पढ्ने, अर्थ सम्झने र लेख्ने अभ्यास गर्नुहोस्।")+
   '<table class="word-table"><thead><tr><th>N2 Kanji</th><th>English meaning</th><th>On-yomi / Kun-yomi</th></tr></thead><tbody>'+
   focus.map(k=>'<tr><td class="ja">'+esc(k[0])+'</td><td>'+en((k[2]||[]).join('; '))+'</td><td class="ja">'+esc([...(k[3]||[]),...(k[4]||[])].join('、'))+'</td></tr>').join('')+'</tbody></table>'+
   '<div class="task">Write five N2-character compounds you remember. Then take the 50-question test for Chapter 10.</div>'+commonFooter('kanji',page,printing);
 }
 const row=kanji[page-1];if(!row)return '<h2>Page unavailable</h2>';
 const [char,indexes,meanings,onyomi,kunyomi,strokes,radical]=row;
 const examples=(indexes||[]).map(i=>words[i]).filter(Boolean).slice(0,5);
 const focus=examples[0];
 return '<div class="eyebrow">N2-TAGGED KANJI / CHAPTER '+(Math.floor((page-1)/40)+1)+' · Page '+page+' / 400</div>'+
 '<h1>漢字ノート <span class="badge">N2 level-tagged character '+page+' / 398</span></h1>'+
 '<div class="flex"><span class="kanji-big ja" lang="ja">'+esc(char)+'</span><div><h2>'+en((meanings||[]).join(' · '))+'</h2>'+
 '<p class="ja">音読み '+esc((onyomi||[]).join('・')||'—')+'</p><p class="ja">訓読み '+esc((kunyomi||[]).join('・')||'—')+'</p>'+
 '<p class="mini">Stroke count: '+esc(strokes||'—')+' · Radical: <span class="ja">'+esc(radical||'—')+'</span></p>'+
 ne("यो N2 स्तरमा वर्गीकृत कान्जी हो। अर्थ, पढाइ र लेख्ने क्रम सम्झनुहोस्।")+
 (!printing&&focus?sayButton(focus[0]):'')+'</div></div>'+
 '<div class="high"><b>Meaning and reading</b><p>'+en('Read on-yomi and kun-yomi above, then recognize the character in the N2-level words below when available.')+'</p>'+
 ne("माथिका पढाइ सम्झेर N2 शब्दहरूको अर्थ मिलाउनुहोस्।")+'</div>'+
 (examples.length?'<h2>N2-tagged vocabulary with '+esc(char)+'</h2><table class="word-table"><thead><tr><th>N2 Word / Reading</th><th>English meaning and example</th></tr></thead><tbody>'+
 examples.map((x,i)=>card(x,printing,i===0)).join('')+'</tbody></table>':
 '<div class="card"><b>N2 word-matching note</b><p class="gloss">This N2-classified kanji has no matching word in this limited N2-only vocabulary dataset. Study its recorded readings and meaning; prerequisite-level words are deliberately not added as target entries.</p></div>')+
 '<h2>Kanji writing · 書き取り</h2><div class="gridwrite">'+Array.from({length:5},(_,i)=>'<span>'+(i?'':esc(char))+'</span>').join('')+'</div>'+
 '<div class="task"><b>Practice / अभ्यास</b><p>1. Recall its principal meaning: '+en((meanings||[])[0]||'')+'</p><p>2. Write the character 5 times and read it aloud.</p>'+
 '<p>3. Try to remember an N2 word containing this kanji, if available.</p>'+ne("अर्थ नहेरी पढाइ सम्झनुहोस् र पाँचपटक लेख्नुहोस्।")+'</div>'+
 commonFooter('kanji',page,printing);
}


function vocabPage(page,printing){
 const entries=range('vocab',page);const first=entries[0],last=entries[entries.length-1];
 return '<div class="eyebrow">N2-TAGGED VOCABULARY / CHAPTER '+(Math.floor((page-1)/30)+1)+' · Page '+page+' / 300</div>'+
 '<h1>語彙ノート <span class="badge">N2 vocabulary · '+words.length+' words in collection</span></h1>'+
 '<p class="high"><b>Read — understand — apply</b><br>'+
 '<span class="ja" lang="ja">読み方・意味・例文を確認して覚えましょう。</span><br>'+
 ne("यो पाठका सबै N2 शब्दहरू र उदाहरण वाक्य ध्यानपूर्वक पढ्नुहोस्।")+'</p>'+
 '<div class="flex">'+(printing?'':sayButton(first[0]))+'<span class="mini">Words '+(Math.floor((page-1)*words.length/300)+1)+'–'+Math.floor(page*words.length/300)+'</span></div>'+
 '<table class="word-table"><thead><tr><th>日本語 / Reading</th><th>English gloss / Examples</th></tr></thead><tbody>'+
 entries.map((x,i)=>card(x,printing,i<2)).join('')+'</tbody></table>'+
 '<div class="card"><h3>Recall and apply / 練習</h3><p>① Read '+esc(first[0])+' and recall its meaning.</p>'+
 '<p>② What N2 word means: '+en(last[2])+'?</p>'+
 '<p>③ Write a new Japanese sentence with two target N2 words and explain it in your own language.</p>'+
 ne("दुई नयाँ शब्दको प्रयोग गरी आफ्नै जापानी वाक्य बनाउनुहोस्।")+'</div>'+commonFooter('vocab',page,printing);
}


function grammarCoordinate(page){
 const chapter=Math.floor((page-1)/30),offset=(page-1)%30;
 const start=Math.floor(chapter*grammar.length/10),end=Math.floor((chapter+1)*grammar.length/10);
 const count=end-start;
 if(offset<2*count)return {chapter,idx:start+Math.floor(offset/2),phase:offset%2,review:false};
 return {chapter,idx:start+(offset-2*count)%(count||1),phase:2,review:true,start,end};
}
function grammarFirstPage(index){
 for(let ch=0;ch<10;ch++){
  const first=Math.floor(ch*grammar.length/10),last=Math.floor((ch+1)*grammar.length/10);
  if(index>=first&&index<last)return ch*30+(index-first)*2+1;
 }
 return 1;
}
function grammarPage(page,printing){
 const where=grammarCoordinate(page);
 const [pattern,meaning,ja,enExample,note,meaningNepali,formation,ja2,en2,tags,reading,ja3,en3]=grammar[where.idx]||[];
 if(!pattern)return '<h2>Grammar pattern not found</h2>';
 let part='',chapter=where.chapter+1;
 const examples=[[ja,enExample],[ja2,en2],[ja3,en3]].filter(a=>a[0]);
 function model(pair){return '<div class="card"><p class="ja" lang="ja">'+esc(pair[0])+'</p><p class="gloss">'+en(pair[1])+'</p>'+(!printing?sayButton(pair[0]):'')+'</div>'}
 if(where.review){
   part='<div class="high"><h2>Chapter review / まとめ</h2><p>Review pattern <span class="ja">'+esc(pattern)+'</span> from this chapter. This is a consolidation page, not an extra N2 grammar item.</p>'+ne("यस अध्यायको व्याकरण फेरि सम्झनुहोस् र आफ्नो उदाहरण बनाउनुहोस्।")+'</div>'+
   model(examples[0]||["",""])+
   '<div class="task"><b>Review questions</b><p>① Explain the nuance in Nepali and English.</p><p>② Complete the structure: '+esc(formation)+'</p><p>③ Create three original sentences and compare with the source examples.</p></div>';
 }else if(where.phase===0){
   part='<div class="high"><h2>Meaning and formation / 意味・接続</h2><p>'+en(meaning)+'</p><p>'+ne(meaningNepali)+'</p></div>'+
    '<h2>Sentence formation</h2><div class="card"><p>'+esc(formation)+'</p><p class="gloss">Usage: '+en(note)+'</p></div>'+
    '<h2>Authentic N2-level examples</h2>'+examples.map(model).join('')+
    '<div class="task"><b>Analysis practice</b><p>Identify the grammar connection and the relationship between clauses. Compare with similar patterns from this chapter.</p>'+ne("बनावट, अर्थ र उदाहरणलाई मिलाएर पढ्नुहोस्।")+'</div>';
 }else{
   part='<h2>Nuance and interpretation / 用法</h2><div class="high"><p>'+en(meaning)+'</p><p>'+ne(meaningNepali)+'</p><p><b>Formation:</b> '+esc(formation)+'</p><p><b>Usage:</b> '+en(note)+'</p></div>'+
    '<h2>Read and analyze</h2>'+examples.slice(0,2).map(model).join('')+
    '<div class="task"><b>Try it yourself</b><p>① Rewrite the first example in your own words.</p><p>② Create two original Japanese sentences using the target grammar.</p><p>③ Explain the difference in meaning if the target grammar is removed.</p>'+ne("कम्तीमा दुईवटा नयाँ जापानी वाक्य बनाउनुहोस्।")+'</div>';
 }
 return '<div class="eyebrow">N2-TAGGED GRAMMAR / CHAPTER '+chapter+' · Page '+page+' / 300 · Pattern '+(where.idx+1)+'/123</div>'+
 '<h1 class="ja" lang="ja">'+esc(pattern)+'</h1><span class="badge">'+(where.review?'Revision':'Grammar lesson '+(where.phase+1)+'/2')+'</span>'+
 '<p class="mini">Reading: '+esc(reading||'—')+'</p>'+part+commonFooter('grammar',page,printing);
}

function renderLesson(book,page,printing=false){
 if(book==='kanji')return kanjiPage(page,printing);
 if(book==='vocab')return vocabPage(page,printing);
 return grammarPage(page,printing);
}
window.N2MakePage=renderLesson;
function save(){try{localStorage.setItem(KEY,JSON.stringify(storage))}catch(e){}}
function boot(){
 const $=id=>document.getElementById(id);
 const viewer=$("viewer");if(!viewer)return;
 const initial=new URLSearchParams(location.search).get('book');
 let book=["kanji","vocab","grammar"].includes(initial)?initial:(["kanji","vocab","grammar"].includes(storage.book)?storage.book:"kanji"),current=storage.page[book]||1;
 const getDone=()=>storage.done[book]||[];
 const getMarks=()=>storage.marks[book]||[];
 function updateCSS(){
   viewer.style.setProperty('--reader-size',storage.size+'px');
   viewer.querySelectorAll('.meaning-en').forEach(x=>x.classList.toggle('hide',!storage.showEnglish));
   viewer.querySelectorAll('.guidance-ne').forEach(x=>x.classList.toggle('hide',!storage.showNepali));
   $("toggle-en").setAttribute('aria-pressed',String(storage.showEnglish));
   $("toggle-ne").setAttribute('aria-pressed',String(storage.showNepali));
   $("toggle-en").textContent='English '+(storage.showEnglish?'✓':'×');
   $("toggle-ne").textContent='नेपाली '+(storage.showNepali?'✓':'×');
 }
 function changePage(p){current=Math.max(1,Math.min(LIMITS[book],Number(p)||1));storage.page[book]=current;save();render()}
 function render(){
   viewer.innerHTML=renderLesson(book,current,false);
   viewer.querySelector("#mynotes").value=storage.notes[key(book,current)]||"";
   viewer.querySelector("#mynotes").addEventListener('input',e=>{storage.notes[key(book,current)]=e.target.value;save()});
   updateCSS();
   $("page").value=current;$("page").max=LIMITS[book];$("pagecounter").textContent="Page "+current+" / "+LIMITS[book];
   $("bookname").textContent=LABELS[book];
   const chapter=Math.floor((current-1)/(book==='kanji'?40:30))+1;
   const chapSelect=$("chapterselect");if(chapSelect)chapSelect.value=String(chapter);
   const chapQuiz=$("chapterquiz");if(chapQuiz)chapQuiz.href="quiz.html?book="+encodeURIComponent(book)+"&chapter="+chapter;
   const chapText=$("chaptername");if(chapText)chapText.textContent="Chapter "+chapter+" / 10 · 50-question JLPT-style practice";
   $("progressbar").style.width=Math.round(getDone().length/LIMITS[book]*100)+"%";
   $("progresslabel").textContent=getDone().length+" / "+LIMITS[book]+" pages marked learned";
   $("completed").textContent=getDone().includes(current)?"✓ Learned":"✓ Mark learned";
   $("bookmark").textContent=getMarks().includes(current)?"★ Bookmarked":"☆ Bookmark";
   $("prev").disabled=current<=1;$("next").disabled=current>=LIMITS[book];
   document.querySelectorAll('[data-book]').forEach(el=>el.setAttribute('aria-selected',String(el.dataset.book===book)));
   storage.page[book]=current;storage.book=book;save();
 }
 document.querySelectorAll('[data-book]').forEach(b=>b.addEventListener('click',()=>{book=b.dataset.book;current=storage.page[book]||1;$("search").value="";$("results").innerHTML="";render()}));
 $("prev").addEventListener('click',()=>changePage(current-1));$("next").addEventListener('click',()=>changePage(current+1));
 $("page").addEventListener('change',e=>changePage(e.target.value));
 const chapterselect=$("chapterselect");if(chapterselect)chapterselect.addEventListener('change',e=>changePage((Number(e.target.value)-1)*(book==='kanji'?40:30)+1));$("first").addEventListener('click',()=>changePage(1));
 $("size").value=String(storage.size);$("size").addEventListener('change',e=>{storage.size=Number(e.target.value)||22;save();updateCSS()});
 $("toggle-en").addEventListener('click',()=>{storage.showEnglish=!storage.showEnglish;save();updateCSS()});
 $("toggle-ne").addEventListener('click',()=>{storage.showNepali=!storage.showNepali;save();updateCSS()});
 $("bookmark").addEventListener('click',()=>{const a=getMarks(),i=a.indexOf(current);if(i>=0)a.splice(i,1);else a.push(current);save();render()});
 $("completed").addEventListener('click',()=>{const a=getDone(),i=a.indexOf(current);if(i>=0)a.splice(i,1);else a.push(current);save();render()});
 $("print").addEventListener('click',()=>{location.href="print.html?book="+encodeURIComponent(book)});
 $("saved").addEventListener('click',()=>showResults(getMarks().map(n=>({n,label:"★ Page "+n})),true));
 viewer.addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(!b)return;
   if(!('speechSynthesis'in window))return alert('Japanese speech is not supported in this browser.');
   window.speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(b.dataset.say);u.lang='ja-JP';u.rate=.84;window.speechSynthesis.speak(u);
 });
 function showResults(items,bm){
   const div=$("results");div.innerHTML='<b>'+items.length+(bm?' bookmarked':' matching')+' pages</b><div class="gap"></div>'+
     items.slice(0,40).map(x=>'<button class="jump" type="button" data-goto="'+x.n+'">'+esc(x.label)+'</button>').join('');
   if(items.length>40)div.innerHTML+='<p>Showing first 40 matches.</p>';
   div.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>changePage(b.dataset.goto)));
 }
 let timer;$("search").addEventListener('input',e=>{clearTimeout(timer);timer=setTimeout(()=>{
   const q=e.target.value.trim().toLowerCase();if(!q){$("results").innerHTML="";return}
   let items=[];
   if(book==='kanji')items=kanji.map((row,i)=>({n:i+1,label:row[0]+' · '+row[1].slice(0,3).map(id=>words[id]?.[0]).join('、'),hay:row[0]+' '+row[1].map(id=>words[id]?.join(' ')).join(' ')}));
   else if(book==='grammar')items=grammar.map((row,i)=>({n:grammarFirstPage(i),label:row[0]+' · '+row[1],hay:row.join(' ')}));
   else items=Array.from({length:300},(_,i)=>({n:i+1,label:'Page '+(i+1)+' · '+range('vocab',i+1).slice(0,2).map(x=>x[0]).join('、'),hay:range('vocab',i+1).flat().join(' ')}));
   showResults(items.filter(x=>x.hay.toLowerCase().includes(q)),false);
 },150)});
 document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||''))return;if(e.key==='ArrowRight')changePage(current+1);if(e.key==='ArrowLeft')changePage(current-1)});
 render();
}
function bootPrint(){
 const root=document.getElementById("printroot");if(!root)return;
 const params=new URLSearchParams(location.search),book=LIMITS[params.get('book')]?params.get('book'):'kanji';
 const max=LIMITS[book],startInput=document.getElementById('frompage'),endInput=document.getElementById('topage');
 startInput.value=1;endInput.value=max;startInput.max=endInput.max=max;
 function generate(){
 const start=Math.max(1,Math.min(max,Number(startInput.value)||1)),end=Math.max(start,Math.min(max,Number(endInput.value)||max));
 document.getElementById('printtitle').textContent=LABELS[book]+' — '+(end-start+1)+' pages';
 const parts=[];
 for(let i=start;i<=end;i++)parts.push('<section class="print-page"><article class="paper">'+renderLesson(book,i,true)+'</article></section>');
 root.innerHTML=parts.join('');
 }
 document.getElementById('prepare').addEventListener('click',generate);
 document.getElementById('do-print').addEventListener('click',()=>{generate();setTimeout(()=>window.print(),350)});
 document.getElementById('backbook').href='index.html?book='+book;
 generate();
}
if(!D||!G){const box=document.getElementById("viewer")||document.getElementById("printroot");if(box)box.textContent='Study data could not load. Please reload or check data.js and grammar-data.js.';return;}
boot();bootPrint();
})();
