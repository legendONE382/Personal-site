import { gsap } from 'gsap'
import Lenis from 'lenis'

export { gsap }

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isCoarse = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

const ease = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))

/**
 * One inertial scroller for the whole experience. The page itself is just a
 * tall invisible spacer — scroll position becomes a 0→1 progress value that
 * drives the WebGL master timeline.
 */
class Scroller {
  lenis: Lenis | null = null

  init() {
    if (this.lenis) return
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

  /** 0 → 1 through the whole journey. */
  get progress() {
    const l = this.lenis
    if (!l || l.limit <= 0) return 0
    return Math.min(1, Math.max(0, l.scroll / l.limit))
  }

  /** Fly to a point in the journey (0 → 1). */
  jump(p: number, duration = 2.6) {
    const l = this.lenis
    if (!l) return
    l.scrollTo(Math.min(1, Math.max(0, p)) * l.limit, { duration, easing: ease, force: true })
  }

  stop() {
    this.lenis?.stop()
  }
  start() {
    this.lenis?.start()
  }
}

export const scroller = new Scroller()
