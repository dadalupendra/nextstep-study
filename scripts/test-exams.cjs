'use strict';
/* Isolated browser QA for all five JLPT levels; test-only fixture vocabulary is NOT published. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(process.argv[2]||'public-site');
const CHROME=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
if(!CHROME)throw Error('Chromium not available');
const PORT=8778;
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
const fixture=Array.from({length:160},(_,i)=>({word:'単語'+String(i).padStart(3,'0'),reading:'たんご'+String(i).padStart(3,'0'),meanings:['test entry '+i],examples:[{ja:'単語'+String(i).padStart(3,'0')+'を確認します。'}]}));
const grammarFixture=Array.from({length:90},(_,i)=>({pattern:'〜試験'+i,meaning:'mock pattern '+i,examples:[{ja:'この文は試験'+i+'を含みます。'}]}));
let browser;
(async()=>{
 await new Promise(resolve=>setTimeout(resolve,800));
 browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const level of ['N5','N4','N3','N2','N1']){
  const page=await browser.newPage({viewport:{width:390,height:840},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/data/json/vocab/*.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
  await page.route('**/data/json/grammar/*.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(grammarFixture)}));
  await page.goto('http://127.0.0.1:'+PORT+'/exams/?level='+level+'&view=classic',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#levels button').count(),5);
  await page.locator('.fulltest-back').click();
  await page.locator('#fulltest-levels .fulltest-level[data-level="'+level+'"]').click();
  assert.equal(await page.locator('#papers button').count(),20);
  assert.match(await page.locator('#current-level').innerText(),new RegExp(level));
  await page.locator('#papers button').first().click();
  await page.waitForFunction(()=>document.getElementById('test-title')?.textContent.includes('100 questions'),null,{timeout:10000});
  assert.equal(await page.locator('#questions .question').count(),10);
  // Next 10 navigation must follow the last question, not appear at top.
  assert.equal(await page.locator('#questions').locator(':scope > :last-child').getAttribute('aria-label'),'Question page navigation');
  const lastQuestionBox=await page.locator('#questions .question').last().boundingBox();
  const nextBox=await page.getByRole('button',{name:'Next 10 →'}).boundingBox();
  assert(nextBox.y>lastQuestionBox.y,'Next button should appear below question 10');

  assert.match(await page.locator('#questions .question').first().locator('h3').innerText(),/語彙|漢字/);
  await page.locator('#questions .question').first().scrollIntoViewIfNeeded();
  const scrollBefore=await page.evaluate(()=>window.scrollY);
  await page.locator('#questions .question').first().locator('button.option').first().click();
  const scrollAfter=await page.evaluate(()=>window.scrollY);
  assert(Math.abs(scrollAfter-scrollBefore)<35,'Answering should not jump back to the top');

  assert.equal(await page.locator('#questions .question').first().locator('.explain p').count(),4);
  const sectionCases=[['grammar',/文法/,10],['reading',/読解/,10],['listening',/聴解/,10],['vocab',/語彙|漢字/,10]];
  for(const [key,heading,count] of sectionCases){
   await page.locator('#exam-sections button[data-section="'+key+'"]').click();
   assert.equal(await page.locator('#questions .question').count(),count);
   assert.match(await page.locator('#questions .question').first().locator('h3').innerText(),heading);
   assert.equal(await page.locator('#exam-sections button[data-section="'+key+'"]').getAttribute('aria-pressed'),'true');
  }
  await page.locator('#exam-sections button[data-section="all"]').click();
  const sectionCounts={N1:[30,25,30,15],N2:[35,25,25,15],N3:[40,25,20,15],N4:[45,25,15,15],N5:[45,25,15,15]};
  const [vc,gc,rc,lc]=sectionCounts[level];
  assert.match(await page.locator('#exam-sections button[data-section="vocab"]').innerText(),new RegExp(String(vc)));
  assert.match(await page.locator('#exam-sections button[data-section="grammar"]').innerText(),new RegExp(String(gc)));
  assert.match(await page.locator('#exam-sections button[data-section="reading"]').innerText(),new RegExp(String(rc)));
  assert.match(await page.locator('#exam-sections button[data-section="listening"]').innerText(),new RegExp(String(lc)));
  await page.locator('#exam-sections button[data-section="reading"]').click();
  const readingLabel=await page.locator('#questions .question').first().locator('.tag').innerText();
  assert.match(readingLabel,/問題形式/);
  await page.locator('#exam-sections button[data-section="all"]').click();
  for(let i=0;i<9;i++)await page.getByRole('button',{name:'Next 10 →'}).click();
  const section=await page.locator('#questions .question').first().locator('h3').innerText();
  assert.match(section,/聴解/);
  assert.equal(await page.getByRole('button',{name:'🔊 再生 \/ Play audio'}).count(),10);
  assert.equal(errors.length,0,level+' page errors: '+errors.join('; '));
  console.log('PASS',level,'20 papers; 100 questions; all sections; listening controls; explanations');
  await page.close();
 }
 console.log('PASS: five-level JLPT practice center smoke tests');
})().catch(e=>{console.error('EXAM TEST FAIL:',e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.kill()});
