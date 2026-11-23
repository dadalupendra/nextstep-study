'use strict';
/** Diagnostic only. Test actual source pages across device widths without changing site content. */
const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const CHROME=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
if(!CHROME)throw Error('Chromium not found');
const ROOT=path.resolve(process.argv[2]||'.'),PORT=8867;
const srv=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',ROOT],{stdio:['ignore','ignore','pipe']});
const paths=['/','/N5/','/N4/','/N3/','/N2/','/N1/','/N2/quiz.html'];
let browser,issues=0;
const sleep=ms=>new Promise(res=>setTimeout(res,ms));
function compact(t){return String(t||'').replace(/\s+/g,' ').slice(0,100)}
(async()=>{
 await sleep(850);
 browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const url of paths){
  for(const width of [320,390,768,1366]){
   const context=await browser.newContext({viewport:{width,height:850},isMobile:width<768,hasTouch:width<768});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>{if(errors.length<3)errors.push(String(e).slice(0,160))});
   page.on('console',m=>{if(m.type()==='error'&&errors.length<3)errors.push(m.text().slice(0,160))});
   try{
    const resp=await page.goto('http://127.0.0.1:'+PORT+url,{waitUntil:'domcontentloaded',timeout:95000});
    await page.waitForTimeout(url==='/N3/'?1100:600);
    const data=await page.evaluate(()=>{
      const width=document.documentElement.clientWidth,doc=document.documentElement;
      const first=(s)=>{const el=document.querySelector(s);return el?el.innerText.slice(0,110):null};
      const bad=[];
      for(const e of document.body.querySelectorAll('*')){
        if(bad.length>=7)break;
        if(e.closest('[hidden],script,style,template'))continue;
        const cs=getComputedStyle(e);
        if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='fixed')continue;
        const r=e.getBoundingClientRect();
        if(r.width<4||r.height<4)continue;
        if(r.right>width+3||r.left< -3){
          const tag=e.tagName.toLowerCase(),id=e.id?'#'+e.id:'',cl=[...e.classList].slice(0,3).join('.');
          bad.push({sel:tag+id+(cl?'.'+cl:''),right:Math.round(r.right),left:Math.round(r.left),w:Math.round(r.width),css:cs.overflowX,white:cs.whiteSpace,text:(e.textContent||'').trim().slice(0,52)});
        }
      }
      const links=[...document.querySelectorAll('a[href]')].filter(x=>x.getAttribute('href')==='#').length;
      const unlabeled=[...document.querySelectorAll('input,select,textarea')].filter(x=>{
       if(x.type==='hidden')return false;
       return !(x.labels?.length||x.getAttribute('aria-label')||x.getAttribute('title'));
      }).length;
      const missingAlt=[...document.images].filter(x=>!x.hasAttribute('alt')).length;
      return {title:document.title.slice(0,90),h1:document.querySelectorAll('h1').length,viewportMeta:!!document.querySelector('meta[name=viewport]'),bodyWidth:document.body.scrollWidth,docWidth:doc.scrollWidth,windowWidth:width,head:first('h1'),metaLen:(document.querySelector('meta[name=description]')?.content||'').length,anchorCount:document.querySelectorAll('a[href]').length,linkPlaceholder:links,missingAlt,unlabeled,totalNodes:document.querySelectorAll('*').length,offenders:bad,nav:[...document.querySelectorAll('nav button,nav a,[role=tab]')].slice(0,6).map(x=>x.textContent.trim().slice(0,30))};
    });
    if(data.docWidth>width+2||errors.length)issues++;
    console.log('AUDIT '+JSON.stringify({page:url,device:width,http:resp.status(),...data,jsErrors:errors}));
   }catch(e){issues++;console.log('AUDIT_ERROR '+JSON.stringify({page:url,device:width,error:String(e).slice(0,280)}))}
   await context.close();
  }
 }
 console.log('AUDIT_DONE issues='+issues+'; compare against production HTML, check original page differences separately.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();srv.kill()});
