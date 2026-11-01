import { useEffect, useRef } from 'react'
import { gsap, isCoarse } from '../lib/motion'

/**
 * Context-aware cursor: a precise dot, a lagging ring that swells over
 * anything interactive and names it (data-cursor="Open"), and magnetic pull
 * on [data-magnetic] elements. Disabled on touch.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (isCoarse()) return
    const r = ring.current!
    const d = dot.current!
    const l = label.current!
    document.documentElement.classList.add('has-cursor')
    gsap.set([r, d], { xPercent: -50, yPercent: -50, opacity: 0 })

    const rx = gsap.quickTo(r, 'x', { duration: 0.5, ease: 'power3' })
    const ry = gsap.quickTo(r, 'y', { duration: 0.5, ease: 'power3' })
    const dx = gsap.quickTo(d, 'x', { duration: 0.08, ease: 'power3' })
    const dy = gsap.quickTo(d, 'y', { duration: 0.08, ease: 'power3' })

    let mag: HTMLElement | null = null
    let seen = false

    const move = (e: PointerEvent) => {
      if (!seen) {
        seen = true
        gsap.to([r, d], { opacity: 1, duration: 0.4 })
      }
      rx(e.clientX)
      ry(e.clientY)
      dx(e.clientX)
      dy(e.clientY)

      const t = e.target as Element | null
      const tagged = t?.closest?.('[data-cursor]') as HTMLElement | null
      const interactive = t?.closest?.('a,button,summary,[role=tab]') as HTMLElement | null
      const field = t?.closest?.('input,textarea')
      const text = tagged?.dataset.cursor

      if (field) {
        gsap.to(r, { width: 8, height: 8, backgroundColor: 'rgba(0,0,0,0)', duration: 0.25 })
        gsap.to(l, { opacity: 0, duration: 0.15 })
      } else if (text) {
        l.textContent = text
        gsap.to(r, { width: 88, height: 88, backgroundColor: 'rgb(255,178,62)', borderColor: 'rgb(255,178,62)', duration: 0.45, ease: 'power3' })
        gsap.to(l, { opacity: 1, duration: 0.25, delay: 0.05 })
      } else if (interactive) {
        gsap.to(r, { width: 56, height: 56, backgroundColor: 'rgba(255,178,62,0.0)', borderColor: 'rgba(255,178,62,0.9)', duration: 0.3 })
        gsap.to(l, { opacity: 0, duration: 0.15 })
      } else {
        gsap.to(r, { width: 34, height: 34, backgroundColor: 'rgba(0,0,0,0)', borderColor: 'rgba(239,234,224,0.6)', duration: 0.3 })
        gsap.to(l, { opacity: 0, duration: 0.15 })
      }

      const m = t?.closest?.('[data-magnetic]') as HTMLElement | null
      if (mag && mag !== m) gsap.to(mag, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.4)' })
      mag = m
      if (m) {
        const b = m.getBoundingClientRect()
        gsap.to(m, { x: (e.clientX - (b.left + b.width / 2)) * 0.28, y: (e.clientY - (b.top + b.height / 2)) * 0.35, duration: 0.4, ease: 'power3' })
      }
    }
    const down = () => gsap.to([r, d], { scale: 0.75, duration: 0.2 })
    const up = () => gsap.to([r, d], { scale: 1, duration: 0.3 })

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  if (isCoarse()) return null
  return (
    <div aria-hidden="true">
      <div ref={ring} className="cursor-ring"><span ref={label} /></div>
      <div ref={dot} className="cursor-dot" />
    </div>
  )
}
