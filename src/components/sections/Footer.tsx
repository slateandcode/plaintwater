'use client'

import { useRef } from 'react'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { MQ, useNear } from '@/lib/motion'
import { FOOTER } from '@/lib/content'
import { scrollToHash } from '@/lib/site'
import Logo from '@/components/nav/Logo'

/**
 * Footer (cobalt, under the contact block). The page's closing shot: the
 * logo set huge across the content width, the jet entering off the left edge
 * and waving through the letters, the bookend to the hero.
 *
 * Figma draws it as the logo scaled 8.127x (380px caps, 76/24 strokes), so it
 * is the Logo itself: an SVG 104.7vw wide, shifted 2.3vw left so the jet
 * starts off screen and the letters land on the content edges.
 */
export default function Footer() {
  const root = useRef<HTMLElement>(null)
  // Build this section's motion only when it is about to come into view
  const near = useNear(root)

  useGSAP(
    () => {
      if (!near) return
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()
      mm.add({ motion: MQ.motion }, () => {
        const mark = q('[data-wordmark]')
        gsap
          .timeline({ scrollTrigger: { trigger: mark[0], start: 'top 85%', once: true } })
          .fromTo(mark, { y: () => (root.current!.offsetWidth / 2562) * 90 }, { y: 0, duration: 1.2, ease: EASE.inOut }, 0)
          .fromTo(mark, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, ease: EASE.soft }, 0)
          // The eraser and the water draw through the word together
          .fromTo(q('[data-wordmark] [data-wave]'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 2, ease: EASE.inOut }, 0.7)
          .add(fadeIn(q('[data-footer-row]')), 2.2)
      })
    },
    { scope: root, dependencies: [near] },
  )

  return (
    <footer ref={root} data-theme="cobalt" className="relative -mt-px overflow-hidden pt-[clamp(72px,8vw,150px)] pb-[max(24px,env(safe-area-inset-bottom))]">
      <div data-wordmark aria-hidden="true" className="ml-[-2.34vw] w-[104.68vw]">
        <Logo drawOnMount={false} drawOnHover={false} className="h-auto w-full" />
      </div>

      <div data-footer-row className="px-page mt-[clamp(40px,3.5vw,64px)]">
        <div className="h-px bg-limestone/25" />
        <ul className="mono flex flex-col gap-3 pt-[clamp(18px,1.95vw,36px)] text-limestone/78 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-8">
          {FOOTER.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
          <li>
            <a href={FOOTER.credit.href} target="_blank" rel="noopener noreferrer" className="link-draw">
              {FOOTER.credit.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
          <li>
            <a href="#top" onClick={(e) => scrollToHash(e, '#top')} className="link-draw">
              {FOOTER.top} <span aria-hidden="true">↑</span>
            </a>
          </li>
        </ul>
      </div>
    </footer>
  )
}

function fadeIn(t: Element[]) {
  return gsap.fromTo(t, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: EASE.soft })
}
