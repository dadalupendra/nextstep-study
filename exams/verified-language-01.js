/* Original manually authored language questions (Paper 01 only).
   Level-specific words and grammar; not copied from JLPT official questions. */
(function(global){'use strict';
const V={
N5:[
['学校','がっこう','school','विद्यालय','毎朝、学校へ行きます。',['がっこ','かっこう','がくこ']],
['電車','でんしゃ','train','रेल','駅で電車を待ちます。',['てんしゃ','でんじゃ','でんちゃ']],
['毎朝','まいあさ','every morning','हरेक बिहान','毎朝、七時に起きます。',['まいちょう','まいひる','まいばん']],
['先生','せんせい','teacher','शिक्षक','先生に質問しました。',['せんしょう','せんぜい','せいせん']],
['図書館','としょかん','library','पुस्तकालय','土曜日に図書館で本を読みました。',['としょうかん','ずしょかん','としょがん']]],
N4:[
['予約','よやく','reservation','आरक्षण','電話で席を予約しました。',['よしょく','やくよ','よやっく']],
['連絡','れんらく','contact / notice','सम्पर्क','予定が変わったら連絡してください。',['れんがく','れらく','れんろく']],
['準備','じゅんび','preparation','तयारी','旅行の準備をしています。',['じゅびん','しゅんび','じゅんぴ']],
['必要','ひつよう','necessary','आवश्यक','この手続きには身分証明書が必要です。',['ひよう','ひつよ','びつよう']],
['約束','やくそく','promise','वाचा','友だちとの約束を守ります。',['やっそく','やくぞく','やくさく']]],
N3:[
['確認','かくにん','confirmation','पुष्टि','出発前に時間を確認してください。',['かっにん','かくじん','がくにん']],
['責任','せきにん','responsibility','जिम्मेवारी','自分の仕事には責任を持ちます。',['せいにん','せきじん','せきねん']],
['改善','かいぜん','improvement','सुधार','問題点を確認して改善します。',['かいせん','かいぜい','がいぜん']],
['状況','じょうきょう','situation','अवस्था','交通の状況を調べます。',['じょきょう','じょうけい','しょうこう']],
['希望','きぼう','hope / preference','आशा / इच्छा','参加希望者は申し込んでください。',['きほう','ぎぼう','きもう']]],
N2:[
['貢献','こうけん','contribution','योगदान','地域社会に貢献する活動です。',['こうこん','こうげん','ごうけん']],
['促進','そくしん','promotion / acceleration','प्रवर्द्धन','交流を促進する取り組みです。',['そっしん','ぞくしん','そくじん']],
['制約','せいやく','restriction','प्रतिबन्ध','予算の制約で計画を変更しました。',['せいらく','せいやっく','せいじゃく']],
['著しい','いちじるしい','remarkable / significant','उल्लेखनीय','この数年で著しい変化が見られた。',['ちょしい','いちじゅるしい','いちしるしい']],
['譲歩','じょうほ','concession','सम्झौता गर्न पछि हट्ने','交渉では双方の譲歩が必要だった。',['じょうぶ','じょほ','ゆずほ']]],
N1:[
['顕著','けんちょ','prominent / remarkable','स्पष्ट रूपमा देखिने','実験では顕著な差が認められた。',['けんしょ','げんちょ','けんじょ']],
['看過','かんか','overlook / disregard','बेवास्ता गर्नु','重大な誤りを看過することはできない。',['かんすぎ','かんが','みすご']],
['煩雑','はんざつ','complicated / cumbersome','जटिल / झन्झटिलो','手続きが煩雑で時間がかかった。',['ぼんざつ','はんそう','はんじゃつ']],
['踏襲','とうしゅう','follow precedent','पहिलेकै विधि अनुसरण','従来の方針を踏襲することにした。',['とうじゅう','ふみしゅう','とうしゅ']],
['乖離','かいり','divergence / discrepancy','भिन्नता / दूरी','理念と実態の乖離を指摘した。',['かいれい','がいり','かいはなれ']]]
};
const G={
N5:[
['昨日、駅で友だち（　）会いました。','に',['を','が','の'],'「会う」は相手を「に」で示します。','The person met is marked with に.','भेटिने व्यक्तिलाई に ले जनाउँछ।'],
['机の上に本が二冊（　）。','あります',['います','します','なります'],'物の存在には「あります」を使います。','Use あります for the existence of inanimate objects.','निर्जीव वस्तुको अस्तित्वका लागि あります प्रयोग हुन्छ।'],
['お茶を（　）か。','飲みません',['飲んで','飲む','飲み'],'「〜ませんか」は丁寧な誘いです。','〜ませんか is a polite invitation.','〜ませんか विनम्र निमन्त्रणा हो।'],
['これは母（　）作ったケーキです。','が',['を','に','で'],'「母が作った」が名詞「ケーキ」を修飾します。','The clause 母が作った modifies ケーキ; が marks the subject.','母が作った ले केकलाई विशेषण गर्छ; が कर्ता जनाउँछ।'],
['あした雨が（　）、家にいます。','降ったら',['降ると','降って','降るの'],'「降ったら」は仮定の条件を表します。','降ったら sets a conditional situation.','降ったら ले यदि पानी पर्यो भने भन्ने शर्त जनाउँछ।']
],
N4:[
['宿題が終わった（　）、テレビを見てもいいです。','ら',['ながら','そう','ために'],'動詞のた形に「ら」を付け、条件を示します。','The past form plus ら creates a conditional.','क्रियाको た रूपपछि ら ले शर्त बनाउँछ।'],
['雨が降っている（　）、出かけません。','ので',['まで','だけ','ほど'],'「ので」は理由を表し、後ろの判断につなげます。','ので expresses the reason for not going out.','ので ले बाहिर ननिस्किनुको कारण बताउँछ।'],
['先生に相談（　）から、決めます。','して',['する','した','され'],'「〜てから」は動作の順序を示します。','The te-form plus から indicates action sequence.','〜てから ले कामको क्रम देखाउँछ।'],
['この部屋は昨日より（　）なりました。','暖かく',['暖かい','暖かさ','暖かくて'],'い形容詞は「く＋なる」で変化を表します。','An i-adjective takes く before なる to express change.','い-विशेषणलाई く बनाइ なる सँग परिवर्तन जनाइन्छ।'],
['日本語の新聞が読める（　）なりました。','ように',['ために','ことを','はずに'],'「可能形＋ようになる」は能力の変化です。','Potential form + ようになる describes acquiring an ability.','सम्भावनात्मक रूप + ようになる ले नयाँ क्षमता आएको जनाउँछ।']
],
N3:[
['出張の予定が決まり（　）、お知らせします。','次第',['かけ','たび','ばかり'],'「ます形の語幹＋次第」は、直後に行うことを示します。','Verb stem + 次第 means as soon as something is decided.','क्रियाको stem + 次第 ले निर्णय हुनासाथ भन्ने जनाउँछ।'],
['この町を訪れる（　）、昔の友人に会います。','たびに',['うちに','ところで','ために'],'「〜たびに」は毎回の繰り返しを表します。','たびに means each time an event occurs.','たびに ले हरेकपटक भन्ने अर्थ दिन्छ।'],
['説明を聞いた（　）、質問してください。','うえで',['とたん','ばかり','に反して'],'「〜たうえで」は前の行為を終えてから次を行う意味です。','Past tense + うえで means after doing something first.','〜たうえで ले पहिले काम सकेर अर्को काम गर्नु जनाउँछ।'],
['忘れない（　）、手帳に書いておきます。','ように',['ものの','ばかり','以上'],'「〜ないように」は目的・予防を表します。','〜ないように expresses prevention or purpose.','〜ないように ले नबिर्सियोस् भनेर गरेको उपाय जनाउँछ।'],
['料理を作っている（　）、電話が鳴りました。','最中に',['以来','たびに','あまり'],'「〜ている最中に」は動作の途中に何かが起きることです。','最中に describes an interruption during an ongoing action.','最中に ले काम भइरहेकै बेला केही घट्नु जनाउँछ।']
],
N2:[
['情報が不足すると、判断を誤り（　）。','かねない',['きれない','がたい','っぽい'],'「〜かねない」は望ましくない可能性を表します。','かねない warns of a possible undesirable outcome.','かねない ले नचाहिएको परिणाम हुन सक्ने जोखिम जनाउँछ।'],
['仕事が忙しくても、約束を破る（　）。','わけにはいかない',['に違いない','ことになっている','ほどでもない'],'「〜わけにはいかない」は事情・義務から不可能であることを表します。','わけにはいかない means one cannot do something due to duty or circumstances.','कर्तव्यका कारण गर्न नमिल्ने अवस्था わけにはいかない हो।'],
['資料を確認した（　）、会議を始めます。','うえで',['に限り','を問わず','に伴って'],'「〜たうえで」は事前に必要な行為を行う意味です。','うえで indicates a required preliminary action.','〜たうえで ले आवश्यक पहिलेको प्रक्रिया जनाउँछ।'],
['予定が変更される（　）、参加者へ連絡してください。','場合は',['ものの','ところを','だけあって'],'「〜場合は」は条件に応じた対応を表します。','場合は states the action required in a given situation.','場合は ले यस्तो अवस्था आएमा के गर्ने जनाउँछ।'],
['この研究は従来の方法（　）、新しい視点を取り入れた。','に加えて',['に限って','を通じて','に反して'],'「〜に加えて」は追加を表します。','に加えて means in addition to the previous method.','に加えて ले पहिलेको विधिबाहेक थप कुरा जनाउँछ।']
],
N1:[
['彼の努力が並大抵でなかったことは、結果を見れば想像（　）。','にかたくない',['ずにはいられない','こそあれ','を禁じ得ない'],'「想像にかたくない」は容易に想像できることを表します。','想像にかたくない means not difficult to imagine.','想像にかたくない ले सहजै कल्पना गर्न सकिन्छ भन्ने अर्थ दिन्छ।'],
['長年の研究が実を結び、研究者の喜びは（　）。','ひとしおだった',['いかんだった','まみれだった','だらけだった'],'「喜びもひとしお」は喜びが一層深いことを表します。','ひとしお describes a particularly deep feeling.','ひとしお ले खुशी विशेष रूपमा गहिरो भएको जनाउँछ।'],
['その報告書は、専門家でさえ理解し（　）内容だった。','がたい',['かねない','つつある','まみれの'],'「〜がたい」は心理的・意味的に困難であることを表します。','がたい means difficult to do, often conceptually.','がたい ले बुझ्न/गर्न अत्यन्त कठिन हुनु जनाउँछ।'],
['調査方法の変更を（　）された。','余儀なく',['禁じ','問わず','待たず'],'「〜を余儀なくされる」は避けられず何かをさせられることです。','余儀なくされる means being compelled by circumstances.','余儀なくされる ले परिस्थितिले बाध्य पार्नु जनाउँछ।'],
['政策の効果は、地域の事情（　）異なる。','いかんによって',['といわず','とあって','ずくめで'],'「〜いかんによって」は事情・条件次第という意味です。','いかんによって means depending on circumstances.','いかんによって ले परिस्थितिअनुसार फरक पर्ने जनाउँछ।']
]
};
function reorder(level,index,opts,reasons){
 const chosen=(index+parseInt(level.slice(1),10))%4;
 const options=[...opts],explanations=[...reasons];
 [options[0],options[chosen]]=[options[chosen],options[0]];
 [explanations[0],explanations[chosen]]=[explanations[chosen],explanations[0]];
 return{options,answer:chosen,explanations};
}
function word(level,paper,index){
 if(paper!==1||index<0||index>=5||!V[level])return null;
 const [kanji,reading,meaning,nepali,sentence,wrong]=V[level][index];
 const options=[reading,...wrong];
 const itemExplanations=options.map((opt,i)=>i===0?
 {ja:'「'+kanji+'」の読みは「'+reading+'」です。例文：「'+sentence+'」',en:kanji+' is read '+reading+' and means '+meaning+'. Example: '+sentence,ne:kanji+' को सही पढाइ '+reading+' हो। अर्थ: '+nepali+'।'}:
 {ja:'「'+opt+'」は「'+kanji+'」の読みではありません。正しくは「'+reading+'」です。',en:opt+' is not the reading of '+kanji+'. The correct reading is '+reading+'.',ne:opt+' यस शब्दको सही पढाइ होइन। सही पढाइ '+reading+' हो।'});
 const choice=reorder(level,index,options,itemExplanations);
 return{type:'語彙・漢字',subtype:'漢字読み',prompt:'次の言葉の読み方として最もよいものを一つ選びなさい。\n「'+kanji+'」',options:choice.options,answer:choice.answer,verified:true,authoredBatch:'language-01',choiceExplanations:choice.explanations,
  explanation:{ja:'正しい読みは「'+reading+'」です。'+sentence,en:'The correct reading is '+reading+'. '+meaning+'.',ne:'सही पढाइ '+reading+' हो। अर्थ: '+nepali+'।'}};
}
function grammar(level,paper,index){
 if(paper!==1||index<0||index>=5||!G[level])return null;
 const [sentence,correct,others,ja,en,ne]=G[level][index],options=[correct,...others];
 const reasons=options.map((opt,i)=>i===0?{ja,en,ne}:{
 ja:'この文の（　）には「'+opt+'」ではなく「'+correct+'」が必要です。'+ja,
 en:'The expression '+opt+' does not fit this sentence. '+en,
 ne:opt+' यस वाक्यमा मिल्दैन। '+ne});
 const choice=reorder(level,index,options,reasons);
 return{type:'文法',subtype:'文の文法１',prompt:'次の文の（　）に入れるのに最もよいものを一つ選びなさい。\n'+sentence,
 options:choice.options,answer:choice.answer,verified:true,authoredBatch:'language-01',choiceExplanations:choice.explanations,
 explanation:{ja,en,ne}};
}
global.NextStepVerifiedLanguage={word,grammar,vocabEntries:V,grammarEntries:G};
})(window);