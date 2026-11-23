/* Independent JLPT-style reading/listening practice templates.
   Aligns subtypes to official JLPT Composition of Test Items (2026).
   These are original instructional items, NOT actual test questions.
   https://www.jlpt.jp/e/guideline/testsections.html */
(function(global){'use strict';
const TYPES={
  N1:{reading:['短文','中文','長文','統合理解','主張理解','情報検索'],listening:['課題理解','ポイント理解','概要理解','即時応答','統合理解']},
  N2:{reading:['短文','中文','統合理解','主張理解','情報検索'],listening:['課題理解','ポイント理解','概要理解','即時応答','統合理解']},
  N3:{reading:['短文','中文','長文','情報検索'],listening:['課題理解','ポイント理解','概要理解','発話表現','即時応答']},
  N4:{reading:['短文','中文','情報検索'],listening:['課題理解','ポイント理解','発話表現','即時応答']},
  N5:{reading:['短文','中文','情報検索'],listening:['課題理解','ポイント理解','発話表現','即時応答']}
};
const DAYS=['月曜日','火曜日','水曜日','木曜日','金曜日','土曜日','日曜日'];
const TIMES=['午前９時','午前１０時','午前１１時','午後１時','午後２時','午後３時','午後４時'];
const PLACES=['図書館','学校','市民センター','公民館','駅前のホール','大学の教室','文化センター','会議室'];
const THEMES=['日本語教室','読書会','説明会','勉強会','文化交流会','講習会','作品展示会','地域の集まり'];
function hash(str){let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0;}
function shuffle(a,key){const x=[...a];let s=hash(key);for(let i=x.length-1;i>0;i--){s^=s<<13;s^=s>>>17;s^=s<<5;const k=(s>>>0)%(i+1);[x[i],x[k]]=[x[k],x[i]];}return x;}
function pick(arr,n){return arr[((n%arr.length)+arr.length)%arr.length];}
function context(level,paper,index,kind){const n=hash(level+':'+paper+':'+index+':'+kind);const day=pick(DAYS,n),time=pick(TIMES,n>>>3),place=pick(PLACES,n>>>6),theme=pick(THEMES,n>>>10);
 const oldTime=pick(TIMES,TIMES.indexOf(time)+2),oldPlace=pick(PLACES,PLACES.indexOf(place)+3);
 return{day,time,place,theme,oldTime,oldPlace};}
function variant(level,kind,subtype,ctx,sequence){
 const {day,time,place,theme,oldTime,oldPlace}=ctx;
 if(level==='N5'){
  return{short:'【お知らせ】'+day+'に'+place+'で'+theme+'があります。'+time+'に始まります。',mid:'わたしは'+day+'に'+place+'へ行きます。'+theme+'は'+time+'からです。友だちといっしょに行きます。',info:'【イベント】'+theme+'\n日にち：'+day+'\n場所：'+place+'\n時間：'+time};
 }
 if(level==='N4'){
  return{short:'【お知らせ】'+day+'の'+theme+'は、'+oldTime+'ではなく'+time+'からです。場所は'+place+'です。',mid:'来週の'+theme+'について連絡します。'+day+'に'+place+'で行います。時間は'+oldTime+'から'+time+'に変わりました。申し込んだ人は気をつけてください。',info:'【'+theme+'のご案内】\n日時：'+day+'　'+time+'\n会場：'+place+'\n変更前：'+oldTime};
 }
 if(level==='N3'){
  return{short:'【連絡】'+day+'に'+place+'で予定している'+theme+'は、準備のため開始時刻を'+oldTime+'から'+time+'へ変更します。会場は変わりません。',mid:'先日お知らせした'+theme+'の日時が変更になりました。参加者から準備時間を確保したいという意見があり、'+day+'の開始を'+oldTime+'から'+time+'に変更しました。ただし、会場は'+place+'のままです。参加する方は新しい予定をご確認ください。',info:'【'+theme+'　変更のお知らせ】\n開催日：'+day+'\n開始時刻：'+time+'（変更前：'+oldTime+'）\n会場：'+place};
 }
 if(level==='N2'){
  return{short:'【通知】'+day+'に'+place+'で行われる'+theme+'については、運営上の都合により開始時刻を'+oldTime+'から'+time+'に変更した。会場の変更はない。',mid:'今回の'+theme+'では、参加者の学習時間を確保するため、日程を見直すことになった。従来は'+day+'の'+oldTime+'に始まる予定だったが、準備を十分に行う必要があるとの指摘を受け、開始を'+time+'に改めた。会場は引き続き'+place+'である。参加を希望する人には、変更後の時刻を確認してもらいたい。',info:'【実施概要】\n行事：'+theme+'\n実施日：'+day+'\n新しい開始：'+time+'\n変更前：'+oldTime+'\n会場：'+place};
 }
 return{short:'【事務連絡】'+day+'に'+place+'で開催する'+theme+'は、事前準備の見直しに伴い、当初公表していた'+oldTime+'から開始時刻を'+time+'へ変更する。会場については変更しない。',mid:'近年、学習の成果を測る際には、参加人数だけでなく学びがどの程度継続されているかを検討する必要があると指摘されている。今回の'+theme+'も、単に参加者を増やすのではなく、参加後の学習につながる時間の確保を重視している。この方針を踏まえ、'+day+'に'+place+'で実施する催しの開始は、従来の'+oldTime+'から'+time+'に改められた。担当者は、日程の変更は目的ではなく、活動の質を高めるための手段だと説明している。',info:'【改訂後の実施要領】\n対象行事：'+theme+'\n実施日：'+day+'\n新しい開始時刻：'+time+'\n従来の開始時刻：'+oldTime+'\n会場：'+place};
}
function buildReading(level,paper,index){
 const types=TYPES[level].reading,subtype=types[(index+(paper-1))%types.length],ctx=context(level,paper,index,'read');
 const v=variant(level,'read',subtype,ctx,index);
 let passage=v.short,query='開始時刻はいつですか。',answer=ctx.time,options=TIMES.filter(x=>x!==answer);
 if(subtype==='中文'||subtype==='主張理解'||subtype==='長文')passage=v.mid;
 if(subtype==='情報検索')passage=v.info;
 if(subtype==='長文'){
  passage+='\n\nただし、予定を変更する際には、参加する人が必要な情報を手に入れられるよう、十分に知らせることが欠かせない。突然の変更が続くと、活動そのものへの信頼が失われるおそれがある。実施担当者は今回の経験を踏まえ、変更の理由と新しい計画を分かりやすく示す仕組みを検討することにした。';
  passage+='\n\nこうした対応は、一時的な負担を生むとしても、今後の参加を支える基盤になるだろう。';
 }
 if(subtype==='統合理解'){
  passage='【資料Ａ】'+v.short+'\n\n【資料Ｂ】申込者へのメール：先に送った案内の'+ctx.oldTime+'は変更前の情報です。新しい開始時刻は'+ctx.time+'です。実施場所は'+ctx.place+'です。';
  query='二つの資料を合わせると、正しい開始時刻はいつですか。';
 }
 if(subtype==='主張理解'){
   query='筆者がもっとも重視していることは何ですか。';
   answer='学習の質を高めるために活動を工夫すること';
   options=['とにかく参加人数を増やすこと','予定の変更を一切認めないこと','開催場所を毎回変えること'];
 }
 else if(subtype==='長文'&&(level==='N1'||level==='N3')){
  query='文章全体から、担当者が今後取り組もうとしていることは何ですか。';
  answer='変更の理由と新しい計画を分かりやすく知らせること';
  options=['変更を参加者に知らせないこと','毎回予定を直前に決めること','催しをすべて中止すること'];
 }
 else if(index%3===1&&subtype!=='統合理解'){
  query='イベントが行われるのはどこですか。';answer=ctx.place;options=PLACES.filter(x=>x!==answer);
 }else if(index%3===2&&subtype!=='統合理解'){
  query='何曜日に行われますか。';answer=ctx.day;options=DAYS.filter(x=>x!==answer);
 }
 const choices=shuffle([answer,...options.slice(0,3)],'reading:'+level+':'+paper+':'+index);
 return{type:'読解',subtype,prompt:'【'+subtype+'】次の文章を読んで、質問に答えてください。\n\n'+passage+'\n\n【質問】'+query,
  passage,options:choices,answer:choices.indexOf(answer),sourceType:'reading-structured',correctValue:answer,question:query,
  explanation:{ja:'文章の情報から、正しい答えは「'+answer+'」です。',ne:'पाठमा दिएको विवरण अनुसार सही उत्तर '+answer+' हो।',en:'The passage supports '+answer+' as the correct answer.'}};
}
function buildListening(level,paper,index){
 const types=TYPES[level].listening,subtype=types[(index+(paper-1))%types.length],ctx=context(level,paper,index,'listen');
 const {day,time,place,theme,oldTime}=ctx;
 let answer=time,query='新しい開始時刻はいつですか。',options=TIMES.filter(x=>x!==answer);
 let speech='女：'+theme+'についてお知らせします。'+day+'に'+place+'で行います。開始は'+oldTime+'から'+time+'に変わりました。\n男：わかりました。'+time+'ですね。';
 if(subtype==='課題理解'){
  query='男の人は何を確認する必要がありますか。';
  answer='新しい開始時刻';options=['会場の予約番号','参加費の支払い方法','別のイベントの名前'];
  speech='女：'+theme+'に来る方へ、予定が変わったことを伝えてください。時間は'+oldTime+'から'+time+'になりました。\n男：はい。開始時間の変更を確認して、みなさんに伝えます。';
 }else if(subtype==='ポイント理解'){
  query='新しい開始時刻はいつですか。';
 }else if(subtype==='概要理解'){
  query='この会話の主な内容は何ですか。';
  answer='イベントの開始時刻が変更されたこと';options=['イベントが中止されたこと','参加費が高くなったこと','会場が閉鎖されたこと'];
 }else if(subtype==='発話表現'){
  query='こんなとき、何と言うのが適切ですか。';
  answer='はい、変更された時間を確認します。';
  options=['いいえ、何も聞いていません。','はい、時間を守らなくていいです。','いいえ、その場所は知りません。'];
  speech='女：すみません、'+theme+'は'+oldTime+'ではなく、'+time+'からです。間違えないようにしてください。\n男：';
 }else if(subtype==='即時応答'){
  query='この問いかけに対する最も適切な返事はどれですか。';
  answer='はい、'+time+'からですね。';options=['いいえ、会場はありません。','はい、昨日は休みでした。','いいえ、私は図書館です。'];
  speech='女：すみません。'+theme+'の開始は'+time+'に変わりましたが、よろしいですか。';
 }else if(subtype==='統合理解'){
  query='男の人は、どの予定をメモすればよいですか。';
  answer=day+'・'+time;options=[day+'・'+oldTime,'日曜日・'+time,'月曜日・'+oldTime];
  speech='男：先ほどのご案内を確認したいのですが、'+theme+'は'+day+'ですよね。\n女：はい、会場は'+place+'です。時間だけ、以前の'+oldTime+'から'+time+'に変わりました。\n男：それでは、新しい時間を書いておきます。';
 }
 const choices=shuffle([answer,...options.slice(0,3)],'listen:'+level+':'+paper+':'+index);
 return{type:'聴解',subtype,prompt:'【'+subtype+'】音声を聞いて、もっともよいものを選んでください。\n【質問】'+query,
  passage:speech,options:choices,answer:choices.indexOf(answer),listen:true,sourceType:'listening-structured',
  correctValue:answer,question:query,
  // Only selected task types use a simple accompanying visual schedule.
  visual:(subtype==='課題理解'||subtype==='統合理解')?{label:theme,day,place,oldTime,newTime:time}:null,
  explanation:{ja:'会話の内容から正しい答えは「'+answer+'」です。',ne:'संवादको आधारमा सही उत्तर '+answer+' हो।',en:'The audio script supports '+answer+' as the correct answer.'}};
}
global.NextStepExamTypes={TYPES,buildReading,buildListening};
})(window);
