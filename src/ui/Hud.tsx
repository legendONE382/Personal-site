import { SCENES } from '../world/sceneList'

interface Props {
  scene: number
  live: boolean
  /** true while the opening fly-in plays: that is the only time a skip makes sense */
  intro: boolean
  sound: boolean
  menuOpen: boolean
  full: boolean
  onSound: () => void
  onMenu: () => void
  onDossier: () => void
  onJump: (k: number) => void
  onSkip: () => void
  onFull: () => void
  onCalm: () => void
}

const canFull = typeof document !== 'undefined' && 'requestFullscreen' in HTMLElement.prototype

/** Always-reachable chrome: it never covers the world and never blocks it. */
export function Hud({ scene, live, intro, sound, menuOpen, full, onSound, onMenu, onDossier, onJump, onSkip, onFull, onCalm }: Props) {
  return (
    <>
      <header className="hud hud--top">
        <button className="brand" onClick={() => onJump(0)} aria-label="Emmanuel Uchenna — back to the start" data-cursor="Start">
          <span className="brand__mark" aria-hidden="true" />
          <span>
            <span className="brand__name">Emmanuel Uchenna</span>
            <span className="brand__sub">Software studio · Lagos</span>
          </span>
        </button>
        <nav className="hud__right" aria-label="Utilities">
          <button className="link-btn hide-sm" onClick={onDossier}>Dossier</button>
          <button className="link-btn" aria-pressed={sound} onClick={onSound}>
            Sound {sound ? 'on' : 'off'}
          </button>
          {canFull && (
            <button className="link-btn hide-md" onClick={onFull} aria-pressed={full}>
              {full ? 'Exit full screen' : 'Full screen'}
            </button>
          )}
          <button className="menu-btn" aria-expanded={menuOpen} onClick={onMenu}>
            {menuOpen ? 'Close' : 'Menu'} <i aria-hidden="true" />
          </button>
        </nav>
      </header>

      {live && !menuOpen && (
        <aside className="hud hud--left" aria-label="Progress">
          <div className="counter" aria-live="polite">
            {String(scene + 1).padStart(2, '0')}
            <small>/ {String(SCENES.length).padStart(2, '0')}</small>
            <span className="counter__label">{SCENES[scene].label}</span>
          </div>
          <div className={scene <= 1 && !intro ? 'hint' : 'hint is-hidden'} aria-hidden="true">
            <i /> Scroll
          </div>
        </aside>
      )}

      {live && !menuOpen && (
        <nav className="dots" aria-label="Jump to a scene">
          {SCENES.map((s, i) => (
            <button key={s.id} className="dot-btn" aria-label={`Go to ${s.label}`} aria-current={scene === i} onClick={() => onJump(i)} data-cursor={s.label} />
          ))}
        </nav>
      )}

      {/* corner utilities: only once the world is up, since the loader owns that
          corner while it is still charging (it has its own escape hatch) */}
      {live && (
        <div className="hud hud--escape">
        {intro && (
          <button className="link-btn" onClick={onSkip}>
            Skip intro
          </button>
        )}
        <button className="link-btn" onClick={onCalm}>
          Calm version
        </button>
        </div>
      )}
    </>
  )
}
