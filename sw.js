const CACHE_NAME = `baseflow-v1`;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
     const filesToCache = [
      '/',
      'index.html',
      'script.js',
      'js/execute.js',
      'js/pythonTranslation.js',
      'js/saveOpen.js',
      'js/tutorial.js',
      'style.css',
      'img/icon.png',
      'img/logoBaseFlow.png',
      'manifest.json'
    ];

    for (const file of filesToCache) {
      try {
        await cache.add(file);
        console.log(`Cached: ${file}`);
      } catch (err) {
        console.error(`Failed to cache: ${file}`, err);
      }
    }

  })());
});

self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Get the resource from the cache.
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    } else {
        try {
          // If the resource was not in the cache, try the network.
          const fetchResponse = await fetch(event.request);

          // Save the resource in the cache and return it.
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        } catch (e) {
          // The network failed.
        }
    }
  })());
});