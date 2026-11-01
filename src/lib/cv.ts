import { more, projects, studio, timeline, toolbox } from '../data/studio'

/**
 * CV — generated from the same data that powers the site, so the two can
 * never disagree. Opens a clean, print-ready page (Ctrl/⌘+P → Save as PDF).
 *
 * No PDF library: zero extra bytes shipped, and the output is plain,
 * ATS-friendly semantic HTML.
 */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function html() {
  const skills = toolbox
    .map((g) => `<p><strong>${esc(g.title)}:</strong> ${g.items.map(esc).join(', ')}</p>`)
    .join('')

  const featured = projects
    .map(
      (p) => `
      <article>
        <h3>${esc(p.title)} <span>— ${esc(p.blurb)}</span></h3>
        <p class="meta">${esc(p.discipline)} · ${p.live ? 'Deployed demonstration' : 'Working prototype'}</p>
        <p>${esc(p.summary)}</p>
        <p class="meta">Stack: ${p.stack.map(esc).join(', ')}</p>
        <p class="links">${p.live ? `Live: <a href="${esc(p.live)}">${esc(p.live)}</a> · ` : ''}Source: <a href="${esc(p.repo)}">${esc(p.repo)}</a></p>
      </article>`,
    )
    .join('')

  const smaller = more
    .map(
      (m) =>
        `<li><strong>${esc(m.title)}</strong> (${esc(m.status.toLowerCase())}) — ${m.stack.map(esc).join(', ')}. ${m.links
          .map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`)
          .join(' · ')}</li>`,
    )
    .join('')

  const jobs = timeline
    .map(
      (t) => `
      <article>
        <h3>${esc(t.role)} — ${esc(t.org)}</h3>
        <p class="meta">${esc(t.dates)}</p>
        <p>${esc(t.note)}</p>
        <ul>${t.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      </article>`,
    )
    .join('')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(studio.name)} — CV</title>
<style>
  *{box-sizing:border-box}
  body{font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:820px;margin:0 auto;padding:40px 28px}
  h1{font-size:2rem;margin:0;letter-spacing:-.02em}
  .role{color:#444;margin:.2rem 0 .6rem;font-size:1.05rem}
  .contact{color:#333;font-size:.95rem}
  a{color:#1637e0}
  h2{font-size:.85rem;letter-spacing:.12em;text-transform:uppercase;border-bottom:2px solid #111;padding-bottom:.35rem;margin:2rem 0 1rem}
  h3{font-size:1.05rem;margin:0 0 .15rem}
  h3 span{font-weight:400;color:#333}
  article{margin-bottom:1.1rem;break-inside:avoid}
  p{margin:.3rem 0}
  .meta{color:#444;font-size:.9rem}
  .links{font-size:.9rem;word-break:break-all}
  ul{margin:.4rem 0 0 1.2rem;padding:0}
  li{margin:.25rem 0}
  .bar{margin-top:2.5rem;padding:16px;background:#f3f3f1;border-radius:12px;text-align:center}
  .bar button{font:inherit;padding:.6rem 1.2rem;border-radius:999px;border:0;background:#111;color:#fff;cursor:pointer}
  @media print{.bar{display:none}body{padding:0}a{color:#000}}
</style></head><body>
  <h1>${esc(studio.name)}</h1>
  <p class="role">${esc(studio.role)}</p>
  <p class="contact">${esc(studio.location)} · <a href="mailto:${esc(studio.email)}">${esc(studio.email)}</a> ·
    <a href="${esc(studio.github)}">github.com/legendONE382</a> · <a href="${esc(studio.brandUrl)}">${esc(studio.brand)}</a></p>

  <h2>Summary</h2>
  <p>Full-stack developer building web applications, AI-powered tools, business software and automated workflows. Works across the frontend, the backend, the database and AI APIs, and ships what he builds. Open to remote software development roles, full-stack and AI application work, engineering collaborations, website projects and programming instruction.</p>

  <h2>Technical skills</h2>${skills}
  <h2>Selected projects</h2>${featured}
  <h2>Other projects</h2><ul>${smaller}</ul>
  <h2>Experience</h2>${jobs}

  <div class="bar"><p>Press <strong>Ctrl/⌘ + P</strong> and choose “Save as PDF”.</p>
  <button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`
}

/** Opens the CV; falls back to a file download if pop-ups are blocked. */
export function openCV(): 'opened' | 'downloaded' {
  const blob = new Blob([html()], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) {
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return 'opened'
  }
  const a = document.createElement('a')
  a.href = url
  a.download = 'Emmanuel-Uchenna-CV.html'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5_000)
  return 'downloaded'
}
