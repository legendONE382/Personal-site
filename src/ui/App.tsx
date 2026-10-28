import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { projects } from '../data/studio'
import { openCV } from '../lib/cv'
import { reducedMotion, scroller } from '../lib/motion'
import type { World } from '../world/World'
import type { AudioSystem } from '../world/systems/Audio'
import { N } from '../world/sceneList'
import { CaseStudy } from './CaseStudy'
import { Cursor } from './Cursor'
import { Dossier } from './Dossier'
import Fallback from './Fallback'
import { Hud } from './Hud'
import { Loader } from './Loader'
import { Menu } from './Menu'
import { Panels } from './Panels'

type Mode = 'ok' | 'motion' | 'webgl'

function detectMode(): Mode {
  const force = new URLSearchParams(location.search).has('immersive') || sessionStorage.getItem('immersive') === '1'
  if (!force && reducedMotion()) return 'motion'
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return 'webgl'
    const ok = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    if (!ok) return 'webgl'
  } catch {
    return 'webgl'
  }
  return 'ok'
}

const readCase = () => {
  const m = location.hash.match(/^#case-([a-z0-9-]+)$/)?.[1]
  return m && projects.some((p) => p.slug === m) ? m : null
}

export default function App() {
  const [mode] = useState<Mode>(detectMode)
  if (mode !== 'ok') return <Fallback reason={mode} />
  return <Experience />
}

function Experience() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const audioRef = useRef<AudioSystem | null>(null)
  const audio = useMemo(() => ({
    get(): Promise<AudioSystem> {
      if (audioRef.current) return Promise.resolve(audioRef.current)
      return import('../world/systems/Audio').then((m) => (audioRef.current ??= new m.AudioSystem()))
    },
    setEnergy(v: number) { audioRef.current?.setEnergy(v) },
    tick() { audioRef.current?.tick() },
    open() { audioRef.current?.open() },
    whoosh() { audioRef.current?.whoosh() },
    disable() { audioRef.current?.disable() },
  }), [])
  const entered = useRef(false)
  const skipped = useRef(false)

  const [phase, setPhase] = useState<'loading' | 'ready' | 'live'>('loading')
  const [progress, setProgress] = useState(0)
  const [scene, setScene] = useState(0)
  const [menu, setMenu] = useState(false)
  const [dossier, setDossier] = useState<string | null>(null)
  const [caseSlug, setCaseSlug] = useState<string | null>(readCase)
  const [sound, setSound] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  /* ── boot the world (lazy: the engine is a separate chunk, so the page is readable before it arrives) ── */
  useEffect(() => {
    let world: World | null = null
    let cancelled = false
    ;(async () => {
      try {
        const [{ World: WorldCtor }] = await Promise.all([import('../world/World')])
        if (cancelled) return
        setProgress(0.08)
        world = new WorldCtor(canvas.current!, { onScene: setScene, onFrame: (v) => audio.setEnergy(v) })
      } catch (e) {
        console.error('[world] could not start', e)
        if (!cancelled) setFailed(true)
        return
      }
      worldRef.current = world
      scroller.init()
      scroller.stop()
      document.documentElement.classList.add('is-locked')
      ;(window as unknown as { __studio: unknown }).__studio = { world, scroller }
      try {
        await world.load((p) => setProgress(0.08 + p * 0.92))
        if (cancelled) return
        setPhase('ready')
        if (skipped.current) enter(false)
      } catch (e) {
        console.error('[world] load failed', e)
        if (!cancelled) setFailed(true)
      }
      if (new URLSearchParams(location.search).has('gui') && world) void import('../world/Debug').then((m) => m.openDebug(world!))
    })()
    return () => {
      cancelled = true
      world?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enter = useCallback(
    (withSound: boolean) => {
      const w = worldRef.current
      if (!w || entered.current) return
      entered.current = true
      if (withSound) void audio.get().then((a) => a.enable()).then(() => setSound(true))
      w.enter(skipped.current)
      if (skipped.current) w.skipIntro()
      document.documentElement.classList.remove('is-locked')
      scroller.start()
      setPhase('live')
    },
    [audio],
  )

  /* auto-enter (silent) so a zero-click visitor still gets the full experience */
  useEffect(() => {
    if (phase !== 'ready') return
    const t = window.setTimeout(() => enter(false), 4500)
    return () => window.clearTimeout(t)
  }, [phase, enter])

  const onSkip = () => {
    skipped.current = true
    worldRef.current?.skipIntro()
    if (phase === 'ready') enter(false)
  }

  /* ── routing: case studies are shareable (#case-lumora) ── */
  useEffect(() => {
    const on = () => setCaseSlug(readCase())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const openCase = useCallback((slug: string) => {
    setDossier(null)
    setMenu(false)
    window.history.replaceState(null, '', `#case-${slug}`)
    setCaseSlug(slug)
  }, [])
  const closeCase = useCallback(() => {
    window.history.replaceState(null, '', location.pathname + location.search)
    setCaseSlug(null)
  }, [])

  /* ── overlays: dim the world, freeze scroll, Escape to close ── */
  const overlay = menu || !!caseSlug || dossier !== null
  useEffect(() => {
    worldRef.current?.setMenu(menu)
  }, [menu])
  useEffect(() => {
    worldRef.current?.setDim(caseSlug || dossier !== null ? 0.72 : 0)
  }, [caseSlug, dossier])
  useEffect(() => {
    if (phase !== 'live') return
    if (overlay) scroller.stop()
    else scroller.start()
  }, [overlay, phase])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (caseSlug) closeCase()
      else if (dossier !== null) setDossier(null)
      else if (menu) setMenu(false)
      else if (e.key === 'Escape') return
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [caseSlug, dossier, menu, closeCase])
  useEffect(() => {
    if (caseSlug) audio.open()
  }, [caseSlug, audio])

  /* press "g" for the lil-gui tuning panel */
  useEffect(() => {
    let gui: { destroy: () => void } | null = null
    const onKey = async (e: KeyboardEvent) => {
      if (e.key !== 'g' || (e.target as HTMLElement).closest('input,textarea')) return
      if (gui) {
        gui.destroy()
        gui = null
      } else if (worldRef.current) gui = await (await import('../world/Debug')).openDebug(worldRef.current)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ── sound + toast ── */
  useEffect(() => {
    if (phase === 'live') audio.whoosh()
  }, [scene, phase, audio])
  useEffect(() => {
    const over = (e: PointerEvent) => {
      if ((e.target as Element).closest?.('a,button,summary')) audio.tick()
    }
    document.addEventListener('pointerover', over)
    return () => document.removeEventListener('pointerover', over)
  }, [audio])
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3400)
    return () => window.clearTimeout(t)
  }, [toast])

  const toggleSound = async () => {
    if (sound) {
      audio.disable()
      setSound(false)
    } else {
      await (await audio.get()).enable()
      setSound(true)
    }
  }

  const jump = useCallback(
    (k: number) => {
      const go = () => scroller.jump(k / (N - 1))
      if (menu || caseSlug || dossier !== null) {
        setMenu(false)
        setDossier(null)
        if (caseSlug) closeCase()
        window.setTimeout(() => {
          scroller.start()
          go()
        }, 520)
      } else go()
    },
    [menu, caseSlug, dossier, closeCase],
  )

  const cv = useCallback(() => {
    const r = openCV()
    setToast(r === 'opened' ? 'CV opened — press Ctrl/⌘ + P to save it as a PDF' : 'CV downloaded as a web page — open it and print to PDF')
  }, [])

  if (failed) return <Fallback reason="webgl" />

  return (
    <>
      <a href="#panels" className="sr-only" onClick={(e) => e.preventDefault()}>
        The portfolio is an immersive 3D experience. All text is also available as real page content.
      </a>
      <canvas ref={canvas} id="gl" aria-hidden="true" />
      <div id="scroll-space" aria-hidden="true" />

      <main id="panels">
        <Panels scene={scene} live={phase === 'live' && !overlay} onCase={openCase} onJump={jump} onDossier={(t) => setDossier(t ?? 'about')} onCV={cv} notify={setToast} />
      </main>

      <Hud
        scene={scene}
        live={phase === 'live'}
        sound={sound}
        menuOpen={menu}
        onSound={toggleSound}
        onMenu={() => setMenu((m) => !m)}
        onDossier={() => setDossier('about')}
        onJump={jump}
        onSkip={onSkip}
      />
      <Menu
        open={menu}
        scene={scene}
        onJump={jump}
        onHover={(k) => worldRef.current?.burst(0.35 + (k / N) * 0.3, 0.7 - (k / N) * 0.4, 1)}
        onDossier={() => {
          setMenu(false)
          setDossier('about')
        }}
        onCV={cv}
      />
      <Loader phase={phase} progress={progress} onEnter={enter} />
      {dossier !== null && <Dossier tab={dossier} onTab={setDossier} onClose={() => setDossier(null)} onCase={openCase} />}
      {caseSlug && <CaseStudy slug={caseSlug} onClose={closeCase} onNav={openCase} />}
      <Cursor />
      {toast && (
        <div role="status" className="toast">
          {toast}
        </div>
      )}
    </>
  )
}
