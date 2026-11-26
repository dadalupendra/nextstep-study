'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const ROOT=path.resolve(process.argv[2]||'public-site'),PORT=8934;
const chrome=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/google-chrome-stable'].find(fs.existsSync);
if(!chrome)throw Error('Chrome required');
const questions=JSON.parse(fs.readFileSync(path.join(ROOT,'exam-plus/questions.json'),'utf8')).questions;
const books=JSON.parse(fs.readFileSync(path.join(ROOT,'exam-plus/books.json'),'utf8')).books;
assert.equal(questions.length,54);
assert.equal(new Set(questions.map(q=>q.id)).size,54,'Every practice question must have unique stable ID');
for(const q of questions){
 assert.equal(q.options.length,4,q.id+' four choices');
 assert.equal(new Set(q.options).size,4,q.id+' no duplicate choices');
 assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,q.id+' valid correct answer');
 assert(q.explanation.ja&&q.explanation.en&&q.explanation.ne,q.id+' trilingual explanations');
}
assert.equal(books.NAT.length,5);
assert.equal(books.JFT.length,4);
assert.equal(books.BJT.length,4);
for(const level of ['5Q','4Q','3Q','2Q','1Q'])assert.equal(questions.filter(q=>q.exam==='NAT'&&q.level===level).length,6);
assert.equal(questions.filter(q=>q.exam==='JFT').length,12);
assert.equal(questions.filter(q=>q.exam==='BJT').length,12);
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
(async()=>{
 await new Promise(r=>setTimeout(r,850));
 const browser=await chromium.launch({executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 for(const [exam,level,expected] of [['NAT','5Q',6],['NAT','4Q',6],['NAT','3Q',6],['NAT','2Q',6],['NAT','1Q',6],['JFT',null,12],['BJT',null,12]]){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+PORT+'/exam-plus/?exam='+exam+(level?'&level='+level:''),{waitUntil:'domcontentloaded'});
  await page.locator('#status').getByText('Ready:',{exact:false}).waitFor({timeout:15000}).catch(()=>{});
  assert.equal(await page.locator('.chapter').count(),1,'Page-by-page textbook must show one actual chapter');
  assert.equal(await page.locator('#bookPageNumber').innerText().then(x=>x.includes('/ '+(exam==='NAT'?1:4))),true);
  assert((await page.locator('#language option').count())>=90,'90+ language options');
  if(exam!=='NAT'){await page.locator('#bookNext').click();assert((await page.locator('#bookPageNumber').innerText()).includes('2 / 4'),'Next page must navigate a new chapter');}
  assert.equal(await page.locator('#book').isVisible(),true);
  await page.locator('#language').selectOption('ne');
  assert.equal(await page.locator('.chapter .explain').first().innerText().then(x=>x.length>14),true);
  await page.locator('#quizTab').click();
  assert.equal(await page.locator('#quiz').isVisible(),true);
  assert((await page.locator('#quizCount').innerText()).includes('/ '+expected));
  assert.equal(await page.locator('.answers button').count(),4);
  await page.locator('.answers button').first().click();
  assert.equal(await page.locator('.answers button').first().getAttribute('aria-pressed'),'true');
  await page.locator('#finish').click();
  assert.equal(await page.locator('#results').isVisible(),true);
  assert.equal(await page.locator('.feedback').count(),1);
  assert((await page.locator('#results').innerText()).includes('/ '+expected));
  assert.equal(errors.length,0,'Unexpected browser errors: '+errors.join('; '));
  console.log('PASS '+exam+' '+(level||'all')+' book, quiz, review and trilingual explanations');
  await context.close()
 }
 }finally{await browser.close()}
})().catch(e=>{console.error('EXAM PLUS TEST FAILED',e);process.exitCode=1}).finally(()=>server.kill());
