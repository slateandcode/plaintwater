'use client'

import { Fragment, useRef } from 'react'
import Image from 'next/image'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { MQ, SCROLL_START, fontsReady, useNear } from '@/lib/motion'
import { ABOUT, type AboutToken } from '@/lib/content'
import { scrollToHash } from '@/lib/site'
import { SectionTag } from '@/components/ui/Pill'
import ArrowLink from '@/components/ui/ArrowLink'
import Logo from '@/components/nav/Logo'

type Seq = { kind: 'word'; text: string; accent?: boolean } | Exclude<AboutToken, { kind: 'text' }>

/** The statement in reading order: text broken into words, pills kept whole so they take their turn like words. */
const SEQ: Seq[] = ABOUT.statement.flatMap((t): Seq[] =>
  t.kind === 'text' ? t.text.split(' ').map((w) => ({ kind: 'word', text: w, accent: t.accent })) : [t],
)

const fmt = (n: number) => `${Math.round(n).toLocaleString('en-GB')}+`

// As Hartwell does it: the words are already there, pencilled in, and ink in one by one
const INK = '#ECE8E1'
const ACCENT = '#D8C6A3'
const FAINT_INK = 'rgba(236, 232, 225, 0.24)'
const FAINT_ACCENT = 'rgba(216, 198, 163, 0.28)'
const FAINT_MEDIA = 0.28

/**
 * About (#about, cobalt). Hartwell's About, as it runs on the live site: the
 * whole statement is already there, pencilled in, and inks in word by word as
 * you scroll past it (scrubbed, colour only, nothing moves). Pills take their
 * turn in the same flow; the stat counts up as it inks. When the reading is
 * done the monogram divider opens out from the centre.
 */
export default function About() {
  const root = useRef<HTMLElement>(null)
  // Build this section's motion only when it is about to come into view
  const near = useNear(root)

  useGSAP(
    (context) => {
      if (!near) return
      const el = root.current!
      let mm: gsap.MatchMedia | undefined
      let cancelled = false

      // Wait for the fonts so the words are measured in their real face.
      fontsReady().then(() => {
        if (cancelled) return
        context.add(() => {
          const q = gsap.utils.selector(el)
          const seq = q('[data-seq]') as HTMLElement[]
          const count = q('[data-count]')[0] as HTMLElement
          const lines = q('[data-divider-line]')
          const dots = q('[data-divider-dot]')
          const mono = q('[data-monogram]')

          mm = gsap.matchMedia()
          mm.add({ motion: MQ.motion }, () => {
            // Tag, kicker, logo and link arrive first
            const head = q('[data-head]')
            gsap
              .timeline({ scrollTrigger: { trigger: el, start: SCROLL_START, once: true } })
              .fromTo(head, { y: 16 }, { y: 0, duration: 0.8, stagger: 0.08, ease: EASE.inOut }, 0.1)
              .fromTo(head, { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.08, ease: EASE.soft }, 0.1)
              .fromTo(q('[data-head] [data-wave]'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.8, ease: EASE.inOut }, 0.4)

            // Divider: lines draw outward from the centre, dots and monogram settle
            const divider = gsap
              .timeline({ paused: true })
              .fromTo(lines, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: EASE.inOut }, 0)
              .fromTo(mono, { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1, ease: EASE.inOut }, 0.1)
              .fromTo(dots, { scale: 0 }, { scale: 1, duration: 0.6, ease: EASE.pop, stagger: 0.06 }, 0.35)

            // The ink: scrubbed to the statement passing through the viewport
            const counter = { v: 0 }
            count.textContent = fmt(0)
            const ink = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: q('[data-statement]')[0],
                start: 'top 82%',
                end: 'bottom 42%',
                scrub: 0.8,
                onLeave: () => void divider.timeScale(1).play(),
                onEnterBack: () => void divider.timeScale(1.6).reverse(),
              },
            })
            seq.forEach((node, i) => {
              const t = i * 0.12
              if (node.dataset.seq === 'word') {
                const accent = node.dataset.accent === 'true'
                ink.fromTo(node, { color: accent ? FAINT_ACCENT : FAINT_INK }, { color: accent ? ACCENT : INK, duration: 0.55 }, t)
              } else {
                ink.fromTo(node, { opacity: FAINT_MEDIA }, { opacity: 1, duration: 0.55 }, t)
                if (node.dataset.seq === 'stat') {
                  ink.to(counter, { v: 1800, duration: 0.9, onUpdate: () => void (count.textContent = fmt(counter.v)) }, t)
                }
              }
            })

            return () => {
              count.textContent = fmt(1800)
            }
          })
        })
      })

      return () => {
        cancelled = true
        mm?.revert()
      }
    },
    { scope: root, dependencies: [near] },
  )

  return (
    <section
      ref={root}
      id="about"
      data-theme="cobalt"
      aria-labelledby="about-title"
      className="px-page relative flex flex-col pt-[var(--pad)] pb-[clamp(56px,5.7vw,110px)] lg:min-h-[53.8vw]"
    >
      {/* Head: tag, kicker over the logo, link */}
      <div className="grid grid-cols-[1fr_auto] items-start gap-y-8 lg:grid-cols-[1fr_auto_1fr]">
        <div data-head className="col-start-1 row-start-1">
          <SectionTag>{ABOUT.tag}</SectionTag>
        </div>
        <div data-head className="col-span-2 col-start-1 row-start-2 flex flex-col items-center lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:pt-[0.3vw]">
          <h2 id="about-title" className="font-garamond text-[clamp(18px,1.6vw,30px)] leading-[0.84]">
            <span aria-hidden="true">{ABOUT.kicker}</span>
            <span className="sr-only">{ABOUT.title}</span>
          </h2>
          <div className="mt-[clamp(10px,0.9vw,16px)] w-[clamp(130px,12.9vw,240px)]">
            <Logo drawOnMount={false} className="h-auto w-full" />
          </div>
        </div>
        <div data-head className="col-start-2 row-start-1 justify-self-end lg:col-start-3 lg:pt-[0.55vw]">
          <ArrowLink href={ABOUT.link.href} onClick={(e) => scrollToHash(e, ABOUT.link.href)}>
            {ABOUT.link.label}
          </ArrowLink>
        </div>
      </div>

      {/* Statement */}
      <p
        data-statement
        className="mx-auto mt-[clamp(40px,6.4vw,120px)] max-w-[74vw] text-[clamp(26px,7.2vw,40px)] leading-[1.12] font-medium tracking-[-0.03em] max-lg:max-w-none lg:text-center lg:text-statement"
      >
        {SEQ.map((tok, i) => (
          <Fragment key={i}>
            <Token tok={tok} />
            {i < SEQ.length - 1 ? ' ' : ''}
          </Fragment>
        ))}
      </p>

      {/* Monogram divider */}
      <div aria-hidden="true" className="mt-auto flex items-center justify-center gap-[clamp(8px,0.78vw,14px)] pt-[clamp(56px,8vw,150px)]">
        <span data-divider-line className="block h-px w-[clamp(64px,15.6vw,300px)] origin-right bg-limestone/30" />
        <span data-divider-dot className="block size-[clamp(5px,0.47vw,9px)] rounded-full bg-sandstone" />
        <span
          data-monogram
          className="grid size-[clamp(54px,4.84vw,92px)] place-items-center rounded-full border border-limestone/45"
        >
          <span className="grid size-[85.5%] place-items-center rounded-full border border-limestone/20 font-garamond text-[clamp(19px,1.72vw,33px)] leading-none">
            {ABOUT.monogram}
          </span>
        </span>
        <span data-divider-dot className="block size-[clamp(5px,0.47vw,9px)] rounded-full bg-sandstone" />
        <span data-divider-line className="block h-px w-[clamp(64px,15.6vw,300px)] origin-left bg-limestone/30" />
      </div>
    </section>
  )
}

/** One token of the statement: a word, an image pill, the crew circle or the stat pill. */
function Token({ tok }: { tok: Seq }) {
  if (tok.kind === 'word') {
    return (
      <span data-seq="word" data-accent={tok.accent ? 'true' : undefined} className={`inline-block ${tok.accent ? 'text-sandstone' : ''}`}>
        {tok.text}
      </span>
    )
  }

  if (tok.kind === 'stat') {
    return (
      <span
        data-seq="stat"
        className="inline-flex translate-y-[-0.06em] items-center gap-[0.18em] rounded-full bg-limestone/16 py-[0.125em] pr-[0.36em] pl-[0.125em] align-middle"
      >
        <svg viewBox="0 0 62 62" aria-hidden="true" className="size-[0.705em] shrink-0">
          <circle cx="31" cy="31" r="31" fill="var(--color-limestone)" />
          <path d="M22 40L40 22M40 34.6V22H27.4" fill="none" stroke="var(--color-cobalt)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span aria-hidden="true" data-count className="min-w-[3.4em] text-[0.477em] leading-none tracking-normal">
          {fmt(tok.value)}
        </span>
        <span className="sr-only">{fmt(tok.value)}</span>
      </span>
    )
  }

  const round = tok.shape === 'round'
  return (
    <span
      data-seq={round ? 'crew' : 'pill'}
      aria-hidden="true"
      className={`relative inline-block translate-y-[-0.06em] overflow-hidden rounded-full align-middle ${round ? 'size-[0.955em]' : 'h-[0.955em] w-[2.27em]'}`}
      style={{ backgroundColor: tok.placeholder ?? 'var(--color-ghost-deep)' }}
    >
      {tok.src && <Image src={tok.src} alt="" fill sizes="(min-width: 1024px) 8vw, 20vw" className="object-cover object-[27%_30%]" />}
    </span>
  )
}
