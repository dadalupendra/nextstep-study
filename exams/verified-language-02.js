/* Authored original Japanese language questions for existing Paper 02.
   These are NOT generated permutations or official JLPT past questions. */
(function(global){'use strict';
const words={
N5:[
['家族','かぞく','family','परिवार','わたしの家族は四人です。',['かそう','いえぞく','かじょく']],
['来週','らいしゅう','next week','अर्को हप्ता','来週、友だちに会います。',['らいしょ','きしゅう','らいじゅう']],
['午前','ごぜん','before noon / a.m.','बिहान','授業は午前九時からです。',['ごせん','こぜん','ごまえ']],
['誕生日','たんじょうび','birthday','जन्मदिन','今日は弟の誕生日です。',['たんしょうび','だんじょうび','たんじょび']],
['友達','ともだち','friend','साथी','日曜日は友達と遊びます。',['ゆうたつ','ともたち','ともだつ']]],
N4:[
['受付','うけつけ','reception / registration','स्वागत कक्ष / दर्ता','受付で名前を書いてください。',['うけづけ','じゅふ','うけとけ']],
['景色','けしき','scenery','दृश्य','山の上からきれいな景色が見えます。',['けいしき','げしき','けいしょく']],
['季節','きせつ','season','ऋतु','春は花が咲く季節です。',['きぜつ','きふし','きせち']],
['引っ越す','ひっこす','to move house','बसाइँ सर्नु','来月、新しい家に引っ越します。',['ひきこす','ひっこうす','ひっこる']],
['残念','ざんねん','unfortunate / disappointing','दुःखद / अफसोस','雨で試合が中止になって残念です。',['さんねん','ざんれん','ざんなん']]],
N3:[
['手続き','てつづき','procedure','प्रक्रिया','申し込みの手続きを終えました。',['しゅつづき','てつつき','てづつき']],
['結果','けっか','result','नतिजा','試験の結果が発表されました。',['けつか','けっけ','けっが']],
['比較','ひかく','comparison','तुलना','二つの方法を比較してみます。',['ひこう','びかく','ひがく']],
['原因','げんいん','cause','कारण','事故の原因を調べています。',['げんにん','けんいん','げんじん']],
['参加者','さんかしゃ','participant','सहभागी','参加者には資料を配ります。',['さんがしゃ','さんかもの','ざんかしゃ']]],
N2:[
['維持','いじ','maintenance / preservation','कायम राख्नु','品質を維持することは大切です。',['いち','ゆいじ','いし']],
['運営','うんえい','management / operation','सञ्चालन','学生たちが行事を運営しています。',['うんけい','うんえ','うんよう']],
['調整','ちょうせい','adjustment','समायोजन','会議の日程を調整しました。',['ちょうしょう','ちょうぜい','じょうせい']],
['納得','なっとく','understanding / acceptance','चित्त बुझ्नु','説明を聞いて納得しました。',['のうとく','なっと','なっどく']],
['配慮','はいりょ','consideration','विचार / ख्याल','周囲への配慮が必要です。',['はいろ','ばいりょ','はいりょう']]],
N1:[
['是正','ぜせい','correction / rectification','सुधार / सच्याउनु','運用上の問題を是正するよう求められた。',['ぜしょう','せぜい','ぜじょう']],
['慎重','しんちょう','careful / prudent','सावधान','慎重な判断が求められている。',['しんじゅう','しんしょう','じんちょう']],
['概略','がいりゃく','outline / summary','सारांश','計画の概略を説明してください。',['かいりゃく','がいりく','がいりょう']],
['依拠','いきょ','reliance / based on','आधारित हुनु','その主張は複数の資料に依拠している。',['いきょう','えきょ','いこ']],
['齟齬','そご','discrepancy / mismatch','असंगति / बेमेल','担当者間の認識に齟齬が生じた。',['そが','そうご','しょご']]]
};
const grammar={
N5:[
['わたしは朝六時（　）起きます。','に',['で','を','へ'],'時刻は「に」で表します。','に marks a specific time.','निश्चित समयका लागि に प्रयोग हुन्छ।'],
['へやに犬が（　）。','います',['あります','します','見ます'],'動物の存在には「います」を使います。','Use います for the existence of living animals.','जनावरको अस्तित्व जनाउन います प्रयोग हुन्छ।'],
['この車は兄（　）です。','の',['が','を','に'],'「の」は所有・持ち主を示します。','の marks possession: the car belongs to the older brother.','の ले दाइको गाडी भन्ने स्वामित्व जनाउँछ।'],
['駅まで歩いて（　）。','行きます',['来ましたか','あります','いる'],'「歩いて行く」は歩いて目的地へ向かう意味です。','歩いて行きます means to go somewhere on foot.','歩いて行く ले हिँडेर जानु जनाउँछ।'],
['きのう買った本を（　）。','読みました',['読んでいますか','読みです','読むでした'],'「昨日」に合わせて過去形「読みました」を用います。','読みました is the past polite form, matching yesterday.','हिजो भएको कामका लागि भूतकाल 読みました प्रयोग हुन्छ。']
],
N4:[
['明日雨が降る（　）、試合は中止です。','なら',['まで','だけ','しか'],'「〜なら」は仮定の条件を表します。','なら introduces a hypothetical condition.','なら ले यदि भन्ने शर्त जनाउँछ।'],
['漢字が少しずつ読める（　）なりました。','ように',['ことに','ために','そうに'],'「〜ようになる」は能力の変化を示します。','Potential verb + ようになる expresses becoming able to do something.','ようになる ले नयाँ क्षमता हासिल हुनु जनाउँछ।'],
['疲れて（　）、宿題を終わらせます。','いても',['いるので','いたら','いれば'],'「〜ても」は逆接の条件を表します。','ても expresses even if / despite.','ても ले थकित भए पनि भन्ने विरोध जनाउँछ।'],
['会議は午後三時から始まる（　）。','と思います',['ときです','ようですか','ながらです'],'「〜と思います」は話者の考えを表します。','と思います expresses the speaker’s thought.','と思います ले आफ्नो विचार बताउँछ।'],
['旅行の前に、ホテルを予約し（　）。','ておきます',['てしまいましたか','てみたい','ているから'],'「〜ておく」は事前の準備です。','ておく indicates doing something in advance.','ておく ले पहिले नै तयारी गर्नु जनाउँछ।']
],
N3:[
['大雨（　）、電車が遅れています。','により',['によると','に対し','ばかりで'],'「〜により」は原因を示します。','により introduces a cause.','により ले कारण देखाउँछ।'],
['明るい（　）帰りましょう。','うちに',['ところへ','ままに','以来'],'「〜うちに」はある状態が続く間です。','うちに means while a condition still holds.','うちに ले उज्यालो हुँदै गर्दा भन्ने समय जनाउँछ।'],
['会った（　）なのに、名前を覚えていない。','ばかり',['うち','ため','以上'],'「〜たばかり」は直前に起きたことを表します。','たばかり means just recently did something.','たばかり ले भर्खरै गरेको काम जनाउँछ।'],
['毎日三十分、日本語を勉強する（　）しました。','ことに',['ように','ために','とおりに'],'「〜ことにする」は自分で決める意味です。','ことにする indicates making a personal decision.','ことにする ले आफैले निर्णय गर्नु जनाउँछ।'],
['忘れ物をしない（　）、出かける前に確認します。','ように',['ものの','だけに','ほど'],'「〜ないように」は予防の目的を表します。','ないように expresses prevention.','ないように ले नबिर्सियोस् भन्ने उद्देश्य जनाउँछ।']
],
N2:[
['調査結果（　）、新しい方針を決めた。','に基づいて',['を問わず','に限って','に反して'],'「〜に基づいて」は根拠を表します。','に基づいて means based on evidence.','に基づいて ले तथ्यका आधारमा भन्ने जनाउँछ।'],
['年齢（　）、誰でも参加できます。','にかかわらず',['にこたえて','にひきかえ','に先立って'],'「〜にかかわらず」は条件の違いを問題にしません。','にかかわらず means regardless of.','にかかわらず ले उमेर जेसुकै भए पनि भन्ने जनाउँछ।'],
['仕事を続け（　）、資格試験の準備をしています。','つつ',['だけあって','にもかかわらず','に限らず'],'「〜つつ」は並行する二つの動作を表します。','つつ expresses simultaneous actions.','つつ ले एकै समयमा दुई काम जनाउँछ।'],
['留学（　）、さまざまな価値観に触れた。','を通じて',['を問わず','に先立ち','に反して'],'「〜を通じて」は経験の機会・手段です。','を通じて means through the experience of.','を通じて ले अनुभवमार्फत जनाउँछ।'],
['参加者の希望（　）、内容を調整します。','に応じて',['に反して','に限って','をよそに'],'「〜に応じて」は状況に合わせる意味です。','に応じて means according to individual needs.','に応じて ले आवश्यकताअनुसार जनाउँछ।']
],
N1:[
['調査に不備が見つかり、計画の変更を（　）された。','余儀なく',['見込まず','差し控え','いとわず'],'「〜を余儀なくされる」は事情により避けられない変更です。','余儀なくされる means to be compelled by circumstances.','余儀なくされる ले परिस्थितिले बाध्य गर्नु जनाउँछ।'],
['この問題の深刻さは、改めて説明する（　）。','までもない',['ことなく','に越したことはない','いかんだ'],'「〜までもない」はわざわざする必要がないことです。','までもない means there is no need to do something.','までもない ले फेरि व्याख्या गर्नु आवश्यक छैन भन्ने जनाउँछ।'],
['ご挨拶（　）、資料をお届けに参りました。','かたがた',['とあって','ずくめで','まみれで'],'「〜かたがた」は一つの機会に別の目的も果たすことです。','かたがた means while also taking the opportunity to.','かたがた ले भेटघाटको अवसरमा अर्को काम पनि गर्नु जनाउँछ।'],
['その悲惨な光景には、驚きを（　）。','禁じ得なかった',['問わなかった','余儀なくされた','踏襲した'],'「〜を禁じ得ない」は感情を抑えられないことです。','禁じ得ない means being unable to suppress an emotion.','禁じ得ない ले भावना रोक्न नसक्नु जनाउँछ।'],
['制度の細部から運用上の例外（　）、慎重な検討が必要だ。','に至るまで',['に限らず','をよそに','を皮切りに'],'「〜に至るまで」は範囲の広さを表します。','に至るまで means all the way through, including details.','に至るまで ले स-साना विवरणसम्मको सबै दायरा जनाउँछ।']
]
};
function reorder(level,index,options,reasons){
 const k=(index+Number(level.slice(1)) +2)%4,a=[...options],b=[...reasons];[a[0],a[k]]=[a[k],a[0]];[b[0],b[k]]=[b[k],b[0]];
 return{options:a,explanations:b,answer:k};
}
function word(level,paper,index){
 if(paper!==2||!Number.isInteger(index)||index<0||index>=5||!words[level])return null;
 const [word,reading,en,ne,ex,others]=words[level][index],options=[reading,...others];
 const reasons=options.map((v,i)=>i===0?{ja:'「'+word+'」の正しい読みは「'+reading+'」です。例文：「'+ex+'」',
 en:'The correct reading is '+reading+'. Meaning: '+en+'. Example: '+ex,ne:'सही पढाइ '+reading+' हो। अर्थ: '+ne+'।'}:
 {ja:'「'+v+'」は「'+word+'」の正しい読みではありません。正しくは「'+reading+'」です。',
 en:v+' is not the correct reading of '+word+'. Correct: '+reading+'.',ne:v+' सही पढाइ होइन। सही '+reading+' हो।'});
 const q=reorder(level,index,options,reasons);
 return{type:'語彙・漢字',subtype:'漢字読み',prompt:'次の言葉の読み方として最もよいものを一つ選びなさい。\n「'+word+'」',
 options:q.options,answer:q.answer,verified:true,authoredBatch:'language-02',choiceExplanations:q.explanations,
 explanation:q.explanations[q.answer]};
}
function grammarQuestion(level,paper,index){
 if(paper!==2||!Number.isInteger(index)||index<0||index>=5||!grammar[level])return null;
 const [sentence,correct,others,ja,en,ne]=grammar[level][index],options=[correct,...others];
 const reasons=options.map((v,i)=>i===0?{ja,en,ne}:{ja:'この文に「'+v+'」は適切ではありません。'+ja,en:v+' does not fit this sentence. '+en,ne:v+' यो वाक्यमा मिल्दैन। '+ne});
 const q=reorder(level,index,options,reasons);
 return{type:'文法',subtype:'文の文法１',prompt:'次の文の（　）に入れるのに最もよいものを一つ選びなさい。\n'+sentence,
 options:q.options,answer:q.answer,verified:true,authoredBatch:'language-02',choiceExplanations:q.explanations,
 explanation:q.explanations[q.answer]};
}
global.NextStepVerifiedLanguage02={word,grammar:grammarQuestion,vocabEntries:words,grammarEntries:grammar};
})(window);