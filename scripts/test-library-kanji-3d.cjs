'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const ROOT=path.resolve(process.argv[2]||'public-site'),PORT=8895;
const CHROME=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/google-chrome-stable'].find(fs.existsSync);
if(!CHROME)throw Error('Chromium required for browser tests');
const kanji=Array.from({length:40},(_,i)=>({character:String.fromCharCode(0x4e00+i),onyomi:['オン'],kunyomi:['くん'],meanings:['Meaning '+i],radical:'一',strokes:5}));
const vocab=[...kanji.map((k,i)=>({word:k.character+'語',reading:'ご'+i,meanings:['Compound '+i],examples:[{ja:'毎日、'+k.character+'語を勉強します。',en:'I study this compound every day.'}]})),...Array.from({length:45},(_,i)=>({word:'単語'+i,reading:'たんご'+i,meanings:['Word '+i],examples:[]}))];
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
(async()=>{
 await new Promise(resolve=>setTimeout(resolve,800));
 const browser=await chromium.launch({executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const level of ['N5','N4','N3','N2','N1']){
   const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/data/kanji.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(kanji)}));
   await page.route('**/data/vocab.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(vocab)}));
   await page.goto('http://127.0.0.1:'+PORT+'/mobile-app/learn.html?level='+level+'&section=kanji',{waitUntil:'domcontentloaded'});
   await page.locator('#content .library-kanji-card').first().waitFor({timeout:15000});
   assert(page.url().includes('/mobile-app/learn.html'),'Kanji must remain INSIDE the Library, not open a separate page');
   assert.equal(await page.locator('#content .library-kanji-card').count(),24);
   await page.locator('.library-kanji-flip').first().click();
   assert.equal(await page.locator('#detailDialog[open]').count(),1);
   assert.equal(await page.locator('#content .ns-review-filters button').count(),4,'Smart Review categories visible');
   await page.locator('#detailBody .ns-review-grade-buttons button[data-grade="hard"]').click();
   assert.equal(await page.locator('#detailBody .ns-review-message').innerText().then(x=>x.includes('Next review')),true,'Hard rating schedules a future review');
   await page.locator('#detailBody .library-kanji-compound').first().waitFor({timeout:10000});
   assert.equal(await page.locator('#detailBody .library-kanji-compound').count()>=1,true);
   assert.equal(await page.locator('#detailBody .library-kanji-example p:lang(ja)').count()>=1,true);
   await page.locator('#detailBody .library-kanji-compound button').first().click();
   assert.equal(await page.locator('#detailBody h2').first().innerText().then(x=>x.includes('語')),true);
   await page.locator('#closeDetail').click();
   await page.locator('.library-kanji-card .library-kanji-actions button').first().click();
   assert.equal(await page.locator('.library-kanji-card.flipped').count(),1);
   await page.locator('.library-kanji-card .library-kanji-actions button').nth(2).click();
   assert.equal(await page.locator('.library-kanji-card.mastered').count(),1);
   await page.locator('#content .pagebar button').last().click();
   assert.equal(await page.locator('#content .library-kanji-card').count(),16);
   await page.locator('#libraryKanjiSearch').fill('一');
   assert.equal(await page.locator('#content .library-kanji-card').count()>=1,true);
   assert.equal(errors.length,0,'Unexpected browser errors: '+errors.join('; '));
   console.log('PASS '+level+' inline Library Kanji 3D, compounds, examples, flip, learned, search, pagination');
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('LIBRARY 3D KANJI TEST FAILED:',e);process.exitCode=1}).finally(()=>server.kill());
