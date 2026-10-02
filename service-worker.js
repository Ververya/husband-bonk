const CACHE='husband-bonk-pages-v2-'+self.registration.scope;
const FILES=['./','./index.html','./css/game.css','./js/game.js','./js/storage.js','./js/character.js','./js/effects.js','./js/share.js','./data/dialogues.js','./data/alerts.js','./data/achievements.js','./assets/icons/husband.svg','./manifest.json','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.endsWith(self.registration.scope)||key==='husband-bonk-two-counters-v1')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  const known=FILES.some(file=>new URL(file,self.registration.scope).pathname===url.pathname);
  if(!known)return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(new Request(url.origin+url.pathname),copy)));}
    return response;
  }).catch(()=>caches.match(url.origin+url.pathname)));
});
