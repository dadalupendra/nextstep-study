'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require('playwright-core');const ROOT=path.resolve(process.argv[2]||'public-site'),PORT=8896;
const CHROME=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/google-chrome-stable'].find(fs.existsSync);
if(!CHROME)throw Error('Chrome required');
const vocab=[
 {word:'学校',reading:'がっこう',meanings:['school'],pos:['n'],examples:[{ja:'私は学校へ行きます。',en:'I go to school.',furigana:'{私|わたし}は{学校|がっこう}へ{行|い}きます。'}]},
 {word:'学生',reading:'がくせい',meanings:['student'],pos:['n'],examples:[{ja:'学生は勉強します。',en:'Students study.'}]},
 {word:'私',reading:'わたし',meanings:['I'],pos:['pn'],examples:[{ja:'私は学生です。',en:'I am a student.'}]},
 {word:'行く',reading:'いく',meanings:['to go'],pos:['v5k'],examples:[{ja:'明日、学校へ行きます。',en:'I will go to school tomorrow.'}]},
 {word:'きれい',reading:'きれい',meanings:['pretty'],pos:['adj-na'],examples:[{ja:'花がきれいです。',en:'The flowers are pretty.'}]},
 {word:'早く',reading:'はやく',meanings:['quickly'],pos:['adv'],examples:[{ja:'早く帰ってください。',en:'Please return quickly.'}]},
 {word:'そして',reading:'そして',meanings:['and then'],pos:['conj'],examples:[{ja:'そして家へ帰りました。',en:'And then I went home.'}]},
 {word:'は',reading:'は',meanings:['topic marker'],pos:['prt'],examples:[{ja:'私は学生です。',en:'I am a student.'}]},
 ...Array.from({length:28},(_,i)=>({word:'単語'+i,reading:'たんご'+i,meanings:['word '+i],pos:['n'],examples:[{ja:'単語を覚えます。',en:'I memorize words.'}]}))
];
const n2={level:'N2',words:vocab.map((v,i)=>[v.word,v.reading,v.meanings[0],'id'+i,v.pos.join(', '),v.examples[0].ja,v.examples[0].en,'','','',''])};
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
(async()=>{await new Promise(r=>setTimeout(r,850));const browser=await chromium.launch({executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
try{for(const level of ['N5','N4','N3','N2','N1']){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/data/vocab.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(vocab)}));
 await page.route('**/N2/data.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:'window.NEXTSTEP_N2_DATA='+JSON.stringify(n2)+';'}));
 await page.goto('http://127.0.0.1:'+PORT+'/mobile-app/learn.html?level='+level+'&section=vocab',{waitUntil:'domcontentloaded'});
 await page.locator('#content .v3-card').first().waitFor({timeout:16000});
 assert(page.url().includes('/mobile-app/learn.html'),'Vocabulary must stay INSIDE Library');
 assert.equal(await page.locator('#content .v3-card').count(),24);
 await page.locator('#v3Class').selectOption('pronoun');
 assert.equal(await page.locator('#content .v3-card').count(),1,'Pronouns must be separate');
 await page.locator('#v3Class').selectOption('verb');
 assert.equal(await page.locator('#content .v3-card').count(),1,'Verbs must be separate');
 await page.locator('#v3Class').selectOption('noun');
 await page.locator('#content .v3-flip').first().click();
 assert.equal(await page.locator('#detailDialog[open]').count(),1);
 assert((await page.locator('#detailBody').innerText()).includes('Noun'),'POS details required');
 assert.equal(await page.locator('#detailBody .v3-example .v3-japanese').count()>0,true);
 await page.locator('#detailBody .v3-related-item').first().click();
 assert((await page.locator('#detailBody h2').innerText()).length>0);
 await page.locator('#closeDetail').click();
 await page.locator('.v3-card .v3-actions button').first().click();
 assert.equal(await page.locator('.v3-card.flipped').count(),1);
 await page.locator('.v3-card .v3-actions button').nth(2).click();
 assert.equal(await page.locator('.v3-card.v3-learned').count(),1);
 await page.locator('#v3Search').fill('school');
 assert.equal(await page.locator('#content .v3-card').count(),1);
 assert.deepEqual(errors,[],'Page errors: '+errors.join('; '));
 console.log('PASS '+level+' 3D vocabulary inside Library, noun/pronoun/verb, examples, related words, review, translation control and persistence');
 await context.close()
}}finally{await browser.close()}
})().catch(e=>{console.error('3D VOCABULARY TEST FAILED:',e);process.exitCode=1}).finally(()=>server.kill());
