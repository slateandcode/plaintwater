'use client'

import { useEffect, useRef } from 'react'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'
import { CONTACT, NAV, SITE } from '@/lib/content'
import { openQuote, scrollToHash, site, useSite } from '@/lib/site'
import Logo from './Logo'

/**
 * Full-screen cobalt menu (below 1024px). Links in large serif fade up with a
 * stagger; contact details sit at the bottom in mono. Scroll is locked and
 * Lenis stopped while it is open.
 */
export default function MobileMenu() {
  const root = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const open = useSite((s) => s.menuOpen)
  const shown = useRef(false)

  const tl = useRef<gsap.core.Timeline | null>(null)
  const { contextSafe } = useGSAP({ scope: root })

  const animate = contextSafe((next: boolean) => {
    const el = root.current!
    const items = el.querySelectorAll('[data-menu-item]')
    const reduce = prefersReducedMotion()
    const lenis = site.get().lenis
    tl.current?.kill()
    if (next) {
      lenis?.stop()
      document.documentElement.style.overflow = 'hidden'
      // Visible straight away so focus can land on the close button.
      gsap.set(el, { autoAlpha: 1 })
      if (reduce) {
        gsap.set(el, { clipPath: 'inset(0 0 0% 0)' })
        gsap.set(items, { autoAlpha: 1, y: 0 })
      } else {
        tl.current = gsap
          .timeline()
          .fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: EASE.inOut })
          .fromTo(items, { y: 40 }, { y: 0, duration: 0.9, stagger: 0.07, ease: EASE.inOut }, 0.35)
          .fromTo(items, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, stagger: 0.07, ease: EASE.soft }, 0.35)
      }
      closeBtn.current?.focus()
    } else {
      lenis?.start()
      document.documentElement.style.overflow = ''
      if (reduce) {
        gsap.set(el, { autoAlpha: 0 })
      } else {
        tl.current = gsap
          .timeline()
          .to(items, { autoAlpha: 0, y: -16, duration: 0.35, stagger: 0.03, ease: EASE.soft })
          .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: EASE.inOut }, 0.15)
          .set(el, { autoAlpha: 0 })
      }
    }
  })

  useEffect(() => {
    if (open === shown.current) return
    shown.current = open
    animate(open)
    if (!open) document.querySelector<HTMLElement>('[data-menu-button]:not([hidden])')?.focus({ preventScroll: true })
  }, [open, animate])

  // Escape closes; the menu closes itself if the viewport grows past the breakpoint.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && site.set({ menuOpen: false })
    const mq = window.matchMedia('(min-width: 1024px)')
    const onMq = () => mq.matches && site.set({ menuOpen: false })
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)
    return () => {
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
    }
  }, [open])

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    site.set({ menuOpen: false })
    setTimeout(() => (href === NAV.cta.href ? openQuote(null, 1) : scrollToHash(null, href)), 500)
  }

  return (
    <div
      ref={root}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      data-theme="cobalt"
      inert={!open}
      className="invisible fixed inset-0 z-[60] flex flex-col lg:hidden"
      style={{ clipPath: 'inset(0 0 100% 0)' }}
    >
      <div className="px-page flex h-[var(--nav-h)] items-center justify-between">
        <a href="#top" aria-label={NAV.home} onClick={(e) => go(e, '#top')} className="block h-[17px] [&_svg]:h-full [&_svg]:w-auto">
          <Logo drawOnMount={false} drawOnHover={false} />
        </a>
        <button
          ref={closeBtn}
          type="button"
          onClick={() => site.set({ menuOpen: false })}
          className="mono inline-flex h-10 items-center gap-2 rounded-full bg-[var(--tag-fill)] px-4 active:scale-[0.97]"
        >
          <span aria-hidden="true" className="relative block size-3">
            <span className="absolute top-1/2 left-0 block h-px w-full rotate-45 bg-current" />
            <span className="absolute top-1/2 left-0 block h-px w-full -rotate-45 bg-current" />
          </span>
          {NAV.close}
        </button>
      </div>

      <nav aria-label="Menu" className="px-page flex flex-1 flex-col justify-center">
        <ul className="flex flex-col gap-[0.12em] font-serif text-[clamp(44px,12vw,72px)] leading-[1.05]">
          {[...NAV.links, NAV.cta].map((l) => (
            <li key={l.href + l.label} data-menu-item>
              <a href={l.href} onClick={(e) => go(e, l.href)} className="inline-block">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div data-menu-item className="px-page mono flex flex-col gap-1.5 pb-[max(28px,env(safe-area-inset-bottom))] opacity-80">
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        <p>{CONTACT.details[1].value}</p>
      </div>
    </div>
  )
}
