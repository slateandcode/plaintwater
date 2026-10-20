'use client'

import { useSyncExternalStore } from 'react'
import type Lenis from 'lenis'
import { gsap } from './gsap'

/*
  A tiny shared store: the Lenis instance, the intro state and requests to open
  the quote wizard at a given step. Plain module state plus a subscribe, so no
  extra dependency.
*/

type QuoteRequest = { step: number; nonce: number }

type State = {
  lenis: Lenis | null
  /** True once the preloader has handed over to the page. */
  introDone: boolean
  quoteRequest: QuoteRequest | null
  /** The full-screen mobile menu. */
  menuOpen: boolean
}

const initial: State = { lenis: null, introDone: false, quoteRequest: null, menuOpen: false }
let state: State = initial
const listeners = new Set<() => void>()

export const site = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => void listeners.delete(l)
  },
}

export function useSite<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    site.subscribe,
    () => select(state),
    () => select(initial),
  )
}

/** Smooth-scroll to an in-page anchor through Lenis on the house ease (native fallback). */
export function scrollToHash(e: React.MouseEvent | null, hash: string, { offset = 0 } = {}) {
  const target = hash === '#top' ? document.body : document.querySelector<HTMLElement>(hash)
  if (!target) return
  e?.preventDefault()
  const lenis = state.lenis
  const ease = gsap.parseEase('pw.inOut')
  if (lenis) {
    lenis.scrollTo(hash === '#top' ? 0 : target, { offset, duration: 1.4, easing: (t: number) => ease(t) })
  } else {
    target.scrollIntoView({ behavior: 'smooth' })
  }
  if (hash !== '#top') {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
    history.replaceState(null, '', hash)
  }
}

/**
 * Scroll to the contact section and open the quote wizard. Step 1 by default;
 * the FAQ's "Send us a photo" asks for the contact/photo step.
 */
export function openQuote(e: React.MouseEvent | null, step = 1) {
  e?.preventDefault()
  site.set({ quoteRequest: { step, nonce: Date.now() } })
  scrollToHash(null, '#contact')
}
