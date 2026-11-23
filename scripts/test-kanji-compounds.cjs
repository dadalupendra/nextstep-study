'use strict';
/* Browser smoke test for Kanji → compounds on all five level-specific readers.
   Tests are fixtures only; production uses level-tagged vocabulary source data. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(process.argv[2]||'public-site');
const CHROME=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
if(!CHROME)throw Error('Chromium is required to verify compound navigation');
const PORT=8786;
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
const fixture={};
for(const level of ['n1','n2','n3','n4','n5']){
 fixture[level]=Array.from({length:1500},(_,i)=>({word:'漢字'+String(i).padStart(4,'0'),reading:'かんじ'+i,level:level.toUpperCase(),meanings:['Example word '+i],examples:[{ja:'漢字'+i+'について勉強しています。',en:'Studying word '+i}]}));
}
let browser;
(async()=>{
 await new Promise(r=>setTimeout(r,700));
 browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
 const urls={N1:'/N1/?section=kanji',N2:'/N2/master.html?section=kanji',N3:'/N3/master.html?section=kanji',N4:'/N4/master.html?section=kanji',N5:'/N5/master.html?section=kanji'};
 for(const [level,url] of Object.entries(urls)){
  const page=await browser.newPage({viewport:{width:390,height:840},isMobile:true,hasTouch:true});
  const errs=[];page.on('pageerror',error=>errs.push(error.message));
  await page.route(/\/data\/json\/vocab\/(n[1-5])\.json$/,route=>{
   const n=route.request().url().match(/\/(n[1-5])\.json$/)[1];return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture[n])});
  });
  // Allow independent N3 book loading without relying on remote internet.
  await page.route('**/N3/data/vocab.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture.n3)}));
  await page.goto('http://127.0.0.1:'+PORT+url,{waitUntil:'domcontentloaded'});
  const kanjiButton=page.locator('button.kanji-main-link').first();
  await kanjiButton.waitFor({timeout:35000});
  const char=await kanjiButton.innerText();
  assert(char.length>=1);
  await kanjiButton.click();
  await page.locator('#nextstep-kanji-explorer:not([hidden])').waitFor({timeout:10000});
  assert((await page.locator('#ns-compound-heading').innerText()).includes(char));
  await page.locator('.ns-compound-item').first().waitFor({timeout:10000});
  await page.locator('.ns-compound-item').first().locator('summary').click();
  await page.locator('.ns-compound-item[open]').first().waitFor({timeout:10000});
  const info=await page.locator('.ns-compound-item[open]').first().innerText();
  assert(info.includes('🇯🇵')&&info.includes('🇳🇵')&&info.includes('🇬🇧'),level+' explanations missing');
  await page.locator('.ns-compounds-close').click();
  assert.equal(await page.locator('#nextstep-kanji-explorer').getAttribute('hidden'),'');
  const chip=page.locator('button.kanji-chip').first();
  if(await chip.count()){
   const word=await chip.getAttribute('data-kanji-word');
   await chip.click();
   assert.equal(await page.locator('#ns-compounds-filter').inputValue(),word);
  }
  assert.deepEqual(errs,[],level+' script errors');
  console.log('PASS',level,'clickable Kanji',char,'compound details, explanation and close/search');
  await page.close();
 }
})().catch(e=>{console.error('COMPOUND TEST FAIL',e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.kill()});
