"use strict";
(function(){
const D=window.NEXTSTEP_N2_DATA,G=window.NEXTSTEP_N2_GRAMMAR;
if(!D||!G)return;
const W=D.words||[], K=D.kanji||[], GR=G.patterns||[], BUSINESS=window.NEXTSTEP_BJT_SCENARIOS||[];
const BOOKS=['kanji','vocab','grammar'],EXAMS=['JLPT','BJT','JPT','JTEST','NAT'];
const COUNT=50,LETTERS=['A','B','C','D'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jp=s=>'<span lang="ja" class="ja">'+esc(s)+'</span>',np=s=>'<span lang="ne" class="ne">'+esc(s)+'</span>';
function seed(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rnd(n){n^=n<<13;n^=n>>>17;n^=n<<5;return n>>>0}
function mix(a,s){let out=a.slice(),r=seed(s);for(let i=out.length-1;i>0;i--){r=rnd(r);const j=r%(i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
function example(w){return w?.[5]||''}
function explanation(ja,en,ne){return{ja,en,ne}}
function make(book,ch,kind,serial,prompt,source,answer,wrong,why,meta={}){
 const id=book+'-'+ch+'-'+kind+'-'+serial,opts=[{jp:String(answer),correct:true,rec:meta.rec||null}];
 for(const w of mix(wrong,id+'d')){
   const obj=typeof w==='string'?{jp:w}:w;
   if(!obj||!String(obj.jp||'').trim()||opts.some(x=>x.jp===obj.jp))continue;
   opts.push({...obj,jp:String(obj.jp),correct:false});
   if(opts.length===4)break;
 }
 if(opts.length!==4)throw Error('Insufficient unique options: '+id);
 const shuffled=mix(opts,id+'o');
 return {id,book,chapter:ch,kind,prompt,source,answer:shuffled.findIndex(o=>o.correct),options:shuffled,why,sourceFuri:meta.sourceFuri||'',answerFuri:meta.answerFuri||'',hintFuri:meta.hintFuri||'',target:meta.target||'',example:meta.example||'',exampleFuri:meta.exampleFuri||'',exam:meta.exam||'JLPT'};
}
function jaReading(w){return '「'+w[0]+'」は「'+w[1]+'」と読みます。'+(w[5]?'例文：「'+w[5]+'」':'')}
function wordWhy(w,correct,sourcePhrase){
 const ja='正解は「'+correct+'」です。'+jaReading(w)+(sourcePhrase?' この問題は語彙の読み方・文脈を確認しています。':'');
 const en='The N2-tagged target word '+w[0]+' is read '+w[1]+'. Recorded meaning: '+w[2]+'.'+(w[5]?' Example: '+w[5]+' — '+w[6]+'.':'')+' Compare the target form, reading and example context.';
 const ne='सही उत्तर 「'+correct+'」 हो। N2 शब्द「'+w[0]+'」को उच्चारण「'+w[1]+'」 र अर्थ '+w[2]+' हो। '+(w[5]?'उदाहरण: '+w[5]+'।':'')+' प्रश्नमा भएको पढाइ र प्रसंग ध्यान दिनुहोस्।';
 return explanation(ja,en,ne);
}
const allVRead=W.filter(x=>x[0]!==x[1]&&x[1]),allKanjiChar=K.map(x=>x[0]);
function kanjiChapter(ch){
 const pool=K.slice((ch-1)*40,Math.min(ch*40,398)),out=[];
 const reads=K.flatMap(x=>x[3]||[]).filter(x=>!x.includes('.')&&x.length>=2);
 pool.forEach((k,i)=>{
  const [char,ids,meaning,on,kun]=k,word=(ids||[]).map(id=>W[id]).find(w=>w&&w[0]!==w[1]);
  const right=word?word[1]:(on?.[0]||kun?.[0]?.replace(/\./g,''));
  const wrongPool=word?allVRead.filter(w=>w[1].length>=2).sort((x,y)=>{
       const score=v=>Math.abs(v[1].length-right.length)*2+(v[1][0]===right[0]?0:5)+(v[1][1]===right[1]?0:2);
       return score(x)-score(y)
     }).slice(0,30).map(w=>({jp:w[1],rec:{word:w}})):
     reads.filter(t=>t!==right&&t[0]===right[0]).concat(reads.filter(t=>t!==right)).slice(0,80).map(t=>({jp:t}));
  const prompt=word?'次の言葉の読み方として、最も適切なものを一つ選びなさい。':'次の漢字の読み方として、正しいものを一つ選びなさい。';
  const source=word?word[0]:char;
  out.push(make('kanji',ch,'reading',i+1,prompt,source,right,wrongPool,
   explanation('「'+source+'」の読み方は「'+right+'」です。音読みは「'+(on||[]).join('・')+'」、訓読みは「'+(kun||[]).join('・')+'」です。'+(word?'実際の単語「'+word[0]+'」における読み方を答えます。':'文字の読みを確認する問題です。'),
   'The correct reading is '+right+'. This N2 kanji '+char+' has on-readings '+(on||[]).join(', ')+' and kun-readings '+(kun||[]).join(', ')+'. Meaning: '+(meaning||[]).join(', ')+'.'+(word?' The word '+word[0]+' is recorded with this reading.':''),
   'सही उच्चारण「'+right+'」 हो। N2 कान्जी「'+char+'」को अर्थ '+(meaning||[]).join(', ')+' हो। 音読み '+(on||[]).join('、')+' र 訓読み '+(kun||[]).join('、')+' सम्झनुहोस्।'),
   {target:source,example:word?.[5]||'',exampleFuri:word?.[9]||'',answerFuri:word?.[1]||''}));
 });
 for(let i=0;out.length<COUNT;i++){
  const k=pool[i%pool.length],word=(k[1]||[]).map(n=>W[n]).find(x=>x&&x[0].includes(k[0]));
  let prompt,source,wrong;
  if(word){
    prompt='次の言葉の「（　）」に入る漢字を一つ選びなさい。';
    source=word[0].replace(k[0],'（　）')+'　（読み：'+word[1]+'）';
    wrong=K.filter(x=>x[0]!==k[0]&&!word[0].includes(x[0])).map(x=>({jp:x[0],rec:{kanji:x}}));
  }else{
    const read=k[3]?.[0]||k[4]?.[0];
    prompt='次の読み方に合う漢字を一つ選びなさい。';
    source=read;
    wrong=K.filter(x=>x[0]!==k[0]&&![...(x[3]||[]),...(x[4]||[])].includes(read)).map(x=>({jp:x[0],rec:{kanji:x}}));
  }
  out.push(make('kanji',ch,'writing',i+1,prompt,source,k[0],wrong,
   explanation('正解は「'+k[0]+'」です。'+(word?'「'+word[0]+'（'+word[1]+'）」という語を完成させます。':'「'+source+'」という読みがあります。')+' 音読み：'+(k[3]||[]).join('・')+'。訓読み：'+(k[4]||[]).join('・')+'。',
    'The missing character is '+k[0]+'.'+(word?' The complete N2 word is '+word[0]+' ('+word[1]+').':' The recorded reading is '+source+'.')+' Meaning: '+(k[2]||[]).join(', ')+'.',
    'सही कान्जी「'+k[0]+'」 हो। '+(word?'पूरा शब्द「'+word[0]+'」, पढाइ「'+word[1]+'」 हो।':'पढाइ「'+source+'」 हो।')+' अंग्रेजी अर्थ: '+(k[2]||[]).join(', ')+'।'),
   {target:k[0],example:word?.[5]||'',exampleFuri:word?.[9]||''}));
 }
 return out;
}
function sameType(a,b){let pa=(a[4]||'').split(',')[0],pb=(b[4]||'').split(',')[0];return pa&&pb&&pa===pb}
function vocabChapter(ch){
 const pool=W.slice(Math.floor((ch-1)*W.length/10),Math.floor(ch*W.length/10));
 const eligible=pool.filter(w=>w[0]!==w[1]);
 let out=[];
 for(let i=0;i<COUNT;i++){
   const w=eligible[Math.floor((i+.3)*eligible.length/COUNT)%eligible.length];
   const cloze=i%2===1 && w[5]&&w[5].includes(w[0]);
   if(cloze){
      const qSource=w[5].replace(w[0],'（　　）');
      const distractors=W.filter(other=>other[0]!==w[0]&&!w[5].includes(other[0])&&sameType(w,other))
      .sort((x,y)=>Math.abs(x[0].length-w[0].length)-Math.abs(y[0].length-w[0].length))
      .concat(W.filter(other=>other[0]!==w[0]&&!w[5].includes(other[0])&&other[0].length>1))
      .map(x=>({jp:x[0],rec:{word:x}}));
      out.push(make('vocab',ch,'context',i+1,'次の文の（　）に入る最も適切な言葉を一つ選びなさい。',qSource,w[0],distractors,wordWhy(w,w[0],true),
       {target:w[0],example:w[5],exampleFuri:w[9],answerFuri:w[1]}));
   }else{
      const dist=allVRead.filter(x=>x[1]!==w[1]).sort((x,y)=>{
        const score=v=>Math.abs(v[1].length-w[1].length)*2+(v[1][0]===w[1][0]?0:7)+(v[1][1]===w[1][1]?0:3);
        return score(x)-score(y);
      }).slice(0,80).map(x=>({jp:x[1],rec:{word:x}}));
      out.push(make('vocab',ch,'reading',i+1,'次の言葉の読み方として、正しいものを選びなさい。',w[0],w[1],dist,wordWhy(w,w[1],false),
       {target:w[0],example:w[5],exampleFuri:w[9],answerFuri:w[1]}));
   }
 }
 return out;
}
function jpForm(f){
 let s=String(f||'');
 const dict=[[/\bNoun\b/gi,'名詞'],[/\bVerb-dict\b/gi,'動詞辞書形'],[/\bVerb-stem\b/gi,'動詞ます形語幹'],[/\bVerb-ta\b/gi,'動詞た形'],[/\bVerb-te\b/gi,'動詞て形'],[/\bVerb-nai\b/gi,'動詞ない形'],[/\bVerb-plain\b/gi,'動詞普通形'],[/\bVerb\b/gi,'動詞'],[/\bAdjective-i\b/gi,'い形容詞'],[/\bAdj-i\b/gi,'い形容詞'],[/\bAdj-na\b/gi,'な形容詞'],[/\bAdjective-na\b/gi,'な形容詞'],[/\bAdjective\b/gi,'形容詞'],[/\bPast\b/gi,'過去形'],[/\bPlain\b/gi,'普通形'],[/\bDictionary form\b/gi,'辞書形'],[/\bV-dict\b/gi,'動詞辞書形'],[/\bV-ta\b/gi,'動詞た形'],[/\bV-te\b/gi,'動詞て形'],[/\bV-nai\b/gi,'動詞ない形'],[/\bN\b/g,'名詞'],[/\bV\b/g,'動詞'],[/\bA\b/g,'形容詞'],[/\bClause\b/gi,'節'],[/\bSentence\b/gi,'文']];
 for(const [a,b] of dict)s=s.replace(a,b);
 return s.replace(/\s\+\s/g,' ＋ ').replace(/\s\/\s/g,' ／ ');
}
function grammarWhy(g,correct){
 const [pattern,meaning,ja,en,note,ne,form]=g;
 return explanation('正解は「'+correct+'」です。文型「'+pattern+'」を確認しましょう。接続は「'+jpForm(form)+'」です。例文：「'+ja+'」。接続と文中の意味のつながりから判断します。',
 'The tested N2 grammar is '+pattern+'. Meaning: '+meaning+'. Formation: '+form+'. Usage: '+note+'. Model: '+ja+' ('+en+').',
 'सही उत्तर「'+correct+'」 हो। N2 व्याकरण「'+pattern+'」को नेपाली अर्थ '+ne+'। जोड्ने तरिका「'+jpForm(form)+'」। जापानी उदाहरण「'+ja+'」।');
}
function grammarChapter(ch){
 const pool=GR.slice(Math.floor((ch-1)*GR.length/10),Math.floor(ch*GR.length/10)),out=[];
 for(let i=0;i<COUNT;i++){
   const g=pool[i%pool.length],step=Math.floor(i/pool.length),[pat,,ja,, , ,form,ja2,, ,reading,ja3, ,f1,f2,f3]=g;
   let prompt,source,right,wrong,kind,furi='';
   if(step===0||step===1||step>=4){
     kind='identify';
     const ix=step===0?0:step===1?1:2;
     source=ix===0?ja:ix===1?(ja2||ja):(ja3||ja2||ja);
     furi=ix===0?f1:ix===1?(f2||f1):(f3||f2||f1);
     prompt='次の例文で使われている文型として、最も適切なものを選びなさい。';
     right=pat;wrong=GR.filter(x=>x[0]!==pat).map(x=>({jp:x[0],rec:{grammar:x},furi:x[10]}));
   }else if(step===2){
     kind='example';
     prompt='次の文型の用例として、正しい文を一つ選びなさい。';
     source=pat;right=ja2||ja;
     wrong=GR.filter(x=>x[0]!==pat&&(x[7]||x[2])!==right).map(x=>({jp:x[7]||x[2],furi:x[14]||x[13],rec:{grammar:x}}));
     furi=reading;
   }else{
     kind='formation';
     prompt='次の文型の接続方法として、正しいものを選びなさい。';
     source=pat;right=jpForm(form);
     wrong=GR.filter(x=>x[0]!==pat).map(x=>({jp:jpForm(x[6]),rec:{grammar:x}}));
     furi=reading;
   }
   const q=make('grammar',ch,kind,i+1,prompt,source,right,wrong,grammarWhy(g,right),
     {sourceFuri:kind==='identify'?furi:'',target:pat,example:ja,exampleFuri:f1,hintFuri:kind!=='identify'?furi:'',answerFuri:kind==='example'?(f2||f1):'',metaGrammar:pat});
   q.grammar=g;
   out.push(q);
 }
 return out;
}
function businessChapter(ch){
 if(!BUSINESS.length)throw Error('Business scenario data was not loaded');
 const base=[];
 for(let i=0;i<10;i++){
   const sc=BUSINESS[((ch-1)*7+i)%BUSINESS.length];
   const [situation,correct,...rest]=sc,wrong=rest.slice(0,3);
   base.push(make('BJT',ch,'scenario',i+1,'次のビジネス場面で、最も適切な対応を選びなさい。',situation,correct,
     wrong.map(x=>({jp:x,rec:{business:true}})),
     explanation('正解：「'+correct+'」。'+sc[5]+' 相手や状況に合う敬語・説明の順序に注目しましょう。',
       'Correct response: '+correct+'. '+sc[6]+' The other responses are too blunt, inappropriate, incomplete or not sufficiently courteous for this situation.',
       'सही प्रतिक्रिया「'+correct+'」 हो। '+sc[7]+' अन्य विकल्पहरू यो कार्यस्थलको परिस्थितिका लागि नमिल्ने वा अशिष्ट छन्।'),
     {exam:'BJT',target:correct}));
 }
 const vocab=vocabChapter(ch).filter(q=>q.kind==='context').slice(0,20).map((q,i)=>({...q,id:'BJT-'+ch+'-business-vocab-'+i,exam:'BJT'}));
 const grammar=grammarChapter(ch).filter(q=>q.kind==='identify'||q.kind==='example').slice(0,20).map((q,i)=>({...q,id:'BJT-'+ch+'-business-grammar-'+i,exam:'BJT'}));
 // Not all original N2 examples are about work: they reinforce N2 grammar/vocabulary inside a business-focused review test.
 const full=[...base,...vocab,...grammar];
 if(full.length<50){
   const extra=[...vocabChapter(ch),...grammarChapter(ch)];
   for(let i=0;full.length<50&&i<extra.length;i++)full.push({...extra[i],id:'BJT-'+ch+'-general-'+i,exam:'BJT'});
 }
 return mix(full.slice(0,50),'BJT'+ch);
}
function mixedChapter(ch,exam){
 const k=kanjiChapter(ch),w=vocabChapter(ch),g=grammarChapter(ch);
 const share=exam==='JTEST'?[12,18,20]:exam==='JPT'?[16,18,16]:[18,16,16];
 return mix([...k.slice(0,share[0]),...w.slice(0,share[1]),...g.slice(0,share[2])]
  .map((q,i)=>({...q,id:exam+'-'+ch+'-'+q.id,exam})),exam+ch+'mixed');
}
function makePaper(exam,book,ch){
 if(!EXAMS.includes(exam))throw Error('Unknown exam');
 if(!Number.isInteger(ch)||ch<1||ch>10)throw Error('Unknown chapter');
 let out=exam==='JLPT'?({kanji:kanjiChapter,vocab:vocabChapter,grammar:grammarChapter}[book]||kanjiChapter)(ch)
  :exam==='BJT'?businessChapter(ch):mixedChapter(ch,exam);
 if(out.length!==COUNT)throw Error('Questions '+out.length+' instead of 50');
 for(const q of out){if(q.options.length!==4||new Set(q.options.map(x=>x.jp)).size!==4||q.answer<0||q.answer>=4||!q.why.ja||!q.why.en||!q.why.ne)throw Error('Invalid question '+q.id)}
 return out;
}
function ruby(s,enabled){
 const text=String(s||'');
 if(!enabled)return esc(text.replace(/\{([^|{}]+)\|([^{}]+)\}/g,'$1'));
 let out='',last=0,regex=/\{([^|{}]+)\|([^{}]+)\}/g,match;
 while((match=regex.exec(text))){out+=esc(text.slice(last,match.index))+'<ruby>'+esc(match[1])+'<rt>'+esc(match[2])+'</rt></ruby>';last=match.index+match[0].length}
 return out+esc(text.slice(last));
}
function markedWord(txt,reading,on){
 if(!on||!reading||txt===reading||!/[一-龯々]/.test(txt))return esc(txt);
 return '<ruby>'+esc(txt)+'<rt>'+esc(reading)+'</rt></ruby>';
}
function optionExplanation(q,opt,index){
 if(index===q.answer)return {
 ja:'正解です。問題の文脈、読み方、意味・接続方法のいずれも、この選択肢に合っています。',
 en:'Correct: this choice matches the target reading, sentence context or grammar formation.',
 ne:'सही हो। यो विकल्प प्रश्नको उच्चारण, वाक्यको प्रसंग वा व्याकरणिक बनावटसँग मिल्छ।'
 };
 const rec=opt.rec||{},wrong=opt.jp;
 if(rec.word){
  const w=rec.word;
  return {
   ja:'「'+wrong+'」は、別の語彙「'+w[0]+'（'+w[1]+'）」に対応する選択肢です。設問の対象語や文脈と一致しません。',
   en:'The option "'+wrong+'" is associated with the different N2 word '+w[0]+' ('+w[1]+'), glossed '+w[2]+'. It is not the recorded answer for the target.',
   ne:'「'+wrong+'」 अर्को N2 शब्द「'+w[0]+'（'+w[1]+'）」सँग सम्बन्धित छ। यसको अर्थ '+w[2]+' हुन्छ, तर यस प्रश्नको सही उत्तर होइन।'
  };
 }
 if(rec.kanji){
  const k=rec.kanji;
  return {ja:'「'+wrong+'」は別のN2漢字です。代表的な読みは「'+([...(k[3]||[]),...(k[4]||[])].join('・'))+'」です。問題の語とは一致しません。',
   en:'This is a different N2 character with recorded readings '+[...(k[3]||[]),...(k[4]||[])].join(', ')+'. It does not complete the tested item.',
   ne:'यो अर्को N2 कान्जी हो। यसको पढाइ '+[...(k[3]||[]),...(k[4]||[])].join('、')+' हो, त्यसैले प्रश्नको सही विकल्प होइन।'};
 }
 if(rec.grammar){
  const g=rec.grammar;
  return {ja:'この選択肢は別の文型「'+g[0]+'」に対応します。接続は「'+jpForm(g[6])+'」です。問題の例文・文型と合いません。',
   en:'This is associated with the different grammar pattern '+g[0]+' (meaning: '+g[1]+'). Its formation is '+g[6]+', rather than the target pattern.',
   ne:'यो विकल्प अर्को व्याकरण「'+g[0]+'」सँग सम्बन्धित छ। यसको नेपाली अर्थ '+g[5]+' हो। प्रश्नको प्रयोगसँग मिल्दैन।'};
 }
 if(rec.business){
  return {ja:'この表現は、相手への配慮や言葉遣いが業務場面に適していません。正答の丁寧な言い方と比べてください。',
   en:'This expression is too blunt, incomplete, or inappropriate for the stated business situation. Compare the level of politeness with the correct response.',
   ne:'यो वाक्य कार्यस्थलको परिस्थिति र शिष्ट भाषाको आवश्यकतासँग मेल खाँदैन। सही विनम्र उत्तरसँग तुलना गर्नुहोस्।'};
 }
 return {ja:'この選択肢は、問題の読み方・意味・文法的なつながりと合いません。正答と比較してください。',
 en:'This option does not match the target item; compare its form, reading and context with the supported answer.',
 ne:'यो विकल्प प्रश्नको लक्ष्य अर्थ वा पढाइसँग मेल खाँदैन। सही उत्तरसँग तुलना गर्नुहोस्।'};
}
window.NEXTSTEP_N2_MAKE_QUIZ=makePaper;
window.NEXTSTEP_N2_RUBY=ruby;
if(typeof document==='undefined')return;
const root=document.getElementById('quizroot');if(!root)return;
const el=id=>document.getElementById(id),qargs=new URLSearchParams(location.search);
let exam=EXAMS.includes(qargs.get('exam'))?qargs.get('exam'):'JLPT',
  book=BOOKS.includes(qargs.get('book'))?qargs.get('book'):'kanji',
  chap=Math.min(10,Math.max(1,parseInt(qargs.get('chapter'),10)||1)),
  showFuri=localStorage.getItem('nextstep-n2-furigana')==='yes',list=[],chosen={},finished=false;
const examLabels={JLPT:'JLPT N2',BJT:'BJT ビジネス日本語',JPT:'JPT 日本語練習',JTEST:'J.TEST 実用日本語',NAT:'NAT-TEST N2レベル復習'};
const sourceText=(q,review)=>{
  if(review&&q.example){
    let ja=q.exampleFuri?ruby(q.exampleFuri,showFuri):esc(q.example);
    return '<div class="extraexample"><b>復習例文</b><p lang="ja">'+ja+'</p></div>';
  }
  if(q.sourceFuri){
   return '<span lang="ja" class="ja">'+ruby(q.sourceFuri,showFuri)+'</span>';
  }
  if(showFuri&&q.hintFuri&&q.kind!=='reading'){
   // Grammar patterns have a supported full-reading form, rendered as a ruby annotation.
   return markedWord(q.source,q.hintFuri,true);
  }
  return jp(q.source);
};
function desc(q,index){
 const corr=q.options[q.answer],status=chosen[index]===q.answer;
 const classes=status?'rightnote':'wrongnote';
 return '<div class="decision '+classes+'" role="status"><b>'+(status?'✓ 正解です！ / Correct / सही':'✗ 不正解です / Incorrect / गलत')+'</b>'+
 '<div class="answerkey"><strong>正しい答え：</strong> '+esc(corr.jp)+'</div>'+
 '<div class="multilang"><h4>🇯🇵 日本語の解説</h4><p lang="ja">'+esc(q.why.ja)+'</p><h4>🇬🇧 English explanation</h4><p>'+esc(q.why.en)+'</p><h4>🇳🇵 नेपाली व्याख्या</h4><p lang="ne">'+esc(q.why.ne)+'</p></div>'+
 sourceText(q,true)+
 '<h4>選択肢の比較 / All four choices / चारवटै विकल्प</h4>'+
 '<div class="whyOptions">'+q.options.map((o,j)=>{
 const d=optionExplanation(q,o,j);
 return '<details class="optionwhy" '+(j===q.answer||j===chosen[index]?'open':'')+'><summary><strong>'+LETTERS[j]+'. '+esc(o.jp)+'</strong> '+(j===q.answer?'✓ 正解':'✗ 不正解')+'</summary>'+
 '<p lang="ja">'+esc(d.ja)+'</p><p lang="en">'+esc(d.en)+'</p><p lang="ne">'+esc(d.ne)+'</p></details>';
 }).join('')+'</div></div>';
}
function draw(){
 const names={kanji:'漢字',vocab:'語彙',grammar:'文法'};
 el('examselect').value=exam;el('bookselect').value=book;el('chapterselect').value=String(chap);
 el('bookselect').disabled=exam!=='JLPT';
 el('furiganatoggle').setAttribute('aria-pressed',String(showFuri));
 el('furiganatoggle').textContent=showFuri?'ふりがな ON ✓':'ふりがな OFF';
 el('quiztitle').textContent=examLabels[exam]+' · '+(exam==='JLPT'?names[book]+' · ':'')+'第'+chap+'課';
 el('sub').textContent='各課50問。選んだ瞬間に正誤と日本語・English・नेपालीの解説を表示します。';
 el('modenote').textContent=exam==='JLPT'
  ?'JLPT N2の漢字・語彙・文法を練習するオリジナル問題です。公式過去問ではありません。'
  :exam==='BJT'
  ?'敬語・電話・メールなどのビジネス場面10問とN2日本語40問を組み合わせた独自問題です。公式BJT形式・配点ではありません。'
  :'N2語彙・漢字・文法を混合した独自復習問題です。'+examLabels[exam]+'の公式出題形式とは異なる場合があります。聴解は含まれません。';
 list=makePaper(exam,book,chap);chosen={};finished=false;el('summary').innerHTML='';el('endpaper').classList.remove('hide');
 el('progress').textContent='解答済み 0 / 50 · 正解 0';
 root.innerHTML=list.map((q,i)=>
 '<fieldset class="qitem" id="question-'+i+'"><legend><span class="badge">問題 '+(i+1)+'/50</span> '+esc(q.prompt)+'</legend>'+
 '<div class="prompt-ja">'+sourceText(q,false).replace(/\n/g,'<br>')+'</div>'+
 (q.kind==='reading'?'<p class="reading-note">※ 読み方の問題では、答えが見えないように対象語のふりがなを表示しません。</p>':'')+
 '<div class="option-list" role="group" aria-label="選択肢">'+q.options.map((opt,j)=>
 '<button class="choice" type="button" data-qi="'+i+'" data-oi="'+j+'" aria-label="選択肢'+LETTERS[j]+': '+esc(opt.jp)+'"><b class="letter">'+LETTERS[j]+'</b> '+
 (opt.furi&&showFuri?ruby(opt.furi,true):jp(opt.jp))+'</button>').join('')+'</div>'+
 '<div id="feedback-'+i+'" class="feedback" aria-live="polite"></div></fieldset>').join('');
 if(history?.replaceState)history.replaceState(null,'','?exam='+exam+'&book='+book+'&chapter='+chap);
}
function progress(){
 const n=Object.keys(chosen).length,correct=Object.keys(chosen).filter(i=>chosen[i]===list[Number(i)].answer).length;
 el('progress').textContent='解答済み '+n+' / 50 · 正解 '+correct;
 if(n===50)endPaper();
}
function select(index,option){
 if(Object.prototype.hasOwnProperty.call(chosen,index))return;
 chosen[index]=option;const q=list[index];
 const box=el('question-'+index);
 for(const btn of box.querySelectorAll('.choice')){
   const j=+btn.dataset.oi;btn.disabled=true;btn.classList.toggle('correct',j===q.answer);btn.classList.toggle('incorrect',j===option&&option!==q.answer);
 }
 el('feedback-'+index).innerHTML=desc(q,index);
 progress();
 try{localStorage.setItem('nextstep-n2-quiz-'+exam+'-'+book+'-'+chap,JSON.stringify({answered:Object.keys(chosen).length,score:Object.keys(chosen).filter(i=>chosen[i]===list[Number(i)].answer).length}))}catch(e){}
}
function endPaper(){
 if(finished)return;finished=true;
 const attempts=Object.keys(chosen).length,correct=Object.keys(chosen).filter(i=>chosen[i]===list[Number(i)].answer).length;
 el('summary').innerHTML='<div class="scorebox"><h2>結果 '+correct+' / 50 正解</h2><p>解答済み：'+attempts+' / 50。未解答は不正解として計算します。</p>'+
 '<p lang="en">Score: '+correct+'/50. Answered: '+attempts+'/50.</p><p lang="ne">सही: '+correct+'/५०। जम्मा प्रयास: '+attempts+'/५०।</p>'+
 '<button type="button" id="printpaper">🖨 問題と解説をPDFに保存</button></div>';
 el('printpaper').addEventListener('click',()=>window.print());
}
root.addEventListener('click',e=>{const btn=e.target.closest('button[data-qi]');if(btn)select(+btn.dataset.qi,+btn.dataset.oi)});
el('examselect').addEventListener('change',e=>{exam=e.target.value;draw()});
el('bookselect').addEventListener('change',e=>{book=e.target.value;draw()});
el('chapterselect').addEventListener('change',e=>{chap=+e.target.value;draw()});
el('furiganatoggle').addEventListener('click',()=>{
 showFuri=!showFuri;
 try{localStorage.setItem('nextstep-n2-furigana',showFuri?'yes':'no')}catch(e){}
 const old={...chosen};draw();
 // Preserve and reapply exactly the same answers after toggling furigana.
 for(const [i,j] of Object.entries(old))select(+i,+j);
});
el('endpaper').addEventListener('click',endPaper);
el('resetquiz').addEventListener('click',()=>{draw();window.scrollTo({top:0,behavior:'smooth'})});
draw();
})();