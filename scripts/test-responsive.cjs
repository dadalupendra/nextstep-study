'use strict';
/* Responsive acceptance test using real Chromium, local NextStep pages, and phone/desktop widths. */
const {chromium} = require('playwright-core');
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(process.argv[2] || 'public-site');
const CHROME = process.env.CHROME_PATH || [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].find(x=>fs.existsSync(x));
if(!CHROME)throw Error('Chromium/Chrome missing: install on runner to test true mobile layouts.');
const PORT = 8765;
const server = spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{
 stdio:['ignore','ignore','pipe']
});
let browser;
async function sleep(n){await new Promise(r=>setTimeout(r,n))}
async function main(){
 await sleep(800);
 browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
 let cases=0;
 for(const width of [320,375,390,430,768,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:860},deviceScaleFactor:1,isMobile:width<768,hasTouch:width<768});
  page.setDefaultTimeout(30000);
  const url='http://127.0.0.1:'+PORT+'/N1/';
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#studyView:not([hidden]) .cards .card').first().waitFor({timeout:30000});
  const metrics=await page.evaluate(()=>{
    const card=document.querySelector('.cards .card');
    const tr=card?.querySelector('.triple-detail>div');
    const meanings=card?.querySelector('.meaning');
    const viewport=document.documentElement.clientWidth;
    return {viewport,bodyWidth:document.body.scrollWidth,htmlWidth:document.documentElement.scrollWidth,
      cardRight:card?.getBoundingClientRect().right,cardLeft:card?.getBoundingClientRect().left,
      cardWidth:card?.clientWidth,cardScroll:card?.scrollWidth,
      trWidth:tr?.clientWidth,trScroll:tr?.scrollWidth,
      meaningWidth:meanings?.clientWidth,meaningScroll:meanings?.scrollWidth,
      columns:getComputedStyle(document.querySelector('.cards')).gridTemplateColumns};
  });
  assert(metrics.cardLeft>=-2 && metrics.cardRight<=width+2,'N1 card overflow at '+width+': '+JSON.stringify(metrics));
  assert(metrics.htmlWidth<=width+2,'N1 document horizontal overflow '+width+': '+JSON.stringify(metrics));
  assert(metrics.trScroll<=metrics.trWidth+2,'N1 multilingual text overflow '+width+': '+JSON.stringify(metrics));
  assert(metrics.meaningScroll<=metrics.meaningWidth+2,'N1 meaning text overflow '+width+': '+JSON.stringify(metrics));
  if(width===390){
   const size=page.locator('#readerFontSize');await size.selectOption('large');
   assert.equal(await page.locator('body').getAttribute('data-reader-size'),'large');
   await size.selectOption('normal');
   assert.equal(await page.locator('body').getAttribute('data-reader-size'),'normal');
  }
  console.log('PASS N1',width,'px',JSON.stringify(metrics));
  cases++;
  await page.close();
 }
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:850},isMobile:width<768,hasTouch:width<768});
  page.setDefaultTimeout(30000);
  await page.goto('http://127.0.0.1:'+PORT+'/N2/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#viewer .kanji-big').first().waitFor({timeout:30000});
  const metrics=await page.evaluate(()=>{
   const viewer=document.querySelector('#viewer'),big=document.querySelector('.kanji-big');
   return {vw:document.documentElement.clientWidth,sw:document.documentElement.scrollWidth,
     viewerRight:viewer?.getBoundingClientRect().right,viewerLeft:viewer?.getBoundingClientRect().left,
     viewerScroll:viewer?.scrollWidth,viewerWidth:viewer?.clientWidth,bigRight:big?.getBoundingClientRect().right};
  });
  assert(metrics.sw<=width+2,'N2 horizontal overflow '+width+': '+JSON.stringify(metrics));
  assert(metrics.viewerRight<=width+2,'N2 page card overflow '+width+': '+JSON.stringify(metrics));
  console.log('PASS N2',width,'px',JSON.stringify(metrics));
  cases++;
  await page.close();
 }
 console.log('SUCCESS: '+cases+' tested desktop/tablet/mobile layouts, no clipped page text or card overflow.');
}
main().catch(e=>{console.error('RESPONSIVE TEST FAIL:',e);process.exitCode=1}).finally(async()=>{
 if(browser)await browser.close();
 server.kill();
});
