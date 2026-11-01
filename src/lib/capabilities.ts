/**
 * Should this visitor get the immersive WebGL experience?
 *
 * Default: YES — it opens by itself. We only step aside for three concrete
 * reasons, and every one of them is recoverable with a button:
 *
 *   webgl   — the browser can't create the context or the float buffers the
 *             fluid/particle simulation needs (this includes blocked WebGL)
 *   device  — a very small, very old or very low-power device
 *   network — the line is too slow that the ~180 KB of engine would just be a
 *             stalled spinner; the calm page is useful in under a second
 *
 * prefers-reduced-motion is NOT a reason to withhold the work — it changes how
 * the world moves (see World.reduced), not whether you see it.
 */

export type Block = 'webgl' | 'device' | 'network' | 'user' | null

export interface Capability {
  immersive: boolean
  /** the visitor overrode our judgement — trust them and be patient */
  forced: boolean
  block: Block
  reducedMotion: boolean
  /** A phone/tablet: same experience, lighter, no custom cursor. */
  coarse: boolean
}

type Conn = Navigator & {
  connection?: { effectiveType?: string; saveData?: boolean; downlink?: number }
  deviceMemory?: number
  hardwareConcurrency?: number
}

export function probeWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    const float =
      gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float') || gl.getExtension('WEBGL_color_buffer_float')
    const lose = gl.getExtension('WEBGL_lose_context')
    lose?.loseContext()
    return !!float
  } catch {
    return false
  }
}

/**
 * Only hard, unambiguous signals block up front. `deviceMemory` and
 * `hardwareConcurrency` are coarse hints that plenty of capable machines fail
 * (2 cores is common in VMs and older laptops with good GPUs), so we do not
 * condemn a device on them: anything that turns out too slow for the world is
 * caught after the fact by the adaptive-quality floor (see Quality.onBottom),
 * which offers the calm page rather than guessing at boot.
 */
function weakDevice(): boolean {
  const n = navigator as Conn
  const mem = n.deviceMemory
  const cores = n.hardwareConcurrency
  if (typeof mem === 'number' && mem > 0 && mem < 1) return true
  if (typeof cores === 'number' && cores === 1) return true
  // no matchMedia / ResizeObserver / fullscreen-era APIs = genuinely old engine
  if (typeof window.matchMedia !== 'function') return true
  if (typeof (window as unknown as { ResizeObserver?: unknown }).ResizeObserver !== 'function') return true
  if (!window.isSecureContext) return false
  if (Math.min(innerWidth, innerHeight) < 240) return true
  return false
}

function slowNetwork(): boolean {
  const conn = (navigator as Conn).connection
  if (!conn) return false
  if (conn.saveData === true) return true
  const type = conn.effectiveType ?? ''
  if (type === 'slow-2g' || type === '2g') return true
  if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 0.35) return true
  return false
}

export function assess(): Capability {
  const search = new URLSearchParams(location.search)
  let forced = false
  try {
    forced = search.has('immersive') || sessionStorage.getItem('immersive') === '1'
  } catch {
    /* storage blocked (private mode): the URL flag still works */
    forced = search.has('immersive')
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const coarse = matchMedia('(pointer: coarse)').matches

  let block: Block = null
  if (!forced) {
    if (search.has('calm') || sessionStorage.getItem('calm') === '1') block = 'user'
    else if (!probeWebGL()) block = 'webgl'
    else if (weakDevice()) block = 'device'
    else if (slowNetwork()) block = 'network'
  }
  return { immersive: block === null, block, forced, reducedMotion, coarse }
}

/** Hand the choice back to the visitor. */
export function choose(immersive: boolean) {
  try {
    if (immersive) {
      sessionStorage.setItem('immersive', '1')
      sessionStorage.removeItem('calm')
    } else {
      sessionStorage.setItem('calm', '1')
      sessionStorage.removeItem('immersive')
    }
  } catch {
    /* private mode: the URL flags still work */
  }
  location.reload()
}

/** A second chance after a slow start: keep the immersive path, just once. */
export function retryImmersive() {
  try {
    sessionStorage.setItem('immersive', '1')
    sessionStorage.removeItem('calm')
  } catch {
    /* ignore */
  }
}

export function connectionLabel(): string {
  const conn = (navigator as Conn).connection
  if (!conn) return 'unknown'
  return conn.effectiveType ?? 'unknown'
}
