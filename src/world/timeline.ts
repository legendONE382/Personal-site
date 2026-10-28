import { gsap } from 'gsap'
import { BLOOMS, FOVS, N } from './config'

export interface WorldState {
  /** Continuous scene index: 0 = ignition … 6 = contact. Holds on integers. */
  shape: number
  /** Position along the camera spline, 0 → 1. */
  cam: number
  fov: number
  bloom: number
  intro: number
  introReveal: number
  flash: number
  menu: number
  dim: number
}

/**
 * THE MASTER TIMELINE. Scroll progress scrubs this one GSAP timeline; every
 * camera move, morph and grade change in the world is a tween on it.
 * Each scene gets a hold (the plateau) and a flight (the transition).
 */
export function buildTimeline(S: WorldState) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
  const seg = 1 / (N - 1)
  const hold = 0.045
  for (let k = 1; k < N; k++) {
    const a = (k - 1) * seg
    tl.to(S, { shape: k, duration: seg - 2 * hold, ease: 'power3.inOut' }, a + hold)
    tl.to(S, { cam: k / (N - 1), duration: seg - 0.01, ease: 'power2.inOut' }, a + 0.005)
    tl.to(S, { fov: FOVS[k], bloom: BLOOMS[k], duration: seg - 2 * hold, ease: 'power1.inOut' }, a + hold)
  }
  tl.to({}, { duration: 0 }, 1)
  return tl
}
