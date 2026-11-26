'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {chromium}=require('playwright-core'),{spawn}=require('node:child_process');
const root=path.resolve(process.argv[2]||'public-site');
const CHROME=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!CHROME)throw Error('Chrome is required for 3D daily UI regression tests');
const js=fs.readFileSync(path.join(root,'daily/data.js'),'utf8');
const sandbox={window:{},Intl,Date,Math,Set,Map,Array,Promise,Error,JSON,String,Number};vm.runInNewContext(js,sandbox,{filename:'daily/data.js'});
const api=sandbox.window.NextStepDailySource;
assert(api&&typeof api.dayCards==='function');
assert.equal(api.tokyoDay(new Date('2026-11-26T00:00:00Z')),'2026-11-26');
const kanji=Array.from({length:40},(_,i)=>({character:String.fromCharCode(0x4e00+i),meanings:['Meaning '+i],onyomi:['オン'+i],words:['例'+i]}));
const vocab=Array.from({length:55},(_,i)=>({word:'言葉'+i,reading:'ことば'+i,meanings:['Word '+i],pos:['n'],examples:[{ja:'私は言葉'+i+'を勉強します。',en:'I study word '+i+'.'}]}));
const source={kanji,vocab};
const today=api.dayCards('N2','2026-11-26',source);
const todayAgain=api.dayCards('N2','2026-11-26',source);
const tomorrow=api.dayCards('N2','2026-11-27',source);
assert.equal(today.length,20);
assert.equal(new Set(today.map(x=>x.id)).size,20,'No duplicated same-day cards');
assert.equal(today.map(x=>x.id).join('|'),todayAgain.map(x=>x.id).join('|'),'Same Japan calendar day must be stable');
assert.notEqual(today.map(x=>x.id).join('|'),tomorrow.map(x=>x.id).join('|'),'The next day changes cards');
assert.equal(today.filter(x=>x.type==='kanji').length,10);
assert.equal(today.filter(x=>x.type==='vocab').length,10);
const PORT=8797,server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',root],{stdio:'ignore'});
(async()=>{
 await new Promise(r=>setTimeout(r,750));
 const browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const level of ['N5','N4','N3','N2','N1']){
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const local=api.dayCards(level,'2026-11-26',source);
   await page.route('**/'+level+'/data/kanji.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(kanji)}));
   await page.route('**/'+level+'/data/vocab.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(vocab)}));
   await page.goto('http://127.0.0.1:'+PORT+'/daily/?level='+level,{waitUntil:'domcontentloaded'});
   await page.locator('.flipcard').first().waitFor({timeout:14000});
   assert.equal(await page.locator('.flipcard').count(),20);
   assert.equal(await page.locator('#kanjiCards .flipcard').count(),10);
   assert.equal(await page.locator('#vocabCards .flipcard').count(),10);
   assert.equal(await page.locator('#lang option').count()>=90,true,'90+ selectable explanation languages');
   await page.locator('.flip-button').first().click();
   assert.equal(await page.locator('.flipcard.flipped').count(),1);
   await page.locator('.flipcard .details').first().click();
   assert.equal(await page.locator('dialog[open]').count(),1);
   assert.equal(await page.locator('#detailBody .detail-group').count()>0,true);
   await page.locator('#close').click();
   await page.locator('.flipcard .learned').first().click();
   assert.equal(await page.locator('.learned-card').count(),1);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('.flipcard').first().waitFor({timeout:14000});
   assert.equal(await page.locator('.learned-card').count(),1,'Progress saved');
   assert.equal(errors.length,0,'Unexpected JavaScript errors: '+errors.join('; '));
   assert.equal(local.length,20);
   console.log('PASS '+level+' daily 3D flip, full details, language list, progress, mobile viewport');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error('DAILY 3D TEST FAILED:',error);process.exitCode=1}).finally(()=>server.kill());
