// Flag Football Stats — Service Worker
// Verze cache — změň číslo při každém update aplikace
const CACHE_NAME = 'ff-stats-v9';

// Soubory které se uloží do cache pro offline použití
const FILES_TO_CACHE = [
  './flag_football_stats_v6.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalace — uloží soubory do cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache otevřena');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Aktivace — smaže staré cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Mažu starou cache:', key);
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// Fetch — vrátí z cache pokud není internet
self.addEventListener('fetch', event => {
  // API volání na Google Scripts vždy přes síť
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response; // vrátí z cache
      }
      return fetch(event.request).then(networkResponse => {
        // Uloží nové soubory do cache
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback
        return caches.match('./flag_football_stats_v6.html');
      });
    })
  );
});
