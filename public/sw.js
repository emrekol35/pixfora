// Pixfora Service Worker v2
const CACHE_NAME = "pixfora-v2";
const STATIC_CACHE = "pixfora-static-v2";
const IMAGE_CACHE = "pixfora-images-v2";
const OFFLINE_URL = "/offline.html";

// Onceden cache'lenecek kritik dosyalar
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.png",
];

// Install: Kritik dosyalari cache'e al
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: Eski cache'leri temizle
self.addEventListener("activate", (event) => {
  const keepCaches = [CACHE_NAME, STATIC_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !keepCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Cache boyut limiti: Eski kayitlari sil
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxItems);
  }
}

// Fetch stratejileri
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Sadece GET istekleri cache'le
  if (request.method !== "GET") return;

  // Chrome extension ve diger protocol'ler
  if (!url.protocol.startsWith("http")) return;

  // API istekleri: Network-only (cache'leme)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Urun gorselleri (uploads): Cache-first + stale-while-revalidate
  if (url.pathname.startsWith("/uploads/")) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
                trimCache(IMAGE_CACHE, 200); // Max 200 gorsel
              }
              return response;
            })
            .catch(() => cached);

          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Statik asset'ler (CSS, JS, fontlar, ikonlar): Cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(woff2?|ttf|eot|css|js)$/)
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
                trimCache(STATIC_CACHE, 100);
              }
              return response;
            })
            .catch(() => caches.match(OFFLINE_URL));
        })
      )
    );
    return;
  }

  // Genel resimler: Cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|gif|ico)$/)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
                trimCache(IMAGE_CACHE, 200);
              }
              return response;
            })
            .catch(() => new Response("", { status: 404 }));
        })
      )
    );
    return;
  }

  // Navigasyon istekleri: Network-first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Basarili navigasyonlari cache'le
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
              trimCache(CACHE_NAME, 30); // Max 30 sayfa
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: Once cache'den dene, yoksa offline sayfa
          return caches.match(request).then(
            (cached) => cached || caches.match(OFFLINE_URL)
          );
        })
    );
    return;
  }

  // Diger istekler: Network-first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
