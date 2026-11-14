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
  onJump: (k: number) => void
  onSkip: () => void
  onFull: () => void
}

const canFull = typeof document !== 'undefined' && 'requestFullscreen' in HTMLElement.prototype

/** One compact top bar: brand plus the single Menu entry point. */
export function Hud({ scene, live, intro, sound, menuOpen, full, onSound, onMenu, onJump, onSkip, onFull }: Props) {
  return (
    <>
      <header className="hud hud--top">
        <button className="brand" onClick={() => onJump(0)} aria-label="Emmanuel Uchenna — Home" data-cursor="Start">
          <span className="brand__mark" aria-hidden="true" />
          <span>
            <span className="brand__name">Emmanuel Uchenna</span>
          </span>
        </button>
        <button className="menu-btn" aria-expanded={menuOpen} onClick={onMenu}>
          {menuOpen ? 'Close' : 'Menu'} <i aria-hidden="true" />
        </button>
      </header>

      {live && !menuOpen && (
        <aside className="hud hud--left" aria-label="Progress">
          <div className="counter" aria-live="polite">
            {String(scene + 1).padStart(2, '0')}
            <small>/ {String(SCENES.length).padStart(2, '0')}</small>
          </div>
          <div className="meter" aria-hidden="true">
            <span className="meter__fill" />
          </div>
          {scene < SCENES.length - 1 && (
            <div className="hint" aria-hidden="true">
              <i /> Scroll → next scene
            </div>
          )}
        </aside>
      )}

      {live && !menuOpen && (
        <nav className="dots" aria-label="Jump to a scene">
          {SCENES.map((s, i) => (
            <button key={s.id} className="dot-btn" aria-label={`Go to ${s.label}`} aria-current={scene === i} onClick={() => onJump(i)} data-cursor={s.label} />
          ))}
        </nav>
      )}

      {/* discreet corner utilities: skip intro while it plays, then sound / full-screen */}
      {live && (
        <div className="hud hud--escape">
          {intro && (
            <button className="link-btn" onClick={onSkip}>
              Skip intro
            </button>
          )}
          <button className="link-btn" aria-pressed={sound} onClick={onSound}>
            Sound {sound ? 'on' : 'off'}
          </button>
          {canFull && (
            <button className="link-btn" onClick={onFull} aria-pressed={full}>
              {full ? 'Exit full screen' : 'Full screen'}
            </button>
          )}
        </div>
      )}
    </>
  )
}
