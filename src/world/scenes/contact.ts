import * as THREE from 'three'
import { stations } from '../config'
import { projects } from '../../data/studio'
import { ImagePlane } from '../objects/ImagePlane'
import { TextPlane } from '../objects/TextPlane'
import { sharedImage } from '../assets'
import { gauss } from '../utils'
import type { SceneModule } from './types'

const R = 2.75
const PLATE_W = 2.05

/**
 * SCENE 7 — CONTACT
 * The journey ends where it started, resolved: the current closes into a ring,
 * "Let's talk." sits inside it, and the four shipped products orbit behind as
 * real plates. Those plates reuse the screenshots the project scenes already
 * fetched (see world/assets.ts), so the extra graphics cost nothing on the wire.
 */
export function createContact(): SceneModule {
  let group: THREE.Group | null = null
  let title: TextPlane | null = null
  let arc: THREE.Group | null = null
  const plates: { plane: ImagePlane; base: THREE.Vector3; phase: number }[] = []
  const made: (THREE.Texture | null)[] = []

  return {
    id: 'contact',
    index: 6,
    baseCurl: 0.1,
    isImage: false,

    async load() {
      const shots = projects.map((p) => p.hero ?? p.img)
      const uniq = Array.from(new Set(shots))
      const byUrl = new Map<string, THREE.Texture | null>()
      await Promise.all(
        uniq.map(async (u) => {
          try {
            const { tex } = await sharedImage(u)
            byUrl.set(u, tex)
          } catch {
            byUrl.set(u, null)
          }
        }),
      )
      made.push(...shots.map((u) => byUrl.get(u) ?? null))
    },

    shape(_i, _n, rnd, o) {
      const k = rnd()
      const a = rnd() * Math.PI * 2
      let r = 1
      let g = 0.7
      let b = 0.24
      let br = 0.8 + 0.6 * rnd()
      if (k < 0.62) {
        const rad = R + gauss(rnd) * 0.07
        o.x = Math.cos(a) * rad
        o.y = Math.sin(a) * rad
        o.z = gauss(rnd) * 0.07
        const w = Math.pow(Math.sin(a * 3) * 0.5 + 0.5, 3)
        r = 1 - 0.06 * w
        g = 0.7 + 0.2 * w
        b = 0.24 + 0.58 * w
      } else if (k < 0.86) {
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

      // the shipped work, held in an arc around the portal
      const rig = new THREE.Group()
      arc = rig
      // portrait frames put the copy higher, so the arc drops and tightens to stay behind the ring
      rig.position.set(0, ctx.portrait ? -1.5 : 0.15, -1.1)
      if (ctx.portrait) rig.scale.setScalar(0.62)
      group.add(rig)
      const crop = new THREE.Vector4(0, 0, 1, 1)
      const n = projects.length
      made.forEach((tex, i) => {
        if (!tex) return
        const img = tex.image as HTMLImageElement
        const aspect = img && img.height ? img.width / img.height : 1.78
        const plane = new ImagePlane(tex, crop, PLATE_W, aspect, ctx.shared, 0.16)
        const a = (ctx.portrait ? -0.62 : -0.95) + (i / Math.max(1, n - 1)) * (ctx.portrait ? 1.24 : 1.9)
        const rad = 5.6
        const base = new THREE.Vector3(Math.sin(a) * rad, 1.75 - i * (ctx.portrait ? 0.56 : 0.72), -Math.cos(a) * rad * 0.42 - 0.6)
        plane.mesh.position.copy(base)
        plane.mesh.rotation.y = -a * 0.85
        plane.mesh.rotation.x = 0.04 * (i - 1.5)
        rig.add(plane.mesh)
        plates.push({ plane, base, phase: i * 1.7 })
      })
    },

    update(ctx, pres, reveal) {
      title?.set(reveal, pres)
      const r = Math.min(1, reveal * 1.15)
      plates.forEach((p, i) => {
        p.plane.set(pres, r, 0)
        p.plane.mesh.position.y = p.base.y + Math.sin(ctx.pointer.y * 0.2 + i) * 0.04
      })
      if (arc) {
        arc.rotation.y = ctx.pointer.x * 0.16
        arc.rotation.x = -ctx.pointer.y * 0.06
      }
    },

    dispose() {
      title?.dispose()
      plates.forEach((p) => p.plane.dispose())
      plates.length = 0
    },
  }
}
