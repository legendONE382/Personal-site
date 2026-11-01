import { useCallback, useEffect, useRef, useState } from 'react'
import { projects } from '../data/studio'
import { openCV } from '../lib/cv'
import { assess, choose, retryImmersive, type Block } from '../lib/capabilities'
import { scroller } from '../lib/motion'
import type { World } from '../world/World'
import type { AudioSystem } from '../world/systems/Audio'
import { N } from '../world/sceneList'
import { CaseStudy } from './CaseStudy'
import { Cursor } from './Cursor'
import { Dossier } from './Dossier'
import Fallback from './Fallback'
import { Hud } from './Hud'
import { Loader, Prompt } from './Loader'
import { Menu } from './Menu'
import { Panels } from './Panels'

const readCase = () => {
  const m = location.hash.match(/^#case-([a-z0-9-]+)$/)?.[1]
  return m && projects.some((p) => p.slug === m) ? m : null
}

/**
 * Gate. The immersive experience is the DEFAULT: it boots by itself with no
 * click. We only stand aside when WebGL/float buffers are unavailable or
 * blocked, the device is very small/old, the connection is too slow to fetch
 * the engine without stalling, or the visitor already chose the calm page.
 */
export default function App() {
  const [cap] = useState(assess)
  if (!cap.immersive) return <Fallback reason={cap.block ?? 'webgl'} />
  return <Experience reduced={cap.reducedMotion} patient={cap.forced} />
}

/* A shaky line gets a generous but finite window: past it, the calm page is
   served (with a one-tap retry) rather than an eternal spinner. */
const PATIENT_MS = 26000
const SLOW_NET_MS = 11000

function slowish() {
  const c = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } }).connection
  if (!c) return false
  return c.effectiveType === '3g' || (typeof c.downlink === 'number' && c.downlink > 0 && c.downlink < 1.6)
}

function Experience({ reduced, patient }: { reduced: boolean; patient: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const audioRef = useRef<AudioSystem | null>(null)
  const audio = useRef({
    get(): Promise<AudioSystem> {
      if (audioRef.current) return Promise.resolve(audioRef.current)
      return import('../world/systems/Audio').then((m) => (audioRef.current ??= new m.AudioSystem()))
    },
    setEnergy(v: number) {
      audioRef.current?.setEnergy(v)
    },
    tick() {
      audioRef.current?.tick()
    },
    open() {
      audioRef.current?.open()
    },
    whoosh() {
      audioRef.current?.whoosh()
    },
    disable() {
      audioRef.current?.disable()
    },
  }).current

  const entered = useRef(false)
  const readyRef = useRef(false)

  const [phase, setPhase] = useState<'loading' | 'live'>('loading')
  const [progress, setProgress] = useState(0)
  const [block, setBlock] = useState<Block | null>(null)
  const [intro, setIntro] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [prompt, setPrompt] = useState<'sound' | 'struggle' | null>(null)
  const [menu, setMenu] = useState(false)
  const [dossier, setDossier] = useState<string | null>(null)
  const [caseSlug, setCaseSlug] = useState<string | null>(readCase)
  const [toast, setToast] = useState<string | null>(null)
  const [full, setFull] = useState(false)
  const failedRef = useRef<Block | null>(null)

  /* ── boot: fetch the engine, build the world, then GO (no gate) ── */
  useEffect(() => {
    let world: World | null = null
    let cancelled = false

    const watchdog = window.setTimeout(() => {
      if (readyRef.current || cancelled) return
      // never strand anyone on a spinner
      failedRef.current = 'network'
      setBlock('network')
    }, patient ? PATIENT_MS * 4 : slowish() ? SLOW_NET_MS : PATIENT_MS)

    ;(async () => {
      try {
        const [{ World: WorldCtor }] = await Promise.all([import('../world/World')])
        if (cancelled) return
        setProgress(0.08)
        world = new WorldCtor(canvas.current!, {
          onScene: setScene,
          onFrame: (v) => audio.setEnergy(v),
          reduced,
          onBottom: () => {
            // judged by behaviour, not by a spec sheet: ask once, per session
            let seen = false
            try {
              seen = sessionStorage.getItem('calm-offered') === '1'
              if (!seen) sessionStorage.setItem('calm-offered', '1')
            } catch {
              /* private mode: still allow one ask per load */
            }
            if (!seen) setPrompt('struggle')
          },
        })
      } catch (e) {
        console.error('[world] could not start', e)
        if (!cancelled) {
          failedRef.current = 'webgl'
          setBlock('webgl')
        }
        return
      }
      worldRef.current = world
      scroller.init()
      scroller.stop()
      document.documentElement.classList.add('is-locked')
      ;(window as unknown as { __studio: unknown }).__studio = { world, scroller }
      try {
        await world.load((p) => setProgress(Math.max(0.08, 0.08 + p * 0.92)))
        if (cancelled) return
        readyRef.current = true
        window.clearTimeout(watchdog)
        enter()
      } catch (e) {
        console.error('[world] load failed', e)
        if (!cancelled) {
          failedRef.current = 'webgl'
          setBlock('webgl')
        }
      }
      if (new URLSearchParams(location.search).has('gui') && world) void import('../world/Debug').then((m) => m.openDebug(world!))
    })()

    return () => {
      cancelled = true
      window.clearTimeout(watchdog)
      world?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* the camera fly-in runs for ~3.4 s; offer a skip while it plays */
  const enter = useCallback(() => {
    const w = worldRef.current
    if (!w || entered.current) return
    entered.current = true
    w.enter(false)
    document.documentElement.classList.remove('is-locked')
    scroller.start()
    setPhase('live')
    setIntro(true)
    window.setTimeout(() => setIntro(false), 3400)
    // offer audio once, quietly — it can only start on a real gesture anyway
    setPrompt('sound')
    window.setTimeout(() => setPrompt((k) => (k === 'sound' ? null : k)), 9000)
  }, [])

  const [scene, setScene] = useState(0)

  const skipIntro = () => {
    worldRef.current?.skipIntro()
    setIntro(false)
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
    history.replaceState(null, '', `#case-${slug}`)
    setCaseSlug(slug)
  }, [])
  const closeCase = useCallback(() => {
    history.replaceState(null, '', location.pathname + location.search)
    setCaseSlug(null)
  }, [])

  /* ── overlays: dim the world, freeze scroll, Escape closes ── */
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

  /* ── sound + feedback ── */
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
    document.documentElement.classList.toggle('has-prompt', !!prompt && phase === 'live')
  }, [prompt, phase])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3400)
    return () => window.clearTimeout(t)
  }, [toast])

  const toggleSound = async () => {
    if (soundOn) {
      audio.disable()
      setSoundOn(false)
      return
    }
    await (await audio.get()).enable()
    setSoundOn(true)
    setPrompt(null)
  }

  /* "full immersive display": the browser only grants fullscreen from a real
     gesture, so the world auto-starts and this button completes it. */
  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setFull(false)
      } else {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
        setFull(true)
      }
    } catch {
      setToast('Your browser wouldn’t allow full-screen here')
    }
  }
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

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

  const calm = useCallback(() => {
    choose(false)
  }, [])

  if (block) {
    return (
      <Fallback
        reason={block}
        note={
          block === 'network'
            ? 'The 3D engine didn’t finish arriving in time, so here is everything in calm form. It’s cached now — one tap and it opens instantly.'
            : undefined
        }
        onRetry={
          block === 'network'
            ? () => {
                retryImmersive()
                location.reload()
              }
            : undefined
        }
      />
    )
  }

  return (
    <>
      <a href="#panels" className="sr-only" onClick={(e) => e.preventDefault()}>
        This portfolio is an immersive 3D experience. All of the writing is real page text as well.
      </a>
      <canvas ref={canvas} id="gl" aria-hidden="true" />
      <div id="scroll-space" aria-hidden="true" />

      <main id="panels">
        <Panels
          scene={scene}
          live={phase === 'live' && !overlay}
          onCase={openCase}
          onJump={jump}
          onDossier={(t) => setDossier(t ?? 'about')}
          onCV={cv}
          notify={setToast}
        />
      </main>

      <Hud
        scene={scene}
        live={phase === 'live'}
        intro={intro}
        sound={soundOn}
        menuOpen={menu}
        full={full}
        onSound={toggleSound}
        onMenu={() => setMenu((m) => !m)}
        onDossier={() => setDossier('about')}
        onJump={jump}
        onSkip={skipIntro}
        onFull={toggleFull}
        onCalm={calm}
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
      <Loader
        done={phase === 'live'}
        progress={progress}
        onCalm={calm}
      />
      {prompt && phase === 'live' && (
        <Prompt
          kind={prompt}
          onPrimary={() => (prompt === 'sound' ? void toggleSound() : calm())}
          onDismiss={() => setPrompt(null)}
        />
      )}
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
