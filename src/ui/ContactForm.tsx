import { useEffect, useRef, useState, type FormEvent } from 'react'
import { studio } from '../data/studio'

type Status = 'idle' | 'sending' | 'success' | 'error'
type Errors = Partial<Record<'name' | 'email' | 'message', string>>

/**
 * Contact form. Messages go through FormSubmit to the studio inbox. Success is
 * only ever shown when the service confirms it. A honeypot and a minimum-time
 * check keep bots out.
 */
export function ContactForm({ notify, onCV }: { notify: (m: string) => void; onCV: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', message: '', _honey: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')
  const mounted = useRef(Date.now())

  useEffect(() => {
    mounted.current = Date.now()
  }, [])

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = (): Errors => {
    const e: Errors = {}
    if (form.name.trim().length < 2) e.name = 'Please enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'Please enter a valid email address.'
    if (form.message.trim().length < 10) e.message = 'Please add a few more details (at least 10 characters).'
    return e
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (status === 'sending') return
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    if (form._honey) {
      setStatus('success')
      return
    }
    if (Date.now() - mounted.current < 3000) {
      setStatus('error')
      return
    }
    setStatus('sending')
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${studio.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          _subject: `Portfolio enquiry from ${form.name.trim()}`,
          _replyto: form.email.trim(),
          _template: 'table',
          _captcha: 'false',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && (data.success === true || data.success === 'true')) {
        setStatus('success')
        setForm({ name: '', email: '', message: '', _honey: '' })
      } else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(studio.email)
      notify('Email address copied')
    } catch {
      notify('Copy failed — please select the address manually')
    }
  }

  const err = (id: string, msg?: string) =>
    msg ? (
      <span id={id} role="alert" className="err">
        {msg}
      </span>
    ) : null

  return (
    <div data-lenis-prevent>
      {status === 'success' ? (
        <div role="status" className="ok">
          <h3>Message sent</h3>
          <p>Thank you. I’ll reply to the email address you gave.</p>
          <button type="button" className="btn" style={{ marginTop: '1rem' }} onClick={() => setStatus('idle')}>
            Send another
          </button>
        </div>
      ) : (
        <form className="form" onSubmit={submit} noValidate aria-label="Contact form">
          <label className="field" htmlFor="f-name">
            Your name
            <input id="f-name" className="input" value={form.name} onChange={set('name')} autoComplete="name" placeholder="Ada Lovelace" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'e-name' : undefined} />
            {err('e-name', errors.name)}
          </label>
          <label className="field" htmlFor="f-email">
            Your email
            <input id="f-email" type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@company.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'e-email' : undefined} />
            {err('e-email', errors.email)}
          </label>
          <label className="field" htmlFor="f-msg">
            What do you need?
            <textarea id="f-msg" className="input" rows={3} maxLength={1000} value={form.message} onChange={set('message')} placeholder="The role or project, and any timeline." aria-invalid={!!errors.message} aria-describedby={errors.message ? 'e-msg' : undefined} style={{ resize: 'vertical' }} />
            {err('e-msg', errors.message)}
          </label>
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, overflow: 'hidden' }}>
            <label>
              Leave empty
              <input tabIndex={-1} autoComplete="off" value={form._honey} onChange={set('_honey')} />
            </label>
          </div>
          {status === 'error' && (
            <div role="alert" className="alert">
              Your message could not be sent. Please try again in a moment, or email me directly at <a href={`mailto:${studio.email}`}>{studio.email}</a>.
            </div>
          )}
          <div className="cta-row" style={{ marginTop: 0 }}>
            <button type="submit" className="btn btn--primary" disabled={status === 'sending'} data-magnetic data-cursor="Send">
              {status === 'sending' ? 'Sending…' : 'Send message'} <span aria-hidden>→</span>
            </button>
          </div>
        </form>
      )}
      <p className="contact-links">
        <a href={`mailto:${studio.email}`}>{studio.email}</a>
        <button type="button" onClick={copy}>Copy email</button>
        <button type="button" onClick={onCV}>Download CV ↓</button>
        <a href={studio.github} target="_blank" rel="noreferrer">GitHub ↗</a>
        <a href={studio.brandUrl} target="_blank" rel="noreferrer">Estech Solutions ↗</a>
      </p>
    </div>
  )
}
