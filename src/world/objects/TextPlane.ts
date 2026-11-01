import * as THREE from 'three'
import { PLANE_VERT, TEXT_FRAG } from '../shaders/objects'
import type { SharedUniforms } from '../scenes/types'

export interface TextLine {
  text: string
  italic?: boolean
  color?: string
}

const FAMILY = '"Instrument Serif", "Iowan Old Style", "Palatino Linotype", Georgia, serif'

/**
 * Display type that lives inside the scene. The text is drawn once into a
 * canvas texture; the shader reveals it line by line and bends it with the
 * fluid under the cursor.
 */
export class TextPlane {
  mesh: THREE.Mesh
  width: number
  height: number
  private mat: THREE.ShaderMaterial
  private tex: THREE.CanvasTexture

  constructor(lines: TextLine[], o: { fontPx: number; worldLine: number; align?: 'left' | 'center'; shared: SharedUniforms }) {
    const fontPx = o.fontPx
    const lineH = Math.round(fontPx * 1.04)
    const pad = Math.round(fontPx * 0.18)
    const font = (it?: boolean) => `${it ? 'italic ' : ''}400 ${fontPx}px ${FAMILY}`

    const meas = document.createElement('canvas').getContext('2d')!
    let maxW = 0
    for (const l of lines) {
      meas.font = font(l.italic)
      maxW = Math.max(maxW, meas.measureText(l.text).width)
    }
    const cw = Math.min(4096, Math.ceil(maxW + pad * 2))
    const ch = Math.ceil(lines.length * lineH + pad * 2)

    const cv = document.createElement('canvas')
    cv.width = cw
    cv.height = ch
    const g = cv.getContext('2d')!
    g.textBaseline = 'alphabetic'
    lines.forEach((l, i) => {
      g.font = font(l.italic)
      g.fillStyle = l.color ?? '#efeae0'
      const w = g.measureText(l.text).width
      const x = o.align === 'center' ? (cw - w) / 2 : pad
      g.fillText(l.text, x, pad + i * lineH + lineH * 0.78)
    })

    this.tex = new THREE.CanvasTexture(cv)
    this.tex.colorSpace = THREE.SRGBColorSpace
    this.tex.minFilter = THREE.LinearFilter
    this.tex.generateMipmaps = false
    this.tex.anisotropy = 4

    const wpp = o.worldLine / lineH
    this.width = cw * wpp
    this.height = ch * wpp

    this.mat = new THREE.ShaderMaterial({
      vertexShader: PLANE_VERT,
      fragmentShader: TEXT_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: this.tex },
        uVel: o.shared.uVel,
        uRes: o.shared.uRes,
        uScrollVel: o.shared.uScrollVel,
        uReveal: { value: 0 },
        uOpacity: { value: 0 },
        uLines: { value: lines.length },
        uLineT: { value: lineH / ch },
        uPadT: { value: pad / ch },
      },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), this.mat)
    this.mesh.renderOrder = 3
    this.mesh.visible = false
  }

  set(reveal: number, opacity: number) {
    this.mat.uniforms.uReveal.value = reveal
    this.mat.uniforms.uOpacity.value = opacity
    this.mesh.visible = opacity > 0.003 && reveal > 0.003
  }

  dispose() {
    this.tex.dispose()
    this.mat.dispose()
    this.mesh.geometry.dispose()
  }
}
