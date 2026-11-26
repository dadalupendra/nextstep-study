'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const ROOT=path.resolve(process.argv[2]||'public-site'),PORT=8941;
const CHROME=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/google-chrome-stable'].find(fs.existsSync);
if(!CHROME)throw Error('Chrome needed for onboarding E2E');
const rules=fs.readFileSync(path.resolve('auth/firestore.rules'),'utf8');
assert(rules.includes('allow list: if isAdmin()'),'Only admin may list private profiles');
assert(rules.includes('allow list, create, update, delete: if false'),'Client cannot grant admin role');
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
(async()=>{
 await new Promise(resolve=>setTimeout(resolve,750));
 const browser=await chromium.launch({executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   await page.goto('http://127.0.0.1:'+PORT+'/?welcome=1',{waitUntil:'domcontentloaded'});
   await page.waitForURL(url=>url.pathname.endsWith('/onboarding/'),{timeout:11000});
   assert.equal(await page.locator('.screen:not([hidden])').count(),1);
   await page.locator('#welcomeNext').click();
   await page.locator('#lang').selectOption('ne');
   await page.locator('#languageNext').click();
   await page.locator('input[name=level][value=N3]').check();
   await page.locator('input[name=goal][value=reading]').check();
   await page.locator('#minutes').selectOption('60');
   await page.locator('#goalNext').click();
   assert.equal(await page.locator('#google').isDisabled(),true,'Unconfigured Google login cannot pretend to work');
   assert.equal(await page.locator('#facebook').isDisabled(),true,'Unconfigured Facebook login must remain disabled');
   assert.equal(await page.locator('#phone').isDisabled(),true,'Billing-dependent Phone OTP must remain disabled');
   await page.locator('#guest').click();
   await page.waitForURL(url=>url.pathname==='/',{timeout:12000});
   assert.equal(await page.locator('#learnerHome').isVisible(),true);
   assert((await page.locator('#learnerSummary').innerText()).includes('60 min'));
   assert((await page.locator('#learnerShortcuts a').count())>=2,'Goals should produce real study links');
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nextstep-onboarding')));
   assert.equal(saved.level,'N3');assert.equal(saved.lang,'ne');assert(saved.goals.includes('reading'));
   assert.equal(await page.locator('.levels .level').count(),5,'Existing JLPT cards retained');
   await page.goto('http://127.0.0.1:'+PORT+'/account/',{waitUntil:'domcontentloaded'});
   assert((await page.locator('#status').innerText()).includes('Guest Mode'),'Guest should never appear as verified login');
   await page.goto('http://127.0.0.1:'+PORT+'/admin-users/',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#directory').isVisible(),false,'Admin must not show fabricated or public account list');
   assert((await page.locator('#status').innerText()).includes('Not connected'));
   assert.deepEqual(errors,[],'Uncaught errors '+errors.join('; '));
   console.log('PASS '+width+'px welcome→language→goals→honest guest→personalized home, private profile/admin safeguards');
   await context.close()
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('ONBOARDING REGRESSION FAIL',e);process.exitCode=1}).finally(()=>server.kill());
