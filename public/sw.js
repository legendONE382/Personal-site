/* The Signal — service worker.
 *
 * Strategy, chosen for shaky connections:
 *  • The app shell (HTML) is network-first with a fast fallback to cache, so a
 *    deploy is picked up on the next visit but a dead network still loads.
 *  • Hashed build assets (/assets/*, /fonts/*) are cache-first and immutable.
 *  • Everything is precached on first install, so the SECOND visit is instant
 *    and works fully offline — including the WebGL world.
 */
const VERSION = 'signal-v1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  // addAll() rejects if ANY entry 404s, which would silently disable offline
  // for the whole site. Fetch them independently so one bad path can't sink it.
  e.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION)
      const settled = await Promise.allSettled(
        SHELL.map(async (u) => {
          const res = await fetch(u, { cache: 'reload' })
          if (res.ok) await cache.put(u, res)
        }),
      )
      const failed = settled.filter((r) => r.status === 'rejected').length
      if (failed) console.warn(`[sw] ${failed} of ${SHELL.length} precache entries unavailable; continuing`)
    })().then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const isImmutable = (url) => /\/(assets|fonts)\//.test(url.pathname)
const sameOrigin = (url) => url.origin === self.location.origin

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (!sameOrigin(url)) return

  if (isImmutable(url)) {
    // cache-first: hashed filenames never change content
    e.respondWith(
      caches.match(req, { ignoreVary: true }).then(
        (hit) =>
          hit ||
          fetch(req).then(async (res) => {
            if (res.ok) {
              const c = await caches.open(VERSION)
              await c.put(req, res.clone())
            }
            return res
          }),
      ),
    )
    return
  }

  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    // network-first with a 3.5 s budget, then cache
    e.respondWith(
      new Promise((resolve) => {
        let settled = false
        const timer = setTimeout(() => {
          if (settled) return
          caches.match('/index.html').then((hit) => {
            if (hit && !settled) {
              settled = true
              resolve(hit)
            }
          })
        }, 3500)
        fetch(req)
          .then((res) => {
            clearTimeout(timer)
            if (!settled) {
              settled = true
              if (res.ok) caches.open(VERSION).then((c) => c.put('/index.html', res.clone()))
              resolve(res)
            }
          })
          .catch(async () => {
            clearTimeout(timer)
            if (settled) return
            settled = true
            resolve((await caches.match('/index.html')) || Response.error())
          })
      }),
    )
  }
})
