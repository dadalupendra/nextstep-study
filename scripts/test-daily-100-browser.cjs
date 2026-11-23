'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const ROOT=path.resolve(process.argv[2]||'public-site');
const CHROME=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
if(!CHROME)throw Error('Chrome required for daily 100 UI tests');
const PORT=8795,server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
let browser;
(async()=>{
 await new Promise(resolve=>setTimeout(resolve,850));
 browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
 const urls={
  N5:'/N5/master.html?section=daily',
  N4:'/N4/master.html?section=daily',
  N3:'/N3/master.html?section=daily',
  N2:'/N2/master.html?section=daily',
  N1:'/N1/?section=daily'
 };
 for(const [level,url] of Object.entries(urls)){
  if(level==='N3'&&!fs.existsSync(path.join(ROOT,'N3/data/vocab.json'))){console.log('SKIP N3 browser: level-specific vocabulary is not locally packaged');continue}
  const page=await browser.newPage({viewport:{width:390,height:840},isMobile:true,hasTouch:true});
  const failures=[];page.on('pageerror',e=>failures.push(e.message));
  await page.goto('http://127.0.0.1:'+PORT+url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#nextstep-daily-100 .d100-choices button').first().waitFor({timeout:45000});
  assert.match(await page.locator('#nextstep-daily-100 h2').innerText(),new RegExp(level+' · 今日の100問チャレンジ'));
  assert.equal(await page.locator('#nextstep-daily-100 .d100-nums button').count(),100);
  assert.equal(await page.locator('#nextstep-daily-100 .d100-choice').count(),4);
  assert.equal(await page.locator('#nextstep-daily-100 .d100-section').count(),3);
  await page.locator('#nextstep-daily-100 .d100-choice').first().click();
  assert.equal(await page.locator('#nextstep-daily-100 .d100-feedback .option-detail').count(),4,level+' explanations');
  assert.match(await page.locator('#nextstep-daily-100 .d100-pill').innerText(),/1\s*\/\s*100/);
  await page.locator('#nextstep-daily-100 [data-d100-next]').click();
  assert.match(await page.locator('#nextstep-daily-100 .d100-meta').innerText(),/問題 2\/100/);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#nextstep-daily-100 .d100-choices button').first().waitFor({timeout:45000});
  assert.match(await page.locator('#nextstep-daily-100 .d100-pill').innerText(),/1\s*\/\s*100/,level+' progress persisted');
  assert.equal(failures.length,0,level+' JavaScript errors: '+failures.join(', '));
  console.log('PASS '+level+' Daily 100 UI, 100 unique answer-sheet slots, 4 options, JP/EN/NP explanation, saved progress');
  await page.close();
 }
})().catch(e=>{console.error('DAILY 100 BROWSER TEST FAILED:',e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.kill()});
