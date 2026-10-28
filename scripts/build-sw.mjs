/**
 * Post-build step (deploy build only): inject the exact list of built assets
 * into the service worker so EVERYTHING is precached on the first visit —
 * the WebGL engine, fonts and screenshots included. After one visit the whole
 * site works fully offline, and the second visit is instant.
 *
 * The cache name includes a content hash of the list, so every deploy gets a
 * fresh cache and stale chunks are evicted on activate.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const dist = new URL('../dist/', import.meta.url).pathname
const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full)
    else files.push('/' + relative(dist, full).split('\\').join('/'))
  }
}
walk(dist)

const precache = files.filter((f) => !/\/(sw\.js|_headers)$/.test(f) && !f.endsWith('.map'))
const version = 'signal-' + createHash('sha1').update(precache.join('\n')).digest('hex').slice(0, 10)

const swPath = join(dist, 'sw.js')
let sw = readFileSync(swPath, 'utf8')
sw = sw.replace("const VERSION = 'signal-v1'", `const VERSION = '${version}'`)
sw = sw.replace("const SHELL = ['/', '/index.html', '/manifest.webmanifest']", `const SHELL = ${JSON.stringify(['/', ...precache])}`)
writeFileSync(swPath, sw)

const kb = (n) => (n / 1024).toFixed(0) + ' KB'
const total = precache.reduce((s, f) => s + statSync(join(dist, f)).size, 0)
console.log(`[sw] precaching ${precache.length} files (${kb(total)}) as ${version}`)
