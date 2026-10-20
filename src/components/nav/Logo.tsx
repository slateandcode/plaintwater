'use client'

import { useRef } from 'react'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'
import { LOGO_WAVE } from '@/lib/paths'

type Props = {
  className?: string
  /** Redraw the wave once on mount. The hero turns this off and runs it in its own timeline. */
  drawOnMount?: boolean
  /** Redraw the wave when the pointer enters the closest link. */
  drawOnHover?: boolean
}

/**
 * PLAINWATER in serif caps (EB Garamond, as drawn in Figma) with a thin wave of water cut through the letters:
 * the hero's trick at miniature scale. One SVG in the Figma group's own
 * coordinates (330 x 39), so text, eraser and jet can never drift apart.
 *
 * Colours come from the surrounding theme: letters use currentColor, the eraser
 * paints the section background (--bg) and the jet uses --jet.
 */
export default function Logo({ className = '', drawOnMount = true, drawOnHover = true }: Props) {
  const svg = useRef<SVGSVGElement>(null)

  const { contextSafe } = useGSAP(
    () => {
      if (!drawOnMount || prefersReducedMotion()) return
      draw()
    },
    { scope: svg },
  )

  const draw = contextSafe(() => {
    const strokes = svg.current?.querySelectorAll('[data-wave]')
    if (!strokes) return
    gsap.fromTo(strokes, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.8, ease: EASE.inOut, overwrite: true })
  })

  useGSAP(
    () => {
      if (!drawOnHover) return
      const host = svg.current?.closest('a, button') ?? svg.current?.parentElement
      if (!host) return
      const onEnter = () => {
        if (!prefersReducedMotion() && window.matchMedia('(hover: hover)').matches) draw()
      }
      host.addEventListener('pointerenter', onEnter)
      return () => host.removeEventListener('pointerenter', onEnter)
    },
    { scope: svg },
  )

  return (
    <svg
      ref={svg}
      className={`overflow-visible ${className}`}
      viewBox="0 0 330 39"
      role="img"
      aria-label="Plainwater"
      data-logo
    >
      <text
        x="20"
        y="35.6"
        fill="currentColor"
        style={{ fontFamily: 'var(--font-garamond)', fontSize: 46.756, letterSpacing: -0.4676 }}
        aria-hidden="true"
      >
        PLAINWATER
      </text>
      <g transform="translate(0 3.34)" fill="none" strokeLinecap="round" aria-hidden="true">
        <path data-wave d={LOGO_WAVE.d} stroke="var(--bg)" strokeWidth={LOGO_WAVE.eraser} />
        <path data-wave d={LOGO_WAVE.d} stroke="var(--jet)" strokeWidth={LOGO_WAVE.water} />
      </g>
    </svg>
  )
}
