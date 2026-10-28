import { clsx } from 'clsx'

interface Props {
  phase: 'loading' | 'ready' | 'live'
  progress: number
  onEnter: (sound: boolean) => void
}

/** The preloader is a live WebGL moment — the current gathering itself — with only this text on top. */
export function Loader({ phase, progress, onEnter }: Props) {
  const pct = Math.round(progress * 100)
  return (
    <div className={clsx('loader', phase === 'live' && 'is-done')} aria-live="polite">
      <div aria-hidden="true" />
      <div className="loader__bottom">
        <div className="loader__count" aria-label={`Loading ${pct} percent`}>
          {String(pct).padStart(2, '0')}
          <i>%</i>
        </div>
        <div className="loader__side">
          <p className="loader__line">{phase === 'loading' ? 'Charging the signal…' : 'Signal stable.'}</p>
          {phase === 'ready' && (
            <div className="cta-row">
              <button className="btn btn--primary" onClick={() => onEnter(true)} data-magnetic>
                Enter with sound
              </button>
              <button className="btn" onClick={() => onEnter(false)} data-magnetic>
                Enter silent
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
