import type { CSSProperties } from 'react'
import { clsx } from 'clsx'
import { projects, stats } from '../data/studio'
import { ContactForm } from './ContactForm'
import { Split } from './Split'

interface Props {
  scene: number
  live: boolean
  onCase: (slug: string) => void
  onJump: (k: number) => void
  onDossier: (tab?: string) => void
  onCV: () => void
  notify: (m: string) => void
}

const d = (ms: number) => ({ '--d': ms }) as CSSProperties

const statement =
  'I am a full-stack developer in Lagos, Nigeria. I build software that has to work in the real world — business tools, AI applications, document intelligence, automated pipelines. Every project here was scoped, written, tested and deployed by me, and every one still has its limitations written down beside it.'

/**
 * The thin text layer. Every word is real HTML (SEO, screen readers); the big
 * display type lives in the WebGL scene. Panels fade in only for the scene
 * the camera is currently holding on.
 */
export function Panels({ scene, live, onCase, onJump, onDossier, onCV, notify }: Props) {
  const on = (k: number) => live && scene === k

  return (
    <>
      <section className={clsx('panel panel--ignition', on(0) && 'is-active')} aria-label="Introduction">
        <h1 className="sr-only">Emmanuel Uchenna — full-stack developer building AI-powered applications and business software</h1>
        <div className="panel__body">
          <p className="kicker rv" style={d(0)}>Full-stack &amp; AI application developer · Lagos</p>
          <p className="lead rv" style={d(140)}>
            I build web applications, AI-powered tools, business software and automated workflows — and take them all the way to deployment.
          </p>
          <div className="cta-row rv" style={d(280)}>
            <button className="btn btn--primary" data-magnetic data-cursor="Fly" onClick={() => onJump(2)}>
              See the work <span aria-hidden>↓</span>
            </button>
            <button className="btn" data-magnetic onClick={() => onJump(6)}>
              Start a conversation
            </button>
            <button className="btn hide-sm" data-magnetic onClick={onCV}>
              CV ↓
            </button>
          </div>
          <p className="status rv hide-sm" style={d(400)}>
            <span className="dot" /> Open to remote work · Lagos, Nigeria
          </p>
        </div>
      </section>

      <section className={clsx('panel panel--statement', on(1) && 'is-active')} aria-label="About">
        <div className="panel__body">
          <p className="kicker rv" style={d(0)}>The signal</p>
          <p className="big" style={{ marginTop: '1rem' }}>
            <Split text={statement} mode="words" step={16} base={140} />
          </p>
          <p className="stats-line rv" style={d(900)}>
            {stats.map((s) => (
              <span key={s.label} style={{ marginRight: '1.1rem', display: 'inline-block', whiteSpace: 'nowrap' }}>
                <b>{s.n}</b> {s.label.toLowerCase().replace(/^ai /, 'AI ')}
              </span>
            ))}
          </p>
          <div className="cta-row rv" style={d(1000)}>
            <button className="btn btn--primary" data-magnetic data-cursor="Fly" onClick={() => onJump(2)}>
              Follow the signal <span aria-hidden>↓</span>
            </button>
            <button className="btn" data-magnetic onClick={() => onDossier('about')}>
              Open the dossier
            </button>
          </div>
        </div>
      </section>

      {projects.map((p, i) => {
        const k = i + 2
        return (
          <section key={p.slug} className={clsx('panel panel--project', on(k) && 'is-active')} aria-label={`${p.title} — project ${p.index} of 04`}>
            <h2 className="sr-only">{p.title}</h2>
            <div className="panel__body">
              <p className="kicker rv" style={d(0)}>
                {p.index} / 04 — {p.discipline.split(' · ')[0]}
              </p>
              <p className="blurb rv" style={d(80)}>{p.blurb}</p>
              <p className="summary rv hide-sm" style={d(180)}>{p.summary}</p>
              <p className="stack-line rv hide-sm" style={d(240)}>{p.stack.slice(0, 6).join(' · ')}</p>
              <p className="status rv hide-sm" style={d(300)}>
                <span className="dot" />
                {p.live ? 'Deployed demonstration' : 'Working prototype · runs locally or in Docker'}
              </p>
              <div className="cta-row rv" style={d(360)}>
                <button className="btn btn--primary" data-magnetic data-cursor="Open" onClick={() => onCase(p.slug)}>
                  Open the case study <span aria-hidden>→</span>
                </button>
                <a className="btn" href={p.live ?? p.repo} target="_blank" rel="noreferrer" data-magnetic>
                  {p.live ? 'Live demo' : 'Source'} ↗
                </a>
              </div>
            </div>
          </section>
        )
      })}

      <section className={clsx('panel panel--contact', on(6) && 'is-active')} aria-label="Contact">
        <h2 className="sr-only">Let’s talk</h2>
        <div className="panel__body">
          <p className="kicker rv" style={d(0)}>Open to work — remote</p>
          <p className="lead rv" style={d(100)}>For a role, a collaboration or a project: a few lines about what you need and when is plenty to start.</p>
          <div className="rv" style={d(200)}>
            <ContactForm notify={notify} onCV={onCV} />
          </div>
        </div>
      </section>
    </>
  )
}
