/**
 * Service worker.
 *
 * The build fills in VERSION and PRECACHE. Every deployment gets its own cache, so the page
 * and its scripts always come from the same version. A new version waits until the person
 * taps "Refresh" in the app, so nobody is switched mid-task and nobody is stuck on old files.
 * Only this site's own files are cached. Contacts and sign-in traffic never pass through here.
 */
const VERSION = '__VERSION__';
const CACHE = `dg-${VERSION}`;
const PRECACHE = ['__PRECACHE__'];
const OFFLINE_PAGE = './offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const stale = keys.filter((k) => k !== CACHE && (k.startsWith('dg-') || k.startsWith('daily-greetings-')));
    await Promise.all(stale.map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(request.mode === 'navigate' ? navigate(request, url) : assetFirst(request));
});

async function navigate(request, url) {
  const cache = await caches.open(CACHE);
  const scope = new URL(self.registration.scope).pathname;
  const isApp = url.pathname === scope || url.pathname === `${scope}index.html`;
  if (isApp) {
    const shell = await cache.match('./index.html');
    if (shell) return shell;
  }
  try {
    return await fetch(request);
  } catch (err) {
    return (await cache.match(OFFLINE_PAGE)) || Response.error();
  }
}

async function assetFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    return Response.error();
  }
}
