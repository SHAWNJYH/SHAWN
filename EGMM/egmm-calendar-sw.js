// EGMM CALENDAR - 최소 서비스 워커 (PWA 설치용, 캐싱 없음: 항상 네트워크 최신본 사용)
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) { /* 네트워크 기본 동작 유지 */ });
