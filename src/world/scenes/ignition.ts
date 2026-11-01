import * as THREE from 'three'
import { stations } from '../config'
import { TextPlane } from '../objects/TextPlane'
import { gauss } from '../utils'
import type { SceneModule } from './types'

/**
 * SCENE 1 — IGNITION
 * The raw signal: a (2,3) torus-knot of current made of every particle.
 * The headline is display type inside the scene, not HTML.
 */
export function createIgnition(): SceneModule {
  let group: THREE.Group | null = null
  let title: TextPlane | null = null

  return {
    id: 'ignition',
    index: 0,
    baseCurl: 0.1,
    isImage: false,

    shape(_i, _n, rnd, o) {
      const u = rnd() * Math.PI * 2
      const rr = 2 + Math.cos(3 * u)
      const s = 0.15 + 0.1 * rnd()
      o.x = rr * Math.cos(2 * u) * 0.95 + gauss(rnd) * s
      o.y = rr * Math.sin(2 * u) * 0.95 + gauss(rnd) * s
      o.z = Math.sin(3 * u) * 0.95 + gauss(rnd) * s
      const k = rnd()
      const br = 0.75 + 0.5 * rnd()
      let r = 1
      let g = 0.7
      let b = 0.24
      if (k < 0.1) [r, g, b] = [0.94, 0.9, 0.82]
      else if (k < 0.17) [r, g, b] = [0.35, 0.84, 1]
      o.r = r * br
      o.g = g * br
      o.b = b * br
    },

    build(root, ctx) {
      group = new THREE.Group()
      group.position.copy(stations[0].pos)
      root.add(group)
      title = new TextPlane([{ text: 'Software' }, { text: 'that ships.', italic: true, color: '#ffb23e' }], {
        fontPx: 220,
        worldLine: 1.55,
        shared: ctx.shared,
      })
      group.add(title.mesh)
    },

    update(ctx, pres, reveal) {
      if (!title) return
      /* fit by width AND by height, so a wide-but-short laptop screen can't push
         the headline down into the HTML copy below it */
      const byW = (ctx.viewW * 0.9) / title.width
      const byH = (ctx.viewH * (ctx.portrait ? 0.3 : 0.36)) / title.height
      const sc = Math.min(1, byW, byH)
      title.mesh.scale.setScalar(sc)
      if (!ctx.portrait) {
        // anchor the TOP edge just under the HUD; the block grows downward from there
        const p = ctx.localFromScreen(0.055, 0.17)
        title.mesh.position.set(p.x + (title.width * sc) / 2, p.y - (title.height * sc) / 2, 0.6)
      } else {
        const p = ctx.localFromScreen(0.5, 0.49)
        title.mesh.position.set(p.x, p.y, 0.6)
      }
      title.set(Math.min(ctx.introReveal, reveal), Math.min(1, ctx.introReveal * 2) * pres)
    },

    dispose() {
      title?.dispose()
    },
  }
}
