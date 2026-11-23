/* NextStep Study PWA: cache only pages/assets a reader actually opens.
 * Avoid precaching several-megabyte book files. */
const VERSION='nextstep-shell-v1';
const ROOT=new URL('./',self.registration.scope);
const SHELL=[ROOT.href,new URL('index.html',ROOT).href,new URL('manifest.webmanifest',ROOT).href,new URL('icons/icon.svg',ROOT).href];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nextstep-shell-')&&k!==VERSION).map(k=>caches.delete(k)))),self.clients.claim()]));});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 // Only cache files within the installation scope.
 if(!req.url.startsWith(ROOT.href))return;
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION);
  try{const fresh=await fetch(req);if(fresh.ok&&fresh.type!=='opaque'&&!req.headers.has('range'))cache.put(req,fresh.clone()).catch(()=>{});return fresh;}
  catch(err){const saved=await cache.match(req,{ignoreSearch:false});if(saved)return saved;if(req.mode==='navigate'){const home=await cache.match(ROOT.href);if(home)return home;}throw err;}
 })());
});
