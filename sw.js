/**
 * Service worker: lets the app open instantly and work offline.
 *
 * App files are served from cache and refreshed in the background, so a new
 * deployment shows up on the next open without any version bumping.
 * Firebase's own scripts are cached the same way. Database and sign-in
 * traffic is never touched here.
 */
const CACHE = 'daily-greetings-v9';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './firebase-config.js',
  './css/tokens.css',
  './css/app.css',
  './js/theme-init.js',
  './js/app.js',
  './js/messages.js',
  './js/importer.js',
  './fonts/bricolage-grotesque-latin-wght-normal.woff2',
  './fonts/instrument-sans-latin-wght-normal.woff2',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];
const FIREBASE_SDK_HOST = 'www.gstatic.com';
const FIREBASE_SDK = [
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    await cache.addAll(SHELL);
    // Best effort: a failed SDK download must not block installing the app itself.
    await Promise.allSettled(FIREBASE_SDK.map((u) => cache.add(new Request(u, { mode: 'no-cors' }))));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && url.hostname !== FIREBASE_SDK_HOST) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: sameOrigin });
      const refresh = fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);
      if (cached) { event.waitUntil(refresh); return cached; }
      const fresh = await refresh;
      if (fresh) return fresh;
      if (request.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }),
  );
});
