// FinançasPRO Service Worker — PWA + Notificações
const CACHE = 'financas-pro-v1'
const STATIC = ['/', '/dashboard', '/movimentacoes', '/compromissos']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {})
        return res
      })
      .catch(() => caches.match(e.request))
  )
})

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'FinançasPRO', body: 'Novo alerta' }
  e.waitUntil(
    self.registration.showNotification(data.title || 'FinançasPRO', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((cs) => {
      const url = e.notification.data?.url || '/'
      const existing = cs.find((c) => c.url.includes(url) && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
