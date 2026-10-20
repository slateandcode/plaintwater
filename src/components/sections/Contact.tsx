'use client'

import { useRef } from 'react'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { MQ, SCROLL_START, fadeUp, useNear } from '@/lib/motion'
import { CONTACT } from '@/lib/content'
import { SectionTag } from '@/components/ui/Pill'
import ArrowLink from '@/components/ui/ArrowLink'
import dynamic from 'next/dynamic'

/* The wizard (and zod with it) loads as its own chunk once the section is near. */
const QuoteWizard = dynamic(() => import('@/components/quote/QuoteWizard'), { ssr: false, loading: () => <CardPlaceholder /> })

function CardPlaceholder() {
  return <div aria-hidden="true" className="quote-card min-h-[540px] rounded-card bg-paper" />
}

/**
 * Contact (#contact, cobalt). Heading and contact details on the left, the
 * click-through quote card on the right. The footer follows in the same cobalt.
 */
export default function Contact() {
  const root = useRef<HTMLElement>(null)
  // Build this section's motion only when it is about to come into view
  const near = useNear(root)

  useGSAP(
    () => {
      if (!near) return
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()
      mm.add({ motion: MQ.motion }, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: SCROLL_START, once: true } })
        tl.add(fadeUp(q('[data-head]'), { y: 16, stagger: 0.08, duration: 0.8 }), 0)
        tl.add(fadeUp(q('[data-head-line]'), { y: 30, stagger: 0.15 }), 0.1)
        tl.add(fadeUp(q('[data-detail]'), { y: 20, stagger: 0.1 }), 0.55)

        // The card rises, then its header and first step settle in
        const card = q('[data-quote-card]')
        const k = () => (root.current!.offsetWidth / 2562) * 100
        tl.fromTo(card, { y: k }, { y: 0, duration: 1.2, ease: EASE.inOut }, 0.2)
        tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 1, ease: EASE.soft }, 0.2)
        tl.add(fadeUp(q('[data-quote-card] [data-quote-head], [data-quote-card] form'), { y: 16, stagger: 0.12, duration: 0.9 }), 0.55)
      })
    },
    { scope: root, dependencies: [near] },
  )

  return (
    <section ref={root} id="contact" data-theme="cobalt" aria-labelledby="contact-title" className="px-page pt-[var(--pad)]">
      <div className="flex items-center justify-between">
        <div data-head>
          <SectionTag>{CONTACT.tag}</SectionTag>
        </div>
        <div data-head>
          <ArrowLink href={CONTACT.link.href} external>
            {CONTACT.link.label}
          </ArrowLink>
        </div>
      </div>

      <div className="mt-[clamp(36px,4.5vw,84px)] grid gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-[4vw]">
        <div>
          <h2 id="contact-title" className="font-serif text-[clamp(48px,7.4vw,136px)] leading-[0.92] tracking-[-0.02em]">
            <span data-head-line className="block">
              {CONTACT.heading[0]}
            </span>
            <span data-head-line className="block">
              {CONTACT.heading[1]}
            </span>
            <span data-head-line className="block text-sandstone">
              {CONTACT.heading[2]}
            </span>
          </h2>
          <dl className="mt-[clamp(36px,4.7vw,90px)] flex flex-wrap gap-x-[clamp(32px,4.7vw,90px)] gap-y-6">
            {CONTACT.details.map((d) => (
              <div key={d.label} data-detail className="flex flex-col gap-[clamp(5px,0.47vw,8px)]">
                <dt className="mono text-limestone/78">{d.label}</dt>
                <dd className="text-[clamp(17px,1.56vw,26px)] leading-tight font-medium tracking-[-0.02em]">
                  {d.href ? (
                    <a href={d.href} className="link-draw">
                      {d.value}
                    </a>
                  ) : (
                    d.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div data-quote-card className="w-full lg:w-[clamp(420px,36vw,520px)]">
          {near ? <QuoteWizard /> : <CardPlaceholder />}
        </div>
      </div>
    </section>
  )
}
