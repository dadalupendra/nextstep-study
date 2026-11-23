
"use strict";
(function(){
const D=window.NEXTSTEP_N2_DATA,G=window.NEXTSTEP_N2_GRAMMAR;
if(!D||!G)return;
const W=D.words||[],K=D.kanji||[],GR=G.patterns||[];
const BOOKS=["kanji","vocab","grammar"],CHAPTERS=10,QCOUNT=50;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const JP=x=>'<span lang="ja" class="ja">'+esc(x)+'</span>';
const NE=x=>'<span lang="ne" class="ne">'+esc(x)+'</span>';
function seed(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rnd(n){n^=n<<13;n^=n>>>17;n^=n<<5;return n>>>0}
function shuffled(a,nonce){let o=a.slice(),state=seed(String(nonce));for(let i=o.length-1;i>0;i--){state=rnd(state);const j=state%(i+1);[o[i],o[j]]=[o[j],o[i]];}return o}
function choices(correct,distractors,id){
 const vals=[String(correct)];
 for(const x of shuffled(distractors,id+"d")){const t=String(x||"").trim();if(t&&t!==vals[0]&&!vals.includes(t))vals.push(t);if(vals.length===4)break}
 if(vals.length<4)throw Error("Not enough unique answer options for "+id);
 const opts=shuffled(vals,id+"o");
 return {options:opts,answer:opts.indexOf(vals[0])};
}
function item(book,chapter,kind,number,prompt,source,correct,distractors,why){
 let id=book+"-"+chapter+"-"+kind+"-"+number,choice=choices(correct,distractors,id);
 return {id,prompt,source,options:choice.options,answer:choice.answer,why,kind};
}
function chapterItems(book,ch){
 if(!BOOKS.includes(book)||!Number.isInteger(ch)||ch<1||ch>10)throw Error("Bad book or chapter");
 const source=book==="kanji"?K:book==="vocab"?W:GR;
 let a=[],b=book==='kanji'?(ch-1)*40:Math.floor((ch-1)*source.length/10),e=book==='kanji'?Math.min(ch*40,source.length):Math.floor(ch*source.length/10);
 if(book==="kanji"){
   // 398 N2-tagged characters => 400 study pages (two review pages). Quiz target: N2 characters only.
   const pool=K.slice(b,e);
   pool.forEach((k,i)=>{
     const [char,ids,meanings,on,kun,strokes,radical]=k;
     const word=ids.map(n=>W[n]).find(w=>w&&w[0]!==w[1]);
     const readings=[...(on||[]),...(kun||[])];
     const correct=word?word[1]:readings[0];
     if(!correct){throw Error("No reading for kanji "+char)}
     const readPool=word?W.filter(x=>x[0]!==x[1]).map(x=>x[1]):K.map(x=>[...(x[3]||[]),...(x[4]||[])][0]).filter(Boolean);
     const label=word?"Choose the listed reading of this N2 vocabulary word:":"Choose an attested reading of this N2-tagged character:";
     const display=word?word[0]:char;
     const why={
       en:"Correct reading: "+correct+". Kanji "+char+" — "+(meanings||[]).join(", ")+". On-yomi: "+(on||[]).join(", ")+"; kun-yomi: "+(kun||[]).join(", ")+". "+(word?"The example word "+word[0]+" has this reading in the N2-tagged vocabulary data.":"The question tests one reading of the highlighted character, not a compound word."),
       ne:"सही पढाइ: "+correct+"। यो N2 वर्गीकरणको कान्जी "+char+" हो। अर्थ: "+(meanings||[]).slice(0,2).join(", ")+"। Onyomi "+(on||[]).join(", ")+" र Kunyomi "+(kun||[]).join(", ")+" तुलना गरेर सम्झनुहोस्।",
       ja:"正解："+correct+"。漢字："+char+"。音読み："+(on||[]).join("・")+"。訓読み："+(kun||[]).join("・")+"。"
     };
     a.push(item(book,ch,"reading",i+1,label,display,correct,readPool,why));
   });
   for(let i=0;a.length<50;i++){
     const k=pool[i%pool.length],correct=k[2]?.[0]||"meaning not supplied";
     const meanings=K.filter(x=>x[2]?.[0]&&x[2][0]!==correct).map(x=>x[2][0]);
     a.push(item(book,ch,"meaning",i+1,"Choose the primary listed English meaning for this N2 kanji:",k[0],correct,meanings,{
       en:"Kanji "+k[0]+" means "+k[2].join("; ")+". The listed on-yomi are "+(k[3]||[]).join(", ")+" and kun-yomi are "+(k[4]||[]).join(", ")+". This gloss is linked to this kanji rather than the distractor characters.",
       ne:"कान्जी "+k[0]+" को मुख्य अर्थ "+correct+" हो। अन्य विकल्पहरू फरक कान्जीका अर्थ हुन्। पढाइ: "+(k[3]||[]).concat(k[4]||[]).join(", ")+"।",
       ja:k[0]+"：意味 "+k[2].join("・")+"。読み方 "+(k[3]||[]).join("・")+"。"
     }));
   }
 }else if(book==="vocab"){
   const pool=W.slice(b,e);
   for(let i=0;i<50;i++){
     let ix=Math.floor(i*pool.length/50),w=pool[ix],type=(i%3===1&&w[0]!==w[1])?"reading":(i%3===2&&w[5])?"context":"meaning";
     const meaning=w[2].split("; ")[0];
     let correct,distractors,prompt,sourceTxt;
     if(type==="reading"){
       correct=w[1];distractors=W.filter(x=>x[0]!==x[1]).map(x=>x[1]);
       prompt="Select the recorded reading of the highlighted N2 word:";sourceTxt=w[0];
     }else if(type==="context"){
       correct=meaning;distractors=W.map(x=>x[2].split("; ")[0]);
       prompt="In this original/example sentence, what is the N2 target word's English meaning?";
       sourceTxt=w[5]+"\n[Target: "+w[0]+"]";
     }else{
       correct=meaning;distractors=W.map(x=>x[2].split("; ")[0]);
       prompt="Choose the best dictionary gloss for this N2 vocabulary item:";sourceTxt=w[0]+"（"+w[1]+"）";
     }
     a.push(item(book,ch,type,i+1,prompt,sourceTxt,correct,distractors,{
       en:"The N2-tagged item "+w[0]+" is read "+w[1]+". Its recorded senses include: "+w[2]+". Part of speech: "+(w[4]||"not recorded")+". "+(w[5]?"Example: "+w[5]+" — "+w[6]:"Use the recorded reading and meaning together to distinguish it from the other options.")+" The other answer options are readings or meanings of different study items.",
       ne:"सही उत्तर: "+correct+"। N2 शब्द "+w[0]+" को पढाइ "+w[1]+" र अंग्रेजी अर्थ "+w[2]+" हो। "+(w[5]?"उदाहरण: "+w[5]:"दोस्रो शब्दसँग अर्थ र पढाइ तुलना गर्नुहोस्।"),
       ja:"語彙："+w[0]+"（"+w[1]+"）。英語の意味："+w[2]+"。"+(w[5]?"例文："+w[5]:"")
     }));
   }
 }else{
   const pool=GR.slice(b,e);const full=GR;
   const means=full.map(x=>x[1]),forms=full.map(x=>x[6]).filter(Boolean),
     patterns=full.map(x=>x[0]),notes=full.map(x=>x[4]).filter(Boolean);
   for(let i=0;i<50;i++){
     const g=pool[i%pool.length],kind=Math.floor(i/pool.length);
     const [pattern,meaning,ja,en,note,ne,formation,ja2,en2]=g;
     const jp=(kind===4&&ja2)?ja2:ja;
     const enExample=(kind===4&&en2)?en2:en;
     let prompt,sourceTxt,correct,distractors,type;
     if(kind===0){
       type="grammarMeaning";prompt="What is the meaning/nuance of this N2 grammar pattern?";sourceTxt=pattern;correct=meaning;distractors=means;
     }else if(kind>=4){
       type="grammarContext2";prompt="Which N2 grammar pattern is illustrated by this second Japanese example?";
       sourceTxt=ja2||ja;correct=pattern;distractors=patterns;
     }else if(kind===1){
       type="grammarForm";prompt="Which connection/formation rule is listed for this N2 pattern?";
       sourceTxt=pattern;correct=formation;distractors=forms;
     }else if(kind===2){
       type="grammarContext";prompt="Which N2 grammar pattern is being illustrated in this Japanese example?";
       sourceTxt=jp;correct=pattern;distractors=patterns;
     }else{
       type="grammarUsage";prompt="Which usage explanation matches this N2 grammar pattern?";
       sourceTxt=pattern;correct=note||"Use this N2 grammar pattern in its documented context.";distractors=notes;
     }
     a.push(item(book,ch,type,i+1,prompt,sourceTxt,correct,distractors,{
       en:"Pattern: "+pattern+". Meaning: "+meaning+". Formation: "+(formation||"see source note")+". Usage: "+(note||"Apply the meaning in context.")+". Model sentence: "+jp+" ("+enExample+"). The other choices describe different patterns, meanings, or structures.",
       ne:"सही ढाँचा: "+pattern+"। नेपाली अर्थ: "+ne+"। बनावट: "+formation+"। उदाहरण वाक्य "+jp+"। गलत विकल्प अन्य N2 व्याकरणका अर्थ वा बनावट हुन्; यही उदाहरणसँग तुलना गरेर सिक्नुहोस्।",
       ja:"文型："+pattern+"。接続："+formation+"。例文："+jp+"。意味："+meaning+"。"
     }));
   }
 }
 if(a.length!==QCOUNT)throw Error("Question count "+book+"/"+ch+" = "+a.length);
 const ids=new Set(a.map(x=>x.id));if(ids.size!==a.length)throw Error("Duplicate item ID "+book+"/"+ch);
 if(a.some(x=>x.options.length!==4||x.answer<0||x.answer>3||new Set(x.options).size!==4))throw Error("Invalid choices "+book+"/"+ch);
 return a;
}
window.NEXTSTEP_N2_MAKE_QUIZ=chapterItems;
function boot(){
 const holder=document.getElementById("quizroot");if(!holder)return;
 const $=id=>document.getElementById(id);
 const params=new URLSearchParams(location.search);
 let book=BOOKS.includes(params.get("book"))?params.get("book"):"kanji";
 let chap=Math.max(1,Math.min(10,parseInt(params.get("chapter"),10)||1));
 const navBook=$("bookselect"),navChapter=$("chapterselect");
 navBook.value=book;navChapter.value=String(chap);
 let answered={},list=[];
 function render(){
   answered={};list=chapterItems(book,chap);
   const title={kanji:"漢字 · Kanji",vocab:"語彙 · Vocabulary",grammar:"文法 · Grammar"};
   $("quiztitle").textContent="JLPT N2 "+title[book]+" — Chapter "+chap+" / 10";
   $("sub").textContent="50 original N2-tagged multiple-choice practice questions · one chapter · detailed answer explanations after grading.";
   $("progress").textContent="0 / 50 answered";$("grade").classList.remove("hide");$("summary").innerHTML="";
   holder.innerHTML=list.map((q,i)=>'<fieldset class="qitem" data-qi="'+i+'"><legend><strong>Q'+(i+1)+' / 50.</strong> '+esc(q.prompt)+'</legend><div class="prompt-ja">'+JP(q.source).replace(/\n/g,"<br>")+'</div><div class="option-list">'+q.options.map((o,j)=>'<label class="choice"><input type="radio" name="q'+i+'" value="'+j+'" data-q="'+i+'"><span class="opttext">'+esc(o)+'</span></label>').join("")+'</div><details class="explanation hide" id="explain-'+i+'"><summary>Detailed answer explanation · विस्तृत व्याख्या</summary><p><b>Correct answer:</b> '+esc(q.options[q.answer])+'</p><p>'+esc(q.why.en)+'</p><p>'+NE(q.why.ne)+'</p><p>'+JP(q.why.ja)+'</p></details></fieldset>').join("");
   holder.querySelectorAll('input[type="radio"]').forEach(x=>x.addEventListener("change",e=>{
     answered[+e.target.dataset.q]=+e.target.value;$("progress").textContent=Object.keys(answered).length+" / 50 answered";
   }));
   history.replaceState(null,"","?book="+encodeURIComponent(book)+"&chapter="+chap);
 }
 function grade(){
   const scores=list.map((q,i)=>answered[i]===q.answer);
   const total=scores.filter(Boolean).length,attempted=Object.keys(answered).length;
   $("summary").innerHTML='<div class="scorebox"><h2>Result: '+total+' / 50 correct</h2><p>Answered: '+attempted+' / 50 · Unanswered questions count as incorrect.</p><p lang="ne">सही उत्तर: '+total+' / 50 । तल प्रत्येक प्रश्नको विस्तृत व्याख्या पढ्नुहोस्।</p><button id="printquiz" type="button">🖨 Print paper and explanations</button></div>';
   $("printquiz").addEventListener("click",()=>window.print());
   holder.querySelectorAll(".qitem").forEach((box,i)=>{
     const q=list[i],ans=answered[i],all=box.querySelectorAll(".choice");
     all.forEach((opt,j)=>{
       opt.classList.toggle("correct",j===q.answer);
       opt.classList.toggle("incorrect",ans===j&&ans!==q.answer);
       opt.querySelector("input").disabled=true;
     });
     const details=box.querySelector("details");details.classList.remove("hide");details.open=true;
   });
   $("grade").classList.add("hide");
   $("summary").scrollIntoView({behavior:"smooth",block:"start"});
   try{localStorage.setItem("nextstep-n2-quiz-"+book+"-"+chap,JSON.stringify({score:total,answered:attempted,at:new Date().toISOString()}))}catch(e){}
 }
 navBook.addEventListener("change",()=>{book=navBook.value;render()});
 navChapter.addEventListener("change",()=>{chap=Number(navChapter.value);render()});
 $("grade").addEventListener("click",grade);
 $("resetquiz").addEventListener("click",()=>{render();window.scrollTo({top:0,behavior:"smooth"})});
 render();
}
if(typeof document!=="undefined")boot();
})();
