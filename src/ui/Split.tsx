import type { CSSProperties } from 'react'

/**
 * Per-character (or per-word) masked reveal. Real text stays in the DOM via
 * aria-label; the animated spans are aria-hidden. Timing comes from CSS
 * (see .split in global.css), triggered by the parent panel's .is-active.
 */
export function Split({ text, mode = 'words', step = 40, base = 0 }: { text: string; mode?: 'chars' | 'words'; step?: number; base?: number }) {
  let n = 0
  return (
    <span className="split" aria-label={text} style={{ '--step': `${step}ms`, '--base': `${base}ms` } as CSSProperties}>
      {text.split(' ').map((w, wi) => (
        <span key={wi}>
          <span className="w" aria-hidden="true">
            {mode === 'chars' ? (
              Array.from(w).map((c, ci) => (
                <span key={ci} className="c" style={{ '--i': n++ } as CSSProperties}>
                  {c}
                </span>
              ))
            ) : (
              <span className="c" style={{ '--i': n++ } as CSSProperties}>
                {w}
              </span>
            )}
          </span>{' '}
        </span>
      ))}
    </span>
  )
}
