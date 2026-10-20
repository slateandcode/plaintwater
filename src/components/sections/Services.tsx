'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { MQ, fadeUp, useNear } from '@/lib/motion'
import { SERVICES, type Service } from '@/lib/content'

/**
 * Services (#services, light), built the way pxpush.com stacks its benefits:
 * full-width rows on the section's own background, a hairline at the top of
 * each, the number on the left, the title and copy in the middle, a photo on
 * the right. Each row is sticky one title strip lower than the last, so as you
 * scroll the next row slides up and covers the one before, leaving only its
 * strip showing, each in its own tone. Nothing scales or darkens. When the last row lands in its
 * slot, the whole stack scrolls on together.
 */
export default function Services() {
  const root = useRef<HTMLElement>(null)
  // Build this section's motion only when it is about to come into view
  const near = useNear(root)

  useGSAP(
    () => {
      if (!near) return
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()

      mm.add({ motion: MQ.motion }, () => {
        // Header: label, heading lines, intro
        gsap
          .timeline({ scrollTrigger: { trigger: q('[data-services-head]')[0], start: 'top 75%', once: true } })
          .add(fadeUp(q('[data-head-label]'), { y: 12, duration: 0.8 }), 0)
          .add(fadeUp(q('[data-head-line]'), { y: 30, stagger: 0.15 }), 0.05)
          .add(fadeUp(q('[data-intro-copy]'), { y: 24 }), 0.35)

        // Each row's hairline draws across as it arrives. The row itself stays fully
        // visible while it slides up over the one before, as on pxpush.
        q('[data-row]').forEach((row) => {
          gsap.fromTo(
            row.querySelector('[data-row-rule]'),
            { scaleX: 0 },
            { scaleX: 1, duration: 1.2, ease: EASE.inOut, transformOrigin: '0% 50%', scrollTrigger: { trigger: row, start: 'top 92%', once: true } },
          )
        })
      })

      // Phone rows size to their copy, so give them all the tallest row's height:
      // equal rows end on the same line when stuck, and the stack leaves as one.
      const stack = q('.services-stack')[0] as HTMLElement
      const bodies = q('.service-row-body') as HTMLElement[]
      const equalise = () => {
        stack.style.removeProperty('--row-h')
        if (window.matchMedia(MQ.desktop).matches) return
        const tallest = Math.max(...bodies.map((b) => b.offsetHeight))
        stack.style.setProperty('--row-h', `${tallest}px`)
      }
      equalise()
      let w = window.innerWidth
      const ro = new ResizeObserver(() => {
        if (window.innerWidth === w) return
        w = window.innerWidth
        equalise()
      })
      ro.observe(document.documentElement)

      // Hover (desktop pointers): the photo eases in a touch inside its frame
      const offs: (() => void)[] = []
      if (window.matchMedia('(hover: hover)').matches) {
        q('[data-row]').forEach((row) => {
          const img = row.querySelector('[data-row-img]')
          if (!img) return
          const enter = () => gsap.to(img, { scale: 1.04, duration: 1.2, ease: EASE.out, overwrite: 'auto' })
          const leave = () => gsap.to(img, { scale: 1, duration: 1.2, ease: EASE.out, overwrite: 'auto' })
          row.addEventListener('pointerenter', enter)
          row.addEventListener('pointerleave', leave)
          offs.push(() => {
            row.removeEventListener('pointerenter', enter)
            row.removeEventListener('pointerleave', leave)
          })
        })
      }
      return () => {
        offs.forEach((o) => o())
        ro.disconnect()
      }
    },
    { scope: root, dependencies: [near] },
  )

  return (
    <section ref={root} id="services" data-theme="light" aria-labelledby="services-title" className="pt-[clamp(80px,9vw,170px)]">
      {/* Header row, on the same columns as the rows below */}
      <div data-services-head className="services-grid px-page pb-[clamp(40px,5vw,96px)] max-lg:flex max-lg:flex-col max-lg:gap-6">
        <p data-head-label className="mono flex items-center gap-3 self-start pt-[0.6em] text-muted">
          <span aria-hidden="true" className="size-[7px] rounded-full bg-slate" />
          {SERVICES.label}
        </p>
        <h2 id="services-title" className="display">
          <span data-head-line className="block">
            {SERVICES.heading[0]}
          </span>
          <span data-head-line className="block">
            {SERVICES.heading[1]}
          </span>
        </h2>
        <p data-intro-copy className="self-end text-body text-slate/80 max-lg:max-w-[40ch] lg:pb-[0.5em]">
          {SERVICES.intro}
        </p>
      </div>

      <ol className="services-stack">
        {SERVICES.items.map((s, i) => (
          <ServiceRow key={s.num} s={s} i={i} />
        ))}
        {/* A short hold inside the list, so the last row lands before the stack moves on */}
        <li aria-hidden="true" className="services-hold" />
      </ol>
    </section>
  )
}

/*
  Each row carries its own tone, so the strips left showing in the stack read
  as a set of different cards. Dark tones flip the type to limestone; quiet
  text sits at 75% so it keeps its contrast on every tone.
*/
const TONE: Record<Service['theme'], { bg: string; fg: string; soft: string; dim: string; line: string; dot: string }> = {
  stone: { bg: 'bg-stone', fg: 'text-slate', soft: 'text-slate/85', dim: 'text-slate/75', line: 'bg-slate/15', dot: 'bg-slate/60' },
  paper: { bg: 'bg-paper', fg: 'text-slate', soft: 'text-slate/85', dim: 'text-slate/75', line: 'bg-slate/15', dot: 'bg-slate/60' },
  slate: { bg: 'bg-slate', fg: 'text-limestone', soft: 'text-limestone/85', dim: 'text-limestone/75', line: 'bg-limestone/20', dot: 'bg-limestone/60' },
  cobalt: { bg: 'bg-cobalt', fg: 'text-limestone', soft: 'text-limestone/90', dim: 'text-limestone/80', line: 'bg-limestone/25', dot: 'bg-limestone/70' },
  sand: { bg: 'bg-sand', fg: 'text-slate', soft: 'text-slate/85', dim: 'text-slate/75', line: 'bg-slate/15', dot: 'bg-slate/60' },
}

function ServiceRow({ s, i }: { s: Service; i: number }) {
  const t = TONE[s.theme]
  return (
    <li data-row className="service-row" style={{ ['--i' as string]: i }}>
      <article aria-labelledby={`service-${s.num}`} className={`service-row-body relative ${t.bg} ${t.fg}`}>
        <span data-row-rule aria-hidden="true" className={`absolute inset-x-0 top-0 h-px ${t.line}`} />
        <div className="services-grid px-page h-full">
          {/* Left: the number */}
          <p className={`mono row-strip flex items-start gap-3 ${t.dim}`}>
            <span aria-hidden="true" className={`mt-[0.4em] size-[7px] shrink-0 rounded-full ${t.dot}`} />
            <span>({s.num})</span>
          </p>

          {/* Middle: title in the strip, copy below */}
          <div className="flex min-w-0 flex-col justify-between gap-6">
            <div className="row-strip">
              <h3 id={`service-${s.num}`} className="service-title">
                {s.title}
              </h3>
            </div>
            <div className="flex flex-col gap-5 lg:max-w-[34vw]">
              <p className={`text-body-lg ${t.soft}`}>{s.description}</p>
              <ul>
                {s.included.map((line) => (
                  <li key={line} className="mono relative py-[clamp(8px,0.8vw,12px)]">
                    <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-px ${t.line}`} />
                    {line}
                  </li>
                ))}
              </ul>
              <p className={`mono ${t.dim}`}>{s.tags.join(' · ')}</p>
            </div>
          </div>

          {/* Right: the photo */}
          <div className="service-photo relative overflow-hidden rounded-[4px] bg-ghost">
            {s.image && (
              <div data-row-img className="absolute inset-0">
                <Image src={s.image} alt={s.imageAlt} fill sizes="(min-width: 1024px) 22vw, 92vw" className="object-cover" />
              </div>
            )}
          </div>
        </div>
      </article>
    </li>
  )
}
