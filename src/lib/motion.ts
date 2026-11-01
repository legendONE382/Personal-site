import { gsap } from 'gsap'
import Lenis from 'lenis'

export { gsap }

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isCoarse = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

const ease = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * One progress value (0 → 1) for the whole journey.
 *
 * Normal path: Lenis gives inertial scrolling and we read its animated value.
 * Reduced-motion path: Lenis is never created, and the same API reads the
 * browser's native scroll position instead — so the world still tracks the
 * scroll, it just doesn't glide. The experience never depends on Lenis.
 */
class Scroller {
  lenis: Lenis | null = null
  native = false

  init() {
    if (this.lenis || this.native) return
    if (reducedMotion()) {
      this.native = true
      return
    }
    const l = new Lenis({
      duration: 1.25,
      easing: ease,
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.4,
    })
    this.lenis = l
    gsap.ticker.add((time) => l.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
  }

  get progress() {
    if (this.lenis) {
      const l = this.lenis
      return l.limit > 0 ? clamp01(l.scroll / l.limit) : 0
    }
    const max = document.documentElement.scrollHeight - innerHeight
    return max > 0 ? clamp01(scrollY / max) : 0
  }

  jump(p: number, duration = 2.6) {
    const target = clamp01(p)
    if (this.lenis) {
      this.lenis.scrollTo(target * this.lenis.limit, { duration, easing: ease, force: true })
      return
    }
    const max = document.documentElement.scrollHeight - innerHeight
    window.scrollTo({ top: target * max, behavior: this.native ? 'auto' : 'smooth' })
  }

  /** Freeze the page behind an overlay. Native scroll is left alone (it's harmless). */
  stop() {
    this.lenis?.stop()
  }
  start() {
    this.lenis?.start()
  }
}

export const scroller = new Scroller()
