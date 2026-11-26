'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const ROOT=path.resolve(process.argv[2]||'public-site'),PORT=8891;
const CHROME=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/google-chrome-stable'].find(fs.existsSync);
if(!CHROME)throw Error('Chrome is required');
const kanji=Array.from({length:40},(_,i)=>({character:String.fromCharCode(0x4e00+i),onyomi:['オン'],kunyomi:['くん'],meanings:['Meaning '+i],radical:'一',strokes:5}));
const vocab=[...kanji.map((k,i)=>({word:k.character+'語',reading:'ご'+i,meanings:['Compound '+i],pos:['n'],examples:[{ja:'毎日、'+k.character+'語を勉強します。',en:'I study this word every day.'}]})),...Array.from({length:25},(_,i)=>({word:'学生'+i,reading:'がくせい'+i,meanings:['Student '+i],examples:[]}))];
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
(async()=>{
 await new Promise(r=>setTimeout(r,750));const browser=await chromium.launch({executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 for(const level of ['N5','N4','N3','N2','N1']){
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/data/kanji.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(kanji)}));
  await page.route('**/data/vocab.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(vocab)}));
  await page.goto('http://127.0.0.1:'+PORT+'/kanji-3d/?level='+level,{waitUntil:'domcontentloaded'});
  await page.locator('.kanji-3d-card').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.kanji-3d-card').count(),24,'Kanji pagination must show 24 at once');
  assert.equal(await page.locator('#total').innerText(),'🈶 40 Kanji');
  await page.locator('.kanji-3d-card .flip-button').first().click();
  assert.equal(await page.locator('dialog[open]').count(),1);
  await page.locator('.compound-entry').first().waitFor({timeout:10000});
  assert((await page.locator('.compound-entry').count())>=1,'Compounds must come from sourced vocab');
  assert((await page.locator('.compound-example p:lang(ja)').count())>=1,'Examples from source must be visible');
  await page.locator('.compound-translate').first().click();
  assert((await page.locator('#detailBody').innerText()).includes('語'));
  await page.locator('#close').click();
  await page.locator('.card-turn').first().click();
  assert.equal(await page.locator('.kanji-3d-card.flipped').count(),1);
  await page.locator('.learned').first().click();assert.equal(await page.locator('.learned-card').count(),1);
  await page.locator('#next').click();assert.equal(await page.locator('.kanji-3d-card').count(),16);
  await page.locator('#search').fill('一');assert((await page.locator('.kanji-3d-card').count())>=1);
  assert.deepEqual(errors,[],'Browser must be error-free');
  console.log('PASS '+level+' 3D cards, compounds, sourced examples, flip, progress, paging and search');
  await ctx.close()
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('KANJI 3D TEST FAILED',e);process.exitCode=1}).finally(()=>server.kill());
