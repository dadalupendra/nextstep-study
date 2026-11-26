'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const ROOT=path.resolve(process.argv[2]||'public-site'),PORT=8924;
const browserPath=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
if(!browserPath)throw Error('Chromium browser required for tests');
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
(async()=>{
 await new Promise(resolve=>setTimeout(resolve,750));
 const browser=await chromium.launch({executablePath:browserPath,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const level of ['N1','N2','N3','N4','N5']){
   const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
   const page=await ctx.newPage();
   const expected=level==='N1'?'/N1/':'/'+level+'/master.html';
   await page.goto('http://127.0.0.1:'+PORT+'/mobile-app/learn.html?level='+level+'&section=overview',{waitUntil:'domcontentloaded'});
   const link=page.locator('#content [data-section="original"]');
   await link.waitFor({timeout:14000});
   assert((await link.getAttribute('href')).includes(expected),'Complete Book link must target original book');
   await link.click();
   await page.waitForURL(url=>url.pathname.endsWith(expected),{timeout:12000});
   assert(page.url().includes(expected),'Book should open directly, without another menu');
   await page.locator('#nsBookLanguage').waitFor({timeout:12000});
   assert.equal(await page.locator('.ns-book-toolbar').count(),1,'Japanese textbook toolbar must exist');
   assert((await page.locator('#nsBookLanguage option').count())>=90,'Book should expose 90+ reader language selections');
   assert.equal(await page.locator('.ns-book-actions button').count(),3);
   assert.equal(await page.locator('body.ns-japanese-book').count(),1);
   const style=await page.evaluate(()=>getComputedStyle(document.querySelector('.workarea')).borderTopStyle);
   assert.notEqual(style,'none','Textbook layout needs book-like treatment');
   console.log('PASS '+level+' direct Complete Books navigation, textbook reader and language controls');
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error('COMPLETE BOOK TEST FAILED:',error);process.exitCode=1}).finally(()=>server.kill());
