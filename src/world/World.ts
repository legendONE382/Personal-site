import * as THREE from 'three'
import { gsap } from 'gsap'
import { scroller } from '../lib/motion'
import { GRADES, N, SHIFT, cameraSpline, lookTargets, stations } from './config'
import { buildTimeline, type WorldState } from './timeline'
import { clamp, damp, easeOutCubic, lerp, smoothstep } from './utils'
import { Fluid } from './systems/Fluid'
import { Particles } from './systems/Particles'
import { Quality, TIERS } from './systems/Quality'
import { createPost } from './systems/Post'
import { Floor, Streaks } from './objects/Environment'
import { Grid } from './objects/Grid'
import { createScenes } from './scenes'
import type { SceneCtx, SceneModule, SharedUniforms } from './scenes/types'

export interface WorldOptions {
  onScene?: (k: number) => void
  /** Called every frame with 0..1 scroll speed (drives audio, not React state). */
  onFrame?: (velN: number) => void
  onTier?: (label: string) => void
  /**
   * Visitor asked for reduced motion: keep the same world, strip the idle
   * animation. Scroll still morphs everything (that is user-driven), but
   * nothing moves on its own and the camera does not drift.
   */
  reduced?: boolean
  /** the lowest quality tier still can't keep up */
  onBottom?: () => void
}

const deg = THREE.MathUtils.degToRad

/**
 * THE WORLD. One fixed canvas, one render loop. Scroll scrubs a GSAP master
 * timeline; the timeline drives the camera spline, the morph between scenes,
 * the field of view and the bloom. Everything else is damped toward it.
 */
export class World {
  readonly canvas: HTMLCanvasElement
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400)
  readonly root = new THREE.Group()
  readonly fluid: Fluid
  readonly particles: Particles
  readonly quality: Quality
  readonly post: ReturnType<typeof createPost>
  readonly scenes: SceneModule[]
  readonly mobile: boolean
  readonly reduced: boolean

  readonly S: WorldState = { shape: 0, cam: 0, fov: 38, bloom: 1.15, intro: 1, introReveal: 0, flash: 0, menu: 0, dim: 0 }

  /** Live tuning values (see the lil-gui panel — press "g"). */
  readonly tune = {
    particleSize: 0.0165,
    intensity: 1.25,
    curlScale: 0.26,
    push: 0.03,
    drag: 3.4,
    springHold: 7.2,
    chroma: 1,
    refract: 1,
    streak: 0.55,
    bloom: 1,
  }

  ready = false
  entered = false
  /** Test/debug hook: pin the journey at a progress value. */
  force: number | null = null

  private opts: WorldOptions
  private shared: SharedUniforms = {
    uVel: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uScrollVel: { value: 0 },
  }
  private ctx: SceneCtx
  private tl: gsap.core.Timeline
  private spline = cameraSpline()
  private floor = new Floor()
  private grid: Grid
  private streaks: Streaks

  private time = 0
  private smooth = 0
  private velN = 0
  private loadTarget = 0
  private loadSmooth = 0
  private portrait = false
  private shiftX = 0
  private shiftY = 0
  private current = 0
  private disposed = false
  private introTweens: gsap.core.Tween[] = []

  private pointer = new THREE.Vector2()
  private pointerT = new THREE.Vector2()
  private ptr = { u: 0.5, v: 0.5, du: 0, dv: 0, moved: false, has: false, idle: 0 }

  private camPos = new THREE.Vector3()
  private look = new THREE.Vector3()
  private groupPos = new THREE.Vector3()
  private tmp = new THREE.Vector3()
  private vp = new THREE.Matrix4()
  private right = new THREE.Vector3()
  private up = new THREE.Vector3()
  private grade = new THREE.Vector3(1, 1, 1)

  constructor(canvas: HTMLCanvasElement, opts: WorldOptions = {}) {
    this.canvas = canvas
    this.opts = opts
    this.reduced = !!opts.reduced

    const q = new URLSearchParams(location.search)
    const nav = navigator as Navigator & { deviceMemory?: number }
    this.mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 820
    const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4
    const qp = q.get('q')
    /* Network-aware start tier: a visitor on a slow or metered connection gets the
       lighter world from the first frame instead of waiting for the fps monitor. */
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection
    const slowNet = !!conn && (conn.saveData === true || /(^|-)2g$|^3g$/.test(conn.effectiveType ?? ''))
    const startTier = qp !== null ? Number(qp) : slowNet ? 2 : this.mobile || weak ? 1 : 0
    this.quality = new Quality(startTier, qp === null && !q.has('fixed'))

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false })
    this.renderer.setClearColor(0x05060a, 1)
    if (!this.renderer.extensions.has('EXT_color_buffer_float') && !this.renderer.extensions.has('EXT_color_buffer_half_float')) {
      this.renderer.dispose()
      throw new Error('Float render targets are not supported')
    }

    this.scene.add(this.root)
    this.fluid = new Fluid(this.renderer, this.mobile ? 64 : 128, this.mobile ? 256 : 512, innerWidth / innerHeight)
    this.shared.uVel.value = this.fluid.velocityTexture

    this.scenes = createScenes()
    const simParam = Number(q.get('sim'))
    const simSize = simParam === 128 || simParam === 256 || simParam === 512 ? simParam : this.mobile ? 256 : 512
    this.particles = new Particles(this.renderer, simSize, this.scenes[0].shape)
    this.streaks = new Streaks(this.mobile ? 2200 : 5200)
    this.grid = new Grid(this.mobile)
    this.root.add(this.floor.mesh, this.grid.lines, this.grid.sparks, this.streaks.lines, this.particles.points)

    this.post = createPost(this.renderer, this.scene, this.camera)
    this.tl = buildTimeline(this.S)

    this.ctx = {
      shared: this.shared,
      portrait: false,
      viewW: 12,
      viewH: 7,
      introReveal: 0,
      pointer: this.pointer,
      localFromScreen: (fx, fy) => ({
        x: (fx - (0.5 + this.shiftX)) * this.ctx.viewW,
        y: -(fy - (0.5 - this.shiftY)) * this.ctx.viewH,
      }),
    }

    this.quality.onBottom = () => this.opts.onBottom?.()
    this.quality.onChange = () => {
      this.applyQuality()
      this.opts.onTier?.(this.quality.current.label)
    }
    window.addEventListener('resize', this.resize)
    window.addEventListener('pointermove', this.onPointer, { passive: true })
    canvas.addEventListener('webglcontextlost', (e) => e.preventDefault())
    this.applyQuality()
    gsap.ticker.add(this.tick)
  }

  /* ───────────────────────── loading ───────────────────────── */

  async load(onProgress: (p: number) => void) {
    let done = 0
    const total = this.scenes.length + 1
    const bump = () => {
      done++
      const p = (done / total) * 0.9
      this.loadTarget = p
      onProgress(p)
    }
    await Promise.all(this.scenes.map((s) => (s.load ? s.load() : Promise.resolve()).then(bump)))
    try {
      await Promise.all([document.fonts.load('400 120px "Instrument Serif"'), document.fonts.load('italic 400 120px "Instrument Serif"')])
      await document.fonts.ready
    } catch {
      /* fall back to the serif stack */
    }
    bump()
    await this.particles.buildTargets(
      this.scenes.map((s) => s.shape),
      (f) => {
        this.loadTarget = 0.9 + f * 0.1
        onProgress(0.9 + f * 0.1)
      },
    )
    this.scenes.forEach((s) => s.build(this.root, this.ctx))
    this.loadTarget = 1
    onProgress(1)
    this.ready = true
  }

  /** Release the preloader: the camera pushes in and the headline resolves. */
  enter(skip = false) {
    if (this.entered) return
    this.entered = true
    const instant = skip || this.reduced
    this.introTweens = [
      gsap.to(this.S, { intro: 0, duration: instant ? 0.01 : 3.4, ease: 'expo.out' }),
      gsap.to(this.S, { introReveal: 1, duration: instant ? 0.01 : 2.2, delay: instant ? 0 : 0.5, ease: 'power2.out' }),
    ]
    this.S.flash = 1
    gsap.to(this.S, { flash: 0, duration: instant ? 0.01 : 1.6, ease: 'power3.out' })
  }

  /** True while the opening flight-in is still playing. */
  get introRunning() {
    return this.entered && this.S.intro > 0.001
  }

  skipIntro() {
    this.introTweens.forEach((t) => t.progress(1))
  }

  /* ───────────────────────── controls ───────────────────────── */

  setMenu(open: boolean) {
    gsap.to(this.S, { menu: open ? 1 : 0, duration: open ? 1.1 : 0.9, ease: 'power3.inOut' })
  }

  setDim(v: number) {
    gsap.to(this.S, { dim: v, duration: 0.8, ease: 'power2.out' })
  }

  /** A burst of stirred fluid, e.g. when a menu item is hovered. */
  burst(u: number, v: number, strength = 1) {
    this.fluid.splat(u, v, (Math.random() - 0.5) * 0.05 * strength, (Math.random() - 0.5) * 0.05 * strength, 1)
  }

  setTier(t: number) {
    this.quality.tier = clamp(Math.round(t), 0, TIERS.length - 1)
    this.applyQuality()
  }

  get scene_index() {
    return this.current
  }

  /** Debug: pin the journey at progress p and let the particles fully settle. */
  snapTo(p: number, steps = 70) {
    this.force = p
    this.smooth = p
    this.velN = 0
    this.entered = true
    this.S.intro = 0
    this.S.introReveal = 1
    this.S.flash = 0
    this.loadSmooth = 1
    this.tl.progress(p)
    for (let i = 0; i < steps; i++) this.step(1 / 30)
  }

  /* ───────────────────────── input ───────────────────────── */

  private onPointer = (e: PointerEvent) => {
    const u = e.clientX / innerWidth
    const v = 1 - e.clientY / innerHeight
    this.pointerT.set(u * 2 - 1, v * 2 - 1)
    const p = this.ptr
    if (p.has) {
      p.du += u - p.u
      p.dv += v - p.v
      p.moved = true
    }
    p.u = u
    p.v = v
    p.has = true
    p.idle = 0
  }

  /* ───────────────────────── sizing + quality ───────────────────────── */

  private applyQuality() {
    const t = this.quality.current
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, t.dpr, 2))
    this.particles.setFraction(t.particles)
    this.resize()
  }

  private resize = () => {
    const w = innerWidth
    const h = innerHeight
    this.post.composer.setSize(w, h, false)
    this.renderer.getDrawingBufferSize(this.shared.uRes.value)
    this.post.grade.set('uTexel', new THREE.Vector2(1 / Math.max(1, this.shared.uRes.value.x), 1 / Math.max(1, this.shared.uRes.value.y)))
    this.camera.aspect = w / h
    this.portrait = w / h < 0.85
    this.ctx.portrait = this.portrait
    this.fluid.resize(w / h)
  }

  /* ───────────────────────── the frame ───────────────────────── */

  private tick = (_t: number, deltaMs: number) => {
    if (this.disposed) return
    const dt = Math.min(deltaMs / 1000, 0.05)
    this.step(dt)
    this.post.composer.render(dt)
    this.quality.sample(dt)
    this.opts.onFrame?.(Math.min(1, Math.abs(this.velN)))
  }

  private step(dt: number) {
    const S = this.S
    const ctx = this.ctx
    if (!this.reduced) this.time += dt

    /* scroll → master timeline */
    this.loadSmooth = damp(this.loadSmooth, this.loadTarget, 4, dt)
    const raw = this.force ?? (this.entered ? scroller.progress : 0)
    const prev = this.smooth
    this.smooth = damp(this.smooth, raw, this.reduced ? 26 : 5.5, dt)
    const v = dt > 0 ? (this.smooth - prev) / dt : 0
    this.velN = this.reduced ? 0 : damp(this.velN, clamp(v / 0.4, -1.6, 1.6), 7, dt)
    this.tl.progress(clamp(this.smooth, 0, 1))
    this.shared.uScrollVel.value = this.velN
    document.documentElement.style.setProperty('--p', this.smooth.toFixed(4))

    this.pointer.x = damp(this.pointer.x, this.pointerT.x, 9, dt)
    this.pointer.y = damp(this.pointer.y, this.pointerT.y, 9, dt)

    /* which scenes are we between? */
    const sh = clamp(S.shape, 0, N - 1)
    const a = Math.min(Math.floor(sh), N - 2)
    const b = a + 1
    const f = sh - a
    const mid = Math.sin(Math.PI * f)

    const cur = Math.round(sh)
    if (cur !== this.current) {
      this.current = cur
      this.opts.onScene?.(cur)
    }

    /* layout: where the subject sits on screen */
    const pi = this.portrait ? 2 : 0
    this.shiftX = lerp(SHIFT[a][pi], SHIFT[b][pi], f)
    this.shiftY = lerp(SHIFT[a][pi + 1], SHIFT[b][pi + 1], f)
    this.grade.set(
      lerp(GRADES[a][0], GRADES[b][0], f),
      lerp(GRADES[a][1], GRADES[b][1], f),
      lerp(GRADES[a][2], GRADES[b][2], f),
    )

    /* the camera rides the spline */
    this.spline.getPoint(clamp(S.cam, 0, 1), this.camPos)
    const amb = this.reduced ? 0 : 1
    this.camPos.x += (this.pointer.x * 0.55 + Math.sin(this.time * 0.21) * 0.22) * amb
    this.camPos.y += (this.pointer.y * 0.3 + Math.cos(this.time * 0.17) * 0.14) * amb + S.intro * 1.4
    this.camPos.z += S.intro * 15
    this.look.lerpVectors(lookTargets[a], lookTargets[b], f)
    this.groupPos.lerpVectors(stations[a].pos, stations[b].pos, f)
    if (!this.reduced) this.groupPos.y += Math.sin(this.time * 0.6) * 0.06

    const fov = S.fov + Math.abs(this.velN) * 5 + S.intro * 6
    const dir = this.tmp.copy(this.camPos).sub(this.look)
    let dist = dir.length()
    const viewW0 = 2 * Math.tan(deg(fov) / 2) * dist * this.camera.aspect
    const fit = Math.max(1, (this.portrait ? 8.6 : 9) / viewW0)
    dist *= fit
    dir.multiplyScalar(fit)
    this.camera.position.copy(this.look).add(dir)
    const roll = Math.sin(Math.PI * f) * 0.07 * (a % 2 === 0 ? 1 : -1)
    this.camera.up.set(Math.sin(roll), Math.cos(roll), 0)
    this.camera.lookAt(this.look)
    this.camera.fov = fov
    const W = innerWidth
    const H = innerHeight
    this.camera.setViewOffset(W, H, -this.shiftX * W, this.shiftY * H, W, H)
    this.camera.updateMatrixWorld()

    ctx.viewH = 2 * Math.tan(deg(fov) / 2) * dist
    ctx.viewW = ctx.viewH * this.camera.aspect
    ctx.introReveal = S.introReveal

    /* pointer + idle + scroll all stir the fluid */
    const p = this.ptr
    p.idle += dt
    if (p.moved) {
      this.fluid.splat(p.u, p.v, p.du, p.dv, clamp(Math.hypot(p.du, p.dv) * 40, 0.05, 1))
      p.du = p.dv = 0
      p.moved = false
    } else if (!this.reduced && p.idle > 2.5) {
      const t = this.time
      this.fluid.splat(0.5 + 0.3 * Math.sin(t * 0.37), 0.5 + 0.2 * Math.sin(t * 0.53 + 1.2), 0.3 * 0.37 * Math.cos(t * 0.37) * dt * 0.15, 0.2 * 0.53 * Math.cos(t * 0.53 + 1.2) * dt * 0.15, 0.2)
    }
    if (!this.reduced && Math.abs(this.velN) > 0.06) {
      this.fluid.splat(Math.random(), Math.random(), 0, -Math.sign(this.velN) * Math.abs(this.velN) * 0.007, 0.3)
    }
    this.fluid.step(dt)
    this.shared.uVel.value = this.fluid.velocityTexture

    /* the particles: spring toward the scene's target, stirred by fluid */
    const base = this.scenes
    let spring = lerp(this.tune.springHold, 0.85, mid)
    let curl = lerp(lerp(base[a].baseCurl, base[b].baseCurl, f), 2.1, mid)
    if (!this.entered) {
      const e = easeOutCubic(this.loadSmooth)
      spring = lerp(0.1, this.tune.springHold, e)
      curl = lerp(2.8, base[0].baseCurl, e)
    }

    let hold = 0
    this.scenes.forEach((s, i) => {
      const d = Math.abs(sh - i)
      const pres = 1 - smoothstep(0.35, 0.95, d)
      const reveal = 1 - smoothstep(0.04, 0.5, d)
      if (s.isImage) hold = Math.max(hold, reveal)
      s.update(ctx, pres, reveal)
    })

    this.vp.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)
    this.right.setFromMatrixColumn(this.camera.matrixWorld, 0)
    this.up.setFromMatrixColumn(this.camera.matrixWorld, 1)
    this.particles.update({
      dt,
      time: this.time,
      a,
      b,
      mix: f,
      spring,
      curl,
      curlScale: this.tune.curlScale,
      drag: this.tune.drag,
      push: this.tune.push,
      hold,
      intensity: this.tune.intensity,
      size: this.tune.particleSize,
      projScale: this.shared.uRes.value.y / (2 * Math.tan(deg(fov) / 2)),
      groupPos: this.groupPos,
      viewProj: this.vp,
      camRight: this.right,
      camUp: this.up,
      fluid: this.fluid.velocityTexture,
    })

    this.floor.update(this.time, this.camera.position, this.velN)
    this.grid.update(this.time, this.camera.position, Math.round(clamp(S.shape, 0, N - 1)), this.velN)
    this.streaks.update(this.time, this.velN)

    /* the lens */
    const g = this.post.grade
    g.set('tVel', this.fluid.velocityTexture)
    g.set('tDye', this.fluid.dyeTexture)
    g.set('uTime', this.time)
    g.set('uScroll', this.velN)
    g.set('uMenu', S.menu)
    g.set('uDim', S.dim)
    g.set('uAspect', this.camera.aspect)
    g.set('uChroma', this.reduced ? 0 : this.tune.chroma)
    g.set('uStreak', this.reduced || this.mobile || this.quality.tier > 1 ? 0 : this.tune.streak)
    g.set('uRefract', this.tune.refract * (1 - 0.5 * hold))
    g.set('uFlash', S.flash)
    g.set('uGrade', this.grade)
    this.post.bloom.intensity = S.bloom * this.tune.bloom * this.quality.current.bloom
  }

  dispose() {
    this.disposed = true
    gsap.ticker.remove(this.tick)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('pointermove', this.onPointer)
    this.tl.kill()
    this.scenes.forEach((s) => s.dispose())
    this.fluid.dispose()
    this.particles.dispose()
    this.floor.dispose()
    this.grid.dispose()
    this.streaks.dispose()
    this.post.composer.dispose()
    this.renderer.dispose()
  }
}
