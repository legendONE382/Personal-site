import * as THREE from 'three'
import { stations } from '../config'
import { TextPlane } from '../objects/TextPlane'
import { gauss } from '../utils'
import type { SceneModule } from './types'

/**
 * SCENE 7 — CONTACT
 * The current closes into a ring — a portal — with "Let's talk." set inside it.
 */
export function createContact(): SceneModule {
  const R = 2.75
  let group: THREE.Group | null = null
  let title: TextPlane | null = null

  return {
    id: 'contact',
    index: 6,
    baseCurl: 0.3,
    isImage: false,

    shape(_i, _n, rnd, o) {
      const k = rnd()
      const a = rnd() * Math.PI * 2
      let r = 1
      let g = 0.7
      let b = 0.24
      let br = 0.8 + 0.6 * rnd()
      if (k < 0.7) {
        const rad = R + gauss(rnd) * 0.07
        o.x = Math.cos(a) * rad
        o.y = Math.sin(a) * rad
        o.z = gauss(rnd) * 0.07
        const w = Math.pow(Math.sin(a * 3) * 0.5 + 0.5, 3)
        r = 1 - 0.06 * w
        g = 0.7 + 0.2 * w
        b = 0.24 + 0.58 * w
      } else if (k < 0.9) {
        const rad = R + rnd() * 2.8
        o.x = Math.cos(a) * rad
        o.y = Math.sin(a) * rad
        o.z = gauss(rnd) * 0.3
        br = 0.22 + 0.3 * rnd()
      } else {
        const rad = R + 0.7 + gauss(rnd) * 0.15
        o.x = Math.cos(a) * rad
        o.y = Math.sin(a) * rad * 0.55
        o.z = Math.sin(a * 2) * 1.4
        r = 0.4
        g = 0.85
        b = 1
        br = 0.9 + 0.5 * rnd()
      }
      o.r = r * br
      o.g = g * br
      o.b = b * br
    },

    build(root, ctx) {
      group = new THREE.Group()
      group.position.copy(stations[6].pos)
      root.add(group)
      title = new TextPlane([{ text: 'Let’s' }, { text: 'talk.', italic: true, color: '#ffb23e' }], {
        fontPx: 230,
        worldLine: 1.3,
        align: 'center',
        shared: ctx.shared,
      })
      group.add(title.mesh)
      title.mesh.position.set(0, 0, 0.25)
    },

    update(_ctx, pres, reveal) {
      title?.set(reveal, pres)
    },

    dispose() {
      title?.dispose()
    },
  }
}
