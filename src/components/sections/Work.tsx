'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { MQ, SCROLL_START, fadeUp, prefersReducedMotion, useNear } from '@/lib/motion'
import { WORK } from '@/lib/content'
import ArrowLink from '@/components/ui/ArrowLink'
import BeforeAfter from '@/components/ui/BeforeAfter'

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * Our work (#work, dark ink). The heading, then the before/after frame that
 * washes itself once on entry, then the job's details and a switcher.
 */
export default function Work() {
  const root = useRef<HTMLElement>(null)
  // Build this section's motion only when it is about to come into view
  const near = useNear(root)
  const [active, setActive] = useState(0)
  const busy = useRef(false)
  const job = WORK.jobs[active]

  useGSAP(
    () => {
      if (!near) return
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()
      mm.add({ motion: MQ.motion }, () => {
        const head = gsap.timeline({ scrollTrigger: { trigger: q('[data-work-head]')[0], start: SCROLL_START, once: true } })
        // The hero's entrance: the heading grows from nothing to full size, slow, fast, slow
        head.fromTo(q('#work-title'), { scale: 0 }, { scale: 1, duration: 1.6, ease: EASE.inOut, transformOrigin: '0% 50%' }, 0)
        head.add(fadeUp(q('[data-head-aside]'), { y: 24 }), 0.7)
        gsap
          .timeline({ scrollTrigger: { trigger: q('[data-work-meta]')[0], start: 'top 92%', once: true } })
          .add(fadeUp(q('[data-work-meta] > *'), { y: 20, stagger: 0.08 }))
      })
    },
    { scope: root, dependencies: [near] },
  )

  const { contextSafe } = useGSAP({ scope: root })

  /** Meta values fade out, the job changes, they fade back in (0.6s in all). */
  const choose = contextSafe((i: number) => {
    if (i === active || busy.current) return
    const values = root.current!.querySelectorAll('[data-meta-value]')
    if (prefersReducedMotion()) return setActive(i)
    busy.current = true
    gsap.to(values, {
      autoAlpha: 0,
      y: -6,
      duration: 0.25,
      ease: EASE.soft,
      onComplete: () => {
        setActive(i)
        requestAnimationFrame(() => {
          gsap.fromTo(
            root.current!.querySelectorAll('[data-meta-value]'),
            { autoAlpha: 0, y: 6 },
            { autoAlpha: 1, y: 0, duration: 0.35, ease: EASE.soft, onComplete: () => void (busy.current = false) },
          )
        })
      },
    })
  })

  return (
    <section ref={root} id="work" data-theme="dark" aria-labelledby="work-title" className="px-page pt-[var(--pad)] pb-[clamp(64px,6vw,120px)]">
      <div className="flex justify-end">
        <ArrowLink href={WORK.link.href}>{WORK.link.label}</ArrowLink>
      </div>

      <div data-work-head className="mt-[clamp(28px,3.9vw,72px)] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <h2 id="work-title" className="display">
          <span data-head-line className="block">
            {WORK.heading[0]}
          </span>
          <span data-head-line className="block text-sandstone">
            {WORK.heading[1]}
          </span>
        </h2>
        <p data-head-aside className="max-w-[36ch] text-body-lg font-medium text-limestone/72 lg:mb-[0.4em] lg:max-w-[25vw] lg:text-[clamp(15px,1.33vw,24px)] lg:leading-[1.4]">
          {WORK.intro}
        </p>
      </div>

      <BeforeAfter jobs={WORK.jobs} active={active} className="-mx-[var(--pad)] mt-[clamp(36px,4.8vw,90px)] lg:mx-0" />

      <div data-work-meta className="mt-[clamp(24px,2.5vw,48px)] flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 lg:flex lg:gap-[clamp(28px,3.4vw,64px)]">
          {job.meta.map((m) => (
            <div key={m.label} className="flex flex-col gap-[clamp(5px,0.47vw,8px)]">
              <dt className="mono text-limestone/62">{m.label}</dt>
              <dd data-meta-value className="text-[clamp(15px,1.33vw,24px)] leading-tight font-medium tracking-[-0.01em]">
                {m.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex items-center gap-[clamp(8px,0.62vw,12px)]">
          <p className="mono mr-[clamp(8px,0.62vw,12px)] whitespace-nowrap text-limestone/60" aria-live="polite">
            <span className="sr-only">{WORK.jobLabel} </span>
            {pad2(active + 1)} / {pad2(WORK.jobs.length)}
          </p>
          <ul className="flex gap-[clamp(6px,0.62vw,12px)]">
            {WORK.jobs.map((j, i) => (
              <li key={j.id}>
                <button
                  type="button"
                  aria-label={WORK.showJob(j.id, j.name)}
                  aria-pressed={i === active}
                  onClick={() => choose(i)}
                  className={`relative block h-[clamp(40px,3.6vw,52px)] w-[clamp(56px,5vw,72px)] overflow-hidden rounded-[4px] transition-opacity duration-500 ease-pw-out ${
                    i === active ? 'opacity-100' : 'opacity-45 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: j.placeholder.before }}
                >
                  {j.thumb && <Image src={j.thumb} alt="" fill sizes="72px" className="object-cover" />}
                  {i === active && <span aria-hidden="true" className="absolute inset-0 rounded-[4px] ring-3 ring-cobalt ring-inset" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
