/* NextStep Offline AI Teacher.
   Browser-native LanguageModel (when supported) or deterministic local
   retrieval tutor. No paid API, cloud proxy, remote model CDN, or keys. */
(function(global){'use strict';
const $$=id=>document.getElementById(id);
const labels={
 en:{heading:'🧠 Offline AI Teacher',intro:'Ask about a selected Kanji or word. Your lesson data stays on this device.',ask:'Ask offline',ready:'On-device AI model',fallback:'Offline study guide (no generative model)',none:'Tap any Kanji or Vocabulary card first.',loading:'Preparing local answer…',modelLoading:'Starting the browser on-device model…',needDownload:'The browser model needs a one-time download. Start it using the button below while online.',install:'Enable on-device AI',notSupported:'Generative AI is not supported on this browser. The offline study guide still works.',offline:'Offline answers use the study files saved on this device.',missing:'This information is not supplied in the current study source.',example:'Show examples',reading:'Explain readings',related:'Related words',review:'What should I review?',privacy:'No question is sent to our server or an external AI API.'},
 ne:{heading:'🧠 अफलाइन AI शिक्षक',intro:'Kanji वा शब्द छानेर प्रश्न सोध्नुहोस्। अध्ययन डाटा तपाईंको डिभाइसमा रहन्छ।',ask:'अफलाइन सोध्नुहोस्',ready:'डिभाइसको AI मोडेल',fallback:'अफलाइन अध्ययन गाइड (Generative AI होइन)',none:'पहिले कुनै Kanji वा Vocabulary कार्ड छान्नुहोस्।',loading:'स्थानीय उत्तर तयार हुँदैछ…',modelLoading:'ब्राउजरको स्थानीय AI सुरु हुँदैछ…',needDownload:'ब्राउजर AI लाई पहिलो पटक मोडेल डाउनलोड गर्नुपर्छ। इन्टरनेट भएको बेला तलको बटन थिच्नुहोस्।',install:'डिभाइस AI सक्रिय गर्नुहोस्',notSupported:'यस ब्राउजरमा Generative AI उपलब्ध छैन। अफलाइन अध्ययन गाइड भने चल्छ।',offline:'जवाफ डिभाइसमा सुरक्षित अध्ययन फाइलबाट आउँछ।',missing:'यो जानकारी अहिलेको अध्ययन स्रोतमा छैन।',example:'उदाहरण देखाऊ',reading:'उच्चारण बताऊ',related:'सम्बन्धित शब्द',review:'के पुनः पढ्ने?',privacy:'प्रश्न कुनै बाहिरी AI API वा हाम्रो सर्भरमा पठाइँदैन।'},
 ja:{heading:'🧠 オフラインAI先生',intro:'漢字・単語を選んで質問できます。学習データは端末内で処理します。',ask:'オフラインで質問',ready:'端末内AIモデル',fallback:'オフライン学習ガイド（生成AIではありません）',none:'先に漢字や語彙カードを選択してください。',loading:'端末内で回答を準備中…',modelLoading:'端末内AIを起動中…',needDownload:'端末のAIモデルは最初の一度だけダウンロードが必要です。オンライン時に下のボタンを押してください。',install:'端末内AIを有効にする',notSupported:'このブラウザーでは生成AIが使用できません。オフライン学習ガイドは利用できます。',offline:'保存済み教材からオフラインで回答します。',missing:'元の教材にはこの情報がありません。',example:'例文',reading:'読み方',related:'関連語',review:'復習する',privacy:'質問を外部AIサービスに送信しません。'}
};
const localKey='nextstep-offline-ai-history-v1';
let state={card:null,related:[],level:'N2',lang:'ne',progress:{},mode:'checking',session:null,request:0};
function t(key){return(labels[state.lang]||labels.en)[key]||labels.en[key]}
function el(tag,className,text){const x=document.createElement(tag);if(className)x.className=className;if(text!==undefined)x.textContent=String(text);return x}
function examples(card){return(global.NextStepDailySource?.validExamples(card?.item)||[]).slice(0,3)}
function effectiveExamples(card){
 const direct=examples(card);
 if(direct.length)return direct;
 // Single Kanji sources often have no sentence; use real compound examples
 // instead of fabricating one.
 return state.related.flatMap(word=>examples({item:word})).slice(0,4);
}
function readings(card){const x=card?.item||{};return card?.type==='kanji'?[...(x.onyomi||[]),...(x.kunyomi||[])].join(' · '):String(x.reading||'')}
function name(card){return card?.type==='kanji'?card.item.character:card?.item?.word||''}
function meaning(card){return global.NextStepDailySource?.getGloss(card?.item||{})||''}
function currentFacts(){
 const card=state.card;if(!card)return '';
 const d=card.item,rows=[
 'Level: '+state.level,'Study type: '+card.type,'Word/Kanji: '+name(card),
 'Japanese reading: '+readings(card),'Source English definitions: '+meaning(card)
 ];
 if(card.type==='kanji'){
  if(d.onyomi?.length)rows.push('On-yomi: '+d.onyomi.join(', '));
  if(d.kunyomi?.length)rows.push('Kun-yomi: '+d.kunyomi.join(', '));
  if(d.radical)rows.push('Radical: '+d.radical);
  if(d.strokes)rows.push('Strokes: '+d.strokes);
 }
 if(d.pos)rows.push('Part of speech: '+(Array.isArray(d.pos)?d.pos.join(', '):d.pos));
 const rel=state.related.slice(0,35);
 if(rel.length)rows.push('Real related dictionary words: '+rel.map(w=>w.word+' ('+w.reading+'): '+global.NextStepDailySource.getGloss(w)).join('; '));
 const ex=effectiveExamples(card);if(ex.length)rows.push('Verified sentences: '+ex.map(x=>x.ja+(x.en?' — '+x.en:'')).join(' / '));
 return rows.join('\n').slice(0,6500);
}
function responseGuide(question){
 if(!state.card)return t('none');
 const card=state.card,d=card.item,q=String(question||'').toLowerCase();
 const head=name(card)+' ('+(readings(card)||'—')+')';
 const gloss=meaning(card)||t('missing');
 const ex=effectiveExamples(card);
 const related=state.related;
 const isExample=/例文|example|sentence|文|उदाहरण|वाक्य|例/i.test(q);
 const isReading=/読み|reading|pronun|発音|onyomi|kunyomi|उच्चारण|पढाइ|कैसे पढ़/i.test(q);
 const isRelated=/関連|compound|related|words|शब्द|सम्बन्धित|熟語|単語/i.test(q);
 const isReview=/review|復習|practice|weak|कमजोर|अभ्यास|repeat/i.test(q);
 const intro=state.lang==='ne'?'शब्द: ':state.lang==='ja'?'学習項目: ':'Entry: ';
 const introText=intro+head+'\n'+(state.lang==='ne'?'स्रोतमा भएको अर्थ: ':state.lang==='ja'?'原文の意味 (English): ':'Source meaning: ')+gloss;
 if(isExample)return introText+'\n\n'+(ex.length?ex.map((e,i)=>(i+1)+'. '+e.ja+(e.en?'\n   '+e.en:'')).join('\n'):t('missing'));
 if(isReading)return introText+'\n\n'+(card.type==='kanji'?'音読み: '+(d.onyomi||[]).join('、')+'\n訓読み: '+(d.kunyomi||[]).join('、'):'読み方: '+(d.reading||t('missing')));
 if(isRelated)return introText+'\n\n'+(related.length?related.slice(0,30).map((x,i)=>(i+1)+'. '+x.word+' ('+x.reading+') — '+global.NextStepDailySource.getGloss(x)).join('\n'):t('missing'));
 if(isReview){
  const learned=!!state.progress[card.id];
  return introText+'\n\n'+(state.lang==='ne'?(learned?'यो कार्ड Learned मा चिन्ह लगाइएको छ।':'यो कार्ड अझै Learned मा छैन।'):(learned?'Already marked learned.':'Not marked learned yet.'))+
  '\n1. '+(readings(card)||t('missing'))+'\n2. '+gloss+'\n3. '+(ex[0]?.ja||t('missing'));
 }
 return introText+'\n\n'+(state.lang==='ne'?'उच्चारण: ':state.lang==='ja'?'読み方: ':'Reading: ')+(readings(card)||t('missing'))+
   '\n'+(ex.length?ex.map(e=>e.ja+(e.en?' — '+e.en:'')).join('\n'):t('missing'))+
   '\n\n'+(related.length?'Related: '+related.slice(0,8).map(x=>x.word+' ('+x.reading+')').join('、'):'')+
   '\n\n'+t('offline');
}
async function support(){
 const model=global.LanguageModel;
 if(!model?.availability){state.mode='guide';setStatus(t('notSupported'));return}
 try{
  const availability=await model.availability();
  state.mode=availability==='available'?'model':availability==='downloadable'||availability==='downloading'?'downloadable':'guide';
  setStatus(state.mode==='model'?t('ready'):state.mode==='downloadable'?t('needDownload'):t('notSupported'));
 }catch{state.mode='guide';setStatus(t('notSupported'))}
 refreshButton()
}
function setStatus(message){const status=$$('aiStatus');if(status)status.textContent=message}
function refreshButton(){const enable=$$('aiEnable');if(!enable)return;enable.hidden=state.mode!=='downloadable';enable.textContent=t('install')}
async function install(){
 if(!global.LanguageModel?.create)return;
 const btn=$$('aiEnable');btn.disabled=true;setStatus(t('modelLoading'));
 try{state.session=await global.LanguageModel.create();state.mode='model';setStatus(t('ready'))}
 catch(e){state.mode='guide';setStatus(t('notSupported')+(e?.message?' '+e.message:''))}
 finally{btn.disabled=false;refreshButton()}
}
async function modelReply(question){
 if(!global.LanguageModel?.create)throw Error('No on-device model');
 if(!state.session)state.session=await global.LanguageModel.create();
 const prompt=[
 'You are a Japanese study teacher. Only use the supplied trusted lesson facts. Never invent a dictionary definition, reading, grammar fact, or example sentence. If a fact is absent, say so.',
 'Reply in '+(state.lang==='ne'?'Nepali':state.lang==='ja'?'Japanese':state.lang==='en'?'English':(new Intl.DisplayNames(['en'],{type:'language'}).of(state.lang)||state.lang))+' where the on-device model supports it. If unsupported, reply in clear English.',
 'Keep original Japanese and example sentences unchanged.',
 'LESSON FACTS:\n'+currentFacts(),
 'STUDENT QUESTION:\n'+question.slice(0,400),
 'Explain clearly in no more than 180 words.'
 ].join('\n\n');
 return String(await state.session.prompt(prompt)).slice(0,6000)
}
async function ask(question){
 const output=$$('aiAnswer');if(!output)return;
 if(!state.card){output.textContent=t('none');return}
 const id=++state.request,reply=responseGuide(question);
 output.textContent=t('loading');
 const useModel=state.mode==='model';
 if(useModel){try{const result=await modelReply(question);if(id===state.request){output.textContent=result||reply;record(question,output.textContent)}return}catch(e){setStatus('On-device model unavailable. '+t('fallback'))}}
 if(id===state.request){output.textContent=reply;record(question,reply)}
}
function record(question,answer){
 // Retain at most 10 short entries; no server upload.
 try{
  const existing=JSON.parse(localStorage.getItem(localKey)||'[]');
  existing.push({word:name(state.card),question:String(question).slice(0,200),answer:String(answer).slice(0,500),date:Date.now()});
  localStorage.setItem(localKey,JSON.stringify(existing.slice(-10)));
 }catch{}
}
function select(card,{level,language,related=[],progress={}}={}){
 state.card=card;state.level=level||state.level;state.lang=language||'en';state.related=related;state.progress=progress;
 const topic=$$('aiTopic');if(topic)topic.textContent='📖 '+name(card)+' · '+state.level;
 const answer=$$('aiAnswer');if(answer)answer.textContent=t('offline');
 refreshLabels();
}
function setRelated(words){state.related=Array.isArray(words)?words:[]}
function setLanguage(language){state.lang=language||'en';refreshLabels()}
function refreshLabels(){
 const h=$$('aiTitle');if(h)h.textContent=t('heading');
 const intro=$$('aiIntro');if(intro)intro.textContent=t('intro');
 const askButton=$$('aiAsk');if(askButton)askButton.textContent=t('ask');
 const input=$$('aiQuestion');if(input)input.placeholder=t('intro');
 const privacy=$$('aiPrivacy');if(privacy)privacy.textContent=t('privacy');
 const quick=$$('aiQuick');if(quick){
  const keys=['example','reading','related','review'];quick.replaceChildren();
  for(const key of keys){const b=el('button','ai-chip',t(key));b.type='button';b.onclick=()=>ask(t(key));quick.append(b)}
 }
 refreshButton()
}
function initialize(){
 const submit=$$('aiAsk'),input=$$('aiQuestion'),enable=$$('aiEnable');
 if(submit)submit.addEventListener('click',()=>ask(input.value.trim()||'Explain this study item.'));
 if(input)input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();ask(input.value.trim()||'Explain this study item.')}});
 if(enable)enable.addEventListener('click',install);
 refreshLabels();support()
}
global.NextStepOfflineAI={initialize,select,setRelated,setLanguage,ask,responseGuide,mode:()=>state.mode};
})(window);