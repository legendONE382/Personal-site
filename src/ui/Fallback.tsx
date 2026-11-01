import { more, projects, studio } from '../data/studio'
import { choose } from '../lib/capabilities'
import { openCV } from '../lib/cv'
import { ContactForm } from './ContactForm'

const NOTES: Record<string, string> = {
  webgl: 'This browser can’t run the 3D experience (WebGL or floating-point buffers are unavailable or blocked), so here is the same work as a calm page.',
  device: 'Your device looks too small or low-powered for the 3D experience, so it’s the calm version — every word, screenshot and link is here.',
  network: 'Your connection looks too slow right now to fetch the 3D engine without stalling, so you get the useful page first. Turn on the immersive version any time — it will already be partly cached.',
  user: 'You asked for the calm version. It’s remembered on this device.',
}

/**
 * The calm page. Same real content, zero WebGL — the fallback for blocked
 * browsers, small/old devices, slow lines, and anyone who prefers it.
 */
export default function Fallback({ reason, note, onRetry }: { reason: string; note?: string; onRetry?: () => void }) {
  const enter = () => (onRetry ? onRetry() : choose(true))
  return (
    <div className="fb">
      <p className="fb__note" role="note">
        <span>{note ?? NOTES[reason] ?? NOTES.webgl}</span>
        <button className="btn btn--primary" onClick={enter}>
          {reason === 'network' ? 'Open the immersive version (retry)' : 'Open the immersive version'}
        </button>
        {reason !== 'user' && (
          <button className="btn" onClick={() => choose(false)}>
            Keep the calm version
          </button>
        )}
      </p>

      <h1>
        Software
        <br />
        <em>that ships.</em>
      </h1>
      <p className="sheet__lead">
        I’m Emmanuel Uchenna, a full-stack and AI application developer in Lagos, Nigeria. I build web applications, AI-powered tools, business software and automated workflows — and take them all the way to deployment.
      </p>
      <div className="cta-row">
        <a className="btn btn--primary" href={`mailto:${studio.email}`}>Email me ↗</a>
        <button className="btn" onClick={openCV}>CV ↓</button>
        <a className="btn" href={studio.github} target="_blank" rel="noreferrer">GitHub ↗</a>
      </div>

      <section aria-labelledby="fb-work">
        <h2 id="fb-work" className="display" style={{ fontSize: 'clamp(2.4rem,7vw,5rem)' }}>Selected work</h2>
        {projects.map((p) => (
          <article key={p.slug}>
            <p className="kicker">{p.index} / 04 — {p.discipline}</p>
            <h3 style={{ marginTop: '0.6rem' }}>{p.title}</h3>
            <p className="sheet__lead">{p.summary}</p>
            <figure className="shot" style={{ marginTop: '1.4rem' }}>
              <img src={p.hero ?? p.img} alt={`Screenshot of ${p.title}`} loading="lazy" />
            </figure>
            <ul className="chips" style={{ marginTop: '1.2rem' }}>{p.stack.map((s) => <li className="chip" key={s}>{s}</li>)}</ul>
            <p className="link-row" style={{ marginTop: '1rem' }}>
              {p.links.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>)}
            </p>
            <h4 style={{ marginTop: '1.6rem' }}>Honest limitations</h4>
            <ul className="bullets bullets--mute">{p.limitations.map((x) => <li key={x}>{x}</li>)}</ul>
          </article>
        ))}
      </section>

      <section aria-labelledby="fb-more">
        <h2 id="fb-more" className="display" style={{ fontSize: 'clamp(2.4rem,7vw,5rem)' }}>Also built</h2>
        <ul className="rows" style={{ marginTop: '1.5rem' }}>
          {more.map((m) => (
            <li key={m.title} style={{ gridTemplateColumns: '1fr' }}>
              <h3>{m.title}</h3>
              <p>{m.blurb}</p>
              <p className="link-row">{m.links.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="fb-contact" style={{ paddingBottom: '5rem' }}>
        <h2 id="fb-contact" className="display" style={{ fontSize: 'clamp(2.4rem,7vw,5rem)' }}>Let’s talk</h2>
        <div style={{ maxWidth: '34rem', marginTop: '1.5rem' }}>
          <ContactForm notify={() => {}} onCV={openCV} />
        </div>
      </section>
    </div>
  )
}
