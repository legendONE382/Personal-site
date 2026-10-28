import * as THREE from 'three'
import { COPY_FRAG, POINTS_FRAG, POINTS_VERT, POS_FRAG, VEL_FRAG } from '../shaders/particles'
import type { ShapeFn } from '../scenes/types'
import { clamp, mulberry32 } from '../utils'
import { Double, FullPass, fullMaterial } from './rt'

const u = <T>(value: T): THREE.IUniform<T> => ({ value })

export interface ParticleParams {
  dt: number
  time: number
  a: number
  b: number
  mix: number
  spring: number
  curl: number
  curlScale: number
  drag: number
  push: number
  hold: number
  intensity: number
  size: number
  projScale: number
  groupPos: THREE.Vector3
  viewProj: THREE.Matrix4
  camRight: THREE.Vector3
  camUp: THREE.Vector3
  fluid: THREE.Texture
}

/**
 * GPGPU particle system. Positions and velocities live in half-float render
 * targets and are integrated on the GPU: 262,144 particles on desktop,
 * 65,536 on phones. Every scene supplies a morph target; the whole cloud
 * springs between them. Targets and their colours are stored in 2D texture
 * arrays (one layer per scene).
 */
export class Particles {
  readonly size: number
  readonly count: number
  readonly points: THREE.Points

  private renderer: THREE.WebGLRenderer
  private pass: FullPass
  private pos: Double
  private vel: Double
  private velMat: THREE.ShaderMaterial
  private posMat: THREE.ShaderMaterial
  private pointsMat: THREE.ShaderMaterial
  private targets: THREE.DataArrayTexture | null = null
  private colors: THREE.DataArrayTexture | null = null

  constructor(renderer: THREE.WebGLRenderer, size: number, firstShape: ShapeFn) {
    this.renderer = renderer
    this.size = size
    this.count = size * size
    this.pass = new FullPass(renderer)
    this.pos = new Double(size, size, false)
    this.vel = new Double(size, size, false)

    this.velMat = fullMaterial(VEL_FRAG, {
      tPos: u(null), tVel: u(null), uTargets: u(null), uFluid: u(null),
      uA: u(0), uB: u(0), uMix: u(0), uTime: u(0), uDt: u(0.016),
      uSpring: u(1), uCurl: u(1), uCurlScale: u(0.38), uDrag: u(3.4), uPush: u(0.03),
      uViewProj: u(new THREE.Matrix4()), uGroupPos: u(new THREE.Vector3()),
      uCamRight: u(new THREE.Vector3(1, 0, 0)), uCamUp: u(new THREE.Vector3(0, 1, 0)),
    })
    this.posMat = fullMaterial(POS_FRAG, { tPos: u(null), tVel: u(null), uDt: u(0.016) })

    // scatter the cloud so the preloader has something to pull together
    const init = new Float32Array(this.count * 4)
    const rnd = mulberry32(99)
    for (let i = 0; i < this.count; i++) {
      const r = 9 * Math.cbrt(rnd())
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(2 * rnd() - 1)
      init[i * 4] = r * Math.sin(ph) * Math.cos(th)
      init[i * 4 + 1] = r * Math.sin(ph) * Math.sin(th)
      init[i * 4 + 2] = r * Math.cos(ph)
      init[i * 4 + 3] = 1
    }
    const tex = new THREE.DataTexture(init, size, size, THREE.RGBAFormat, THREE.FloatType)
    tex.needsUpdate = true
    const copy = fullMaterial(COPY_FRAG, { tMap: u(tex) })
    this.pass.run(copy, this.pos.read)
    copy.dispose()
    tex.dispose()

    this.buildSync([firstShape])

    // geometry: one point per texel, pointing at its texel
    const geo = new THREE.BufferGeometry()
    const ref = new Float32Array(this.count * 2)
    const rand = new Float32Array(this.count)
    const r2 = mulberry32(5)
    for (let i = 0; i < this.count; i++) {
      ref[i * 2] = ((i % size) + 0.5) / size
      ref[i * 2 + 1] = (Math.floor(i / size) + 0.5) / size
      rand[i] = r2()
    }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.count * 3), 3))
    geo.setAttribute('aRef', new THREE.BufferAttribute(ref, 2))
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))

    this.pointsMat = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERT,
      fragmentShader: POINTS_FRAG,
      uniforms: {
        uPos: u(null), uVel: u(null), uColors: u(this.colors),
        uA: u(0), uB: u(0), uMix: u(0), uSize: u(0.016), uProjScale: u(800), uHold: u(0), uIntensity: u(1),
        uGroupPos: u(new THREE.Vector3()),
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendEquation: THREE.AddEquation,
    })
    this.points = new THREE.Points(geo, this.pointsMat)
    this.points.frustumCulled = false
    this.points.renderOrder = 4
  }

  private fill(shapes: ShapeFn[]) {
    const n = this.count
    const L = shapes.length
    const pos = new Float32Array(n * 4 * L)
    const col = new Uint8Array(n * 4 * L)
    return { pos, col, L, n }
  }

  private writeLayer(buf: { pos: Float32Array; col: Uint8Array; n: number }, shape: ShapeFn, layer: number) {
    const o = { x: 0, y: 0, z: 0, r: 0, g: 0, b: 0 }
    const rnd = mulberry32(1337 + layer * 7919)
    const off = layer * buf.n * 4
    for (let i = 0; i < buf.n; i++) {
      shape(i, buf.n, rnd, o)
      const k = off + i * 4
      buf.pos[k] = o.x
      buf.pos[k + 1] = o.y
      buf.pos[k + 2] = o.z
      buf.pos[k + 3] = 1
      buf.col[k] = clamp(o.r * 255, 0, 255)
      buf.col[k + 1] = clamp(o.g * 255, 0, 255)
      buf.col[k + 2] = clamp(o.b * 255, 0, 255)
      buf.col[k + 3] = 255
    }
  }

  private upload(buf: { pos: Float32Array; col: Uint8Array; L: number }) {
    const t = new THREE.DataArrayTexture(buf.pos, this.size, this.size, buf.L)
    t.format = THREE.RGBAFormat
    t.type = THREE.FloatType
    t.minFilter = THREE.NearestFilter
    t.magFilter = THREE.NearestFilter
    t.needsUpdate = true
    const c = new THREE.DataArrayTexture(buf.col, this.size, this.size, buf.L)
    c.format = THREE.RGBAFormat
    c.type = THREE.UnsignedByteType
    c.minFilter = THREE.NearestFilter
    c.magFilter = THREE.NearestFilter
    c.needsUpdate = true
    this.targets?.dispose()
    this.colors?.dispose()
    this.targets = t
    this.colors = c
    this.velMat.uniforms.uTargets.value = t
    if (this.pointsMat) this.pointsMat.uniforms.uColors.value = c
  }

  private buildSync(shapes: ShapeFn[]) {
    const buf = this.fill(shapes)
    shapes.forEach((s, i) => this.writeLayer(buf, s, i))
    this.upload(buf)
  }

  /** Build every scene's morph target, yielding to the browser between layers. */
  async buildTargets(shapes: ShapeFn[], onProgress?: (f: number) => void) {
    const buf = this.fill(shapes)
    for (let i = 0; i < shapes.length; i++) {
      this.writeLayer(buf, shapes[i], i)
      onProgress?.((i + 1) / shapes.length)
      await new Promise((r) => setTimeout(r, 0))
    }
    this.upload(buf)
  }

  setFraction(f: number) {
    this.points.geometry.setDrawRange(0, Math.floor(this.count * clamp(f, 0.05, 1)))
  }

  update(p: ParticleParams) {
    const v = this.velMat.uniforms
    v.tPos.value = this.pos.read.texture
    v.tVel.value = this.vel.read.texture
    v.uFluid.value = p.fluid
    v.uA.value = p.a
    v.uB.value = p.b
    v.uMix.value = p.mix
    v.uTime.value = p.time
    v.uDt.value = p.dt
    v.uSpring.value = p.spring
    v.uCurl.value = p.curl
    v.uCurlScale.value = p.curlScale
    v.uDrag.value = p.drag
    v.uPush.value = p.push
    ;(v.uViewProj.value as THREE.Matrix4).copy(p.viewProj)
    ;(v.uGroupPos.value as THREE.Vector3).copy(p.groupPos)
    ;(v.uCamRight.value as THREE.Vector3).copy(p.camRight)
    ;(v.uCamUp.value as THREE.Vector3).copy(p.camUp)
    this.pass.run(this.velMat, this.vel.write)
    this.vel.swap()

    const q = this.posMat.uniforms
    q.tPos.value = this.pos.read.texture
    q.tVel.value = this.vel.read.texture
    q.uDt.value = p.dt
    this.pass.run(this.posMat, this.pos.write)
    this.pos.swap()

    const r = this.pointsMat.uniforms
    r.uPos.value = this.pos.read.texture
    r.uVel.value = this.vel.read.texture
    r.uA.value = p.a
    r.uB.value = p.b
    r.uMix.value = p.mix
    r.uSize.value = p.size
    r.uProjScale.value = p.projScale
    r.uHold.value = p.hold
    r.uIntensity.value = p.intensity
    ;(r.uGroupPos.value as THREE.Vector3).copy(p.groupPos)
  }

  dispose() {
    this.pos.dispose()
    this.vel.dispose()
    this.targets?.dispose()
    this.colors?.dispose()
    this.points.geometry.dispose()
    this.pointsMat.dispose()
    this.velMat.dispose()
    this.posMat.dispose()
    this.pass.dispose()
    void this.renderer
  }
}
