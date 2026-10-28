import type { CSSProperties } from 'react'
import { clsx } from 'clsx'
import { studio } from '../data/studio'
import { SCENES } from '../world/sceneList'

interface Props {
  open: boolean
  scene: number
  onJump: (k: number) => void
  onHover: (k: number) => void
  onDossier: () => void
  onCV: () => void
}

/** Full-screen menu. The darkening wipe is a shader in the post lens; this is only its text. */
export function Menu({ open, scene, onJump, onHover, onDossier, onCV }: Props) {
  return (
    <div className={clsx('menu', open && 'is-open')} role={open ? 'dialog' : undefined} aria-modal={open || undefined} aria-label="Menu" aria-hidden={!open}>
      <nav aria-label="Scenes">
        <ol className="menu__list">
          {SCENES.map((s, i) => (
            <li key={s.id}>
              <button
                className="menu__item"
                style={{ '--i': i } as CSSProperties}
                tabIndex={open ? 0 : -1}
                aria-current={scene === i}
                onMouseEnter={() => onHover(i)}
                onFocus={() => onHover(i)}
                onClick={() => onJump(i)}
                data-cursor="Fly"
              >
                <span className="menu__n">{String(i + 1).padStart(2, '0')}</span>
                <span className="menu__t">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="menu__foot">
        <button tabIndex={open ? 0 : -1} onClick={onDossier}>Dossier</button>
        <button tabIndex={open ? 0 : -1} onClick={onCV}>Download CV ↓</button>
        <a tabIndex={open ? 0 : -1} href={`mailto:${studio.email}`}>{studio.email}</a>
        <a tabIndex={open ? 0 : -1} href={studio.github} target="_blank" rel="noreferrer">GitHub ↗</a>
        <a tabIndex={open ? 0 : -1} href={studio.brandUrl} target="_blank" rel="noreferrer">Estech Solutions ↗</a>
      </div>
    </div>
  )
}
