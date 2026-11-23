'use strict';
/** Real-browser end-to-end smoke test of each JLPT level in published site output. */
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');
const CHROME=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
if(!CHROME)throw Error('Chrome/Chromium not found');
const root=path.resolve(process.argv[2]||'public-site');
const PORT=8769;
const srv=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',root],{stdio:['ignore','ignore','pipe']});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser,passed=0;
const widths=[320,390,1280];
async function pageState(page,selector){
return page.evaluate(sel=>{
 const element=sel==='shadow'?
   document.querySelector('.nextstep-n3-root')?.shadowRoot?.querySelector('#app') :
   document.querySelector(sel);
 const r=element?.getBoundingClientRect();
 return {viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
   bodyScroll:document.body.scrollWidth,
   targetLeft:Math.round(r?.left??-1),targetRight:Math.round(r?.right??99999),
   targetWidth:Math.round(r?.width??0),hasContent:!!element,contentLength:element?.textContent?.length||0};
},selector);
}
(async()=>{
 await wait(800);
 browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const level of ['N5','N4','N3','N2','N1']){
  for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:width<700,hasTouch:width<700});
   const page=await context.newPage();
   page.setDefaultTimeout(45000);
   const errors=[];
   page.on('pageerror',e=>{if(errors.length<3)errors.push(String(e).slice(0,130))});
   try{
    const response=await page.goto('http://127.0.0.1:'+PORT+'/'+level+'/',{waitUntil:'domcontentloaded',timeout:95000});
    assert.equal(response.status(),200,'HTTP 200 '+level);
    if(level==='N3'){
      await page.waitForFunction(()=>!!document.querySelector('.nextstep-n3-root')?.shadowRoot?.querySelector('#app'),{timeout:45000});
      await page.waitForFunction(()=>!!document.querySelector('.nextstep-n3-root')?.shadowRoot?.querySelector('.paper'),{timeout:45000});
    }else if(level==='N1'){
      await page.locator('.cards .card').first().waitFor();
    }else if(level==='N2'){
      await page.locator('#viewer .kanji-big').waitFor();
    }else{
      await page.locator('#main .card').first().waitFor();
      await page.waitForTimeout(280);
    }
    const selector=level==='N3'?'shadow':level==='N1'?'.card':level==='N2'?'#viewer':'#main';
    const v=await pageState(page,selector);
    assert(v.hasContent&&v.contentLength>75,'Missing book content '+level+' '+width+': '+JSON.stringify(v));
    assert(v.scroll<=width+2,'Document overflows on '+level+'/'+width+': '+JSON.stringify(v));
    assert(v.targetLeft>=-3&&v.targetRight<=width+3,'Study card clipped on '+level+'/'+width+': '+JSON.stringify(v));
    if(level==='N3'){
      const card=await page.evaluate(()=>{
        const sh=document.querySelector('.nextstep-n3-root').shadowRoot;
        const nav=sh.querySelector('nav.cards');
        const buttons=[...nav.querySelectorAll('button')];
        const parent=nav.getBoundingClientRect();
        return {navWidth:parent.width,navRight:parent.right,
          buttonPositions:buttons.map(b=>({l:b.getBoundingClientRect().left,r:b.getBoundingClientRect().right})),
          paperOverflow:sh.querySelector('.paper').scrollWidth-sh.querySelector('.paper').clientWidth,
          books:buttons.length};
      });
      assert.equal(card.books,3);
      assert(card.paperOverflow<=2,'N3 paper content clipped '+width+': '+JSON.stringify(card));
      assert(card.buttonPositions.every(b=>b.l>=-2&&b.r<=width+2),'N3 book nav clipped '+width);
      if(width===390){
        const grammarButton=page.locator('.nextstep-n3-root').evaluate(el=>{
          const b=el.shadowRoot.querySelector('nav.cards button[data-book="grammar"]');
          if(b){b.click();return true}return false;
        });
        assert.equal(await grammarButton,true);
        await page.waitForTimeout(180);
        const grammar=await page.locator('.nextstep-n3-root').evaluate(el=>el.shadowRoot.querySelector('#app')?.textContent?.includes('Grammar'));
        assert(grammar,'N3 grammar tab fails');
      }
    }
    if(level==='N5'||level==='N4'){
      assert(await page.locator('.nextstep-home-link').count()===1,'Missing back-to-all-levels link');
      if(width===320){
       const boxes=await page.evaluate(()=>[...document.querySelectorAll('.table-wrap table.responsive-study-table')].slice(0,3).map(t=>{
        const tr=t.querySelector('tr:not(.mobile-header-row)'),r=tr?.getBoundingClientRect();
        return {tableWidth:t.getBoundingClientRect().width,tableRight:t.getBoundingClientRect().right,trRight:r?.right,
         firstLabel:tr?.querySelector('td')?.dataset.columnLabel};
       }));
       assert(boxes.length>0&&boxes.every(x=>x.tableRight<=width+2&&x.trRight<=width+2&&x.firstLabel),
         level+' table labels or phone card layout missing: '+JSON.stringify(boxes));
      }
      if(width===390){
        await page.locator('.nav button[data-view="words"]').click();
        const words=await page.locator('#main').innerText();
        assert(words.length>60,level+' vocabulary navigation missing');
      }
    }
    if(level==='N1'&&width===390){
       await page.locator('#readerFontSize').selectOption('large');
       assert.equal(await page.locator('body').getAttribute('data-reader-size'),'large');
       await page.locator('#readerFontSize').selectOption('normal');
    }
    if(level==='N2'&&width===390){
       await page.locator('.nav button[data-book="vocab"]').click();
       assert((await page.locator('#bookname').innerText()).includes('Vocabulary'),'N2 vocabulary tab fails');
    }
    assert.equal(errors.length,0,level+'/'+width+' JS runtime errors: '+errors.join('; '));
    passed++;console.log('BOOK PASS',level,width,JSON.stringify(v));
   }finally{
    await context.close();
   }
  }
 }
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const quiz=await context.newPage();
 await quiz.goto('http://127.0.0.1:'+PORT+'/N2/quiz.html',{waitUntil:'domcontentloaded'});
 await quiz.locator('.qitem').first().waitFor();
 assert.equal(await quiz.locator('.qitem').count(),50);
 await quiz.locator('.qitem').first().locator('button.choice').first().click();
 assert((await quiz.locator('#feedback-0').innerText()).length>60,'Immediate JP/EN/NE quiz explanation is missing');
 await quiz.locator('#furiganatoggle').click();
 assert.equal(await quiz.locator('#feedback-0').innerText()==='',false,'Toggling furigana erased answer feedback');
 console.log('QUIZ PASS 390 phone: 50 questions, instant answer, preserved furigana toggle');
 passed++;
 await context.close();
 console.log('ALL_READERS_PASS: '+passed+' browser scenarios');
})().catch(e=>{console.error('ALL_READERS_FAIL',e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();srv.kill()});
