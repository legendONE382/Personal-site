import * as THREE from 'three'
import { stations } from '../config'
import type { SceneId } from '../config'
import type { Project } from '../../data/studio'
import { ImagePlane } from '../objects/ImagePlane'
import { TextPlane } from '../objects/TextPlane'
import { gauss } from '../utils'
import type { SceneModule } from './types'

const SAMPLE_W = 384
const WIDTH = 5.8

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.decoding = 'async'
    i.onload = () => res(i)
    i.onerror = () => rej(new Error('image failed'))
    i.src = src
  })
}

/** Procedural stand-in so the world still runs if a screenshot is missing. */
function placeholder(title: string) {
  const c = document.createElement('canvas')
  c.width = 1280
  c.height = 720
  const g = c.getContext('2d')!
  const grd = g.createLinearGradient(0, 0, 1280, 720)
  grd.addColorStop(0, '#0b0d14')
  grd.addColorStop(1, '#2a1a05')
  g.fillStyle = grd
  g.fillRect(0, 0, 1280, 720)
  g.strokeStyle = 'rgba(255,178,62,.35)'
  for (let x = 0; x < 1280; x += 64) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, 720)
    g.stroke()
  }
  g.fillStyle = '#efeae0'
  g.font = '120px Georgia, serif'
  g.fillText(title, 80, 400)
  return c
}

/**
 * SCENES 3–6 — A SHIPPED PRODUCT
 * The particles assemble the project's real screenshot pixel by pixel (with
 * luminance relief), then the sharp image resolves through a dissolve front
 * while the cloud dims to a ghost. The title is display type in the scene.
 */
export function createProjectScene(index: number, def: Project): SceneModule {
  const station = stations[index]
  const cos = Math.cos(station.yaw)
  const sin = Math.sin(station.yaw)

  let sw = SAMPLE_W
  let sh = Math.round(SAMPLE_W / 1.78)
  let data: Uint8ClampedArray | null = null
  let aspect = 1.78
  let tex: THREE.Texture | null = null
  const crop = new THREE.Vector4(0, 0, 1, 1)

  let group: THREE.Group | null = null
  let plane: ImagePlane | null = null
  let title: TextPlane | null = null

  return {
    id: def.slug as SceneId,
    index,
    baseCurl: 0.1,
    isImage: true,

    async load() {
      const src = def.hero ?? def.img
      let source: CanvasImageSource
      let nw: number
      let nh: number
      try {
        const img = await loadImage(src)
        source = img
        nw = img.naturalWidth
        nh = img.naturalHeight
      } catch {
        const c = placeholder(def.title)
        source = c
        nw = c.width
        nh = c.height
      }
      const cl = (def.cropLeft ?? 0) / 100
      const ct = (def.cropTop ?? 0) / 100
      const sx = nw * cl
      const sy = nh * ct
      const cw = nw - sx
      const ch = nh - sy
      aspect = cw / ch
      sw = SAMPLE_W
      sh = Math.max(8, Math.round(SAMPLE_W / aspect))

      const cv = document.createElement('canvas')
      cv.width = sw
      cv.height = sh
      const g = cv.getContext('2d', { willReadFrequently: true })!
      g.drawImage(source, sx, sy, cw, ch, 0, 0, sw, sh)
      data = g.getImageData(0, 0, sw, sh).data

      tex = source instanceof HTMLCanvasElement ? new THREE.CanvasTexture(source) : new THREE.Texture(source as HTMLImageElement)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.generateMipmaps = true
      tex.needsUpdate = true
      crop.set(cl, 0, 1 - cl, 1 - ct)
    },

    shape(i, _n, rnd, o) {
      if (!data) {
        o.x = o.y = o.z = 0
        o.r = o.g = o.b = 0
        return
      }
      const px = i % (sw * sh)
      const cx = px % sw
      const cy = (px / sw) | 0
      const u = (cx + rnd()) / sw
      const v = (cy + rnd()) / sh
      const k = (cy * sw + cx) * 4
      const r = data[k] / 255
      const g = data[k + 1] / 255
      const b = data[k + 2] / 255
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const x = (u - 0.5) * WIDTH
      const y = (0.5 - v) * (WIDTH / aspect)
      const z = 0.08 + lum * 0.5 + gauss(rnd) * 0.04
      o.x = x * cos + z * sin
      o.y = y
      o.z = -x * sin + z * cos
      o.r = r * 1.05
      o.g = g * 1.05
      o.b = b * 1.05
    },

    build(root, ctx) {
      if (!tex) return
      group = new THREE.Group()
      group.position.copy(station.pos)
      group.rotation.y = station.yaw
      root.add(group)

      plane = new ImagePlane(tex, crop, WIDTH, aspect, ctx.shared)
      plane.mesh.position.z = -0.02
      group.add(plane.mesh)

      title = new TextPlane([{ text: def.title }], { fontPx: 170, worldLine: 0.92, shared: ctx.shared })
      group.add(title.mesh)
      const sc = Math.min(1, (WIDTH * 0.98) / title.width)
      title.mesh.scale.setScalar(sc)
      title.mesh.position.set(-WIDTH / 2 + (title.width * sc) / 2, WIDTH / aspect / 2 + 0.28 + (title.height * sc) / 2, 0.05)
    },

    update(ctx, pres, reveal) {
      if (!plane || !title || !group) return
      group.rotation.y = station.yaw + ctx.pointer.x * 0.06
      group.rotation.x = -ctx.pointer.y * 0.04
      plane.set(pres, reveal, 0)
      title.set(reveal, pres)
    },

    dispose() {
      plane?.dispose()
      title?.dispose()
      tex?.dispose()
    },
  }
}
