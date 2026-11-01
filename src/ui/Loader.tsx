import { clsx } from 'clsx'

interface Props {
  done: boolean
  progress: number
  onCalm: () => void
}

/**
 * The preloader is part of the world (the current gathers itself); this is only
 * its numbers and one escape hatch. It never asks permission to begin — the
 * experience opens by itself the moment the engine is ready.
 */
export function Loader({ done, progress, onCalm }: Props) {
  const pct = Math.round(progress * 100)
  return (
    <div className={clsx('loader', done && 'is-done')}>
      <div aria-hidden="true" />
      <div className="loader__bottom">
        <div className="loader__count" role="status" aria-label={`Loading ${pct} percent`}>
          {String(pct).padStart(2, '0')}
          <i>%</i>
        </div>
        <div className="loader__side">
          <p className="loader__line">{progress < 0.99 ? 'Charging the signal…' : 'Signal stable.'}</p>
          <div className="cta-row">
            <button className="btn" onClick={onCalm} data-magnetic>
              Calm version
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** One prompt slot at a time: offer sound, or offer the calm page. */
export function Prompt({
  kind,
  onPrimary,
  onDismiss,
}: {
  kind: 'sound' | 'struggle'
  onPrimary: () => void
  onDismiss: () => void
}) {
  return (
    <div className={clsx('sound-ask is-in', kind === 'struggle' && 'sound-ask--hard')} role="region" aria-label={kind === 'sound' ? 'Sound' : 'Performance'}>
      <span>{kind === 'sound' ? 'Sound is off — browsers only allow it after a click.' : 'This device is struggling to hold frame rate.'}</span>
      <span className="sound-ask__btns">
        <button className="btn btn--primary" onClick={onPrimary}>
          {kind === 'sound' ? 'Turn it on' : 'Calm version'}
        </button>
        <button className="btn" onClick={onDismiss}>
          {kind === 'sound' ? 'No thanks' : 'Keep this'}
        </button>
      </span>
    </div>
  )
}
