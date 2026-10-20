'use client'

import { useRef, useState } from 'react'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { fontsReady } from '@/lib/motion'
import { PRELOADER } from '@/lib/content'
import { LOGO_WAVE } from '@/lib/paths'
import { releaseHero } from '@/lib/intro'
import { site } from '@/lib/site'

const MIN = 1.6 // seconds: never faster than this, so it never flashes
const MAX = 3 // seconds: never slower, whatever is still loading
const SEEN_KEY = 'pw-intro-seen'

/* Rendered stroke widths in px; converted to the SVG's user units on mount and resize. */
const WATER_PX = 2.5
const ERASER_PX = 8

/**
 * The first rinse. The wordmark is set twice in the logo's own geometry: slate
 * underneath, a dirty olive-brown copy on top. A thin cobalt jet draws the
 * logo's wave across it while the counter runs on real loading (fonts and the
 * hero's images), and the dirty copy is clipped away right behind the jet's
 * head, so the word is literally washed clean and ends as the logo.
 *
 * At 100 it holds, the content lifts out, the panel lifts away, and the hero
 * timeline is released half way through the lift. Repeat visits in the same
 * session get a short limestone fade instead; reduced motion gets nothing.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(false)

  useGSAP(
    () => {
      const html = document.documentElement
      const mode = html.classList.contains('intro-pending') ? 'full' : html.classList.contains('intro-repeat') ? 'repeat' : 'none'

      const finish = () => {
        try {
          sessionStorage.setItem(SEEN_KEY, '1')
        } catch {}
        html.classList.remove('intro-pending', 'intro-repeat')
        site.get().lenis?.start()
        site.set({ introDone: true })
        setDone(true)
      }

      if (mode === 'none') {
        releaseHero()
        finish()
        return
      }

      const panel = root.current!

      if (mode === 'repeat') {
        releaseHero()
        gsap.to(panel, { autoAlpha: 0, duration: 0.35, ease: EASE.soft, onComplete: finish })
        return
      }

      // ---- First visit: the full rinse ----
      const svg = panel.querySelector<SVGSVGElement>('[data-mark]')!
      const water = panel.querySelector<SVGPathElement>('[data-water]')!
      const strokes = panel.querySelectorAll<SVGPathElement>('[data-stroke]')
      const clip = panel.querySelector<SVGRectElement>('[data-clip]')!
      const counter = panel.querySelector<HTMLElement>('[data-count]')!
      const content = panel.querySelectorAll('[data-pl-content]')
      const total = water.getTotalLength()
      const ease = gsap.parseEase(EASE.inOut)

      const sizeStrokes = () => {
        const scale = svg.getBoundingClientRect().width / 330
        strokes.forEach((p) => p.setAttribute('stroke-width', String((p.dataset.stroke === 'water' ? WATER_PX : ERASER_PX) / scale)))
      }
      sizeStrokes()
      window.addEventListener('resize', sizeStrokes)

      // Real loading: the fonts plus every image in the hero
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('#hero img'))
      const tasks = imgs.length + 1
      let loaded = 0
      const tick1 = () => void loaded++
      fontsReady().then(tick1)
      imgs.forEach((img) => {
        if (img.complete && img.naturalWidth) return tick1()
        img.addEventListener('load', tick1, { once: true })
        img.addEventListener('error', tick1, { once: true })
      })

      const t0 = performance.now()
      let shown = 0
      let finished = false

      const render = () => {
        const head = ease(shown) * total
        gsap.set(strokes, { drawSVG: `0 ${head}` })
        const x = head > 0 ? water.getPointAtLength(head).x : 0
        clip.setAttribute('x', String(x))
        clip.setAttribute('width', String(Math.max(0, 340 - x)))
        counter.textContent = String(Math.round(shown * 100)).padStart(2, '0')
      }

      const update = () => {
        const t = (performance.now() - t0) / 1000
        const real = loaded / tasks
        // The time floor keeps it from finishing before MIN; the ceiling forces it home by MAX.
        const target = Math.min(1, Math.max(Math.min(real, t / MIN), t / MAX))
        shown += (target - shown) * 0.14
        if (target === 1 && shown > 0.995) shown = 1
        render()
        if (shown === 1 && !finished) {
          finished = true
          gsap.ticker.remove(update)
          exit()
        }
      }

      const exit = () => {
        gsap
          .timeline({ delay: 0.25, onComplete: finish })
          .to(content, { y: -20, duration: 0.5, ease: EASE.inOut }, 0)
          .to(content, { autoAlpha: 0, duration: 0.5, ease: EASE.soft }, 0)
          .fromTo(panel, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: EASE.inOut }, 0.3)
          // The hero starts when the lift is about half done, so there is no dead frame.
          .call(releaseHero, [], 0.75)
      }

      render()
      gsap.ticker.add(update)

      return () => {
        gsap.ticker.remove(update)
        window.removeEventListener('resize', sizeStrokes)
      }
    },
    { scope: root },
  )

  if (done) return null

  return (
    <div
      ref={root}
      data-preloader
      aria-hidden="true"
      data-theme="light"
      className="fixed inset-0 z-[100] items-center justify-center"
    >
      <div data-preloader-content className="relative flex flex-col items-center">
        <svg
          data-mark
          data-pl-content
          viewBox="0 0 330 39"
          className="h-auto overflow-visible"
          style={{ width: 'calc(clamp(44px, 9vw, 140px) * 330 / 46.756)' }}
        >
          <defs>
            <clipPath id="pl-dirt-clip">
              <rect data-clip x="0" y="-20" width="340" height="80" />
            </clipPath>
          </defs>
          <Word fill="var(--color-slate)" />
          <g clipPath="url(#pl-dirt-clip)">
            <Word fill="var(--color-dirt)" />
          </g>
          <g transform="translate(0 3.34)" fill="none" strokeLinecap="round">
            <path data-stroke="eraser" d={LOGO_WAVE.d} stroke="var(--color-limestone)" strokeWidth="2" style={{ strokeDasharray: '0 999' }} />
            <path data-stroke="water" data-water d={LOGO_WAVE.d} stroke="var(--color-cobalt)" strokeWidth="1" style={{ strokeDasharray: '0 999' }} />
          </g>
        </svg>
        <p data-pl-content className="mono mt-[clamp(18px,2.2vw,32px)] text-muted">
          {PRELOADER.line}
        </p>
      </div>

      <p
        data-preloader-content
        className="mono absolute right-[var(--pad)] bottom-[max(24px,env(safe-area-inset-bottom))] text-slate tabular-nums"
      >
        <span data-pl-content data-count className="inline-block min-w-[3ch] text-right">
          00
        </span>
      </p>
    </div>
  )
}

/** The wordmark text, in the logo's coordinates (Figma group 330 x 39). */
function Word({ fill }: { fill: string }) {
  return (
    <text
      x="20"
      y="35.6"
      fill={fill}
      style={{ fontFamily: 'var(--font-garamond)', fontSize: 46.756, letterSpacing: -0.4676 }}
    >
      {PRELOADER.wordmark.toUpperCase()}
    </text>
  )
}
