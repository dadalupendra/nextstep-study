
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
function card(w){
 const [word,reading,meaning]=w;
 return '<tr><td><span class="word ja" lang="ja">'+esc(word)+'</span><br><span class="reading ja" lang="ja">'+esc(reading)+'</span></td><td class="meaning">'+en(meaning)+'</td></tr>';
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
 const row=kanji[page-1];if(!row)return '<h2>No kanji data for this page</h2>';
 const [char,indexes]=row;const samples=indexes.map(i=>words[i]).filter(Boolean);
 const main=samples.slice(0,6),focus=main[0],others=samples.slice(0,3);
 return '<div class="eyebrow">NEXTSTEP STUDY / KANJI NOTEBOOK · Page '+page+' / 400</div>'+
 '<h1>漢字ノート <span class="badge">400 character pages</span></h1>'+
 '<div class="flex"><span class="kanji-big ja" lang="ja">'+esc(char)+'</span><div><h2>Learn this character in words</h2><p class="gloss">Use real Japanese compounds to understand typical contexts and readings.</p>'+
 ne("शब्दभित्र यो कान्जी कसरी प्रयोग हुन्छ भनेर पढ्नुहोस्।")+
 (!printing&&focus?sayButton(focus[0]):"")+'</div></div>'+
 '<div class="high"><b>Read aloud · 音読</b><p class="ja" lang="ja">'+esc(others.map(x=>x[0]+"（"+x[1]+"）").join("　/　"))+'</p><p class="gloss">'+en("The reading above belongs to each complete word; it is not necessarily a standalone reading of the kanji.")+'</p></div>'+
 '<h2>Vocabulary containing '+esc(char)+'</h2><table class="word-table"><thead><tr><th>Word · 読み</th><th>English meaning</th></tr></thead><tbody>'+main.map(card).join('')+'</tbody></table>'+
 '<h2>Write and remember · 書き取り</h2><div class="gridwrite">'+Array.from({length:5},(_,i)=>'<span>'+(i? "":esc(char))+'</span>').join('')+'</div>'+
 '<div class="task"><b>Quick check / अभ्यास</b><p>1. Read: <b class="ja">'+esc(focus[0])+'</b> (cover its reading first).</p><p>2. Recall: '+en(focus[2])+'</p><p>3. Make a sentence with any word above.</p>'+ne("पहिले अर्थ नहेरी पढ्नुहोस्, त्यसपछि उदाहरण वाक्य लेख्नुहोस्।")+'</div>'+
 commonFooter('kanji',page,printing);
}
function vocabPage(page,printing){
 const entries=range('vocab',page);
 const first=entries[0]||["","",""],last=entries[entries.length-1]||first;
 return '<div class="eyebrow">NEXTSTEP STUDY / VOCABULARY NOTEBOOK · Page '+page+' / 300</div>'+
 '<h1>語彙ノート <span class="badge">Vocabulary · Page '+page+'</span></h1>'+
 '<p class="high"><b>Study focus · 学習ポイント</b><br>'+
 '<span class="ja" lang="ja">意味・読み方・使い方を確認しましょう。</span><br>'+
 ne("शब्द, पढाइ र अर्थ सम्झनुहोस्।")+
 '<br><span class="meaning-en">Read each word, cover the meaning, then recall it in Japanese.</span></p>'+
 '<div class="flex">'+(printing?"":sayButton(first[0]))+'<span class="mini">Words '+(Math.floor((page-1)*words.length/300)+1)+'–'+Math.floor(page*words.length/300)+' of '+words.length+'</span></div>'+
 '<table class="word-table"><thead><tr><th>日本語 / Reading</th><th>English gloss</th></tr></thead><tbody>'+entries.map(card).join('')+'</tbody></table>'+
 '<div class="card"><h3>Active recall / 自分でテスト</h3>'+
 '<p>① Read <b class="ja">'+esc(first[0])+'</b> and recall its meaning before looking at the table.</p>'+
 '<p>② What Japanese word means: <b>'+en(last[2])+'</b>?</p>'+
 '<p>③ Use two words from this page in a natural Japanese sentence.</p>'+
 ne("अर्थ छोपेर आफैँ सम्झनुहोस्, दुई शब्द प्रयोग गरी जापानी वाक्य बनाउनुहोस्।")+
 '</div>'+commonFooter('vocab',page,printing);
}
function grammarPage(page,printing){
 const ix=Math.floor((page-1)/3),phase=(page-1)%3;
 const x=grammar[ix];if(!x)return '<h2>No grammar data for this page</h2>';
 const [pattern,meaning,sentence,translation,note,meaningNepali]=x;
 const title=["Learn the pattern · 文型","Usage & comprehension · 読解","Practice & production · 練習"][phase];
 let part='';
 if(phase===0){
   part='<div class="high"><h2>Meaning / 意味</h2><p class="gloss">'+en(meaning)+'</p>'+
   ne(meaningNepali)+'<br>'+ne("यो व्याकरणको अर्थ र प्रयोग उदाहरणबाट सिक्नुहोस्।")+'</div>'+
   '<h2>Example / 例文</h2><div class="card"><h3 class="ja" lang="ja">'+esc(sentence)+'</h3>'+
   '<p class="gloss">'+en(translation)+'</p>'+(!printing?sayButton(sentence):'')+'</div>'+
   '<h2>Usage note / 使い方</h2><p>'+en(note)+'</p><div class="task"><b>Learning tip</b><p>Identify where <strong>'+esc(pattern)+'</strong> occurs in the sentence. Explain the relationship between the two ideas.</p>'+ne("उदाहरणमा यो व्याकरणले दुई भाग कसरी जोडेको छ ध्यान दिनुहोस्।")+'</div>';
 }else if(phase===1){
   part='<h2>Observe the structure / 文の構造</h2><div class="card"><p class="ja" lang="ja">'+esc(sentence)+'</p><p class="gloss">'+en(translation)+'</p>'+
    '<p><b>Key pattern:</b> <span class="ja">'+esc(pattern)+'</span></p><p><b>Usage:</b> '+en(note)+'</p><p>'+ne(meaningNepali)+'</p></div>'+
    '<div class="task"><h3>Comprehension questions</h3><p>1. Which two ideas or events does this pattern link?</p><p>2. Is the tone neutral, formal, emphatic, or negative? Explain using the example.</p><p>3. What changes in meaning if you remove the target pattern?</p></div>'+
    '<p class="high">'+ne("उदाहरण पढेर कारण, विरोध वा सर्त कुन सम्बन्ध छ भनेर पहिचान गर्नुहोस्।")+'</p>';
 }else{
   part='<h2>Apply it yourself / 作文練習</h2>'+
    '<p class="high">'+ne("आफ्नो पढाइ, काम वा दैनिक जीवनसँग सम्बन्धित दुई नयाँ वाक्य लेख्नुहोस्।")+
    '<br><span class="meaning-en">Write two original Japanese sentences using the target pattern.</span></p>'+
    '<div class="task"><p>① Write about a school or workplace situation with <b>'+esc(pattern)+'</b>.</p><p>② Write about a social or everyday situation with the same pattern.</p><p>③ Check that your word order and grammatical connection match the model.</p></div>'+
    '<div class="card"><b>Model to review / 参考文</b><p class="ja" lang="ja">'+esc(sentence)+'</p>'+
    '<p class="gloss">'+en(translation)+'</p>'+
    '<p class="mini">Meaning: '+en(meaning)+'</p><p>'+ne(meaningNepali)+'</p></div>';
 }
 return '<div class="eyebrow">NEXTSTEP STUDY / GRAMMAR NOTEBOOK · Page '+page+' / 300 · Pattern '+(ix+1)+'/100 · Part '+(phase+1)+'/3</div>'+
 '<h1 class="ja" lang="ja">'+esc(pattern)+'</h1><div class="badge">'+esc(title)+'</div><div class="gap"></div>'+
 part+commonFooter('grammar',page,printing);
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
 let book=["kanji","vocab","grammar"].includes(storage.book)?storage.book:"kanji",current=storage.page[book]||1;
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
 $("page").addEventListener('change',e=>changePage(e.target.value));$("first").addEventListener('click',()=>changePage(1));
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
   else if(book==='grammar')items=grammar.map((row,i)=>({n:i*3+1,label:row[0]+' · '+row[1],hay:row.join(' ')}));
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
