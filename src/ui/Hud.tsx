import { SCENES } from '../world/sceneList'

interface Props {
  scene: number
  live: boolean
  sound: boolean
  menuOpen: boolean
  onSound: () => void
  onMenu: () => void
  onDossier: () => void
  onJump: (k: number) => void
  onSkip: () => void
}

/** Always-reachable navigation: jump to any scene, menu, sound, and a way out of the intro. */
export function Hud({ scene, live, sound, menuOpen, onSound, onMenu, onDossier, onJump, onSkip }: Props) {
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
          <div className={scene <= 1 ? 'hint' : 'hint is-hidden'} aria-hidden="true">
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

      {!live && (
        <button className="btn skip" onClick={onSkip}>
          Skip intro
        </button>
      )}
    </>
  )
}
