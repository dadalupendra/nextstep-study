// Cache refresh: delete older NextStep N1 shell caches after upgrade.
const CACHE='nextstep-n1-shell-v2';
const APP=['./','./index.html','./style.css','./app.js','./THIRD-PARTY-NOTICE.txt','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith('nextstep-n1-shell-')&&key!==CACHE)await caches.delete(key)}await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
 const r=event.request;
 if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;
 event.respondWith(caches.match(r,{cacheName:CACHE}).then(hit=>hit||fetch(r).then(res=>{
  if(res.ok&&r.url.match(/\.(?:css|js|html)$/)){caches.open(CACHE).then(c=>c.put(r,res.clone())).catch(()=>{})}
  return res
 })))
});
