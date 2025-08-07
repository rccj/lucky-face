const CACHE_NAME = 'luckyface-models-v1';
const MODEL_FILES = [
  '/models/tiny_face_detector_model-weights_manifest.json',
  '/models/tiny_face_detector_model-shard1',
  '/models/ssd_mobilenetv1_model-weights_manifest.json',
  '/models/ssd_mobilenetv1_model-shard1',
  '/models/ssd_mobilenetv1_model-shard2'
];

// 安裝事件 - 預先緩存模型檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching model files');
      // 不在安裝時就緩存，讓用戶首次訪問更快
      return Promise.resolve();
    })
  );
});

// 啟用事件
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
  // 只處理模型檔案請求
  if (MODEL_FILES.some(file => event.request.url.includes(file))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            console.log('Service Worker: Serving from cache', event.request.url);
            return response;
          }
          
          console.log('Service Worker: Fetching and caching', event.request.url);
          return fetch(event.request).then((response) => {
            // 只緩存成功的請求
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
  }
});