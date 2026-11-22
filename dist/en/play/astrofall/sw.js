/* Offline cache isolated to this game and locale. */
const scope = self.registration.scope;
const prefix = 'night-observatory:' + scope + ':';
const cacheName = prefix + 'a110bd34abbe';
const assetPaths = ["/assets/night-observatory/icons/favicon-32.png?v=a110bd34abbe","/assets/night-observatory/icons/apple-touch-icon.png?v=a110bd34abbe","/assets/night-observatory/style.css?v=a110bd34abbe","/assets/night-observatory/js/i18n.js?v=a110bd34abbe","/assets/night-observatory/js/data.js?v=a110bd34abbe","/assets/night-observatory/js/campaign.js?v=a110bd34abbe","/assets/night-observatory/js/audio.js?v=a110bd34abbe","/assets/night-observatory/js/engine.js?v=a110bd34abbe","/assets/night-observatory/js/ui.js?v=a110bd34abbe","/assets/night-observatory/js/main.js?v=a110bd34abbe"];
const assetURLs = new Set(assetPaths.map(asset => new URL(asset, scope).href));
const shell = new URL('./', scope).href;
const manifest = new URL('./manifest.webmanifest', scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName)
    .then(cache => cache.addAll([shell, manifest, ...assetURLs]))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(prefix) && key !== cacheName).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const entry = request.mode === 'navigate' && url.origin + url.pathname === shell;
  if (!entry && request.url !== manifest && !assetURLs.has(request.url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    if (entry) {
      try { return await fetch(request); }
      catch (_) { return await cache.match(shell) || Response.error(); }
    }
    return await cache.match(request) || fetch(request);
  })());
});
