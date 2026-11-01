/**
 * Opt-in procedural audio — no files to ship. An ambient bed (two detuned
 * saws and a sub, through a slowly breathing low-pass, with a soft noise
 * layer and a synthesised room) that opens up with scroll speed, plus tiny
 * interaction sounds. Nothing plays until the visitor chooses sound.
 */
export class AudioSystem {
  enabled = false
  private ctx: AudioContext | null = null
  private master!: GainNode
  private bus!: GainNode
  private lp!: BiquadFilterNode
  private noiseGain!: GainNode
  private energy = 0

  async enable() {
    if (!this.ctx) this.build()
    const c = this.ctx!
    if (c.state === 'suspended') await c.resume()
    this.enabled = true
    this.master.gain.cancelScheduledValues(c.currentTime)
    this.master.gain.linearRampToValueAtTime(0.5, c.currentTime + 2.2)
  }

  disable() {
    this.enabled = false
    const c = this.ctx
    if (!c) return
    this.master.gain.cancelScheduledValues(c.currentTime)
    this.master.gain.linearRampToValueAtTime(0, c.currentTime + 0.6)
  }

  private build() {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const c = new Ctor()
    this.ctx = c
    this.master = c.createGain()
    this.master.gain.value = 0
    this.master.connect(c.destination)

    // a synthesised room
    const len = c.sampleRate * 2.6
    const ir = c.createBuffer(2, len, c.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
    }
    const verb = c.createConvolver()
    verb.buffer = ir
    const wet = c.createGain()
    wet.gain.value = 0.38
    verb.connect(wet).connect(this.master)

    this.bus = c.createGain()
    this.bus.gain.value = 1
    this.bus.connect(this.master)
    this.bus.connect(verb)

    // drone
    this.lp = c.createBiquadFilter()
    this.lp.type = 'lowpass'
    this.lp.frequency.value = 360
    this.lp.Q.value = 4
    const droneGain = c.createGain()
    droneGain.gain.value = 0.11
    this.lp.connect(droneGain).connect(this.bus)
    for (const [type, f] of [['sawtooth', 55], ['sawtooth', 55.35], ['sine', 110]] as [OscillatorType, number][]) {
      const o = c.createOscillator()
      o.type = type
      o.frequency.value = f
      o.connect(this.lp)
      o.start()
    }
    const lfo = c.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = c.createGain()
    lfoGain.gain.value = 140
    lfo.connect(lfoGain).connect(this.lp.frequency)
    lfo.start()

    // air
    const nb = c.createBuffer(1, c.sampleRate * 3, c.sampleRate)
    const nd = nb.getChannelData(0)
    let last = 0
    for (let i = 0; i < nd.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
      nd[i] = last * 3.5
    }
    const src = c.createBufferSource()
    src.buffer = nb
    src.loop = true
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 900
    bp.Q.value = 0.6
    this.noiseGain = c.createGain()
    this.noiseGain.gain.value = 0.04
    src.connect(bp).connect(this.noiseGain).connect(this.bus)
    src.start()
  }

  /** 0 → 1: how fast the visitor is moving. Opens the filter and lifts the air. */
  setEnergy(v: number) {
    if (!this.enabled || !this.ctx) return
    this.energy += (v - this.energy) * 0.08
    const t = this.ctx.currentTime
    this.lp.frequency.setTargetAtTime(360 + this.energy * 1500, t, 0.15)
    this.noiseGain.gain.setTargetAtTime(0.04 + this.energy * 0.16, t, 0.2)
  }

  private blip(freq: number, dur: number, vol: number, type: OscillatorType = 'sine') {
    if (!this.enabled || !this.ctx) return
    const c = this.ctx
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, c.currentTime)
    o.frequency.exponentialRampToValueAtTime(freq * 0.66, c.currentTime + dur)
    g.gain.setValueAtTime(0.0001, c.currentTime)
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur)
    o.connect(g).connect(this.bus)
    o.start()
    o.stop(c.currentTime + dur + 0.05)
  }

  tick() {
    this.blip(1800, 0.07, 0.05)
  }
  open() {
    this.blip(523, 0.5, 0.07)
    window.setTimeout(() => this.blip(784, 0.6, 0.06), 90)
  }

  whoosh() {
    if (!this.enabled || !this.ctx) return
    const c = this.ctx
    const b = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const s = c.createBufferSource()
    s.buffer = b
    const f = c.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = 1.2
    f.frequency.setValueAtTime(220, c.currentTime)
    f.frequency.exponentialRampToValueAtTime(2600, c.currentTime + 0.9)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.11, c.currentTime + 0.25)
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1)
    s.connect(f).connect(g).connect(this.bus)
    s.start()
  }
}
