'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { fontsReady, prefersReducedMotion } from '@/lib/motion'
import { site } from '@/lib/site'

/**
 * Lenis drives the document scroll and is stepped by GSAP's ticker, so
 * ScrollTrigger and every tween share one clock. Native touch scrolling on
 * phones; no smoothing at all under reduced motion.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    const setVw = () => root.style.setProperty('--vw', `${root.clientWidth}px`)
    setVw()

    const reduce = prefersReducedMotion()
    const lenis = new Lenis({
      lerp: reduce ? 1 : 0.1,
      smoothWheel: !reduce,
      syncTouch: false,
      autoRaf: false,
    })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    site.set({ lenis })

    if (root.classList.contains('intro-pending') || root.classList.contains('intro-repeat')) {
      window.scrollTo(0, 0)
      lenis.scrollTo(0, { immediate: true, force: true })
      lenis.stop()
    }

    // Sections build their ScrollTriggers once fonts are in. Child effects run
    // first, so this refresh lands after all of them. Images settling late
    // (lazy below-the-fold ones) get one more refresh on window load.
    let cancelled = false
    const refresh = () =>
      requestAnimationFrame(() => {
        if (cancelled) return
        ScrollTrigger.sort()
        ScrollTrigger.refresh()
      })
    fontsReady().then(refresh)
    if (document.readyState === 'complete') refresh()
    else window.addEventListener('load', refresh, { once: true })

    // Synchronous on purpose: gsap.matchMedia callbacks measure layout right
    // after the resize event, so the unit has to be current by then.
    window.addEventListener('resize', setVw)

    return () => {
      cancelled = true
      window.removeEventListener('resize', setVw)
      window.removeEventListener('load', refresh)
      gsap.ticker.remove(tick)
      lenis.destroy()
      site.set({ lenis: null })
    }
  }, [])

  return <>{children}</>
}
