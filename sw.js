/* NextStep Study PWA: cache only pages/assets a reader actually opens.
 * Avoid precaching several-megabyte book files. */
const VERSION='nextstep-shell-v5';
const ROOT=new URL('./',self.registration.scope);
const SHELL=[ROOT.href,new URL('index.html',ROOT).href,new URL('manifest.webmanifest',ROOT).href,new URL('icons/icon.svg',ROOT).href,new URL('daily/index.html',ROOT).href,new URL('daily/style.css?v=4',ROOT).href,new URL('daily/data.js?v=4',ROOT).href,new URL('daily/app.js?v=4',ROOT).href,new URL('daily/compounds.js?v=4',ROOT).href,new URL('daily/offline-ai.js?v=1',ROOT).href];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nextstep-shell-')&&k!==VERSION).map(k=>caches.delete(k)))),self.clients.claim()]));});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 // Only cache files within the installation scope.
 const isStudyData=req.url.startsWith('https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/vocab/')||req.url.startsWith('https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/grammar/');
 if(!req.url.startsWith(ROOT.href)&&!isStudyData)return;
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION);
  try{const fresh=await fetch(req);if(fresh.ok&&fresh.type!=='opaque'&&!req.headers.has('range'))cache.put(req,fresh.clone()).catch(()=>{});return fresh;}
  catch(err){const saved=await cache.match(req,{ignoreSearch:false});if(saved)return saved;if(req.mode==='navigate'){const home=await cache.match(ROOT.href);if(home)return home;}throw err;}
 })());
});

/* Opt-in daily challenge notification: open the intended JLPT level.
 * This handles a click on an already displayed notification; it does not
 * schedule background delivery or subscribe users to a push service. */
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  const candidate=event.notification.data&&event.notification.data.url;
  let target;
  try{
   target=new URL(candidate||ROOT.href,ROOT);
   if(target.origin!==ROOT.origin||!target.href.startsWith(ROOT.href))target=new URL('index.html',ROOT);
  }catch(e){target=new URL('index.html',ROOT);}
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){
   try{
    if(new URL(client.url).origin===ROOT.origin){
     await client.navigate(target.href);
     if(typeof client.focus==='function')await client.focus();
     return;
    }
   }catch(e){}
  }
  if(self.clients.openWindow)await self.clients.openWindow(target.href);
 })());
});
