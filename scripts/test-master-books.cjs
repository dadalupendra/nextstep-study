'use strict';
/* Verify the four new N1-style book editions without relying on external vocabulary APIs. */
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(process.argv[2]||'public-site');
const BIN=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!BIN)throw new Error('Chromium required for master book UI test');
const PORT=8779,server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
const fixture=Array.from({length:200},(_,i)=>({id:'test'+i,word:'練習語'+i,reading:'れんしゅうご'+i,meanings:['sample meaning '+i],level:'N2',pos:['n'],examples:[{ja:'練習語'+i+'を覚えます。',en:'Remember word '+i}]}));
let browser;
(async()=>{
 await new Promise(resolve=>setTimeout(resolve,800));
 browser=await chromium.launch({headless:true,executablePath:BIN,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const [level,expected] of [['N5',84],['N4',169],['N3',387],['N2',398]]){
  const page=await browser.newPage({viewport:{width:390,height:840},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(level==='N2'||level==='N3')await page.route('**/data/json/vocab/'+level.toLowerCase()+'.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture.map(w=>({...w,level})))}));
  await page.goto('http://127.0.0.1:'+PORT+'/'+level+'/master.html?section=vocab',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#studyView:not([hidden]) .cards .card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('#statKanji').innerText(),String(expected));
  assert.match(await page.locator('.hero h1').innerText(),new RegExp(level));
  assert.equal(await page.locator('.tab[data-section="vocab"]').count(),1);
  assert.equal(await page.locator('.tab[data-section="vocab"]').evaluate(el=>el.classList.contains('active')),true);
  assert(await page.locator('#statVocab').innerText()!=='0','Vocabulary did not load');
  await page.locator('.tab[data-section="kanji"]').click();
  await page.locator('#itemsView .card').first().waitFor();
  const japanese=await page.locator('#itemsView .card .bigkanji').first().innerText();
  assert(japanese.length>0);
  await page.locator('#furiganaToggle').uncheck();
  await page.locator('.tab[data-section="vocab"]').click();
  await page.locator('#itemsView .card').first().waitFor();
  const width=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
  assert(width[0]<=width[1]+3,level+' horizontal overflow: '+width.join(','));
  assert.equal(errors.length,0,'JavaScript errors for '+level+': '+errors.join('; '));
  console.log('PASS',level,'Kanji',expected,'Vocabulary',await page.locator('#statVocab').innerText(),'first kanji',japanese);
  await page.close();
 }
})().catch(e=>{console.error('MASTER BOOK TEST FAILED:',e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.kill()});
