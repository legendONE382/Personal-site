import { gauss } from '../utils'
import type { SceneModule } from './types'

const fract = (v: number) => v - Math.floor(v)
const hash2 = (a: number, b: number) => fract(Math.sin(a * 127.1 + b * 311.7) * 43758.5453)

/**
 * SCENE 2 — SIGNAL
 * The knot melts into the grid it runs on: a Lagos city lattice with power
 * towers rising from the junctions. Seen from above.
 */
export function createStatement(): SceneModule {
  const SP = 1.5
  return {
    id: 'statement',
    index: 1,
    baseCurl: 0.09,
    isImage: false,

    shape(_i, _n, rnd, o) {
      const k = rnd()
      if (k < 0.17) {
        const gx = Math.floor(rnd() * 13) - 6
        const gz = Math.floor(rnd() * 9) - 4
        const hh = 0.35 + 2.6 * Math.pow(hash2(gx, gz), 2)
        const t = rnd()
        o.x = gx * SP + gauss(rnd) * 0.03
        o.z = gz * SP + gauss(rnd) * 0.03
        o.y = t * hh
        if (t > 0.93) {
          o.r = 0.35 * 1.4
          o.g = 0.84 * 1.4
          o.b = 1
        } else {
          const br = 0.45 + 0.6 * t
          o.r = br
          o.g = 0.7 * br
          o.b = 0.24 * br
        }
      } else {
        if (rnd() < 0.5) {
          o.x = (rnd() - 0.5) * 18
          o.z = (Math.floor(rnd() * 9) - 4) * SP
        } else {
          o.x = (Math.floor(rnd() * 13) - 6) * SP
          o.z = (rnd() - 0.5) * 12
        }
        o.y = gauss(rnd) * 0.03
        const nx = Math.abs(o.x / SP - Math.round(o.x / SP))
        const nz = Math.abs(o.z / SP - Math.round(o.z / SP))
        const glow = Math.exp(-(nx * nx + nz * nz) * 40)
        const br = 0.32 + glow * 1.1
        o.r = br
        o.g = 0.7 * br
        o.b = 0.24 * br
      }
    },

    build() {},
    update() {},
    dispose() {},
  }
}
