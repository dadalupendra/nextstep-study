/* Authored original reading passages for JLPT-inspired educational practice.
   These texts are not official past-paper questions. */
(function(global){'use strict';
const TOPICS=[
 {name:'図書館の利用',place:'図書館',actor:'職員',action:'夜も本を借りられるようにした',reason:'仕事や学校が終わったあとでも利用できるようにするため',result:'利用者は増えたが職員の負担も大きくなった',claim:'便利さと働く人の負担の両方を考えるべきだ',
  plain:'図書館は夕方も開いています。学校が終わってから本を借りることができます。',extra:'一方で、開館時間を延ばすには人員の配置や安全への配慮が必要になる。',wrong:['利用者が少ないから時間を短くするため','図書館を閉めてしまうため','すべての本を新しくするため']},
 {name:'地域の祭り',place:'町の広場',actor:'実行委員',action:'地域の人に準備を手伝ってもらった',reason:'参加する人同士の交流を深めるため',result:'新しい友人ができた一方で準備に時間がかかった',claim:'行事の成功は来場者の数だけで判断できない',
  plain:'日曜日に町でお祭りがあります。みんなで準備をしています。わたしは友だちと店を手伝います。',extra:'参加した人が互いの考え方を知り、活動を来年につなげられるかも重要な点である。',wrong:['お祭りを中止するため','買い物を禁止するため','会場を毎週変えるため']},
 {name:'学校のグループ学習',place:'学校',actor:'先生',action:'生徒が少人数で意見を出し合う時間を設けた',reason:'自分と違う考え方にも気づけるようにするため',result:'話し合いが活発になったが発言しにくい生徒もいた',claim:'発言の多さだけでなく一人ひとりの理解を確かめることが大切だ',
  plain:'今日は学校で友だちと勉強します。先生が問題を出します。みんなで答えを考えます。',extra:'全員が参加できるよう、発言以外の方法で意見を示す機会も用意する必要がある。',wrong:['宿題をなくすため','勉強する時間を短くするため','教室の場所を変えるため']},
 {name:'公共交通の改善',place:'駅',actor:'市の担当者',action:'バスの時刻を見直した',reason:'電車から乗り換える人が待ちやすくなるようにするため',result:'通勤が便利になったが一部の時間帯では混雑した',claim:'一部の利用者だけでなく地域全体の移動を考える必要がある',
  plain:'駅の前にバスが来ます。新しい時間になりました。電車を降りてからバスに乗ります。',extra:'便数だけを増やしても解決しない問題があるため、利用状況の継続的な調査が欠かせない。',wrong:['駅を閉めるため','バスを全部なくすため','電車を止めるため']},
 {name:'会社の働き方',place:'会社',actor:'管理者',action:'自宅でも仕事ができる日を増やした',reason:'移動にかかる時間を減らして仕事に集中できるようにするため',result:'作業は進んだが情報共有が難しい場面もあった',claim:'自由な働き方と必要な情報共有を両立させるべきだ',
  plain:'父は今日は家で仕事をします。パソコンを使います。午後は会社の人と話します。',extra:'勤務場所の選択肢を増やすことは有効だが、仕事の進め方まで個人任せにしてよいとは限らない。',wrong:['仕事を全部やめるため','毎日遠くへ出かけるため','会社の電話を使わないため']},
 {name:'公園の環境',place:'公園',actor:'地域の人',action:'木を植えてごみを拾う活動を始めた',reason:'子どもも大人も安心して過ごせる場所にするため',result:'公園はきれいになったが活動を続ける人が少なくなった',claim:'一度だけの取り組みより続けられる仕組みを作ることが重要だ',
  plain:'土曜日に公園へ行きます。友だちとごみを拾います。公園をきれいにします。',extra:'短期的な成果を示すだけではなく、住民の負担を減らしながら参加を維持する工夫が求められる。',wrong:['公園に入れないようにするため','すべての木を切るため','ごみを増やすため']},
 {name:'ニュースの読み方',place:'教室',actor:'講師',action:'同じ出来事を伝える複数の記事を比較した',reason:'一つの情報だけですぐ判断しない習慣を身につけるため',result:'違いが分かるようになったが確認には時間が必要だった',claim:'情報を早く得ることと正確に理解することは同じではない',
  plain:'先生は新聞を読みます。わたしもニュースを読みます。分からないことを先生に聞きます。',extra:'見出しの印象が強いほど、本文や出典を確かめずに結論を出してしまう危険がある。',wrong:['ニュースを読まないため','新聞を全部捨てるため','記事の題名だけ覚えるため']},
 {name:'健康と運動',place:'体育館',actor:'指導員',action:'毎日少しずつ体を動かす活動を提案した',reason:'無理をせず運動を続けられるようにするため',result:'参加者の習慣が変わったが忙しい日は参加が難しかった',claim:'一度に頑張るより自分に合った方法で継続することが大切だ',
  plain:'朝、公園を歩きます。天気がいい日は友だちと走ります。毎日少し運動します。',extra:'目標を高く設定しすぎると継続そのものが負担になる可能性もある。',wrong:['毎日長い時間走らせるため','運動を禁止するため','学校を休ませるため']}
];
const QUESTIONS={
  short:['文章の内容と合っているものはどれですか。','何について書かれていますか。'],
  mid:['この活動を始めた理由は何ですか。','活動の結果として書かれているのはどれですか。'],
  long:['筆者が最も伝えたいことは何ですか。','文章の結論として適切なのはどれですか。']
};
const wrongResult=['活動には何の変化もなかった','参加する人は一人もいなかった','最初からすべての課題が解決していた'];
const wrongClaim=['人数が多ければ内容は考えなくてよい','一度決めた方法は変更しないほうがよい','短期的な結果だけで成功を決めるべきだ'];
function hash(s){let h=0;for(const c of s)h=(h*33+c.charCodeAt(0))>>>0;return h;}
function shuffle(a,k){const arr=[...a];let h=hash(k);for(let i=arr.length-1;i>0;i--){h=(Math.imul(1664525,h)+1013904223)>>>0;const j=h%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function story(level,paper,index,subtype){
 const seed=hash(level+'|'+paper+'|'+index),t=TOPICS[seed%TOPICS.length];
 const isLong=subtype==='長文'||subtype==='主張理解',isShort=subtype==='短文';
 let passage,query,answer,alternatives;
 if(level==='N5'){
  passage=t.plain+(isShort?'':'\n\n今日は'+t.place+'に行きます。みんなといっしょに活動をします。');
  query='この文章では、どんなことをしていますか。';answer=t.plain.split('。')[0]+'。';
  alternatives=[...TOPICS.filter(x=>x!==t).slice(0,3).map(x=>x.plain.split('。')[0]+'。')];
 }else if(level==='N4'){
  passage=t.plain+'\n\n'+t.actor+'は、'+t.reason+'、'+t.action+'。';
  if(!isShort)passage+='\n\nその後、'+t.result+'。';
  query='この活動をしたのはなぜですか。';answer=t.reason;alternatives=t.wrong;
 }else{
  passage=t.name+'について、新しい試みが始まった。'+t.actor+'は、'+t.reason+'、'+t.action+'。';
  if(!isShort)passage+='\n\nその結果、'+t.result+'。'+t.extra;
  if(isLong){
   passage+='\n\nこの事例は、目に見える成果だけを取り上げても、活動の価値を十分には評価できないことを示している。取組が始まった背景と、参加する人に生じる負担の両方を検討する必要がある。';
   passage+='\n\nしたがって、'+t.claim+'。新しい制度や活動を導入するときは、短期的な効果にとらわれず、継続できるかどうかを判断する視点も欠かせない。';
   if(level==='N1')passage+='\n\nもっとも、あらゆる利害を事前に調整することが可能だとは限らない。だからこそ、決定の後も状況を確認し、必要があれば運用を見直す余地を残しておくことが重要なのである。';
  }
  const mode=isLong?'claim':isShort?'reason':(seed%2?'reason':'result');
  if(mode==='claim'){query='筆者の主張に最も近いものはどれですか。';answer=t.claim;alternatives=wrongClaim;}
  else if(mode==='result'){query='活動の結果として本文に書かれているのはどれですか。';answer=t.result;alternatives=wrongResult;}
  else{query='この活動を始めた理由は何ですか。';answer=t.reason;alternatives=t.wrong;}
 }
 if(level==='N2'&&!isShort)passage+='\n\n今後は、課題を整理しながら効果を確かめ、必要に応じて方法を改善していく予定である。';
 if(level==='N1'&&!isShort&&!isLong)passage+='\n\n制度の意図と運用上の課題を切り離して考えるのではなく、その関係を十分に検討する姿勢が求められている。';
 const choices=shuffle([answer,...alternatives.slice(0,3)],level+'|'+paper+'|'+index);
 return{type:'読解',subtype,prompt:'【'+subtype+'】次の文章を読んで、質問に答えてください。\n\n'+passage+'\n\n【質問】'+query,passage,
 options:choices,answer:choices.indexOf(answer),correctValue:answer,question:query,sourceType:'reading-structured',
 explanation:{ja:'本文によると「'+answer+'」が適切です。',ne:'पाठमा भएको जानकारीअनुसार '+answer+' सही उत्तर हो।',en:'The passage supports this answer: '+answer+'.'}};
}
global.NextStepReadingStories={story};
})(window);
