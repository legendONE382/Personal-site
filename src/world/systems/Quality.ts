export interface Tier {
  label: string
  dpr: number
  particles: number
  bloom: number
}

/** Quality ladder. The world walks DOWN it when the frame rate drops. */
export const TIERS: Tier[] = [
  { label: 'ultra', dpr: 2, particles: 1, bloom: 1 },
  { label: 'high', dpr: 1.5, particles: 0.72, bloom: 1 },
  { label: 'medium', dpr: 1.25, particles: 0.48, bloom: 0.85 },
  { label: 'low', dpr: 1, particles: 0.28, bloom: 0.7 },
]

/**
 * Adaptive quality: measures real frame time and drops resolution, then
 * particle count, until 60fps holds. It never climbs back up (no flapping).
 */
export class Quality {
  tier: number
  adapt: boolean
  onChange: (tier: number) => void = () => {}
  /** fired once when even the lowest tier can't keep up */
  onBottom: () => void = () => {}
  private bottomed = false
  private acc = 0
  private frames = 0
  private slow = 0
  private warm = 4

  constructor(tier: number, adapt: boolean) {
    this.tier = Math.max(0, Math.min(TIERS.length - 1, tier))
    this.adapt = adapt
  }

  get current() {
    return TIERS[this.tier]
  }

  sample(dt: number) {
    if (!this.adapt) return
    if (this.warm > 0) {
      this.warm -= dt
      return
    }
    this.acc += dt
    this.frames++
    if (this.acc < 1) return
    const fps = this.frames / this.acc
    this.acc = 0
    this.frames = 0
    this.slow = fps < 48 ? this.slow + 1 : 0
    if (this.slow >= 2 && this.tier < TIERS.length - 1) {
      this.tier++
      this.slow = 0
      this.warm = 1.5
      this.onChange(this.tier)
      return
    }
    // At the floor and still struggling: this device should not be running the
    // world. Surface it once — the visitor decides, we don't decide for them.
    if (this.slow >= 3 && this.tier === TIERS.length - 1 && !this.bottomed) {
      this.bottomed = true
      this.onBottom()
    }
  }
}
