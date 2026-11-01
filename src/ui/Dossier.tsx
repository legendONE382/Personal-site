import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { faq, more, process, services, stats, studio, timeline, toolbox } from '../data/studio'

const TABS = [
  ['about', 'About'],
  ['capabilities', 'Capabilities'],
  ['toolbox', 'Toolbox'],
  ['process', 'Process'],
  ['more', 'More work'],
  ['questions', 'Questions'],
] as const

interface Props {
  tab: string
  onTab: (t: string) => void
  onClose: () => void
  onCase: (slug: string) => void
}

/** The reference shelf: everything that doesn't belong in the scroll journey, as typographic lists. */
export function Dossier({ tab, onTab, onClose, onCase }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(true))
    root.current?.focus()
    return () => cancelAnimationFrame(t)
  }, [])
  useEffect(() => {
    root.current?.scrollTo({ top: 0 })
  }, [tab])

  return (
    <div ref={root} tabIndex={-1} data-lenis-prevent role="dialog" aria-modal="true" aria-label="Dossier" className={clsx('sheet', shown && 'is-in')}>
      <div className="sheet__bar">
        <button className="btn" onClick={onClose} data-cursor="Back"><span aria-hidden>←</span> Back to the journey</button>
        <span className="sheet__count hide-sm">Dossier</span>
        <a className="btn btn--primary" href={`mailto:${studio.email}`}>Email me ↗</a>
      </div>

      <div className="sheet__inner">
        <h2 className="display">The dossier.</h2>
        <div className="tabs" role="tablist" aria-label="Dossier sections">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls="dossier-panel" className="tab" onClick={() => onTab(id)}>{label}</button>
          ))}
        </div>

        <div id="dossier-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} style={{ marginTop: '2.5rem' }}>
          {tab === 'about' && (
            <div className="cols" style={{ marginTop: 0 }}>
              <div>
                <h3>One desk, a small team of one, and a bias toward shipping.</h3>
                <p className="sheet__lead">
                  I work directly with the people who need the software. No account managers, no handoff — the person who writes the code is the person who ships it and answers the questions afterwards.
                </p>
                <p className="sheet__lead">
                  Before this I spent four months teaching Python and Django in a training room in Lagos. It taught me to explain the work clearly, which matters more than people expect.
                </p>
                <dl className="facts">
                  {stats.map((s) => (
                    <div key={s.label}><dt>{s.label}</dt><dd><b style={{ font: '400 2rem var(--serif)', color: 'var(--amber)' }}>{s.n}</b> · {s.note}</dd></div>
                  ))}
                </dl>
              </div>
              <div>
                <h4>Track record</h4>
                <ol className="steps" style={{ marginTop: '1rem' }}>
                  {timeline.map((t) => (
                    <li key={t.org} style={{ display: 'block' }}>
                      <strong>{t.role}</strong>
                      <span style={{ color: 'var(--amber)' }}>{t.org} · {t.dates}</span>
                      <span>{t.note}</span>
                      <ul className="bullets bullets--mute">{t.points.map((x) => <li key={x}>{x}</li>)}</ul>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {tab === 'capabilities' && (
            <ol className="rows">
              {services.map((s) => (
                <li key={s.index}>
                  <h3>{s.title}</h3>
                  <div>
                    <p>{s.summary}</p>
                    <ul className="chips" style={{ marginTop: '1rem' }}>{s.stack.map((t) => <li key={t} className="chip">{t}</li>)}</ul>
                    <p className="link-row">
                      <span style={{ color: 'var(--mute)' }}>Seen in</span>
                      {s.related.map((r) => (r.slug ? <button key={r.label} onClick={() => onCase(r.slug!)}>{r.label} →</button> : null))}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {tab === 'toolbox' && (
            <ol className="rows">
              {toolbox.map((g) => (
                <li key={g.title}>
                  <h3>{g.title}</h3>
                  <div>
                    <ul className="chips">{g.items.map((t) => <li key={t} className="chip">{t}</li>)}</ul>
                    <p className="link-row">
                      <span style={{ color: 'var(--mute)' }}>Seen in</span>
                      {g.seen.map((s) => s.slug ? <button key={s.label} onClick={() => onCase(s.slug!)}>{s.label} →</button> : <a key={s.label} href={s.href} target="_blank" rel="noreferrer">{s.label} ↗</a>)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {tab === 'process' && (
            <ol className="rows">
              {process.map((s, i) => (
                <li key={s.step}>
                  <h3>{String(i + 1).padStart(2, '0')} · {s.step}</h3>
                  <div>
                    <p>{s.text}</p>
                    <p style={{ marginTop: '0.6rem', color: 'var(--mute)' }}>Example — {s.example}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {tab === 'more' && (
            <ul className="rows">
              {more.map((m) => (
                <li key={m.title} style={{ gridTemplateColumns: '18rem 1fr' }}>
                  {m.img ? <img src={m.img} alt={`${m.title} preview`} loading="lazy" /> : <div className="shot" style={{ aspectRatio: '16/10', display: 'grid', placeItems: 'center', color: 'var(--mute)' }}>No preview</div>}
                  <div>
                    <p className="kicker">{m.status} · {m.kind}</p>
                    <h3 style={{ marginTop: '0.4rem' }}>{m.title}</h3>
                    <p style={{ marginTop: '0.6rem' }}>{m.blurb}</p>
                    <ul className="chips" style={{ marginTop: '1rem' }}>{m.stack.map((t) => <li key={t} className="chip">{t}</li>)}</ul>
                    <p className="link-row">{m.links.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {tab === 'questions' && (
            <div>
              {faq.map((f) => (
                <details className="q" key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
