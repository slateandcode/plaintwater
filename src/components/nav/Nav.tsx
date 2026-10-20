'use client'

import { useRef } from 'react'
import { gsap, ScrollTrigger, EASE, useGSAP } from '@/lib/gsap'
import { NAV } from '@/lib/content'
import { site } from '@/lib/site'
import Button from '@/components/ui/Button'
import { HomeLink, MenuButton, NavLinks, surveyClick } from './NavParts'
import MobileMenu from './MobileMenu'

/** Scroll distance before the compact bar takes over from the hero's own nav. */
const TAKEOVER = 120

/**
 * The compact fixed bar. At the top of the page the hero carries its own nav
 * (placed on the hero stage); past ~120px this bar takes over. It stays out of
 * the way while you scroll down and slides back on a deliberate scroll up.
 * Over cobalt and ink sections it swaps to its light variant.
 */
export default function Nav() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = root.current!
      gsap.set(el, { yPercent: -110 })
      el.inert = window.scrollY < TAKEOVER

      let hidden = true
      const setHidden = (h: boolean) => {
        if (h === hidden) return
        hidden = h
        el.toggleAttribute('data-hidden', h)
        gsap.to(el, { yPercent: h ? -110 : 0, duration: 0.5, ease: EASE.inOut, overwrite: 'auto' })
      }

      // Each change of direction starts a new run. A few px down hides the bar;
      // a deliberate ~40px up brings it back, so the drift at the end of a
      // trackpad flick does not.
      let runStart = 0
      let runDir = 0
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          if (site.get().menuOpen) return
          const y = self.scroll()
          // At the top the hero carries its own nav: keep the bar out of the tab order
          el.inert = y < TAKEOVER
          if (y < TAKEOVER) return setHidden(true)
          if (self.direction !== runDir) {
            runDir = self.direction
            runStart = y
          }
          const run = Math.abs(y - runStart)
          if (runDir === 1 && run > 6) setHidden(true)
          else if (runDir === -1 && run > 40) setHidden(false)
        },
      })

      // Theme follows whichever section sits under the bar's middle.
      const probe = () => `top ${el.offsetHeight / 2}px`
      const probeEnd = () => `bottom ${el.offsetHeight / 2}px`
      document.querySelectorAll<HTMLElement>('main [data-theme], body > footer[data-theme]').forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: probe,
          end: probeEnd,
          onToggle: (self) => {
            if (self.isActive) el.dataset.navTheme = section.dataset.theme
          },
        })
      })

      // Keyboard users tabbing into a hidden bar get it back.
      const onFocus = () => setHidden(false)
      el.addEventListener('focusin', onFocus)
      return () => el.removeEventListener('focusin', onFocus)
    },
    { scope: root },
  )

  return (
    <>
      <a className="skip-link" href="#main">
        {NAV.skip}
      </a>
      <header
        ref={root}
        data-nav
        data-nav-theme="light"
        data-hidden
        className="nav-bar fixed inset-x-0 top-0 z-50 h-[var(--nav-h)] border-b border-[var(--rule)]"
      >
        <div className="px-page grid h-full grid-cols-[1fr_auto] items-center lg:grid-cols-[1fr_auto_1fr]">
          <HomeLink className="h-[clamp(17px,1.3vw,22px)] w-auto justify-self-start [&_svg]:h-full [&_svg]:w-auto" />
          <nav aria-label="Main, compact" className="hidden lg:block">
            <NavLinks className="flex gap-[clamp(24px,2.5vw,40px)] text-button" />
          </nav>
          <div className="justify-self-end">
            {/* Wrapped: the Button's own inline-flex would beat a `hidden` class on it */}
            <div className="hidden lg:block">
              <Button href={NAV.cta.href} size="sm" variant="primary" className="nav-cta" onClick={surveyClick}>
                {NAV.cta.label}
              </Button>
            </div>
            <MenuButton className="lg:hidden" />
          </div>
        </div>
      </header>
      <MobileMenu />
    </>
  )
}
