'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'
import { WORK, type Job } from '@/lib/content'

type Props = {
  jobs: Job[]
  active: number
  className?: string
}

const clamp = (v: number) => Math.min(100, Math.max(0, v))

/**
 * Before/after comparison. The clean photo sits underneath; the dirty one on
 * top is clipped to the left of the line (`--pos`, 0 to 100). On entering view
 * it washes itself once (100 → 50, then a small nudge to show it moves) and
 * stops; from then on the visitor drives it by drag, touch, click or keys.
 * Grabbing it mid-wash hands over control at once.
 */
export default function BeforeAfter({ jobs, active, className = '' }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const handle = useRef<HTMLButtonElement>(null)
  const pos = useRef(50)
  const auto = useRef<gsap.core.Timeline | null>(null)
  const glide = useRef<gsap.core.Tween | null>(null)
  const afterShown = useRef(true)
  const shown = useRef(active)

  const { contextSafe } = useGSAP({ scope: root })

  /** Move the line. Everything reads --pos; the handle reports it to assistive tech. */
  const apply = contextSafe((v: number) => {
    pos.current = clamp(v)
    frame.current!.style.setProperty('--pos', `${pos.current}%`)
    const h = handle.current!
    h.setAttribute('aria-valuenow', String(Math.round(pos.current)))
    h.setAttribute('aria-valuetext', WORK.sliderValue(pos.current))
    if (!afterShown.current && pos.current < 90) {
      afterShown.current = true
      gsap.to(root.current!.querySelector('[data-pill="after"]'), { autoAlpha: 1, duration: 0.5, ease: EASE.soft })
    }
  })

  /** Tween the line to `to`. Returns the tween so callers can sequence it. */
  const tweenTo = contextSafe((to: number, duration: number, ease: string = EASE.inOut) => {
    const proxy = { v: pos.current }
    return gsap.to(proxy, { v: to, duration, ease, onUpdate: () => apply(proxy.v) })
  })

  const stopAuto = () => {
    auto.current?.kill()
    auto.current = null
  }

  // Entry: the frame rises, then the automatic wash
  useGSAP(
    () => {
      apply(50)
      if (prefersReducedMotion()) return
      const f = frame.current!
      apply(100)
      afterShown.current = false
      gsap.set(root.current!.querySelector('[data-pill="after"]'), { autoAlpha: 0 })
      const k = () => f.offsetWidth / 2338 // Figma units on this frame
      gsap
        .timeline({ scrollTrigger: { trigger: f, start: 'top 70%', once: true } })
        .fromTo(f, { y: () => 90 * k(), scale: 0.96 }, { y: 0, scale: 1, duration: 1.2, ease: EASE.inOut }, 0)
        .fromTo(f, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: EASE.soft }, 0)
        .call(
          () => {
            if (auto.current === null && pos.current !== 100) return // the visitor already took over
            auto.current = gsap
              .timeline({ onComplete: () => void (auto.current = null) })
              .add(tweenTo(50, 1.7))
              .add(tweenTo(40, 0.8))
              .add(tweenTo(50, 0.8))
          },
          [],
          0.9,
        )
    },
    { scope: root },
  )

  // Switching jobs: cross-fade both photos, replay a short sweep
  useEffect(() => {
    const el = root.current
    if (!el) return
    const layers = el.querySelectorAll<HTMLElement>('[data-job]')
    // Only a real change of job animates (effects can run twice on mount in development).
    if (shown.current === active) return
    shown.current = active
    const reduce = prefersReducedMotion()
    layers.forEach((l) => {
      gsap.to(l, { autoAlpha: Number(l.dataset.job) === active ? 1 : 0, duration: reduce ? 0 : 0.6, ease: EASE.soft, overwrite: 'auto' })
    })
    if (!reduce) {
      stopAuto()
      glide.current?.kill()
      apply(70)
      glide.current = tweenTo(50, 1)
    }
  }, [active, apply, tweenTo])

  // ---- Pointer: drag anywhere, click to glide there ----
  const dragging = useRef(false)
  const fromEvent = (e: React.PointerEvent) => {
    const r = frame.current!.getBoundingClientRect()
    return ((e.clientX - r.left) / r.width) * 100
  }

  const onPointerDown = contextSafe((e: React.PointerEvent) => {
    if (e.button !== 0) return
    stopAuto()
    glide.current?.kill()
    dragging.current = true
    frame.current!.setPointerCapture(e.pointerId)
    gsap.to(handle.current!.querySelector('[data-knob]'), { scale: 0.92, duration: 0.3, ease: EASE.out })
    const onHandle = handle.current!.contains(e.target as Node)
    if (!onHandle) glide.current = tweenTo(fromEvent(e), 0.4, EASE.out)
  })

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    glide.current?.kill()
    apply(fromEvent(e))
  }

  const onPointerUp = contextSafe((e: React.PointerEvent) => {
    if (!dragging.current) return
    dragging.current = false
    if (frame.current!.hasPointerCapture(e.pointerId)) frame.current!.releasePointerCapture(e.pointerId)
    gsap.to(handle.current!.querySelector('[data-knob]'), { scale: 1, duration: 0.4, ease: EASE.out })
  })

  // ---- Keyboard: arrows ±5, shift ±10, Home and End ----
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 5
    let next: number | null = null
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = pos.current - step
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = pos.current + step
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = 100
    if (next === null) return
    e.preventDefault()
    stopAuto()
    glide.current?.kill()
    if (prefersReducedMotion()) apply(next)
    else glide.current = tweenTo(next, 0.35, EASE.out)
  }

  return (
    <div ref={root} className={className}>
      <div
        ref={frame}
        data-frame
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative aspect-[4/3] cursor-ew-resize touch-pan-y overflow-hidden select-none lg:aspect-[2338/1000] lg:rounded-lg"
        style={{ ['--pos' as string]: '50%' }}
      >
        {/* After (clean) photos underneath */}
        {jobs.map((j, i) => (
          <div key={j.id} data-job={i} className="absolute inset-0" style={{ backgroundColor: j.placeholder.after, opacity: i === active ? 1 : 0 }}>
            {j.after && <Image src={j.after} alt={j.alt.after} fill sizes="(min-width: 1024px) 92vw, 100vw" quality={90} className="object-cover" draggable={false} />}
          </div>
        ))}

        {/* Before (dirty) photos on top, clipped to the left of the line */}
        <div className="absolute inset-0" style={{ clipPath: 'inset(0 calc(100% - var(--pos)) 0 0)' }}>
          {jobs.map((j, i) => (
            <div key={j.id} data-job={i} className="absolute inset-0" style={{ backgroundColor: j.placeholder.before, opacity: i === active ? 1 : 0 }}>
              {j.before && <Image src={j.before} alt={j.alt.before} fill sizes="(min-width: 1024px) 92vw, 100vw" quality={90} className="object-cover" draggable={false} />}
            </div>
          ))}
        </div>

        <span data-pill="before" className="ba-pill top-[var(--ba-inset)] left-[var(--ba-inset)]">
          {WORK.before}
        </span>
        <span data-pill="after" className="ba-pill top-[var(--ba-inset)] right-[var(--ba-inset)]">
          {WORK.after}
        </span>

        {/* The line and its handle */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[var(--pos)] w-[2px] -translate-x-1/2 bg-limestone" />
        <button
          ref={handle}
          type="button"
          role="slider"
          aria-label={WORK.sliderLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          className="ba-handle absolute top-1/2 left-[var(--pos)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        >
          <span
            data-knob
            className="mono flex size-[clamp(60px,6.25vw,80px)] items-center justify-center gap-[0.55em] rounded-full bg-cobalt text-[clamp(10px,0.78vw,12px)] text-limestone shadow-[0_8px_18px_rgb(0_0_0/0.3)]"
          >
            <svg viewBox="0 0 8 16" aria-hidden="true" className="h-[1.1em] w-[0.55em]">
              <path d="M7 1L1 8l6 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {WORK.drag}
            <svg viewBox="0 0 8 16" aria-hidden="true" className="h-[1.1em] w-[0.55em]">
              <path d="M1 1l6 7-6 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  )
}
