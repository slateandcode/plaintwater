'use client'

import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'
import { gsap, EASE } from './gsap'

/* Shared durations, the fade-up reveal and the reduced-motion helpers. */

export const DUR = {
  /** Fade-up reveals run between 0.9 and 1.2s. */
  reveal: 1.05,
  stagger: 0.1,
  hover: 0.4,
  ui: 0.3,
} as const

export const SCROLL_START = 'top 75%'

const REDUCE = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(REDUCE).matches
}

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(REDUCE)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

/** Live `prefers-reduced-motion` value. False during SSR. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}

export const MQ = {
  desktop: '(min-width: 1024px)',
  mobile: '(max-width: 1023px)',
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: REDUCE,
} as const

/**
 * The house reveal: opacity 0 and a small rise, to rest. y travels on pw.inOut,
 * opacity on pw.soft so the fade does not run ahead of the move.
 */
export function fadeUp(
  targets: gsap.TweenTarget,
  { y = 40, duration = DUR.reveal, stagger = DUR.stagger }: { y?: number | string; duration?: number; stagger?: number } = {},
) {
  const tl = gsap.timeline()
  tl.fromTo(targets, { y }, { y: 0, duration, stagger, ease: EASE.inOut }, 0)
  // Opacity, not autoAlpha: content waiting to be revealed stays focusable, and focusing it scrolls it into view.
  tl.fromTo(targets, { opacity: 0 }, { opacity: 1, duration, stagger, ease: EASE.soft }, 0)
  return tl
}

/**
 * True once `ref` comes within `margin` of the viewport. Sections below the
 * fold build their timelines and ScrollTriggers only then, which keeps that
 * work off the main thread while the page loads.
 */
export function useNear(ref: RefObject<Element | null>, margin = '150% 0px') {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (near || !el) return
    if (!('IntersectionObserver' in window)) return setNear(true)
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near, ref, margin])
  return near
}

let fontsPromise: Promise<void> | null = null

/** Resolves once the web fonts are in. Anything that splits or measures text waits on this. */
export function fontsReady(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  if (!fontsPromise) fontsPromise = document.fonts.ready.then(() => undefined)
  return fontsPromise
}
