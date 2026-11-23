'use strict';
/* Isolated browser QA for all five JLPT levels; test-only fixture vocabulary is NOT published. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(process.argv[2]||'public-site');
const {execFileSync}=require('node:child_process');
const auditOutput=execFileSync(process.execPath,['scripts/validate-exam-content.cjs',ROOT],{
 encoding:'utf8',env:{...process.env,NEXTSTEP_AUDIT_REPORT:path.join(ROOT,'exams','content-audit.json')}
});
console.log('JLPT 100-paper content audit (partial state):\n'+auditOutput);

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
  await page.goto('http://127.0.0.1:'+PORT+'/exams/?level='+level,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#levels button').count(),5);
  await page.locator('#levels button').filter({hasText:level}).click();
  assert.equal(await page.locator('#papers button').count(),20);
  assert.match(await page.locator('#current-level').innerText(),new RegExp(level));
  await page.locator('#papers button').first().click();
  await page.waitForFunction(()=>document.getElementById('test-title')?.textContent.includes('15/100 original questions available'),null,{timeout:10000});
  assert.equal(await page.locator('#questions .question').count(),10);
  assert.equal(await page.locator('#questions .question').first().locator('button.option').count(),4);
  assert.match(await page.locator('#questions .question').first().locator('h3').innerText(),/✅ ORIGINAL/);
  const before=await page.evaluate(()=>window.scrollY);
  await page.locator('#questions .question').first().scrollIntoViewIfNeeded();
  await page.locator('#questions .question').first().locator('button.option').first().click();
  assert.equal(await page.locator('#questions .question').first().locator('.explain p').count(),4);
  assert.equal(await page.locator('#questions').getByRole('button',{name:'Next 10 →'}).count(),1);
  await page.locator('#questions').getByRole('button',{name:'Next 10 →'}).click();
  assert.equal(await page.locator('#questions .question').count(),5);
  assert.equal(await page.locator('#questions').getByRole('button',{name:'Next 10 →'}).isDisabled(),true);
  for(const key of ['vocab','grammar','reading']){
    await page.locator('#exam-sections button[data-section="'+key+'"]').click();
    assert.equal(await page.locator('#questions .question').count(),5,key+' contains five original questions');
    assert.equal(await page.locator('#questions .question button.option').count(),20);
  }
  await page.locator('#exam-sections button[data-section="listening"]').click();
  assert.equal(await page.locator('#questions .question').count(),1,'Only one unavailable notice instead of 15 empty slots');
  assert.equal(await page.locator('#questions .question button.option').count(),0);
  assert.match(await page.locator('#questions').innerText(),/確認済みのオリジナル問題がまだありません/);
  assert.equal(await page.locator('#questions button').filter({hasText:'Play audio'}).count(),0);
  await page.locator('#papers button').nth(1).click();
  await page.waitForFunction(()=>document.getElementById('test-title')?.textContent.includes('15/100 original questions available'),null,{timeout:10000});
  await page.locator('#exam-sections button[data-section="reading"]').click();
  assert.equal(await page.locator('#questions .question').count(),5);
  assert.equal(await page.locator('#questions .question').nth(1).locator('button.option').count(),4);
  await page.locator('#papers button').nth(2).click();
  await page.waitForFunction(()=>document.getElementById('test-title')?.textContent.includes('0/100 original questions available'),null,{timeout:10000});
  assert.equal(await page.locator('#questions .question').count(),1);
  assert.equal(await page.locator('#questions .question button.option').count(),0);
  assert.match(await page.locator('#questions').innerText(),/このセクションの問題は準備中です/);
  assert.equal(errors.length,0,level+' page errors: '+errors.join('; '));
  console.log('PASS',level,'20 preserved paper cards; 100 positions; verified authored questions; no fake audio in pending listening');
  await page.close();
 }
 console.log('PASS: five-level JLPT practice center smoke tests');
})().catch(e=>{console.error('EXAM TEST FAIL:',e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.kill()});
