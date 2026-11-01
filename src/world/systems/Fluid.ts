import * as THREE from 'three'
import { ADVECT, CLEAR, CURL, DIVERGENCE, GRADIENT, PRESSURE, SPLAT, VORTICITY } from '../shaders/fluid'
import { Double, FullPass, fullMaterial, makeRT } from './rt'

const u = <T>(value: T): THREE.IUniform<T> => ({ value })

/**
 * GPU fluid simulation stirred by the cursor (no clicks needed). Its velocity
 * field is sampled by the post lens (refraction), by the particles (push) and
 * by the screenshots and display type (ripple). Its dye field leaves a faint
 * amber wake behind the pointer.
 */
export class Fluid {
  cfg = { curl: 26, velDissipation: 0.9, dyeDissipation: 2.2, pressure: 0.8, iterations: 16, force: 5200, radius: 0.2 }

  velocity!: Double
  dye!: Double
  pressure!: Double
  divergence!: THREE.WebGLRenderTarget
  curlRT!: THREE.WebGLRenderTarget

  private pass: FullPass
  private simRes: number
  private dyeRes: number
  private aspect: number
  private texel = new THREE.Vector2()

  private mAdvect: THREE.ShaderMaterial
  private mSplat: THREE.ShaderMaterial
  private mDiv: THREE.ShaderMaterial
  private mCurl: THREE.ShaderMaterial
  private mVort: THREE.ShaderMaterial
  private mPress: THREE.ShaderMaterial
  private mGrad: THREE.ShaderMaterial
  private mClear: THREE.ShaderMaterial

  constructor(renderer: THREE.WebGLRenderer, simRes: number, dyeRes: number, aspect: number) {
    this.simRes = simRes
    this.dyeRes = dyeRes
    this.aspect = aspect
    this.pass = new FullPass(renderer)

    this.mAdvect = fullMaterial(ADVECT, { uVelocity: u(null), uSource: u(null), uTexel: u(this.texel), uDt: u(0), uDissipation: u(0) })
    this.mSplat = fullMaterial(SPLAT, { uTarget: u(null), uAspect: u(1), uColor: u(new THREE.Vector3()), uPoint: u(new THREE.Vector2()), uRadius: u(0.002) })
    this.mDiv = fullMaterial(DIVERGENCE, { uVelocity: u(null), uTexel: u(this.texel) })
    this.mCurl = fullMaterial(CURL, { uVelocity: u(null), uTexel: u(this.texel) })
    this.mVort = fullMaterial(VORTICITY, { uVelocity: u(null), uCurl: u(null), uTexel: u(this.texel), uCurlStrength: u(0), uDt: u(0) })
    this.mPress = fullMaterial(PRESSURE, { uPressure: u(null), uDivergence: u(null), uTexel: u(this.texel) })
    this.mGrad = fullMaterial(GRADIENT, { uPressure: u(null), uVelocity: u(null), uTexel: u(this.texel) })
    this.mClear = fullMaterial(CLEAR, { uTexture: u(null), uValue: u(0) })

    this.build()
  }

  private res(base: number) {
    const a = this.aspect < 1 ? 1 / this.aspect : this.aspect
    const min = Math.round(base)
    const max = Math.round(base * a)
    return this.aspect > 1 ? { w: max, h: min } : { w: min, h: max }
  }

  private build() {
    const s = this.res(this.simRes)
    const d = this.res(this.dyeRes)
    this.velocity = new Double(s.w, s.h)
    this.pressure = new Double(s.w, s.h, false)
    this.dye = new Double(d.w, d.h)
    this.divergence = makeRT(s.w, s.h, false)
    this.curlRT = makeRT(s.w, s.h, false)
    this.texel.set(1 / s.w, 1 / s.h)
  }

  private destroy() {
    this.velocity.dispose()
    this.pressure.dispose()
    this.dye.dispose()
    this.divergence.dispose()
    this.curlRT.dispose()
  }

  resize(aspect: number) {
    if (Math.abs(aspect - this.aspect) / this.aspect < 0.08) return
    this.aspect = aspect
    this.destroy()
    this.build()
  }

  private run(mat: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget, vals: Record<string, unknown>) {
    for (const k in vals) mat.uniforms[k].value = vals[k]
    this.pass.run(mat, target)
  }

  /** Stir the fluid. (u,v) in 0..1, (du,dv) is movement in uv units. */
  splat(x: number, y: number, du: number, dv: number, dye = 1) {
    const c = this.cfg
    let radius = c.radius / 100
    if (this.aspect > 1) radius *= this.aspect
    const mat = this.mSplat
    mat.uniforms.uAspect.value = this.aspect
    ;(mat.uniforms.uPoint.value as THREE.Vector2).set(x, y)
    mat.uniforms.uRadius.value = radius

    ;(mat.uniforms.uColor.value as THREE.Vector3).set(du * c.force, dv * c.force, 0)
    this.run(mat, this.velocity.write, { uTarget: this.velocity.read.texture })
    this.velocity.swap()

    ;(mat.uniforms.uColor.value as THREE.Vector3).set(0.05 * dye, 0.031 * dye, 0.009 * dye)
    this.run(mat, this.dye.write, { uTarget: this.dye.read.texture })
    this.dye.swap()
  }

  step(dt: number) {
    const c = this.cfg
    const v = this.velocity
    const p = this.pressure

    this.run(this.mCurl, this.curlRT, { uVelocity: v.read.texture })
    this.run(this.mVort, v.write, { uVelocity: v.read.texture, uCurl: this.curlRT.texture, uCurlStrength: c.curl, uDt: dt })
    v.swap()
    this.run(this.mDiv, this.divergence, { uVelocity: v.read.texture })
    this.run(this.mClear, p.write, { uTexture: p.read.texture, uValue: c.pressure })
    p.swap()
    for (let i = 0; i < c.iterations; i++) {
      this.run(this.mPress, p.write, { uPressure: p.read.texture, uDivergence: this.divergence.texture })
      p.swap()
    }
    this.run(this.mGrad, v.write, { uPressure: p.read.texture, uVelocity: v.read.texture })
    v.swap()
    this.run(this.mAdvect, v.write, { uVelocity: v.read.texture, uSource: v.read.texture, uDt: dt, uDissipation: c.velDissipation })
    v.swap()
    this.run(this.mAdvect, this.dye.write, { uVelocity: v.read.texture, uSource: this.dye.read.texture, uDt: dt, uDissipation: c.dyeDissipation })
    this.dye.swap()
  }

  get velocityTexture() {
    return this.velocity.read.texture
  }
  get dyeTexture() {
    return this.dye.read.texture
  }

  dispose() {
    this.destroy()
    this.pass.dispose()
    ;[this.mAdvect, this.mSplat, this.mDiv, this.mCurl, this.mVort, this.mPress, this.mGrad, this.mClear].forEach((m) => m.dispose())
  }
}
