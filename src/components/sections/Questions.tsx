'use client'

import { useId, useRef, useState } from 'react'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { MQ, SCROLL_START, fadeUp, useNear } from '@/lib/motion'
import { QUESTIONS } from '@/lib/content'
import { openQuote } from '@/lib/site'
import ArrowLink from '@/components/ui/ArrowLink'
import Button from '@/components/ui/Button'

const pad2 = (n: number) => String(n + 1).padStart(2, '0')

/**
 * Questions (#questions, light). The heading column stays put while the
 * accordion scrolls. One row open at a time; the first is open by default.
 * On entry the rows reveal one by one and then row 01 opens.
 */
export default function Questions() {
  const root = useRef<HTMLElement>(null)
  // Build this section's motion only when it is about to come into view
  const near = useNear(root)
  const [open, setOpen] = useState(0)
  const id = useId().replace(/:/g, '')
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  useGSAP(
    () => {
      if (!near) return
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()
      mm.add({ motion: MQ.motion }, () => {
        // Closed until the rows have arrived, then row 01 opens
        setOpen(-1)
        const rows = q('[data-faq-row]')
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: SCROLL_START, once: true } })
        tl.add(fadeUp(q('[data-head-line]'), { y: 30, stagger: 0.15 }), 0)
        tl.add(fadeUp(q('[data-head-aside]'), { y: 24, stagger: 0.1 }), 0.3)
        tl.fromTo(q('[data-faq-rule]'), { scaleX: 0 }, { scaleX: 1, duration: 1, stagger: 0.12, ease: EASE.inOut, transformOrigin: '0 50%' }, 0.2)
        tl.add(fadeUp(rows, { y: 30, stagger: 0.12 }), 0.25)
        tl.call(() => setOpen((o) => (o === -1 ? 0 : o)), [], 1.4)
        return () => setOpen(0)
      })
    },
    { scope: root, dependencies: [near] },
  )

  // Arrow keys move between the questions; Home and End jump to the ends
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = QUESTIONS.items.length
    const to = e.key === 'ArrowDown' ? (i + 1) % n : e.key === 'ArrowUp' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null
    if (to === null) return
    e.preventDefault()
    buttons.current[to]?.focus()
  }

  return (
    <section ref={root} id="questions" data-theme="light" aria-labelledby="questions-title" className="px-page pt-[var(--pad)] pb-[clamp(80px,8vw,150px)]">
      <div className="flex justify-end">
        <ArrowLink href={QUESTIONS.link.href} onClick={(e) => openQuote(e, 6)}>
          {QUESTIONS.link.label}
        </ArrowLink>
      </div>

      <div className="mt-[clamp(28px,2.5vw,48px)] grid gap-12 lg:grid-cols-[minmax(0,1fr)_49.6vw] lg:gap-[4vw]">
        {/* Left column, sticky on desktop */}
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+48px)] lg:self-start">
          <h2 id="questions-title" className="display">
            <span data-head-line className="block">
              {QUESTIONS.heading[0]}
            </span>
            <span data-head-line className="block text-cobalt">
              {QUESTIONS.heading[1]}
            </span>
          </h2>
          <p data-head-aside className="mt-[clamp(24px,3.2vw,60px)] max-w-[24vw] text-body-lg text-slate/80 max-lg:max-w-[36ch]">
            {QUESTIONS.intro}
          </p>
          <div data-head-aside className="mt-[clamp(20px,2.4vw,44px)]">
            <Button href={QUESTIONS.cta.href} arrow onClick={(e) => openQuote(e, 6)}>
              {QUESTIONS.cta.label}
            </Button>
          </div>
        </div>

        {/* Accordion */}
        <div style={{ ['--faq-num' as string]: 'clamp(44px, 4.3vw, 80px)' }}>
          {QUESTIONS.items.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} data-faq-row className="relative">
                <span data-faq-rule aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-slate/20" />
                <h3>
                  <button
                    ref={(el) => void (buttons.current[i] = el)}
                    type="button"
                    id={`${id}-q${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`${id}-a${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    onKeyDown={(e) => onKey(e, i)}
                    className="group/faq flex w-full items-center gap-4 py-[clamp(18px,1.9vw,30px)] text-left"
                  >
                    <span aria-hidden="true" className="mono -mr-4 w-[var(--faq-num)] shrink-0 text-muted">({pad2(i)})</span>
                    <span className="flex-1 text-question font-medium tracking-[-0.02em]">{item.q}</span>
                    <span
                      aria-hidden="true"
                      className={`relative grid size-[clamp(32px,2.8vw,40px)] shrink-0 place-items-center rounded-full border transition-colors duration-500 ease-pw-out ${
                        isOpen ? 'border-cobalt bg-cobalt text-limestone' : 'border-slate/25 text-slate group-hover/faq:border-slate/50'
                      }`}
                    >
                      <svg viewBox="0 0 20 20" className={`size-[42%] transition-transform duration-500 ease-pw-out ${isOpen ? 'rotate-45' : ''}`}>
                        <path d="M10 2v16M2 10h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                </h3>
                <div
                  id={`${id}-a${i}`}
                  role="region"
                  aria-labelledby={`${id}-q${i}`}
                  inert={!isOpen}
                  className={`faq-answer ${isOpen ? 'is-open' : ''}`}
                >
                  <div className="overflow-hidden">
                    <div className="faq-answer-inner pb-[clamp(22px,2.2vw,36px)] pl-[var(--faq-num)] pr-[clamp(40px,3.6vw,56px)]">
                      <p className="max-w-[35vw] text-body-lg text-slate/75 max-lg:max-w-none">{item.a}</p>
                      <p className="mono mt-[clamp(10px,0.94vw,14px)] text-cobalt">{item.tag}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <span data-faq-rule aria-hidden="true" className="block h-px bg-slate/20" />
        </div>
      </div>
    </section>
  )
}
