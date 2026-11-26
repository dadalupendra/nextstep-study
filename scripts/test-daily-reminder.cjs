'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const ROOT=path.resolve(process.argv[2]||'public-site');
const CHROME=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(x=>fs.existsSync(x));
if(!CHROME)throw Error('Chromium required to test browser reminders');
const PORT=8815,server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
let browser;
(async()=>{
 await new Promise(r=>setTimeout(r,800));
 browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:412,height:870},permissions:['notifications']});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+PORT+'/',{waitUntil:'domcontentloaded'});
 await page.locator('.ns-reminder-panel').waitFor({timeout:20000});
 assert.match(await page.locator('.ns-reminder-panel').innerText(),/Today.s Challenge/);
 assert.match(await page.locator('[data-ns-today]').innerText(),/20 3D cards/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('nextstep-daily-reminder-v1')),null,'No visitor is auto-subscribed');
 const helper=await page.evaluate(()=>{
  const api=window.NextStepDailyReminder;
  return{
   tokyoDay:api.tokyoClock(new Date('2026-11-23T16:15:00Z')).date,
   tokyoTime:api.tokyoClock(new Date('2026-11-23T16:15:00Z')).time,
   n5:api.challengeURL('N5'),
   n1:api.challengeURL('N1')
  };
 });
 assert.equal(helper.tokyoDay,'2026-11-24','Japan-time midnight rollover');
 assert.equal(helper.tokyoTime,'01:15','Japan-time hour');
 assert.match(helper.n5,/daily\/\?level=N5/);
 assert.match(helper.n1,/daily\/\?level=N1/);
 await page.locator('[data-ns-level]').selectOption('N2');
 await page.locator('[data-ns-time]').fill('09:45');
 assert.match(await page.locator('[data-ns-go]').getAttribute('href'),/daily\/\?level=N2/);
 const initial=JSON.parse(await page.evaluate(()=>localStorage.getItem('nextstep-daily-reminder-v1')));
 assert.equal(initial.enabled,false);
 assert.equal(initial.level,'N2');assert.equal(initial.time,'09:45');
 await page.locator('[data-ns-enable]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('nextstep-daily-reminder-v1')||'{}').enabled===true);
 assert.match(await page.locator('[data-ns-status]').innerText(),/Enabled|reminder sent/);
 await page.locator('[data-ns-test]').click();
 await page.locator('[data-ns-status]').getByText(/Test notification sent/).waitFor({timeout:20000}).catch(async()=>{
  assert.match(await page.locator('[data-ns-status]').innerText(),/Test notification sent/);
 });
 const count=await page.evaluate(async()=>{
  const reg=await navigator.serviceWorker.getRegistration(new URL('./',location.href).href);
  const notes=await reg.getNotifications({tag:undefined});
  return notes.filter(n=>n.tag.startsWith('nextstep-daily-test-')).length;
 });
 assert(count>=1,'Test notification was not delivered by service worker');
 await page.goto('http://127.0.0.1:'+PORT+'/N5/master.html?section=daily',{waitUntil:'domcontentloaded'});
 await page.locator('#daily-reminder-root .ns-reminder-panel').waitFor({timeout:30000});
 assert.equal(await page.locator('#daily-reminder-root [data-ns-level]').inputValue(),'N2','Preference persists across JLPT levels');
 assert.match(await page.locator('#daily-reminder-root [data-ns-go]').getAttribute('href'),/daily\/\?level=N2/);
 await page.locator('#daily-reminder-root [data-ns-disable]').click();
 assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem('nextstep-daily-reminder-v1'))).enabled,false);
 assert.equal(errors.length,0,'JS errors: '+errors.join(' / '));
 console.log('PASS daily reminders: opt-in, Japan date, 20-card CTA, selected level, persisted settings, service-worker test notification, disable');
 await context.close();
})().catch(e=>{console.error('DAILY REMINDER TEST FAILED:',e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.kill();});
