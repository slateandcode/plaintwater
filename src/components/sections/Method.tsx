'use client'

import { useRef } from 'react'
import { gsap, ScrollTrigger, SplitText, EASE, useGSAP } from '@/lib/gsap'
import { MQ, SCROLL_START, fadeUp, fontsReady, useNear } from '@/lib/motion'
import { METHOD } from '@/lib/content'
import { DROPLETS_CENTRE, HERO_DROPLETS, METHOD_GEO as G, METHOD_ROUTE } from '@/lib/paths'
import { openQuote } from '@/lib/site'
import { u } from '@/lib/stage'
import ArrowLink from '@/components/ui/ArrowLink'
import Button from '@/components/ui/Button'
import StepIcon from '@/components/ui/StepIcon'

type Pt = { x: number; y: number }

/** Where along the path (0..1) each point sits: the nearest sampled point. */
function fractions(path: SVGPathElement, points: Pt[], samples = 700) {
  const total = path.getTotalLength()
  const pts = Array.from({ length: samples + 1 }, (_, i) => path.getPointAtLength((i / samples) * total))
  return points.map((c) => {
    let best = 0
    let bestD = Infinity
    pts.forEach((p, i) => {
      const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    return best / samples
  })
}

const D = 10 // timeline length; positions along it are fractions of the route

type RouteParts = {
  path: SVGPathElement
  /** Per step: the node (scaled) and its lit layer (faded in). */
  nodes: { node: Element; on: Element }[]
  steps: HTMLElement[]
  sprays: Element[]
  endOn: Element | null
  tip: SVGGElement
  tipScale: number
  nodeAt: number[]
  sprayAt: number[]
  /** Node radius in path units: a node lights as the head touches its edge, not its centre. */
  nodeRadius: number
  splits: SplitText[]
}

/**
 * The Hartwell process model: one timeline, scrubbed to scroll, that draws the
 * jet and, at each node's place along it, dips the node, lights it and pops it,
 * then raises that step (chip, title words from their masks, icon, body lines).
 * Everything is locked to the head of the jet, so nothing lags behind it and
 * scrolling back unwinds it exactly.
 */
function routeTimeline(o: RouteParts) {
  const total = o.path.getTotalLength()
  const touch = (o.nodeRadius / total) * D
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })

  tl.fromTo(o.path, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: D }, 0)
  const head = { p: 0 }
  tl.fromTo(
    head,
    { p: 0 },
    {
      p: 1,
      duration: D,
      onUpdate: () => {
        const pt = o.path.getPointAtLength(head.p * total)
        o.tip.setAttribute('transform', `translate(${pt.x} ${pt.y}) scale(${o.tipScale})`)
        o.tip.style.opacity = head.p > 0.001 && head.p < 0.999 ? '1' : '0'
      },
    },
    0,
  )

  gsap.set(o.nodes.map((n) => n.on), { opacity: 0 })
  o.nodes.forEach(({ node, on }, i) => {
    const t = o.nodeAt[i] * D
    const at = Math.max(0, t - touch)
    tl.to(node, { scale: 0.7, duration: 0.14, ease: 'power2.in', transformOrigin: '50% 50%' }, Math.max(0, at - 0.14))
    tl.to(on, { opacity: 1, duration: 0.12 }, at)
    tl.to(node, { scale: 1, duration: 0.6, ease: 'back.out(3.2)' }, at + 0.02)

    const step = o.steps[i]
    const pill = step.querySelector('[data-step-pill]')
    const words = step.querySelectorAll('[data-word]')
    const icon = step.querySelector('[data-step-icon]')
    const body = step.querySelector<HTMLElement>('[data-step-body]')
    const cta = step.querySelector('[data-step-cta]')
    tl.fromTo(pill, { autoAlpha: 0, rotation: -8, scale: 0.8 }, { autoAlpha: 1, rotation: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' }, at + 0.08)
    tl.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 0.55, stagger: 0.1, ease: EASE.out }, at + 0.14)
    if (icon) tl.fromTo(icon, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.6)', transformOrigin: '50% 60%' }, at + 0.36)
    if (body) {
      const split = SplitText.create(body, { type: 'lines', linesClass: 'split-line' })
      o.splits.push(split)
      // Opacity, not autoAlpha: the text stays readable to assistive tech and keyboard users
      tl.fromTo(split.lines, { y: '0.9em', opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: EASE.out }, at + 0.32)
    }
    if (cta) tl.fromTo(cta, { opacity: 0, scale: 0.85, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.8)' }, at + 0.9)
  })

  o.sprays.forEach((spray, i) => {
    tl.fromTo(spray, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: EASE.out, transformOrigin: '0% 50%' }, o.sprayAt[i] * D)
  })
  if (o.endOn) tl.fromTo(o.endOn, { opacity: 0 }, { opacity: 1, duration: 0.2 }, D - 0.2)
  return tl
}

/**
 * Method (#method, light). Desktop: a 2562 x 3450 stage scaled to the width.
 * The cobalt jet draws along a fixed route as you scroll (scrubbed), one loop
 * between steps 1 and 2, lighting each node and raising its step as it passes.
 * Phone: a single wavy route down the left gutter, drawn through wherever the
 * nodes land, with the same behaviour.
 */
export default function Method() {
  const root = useRef<HTMLElement>(null)
  // Build this section's motion only when it is about to come into view
  const near = useNear(root)

  useGSAP(
    () => {
      if (!near) return
      const el = root.current!
      const q = gsap.utils.selector(el)
      const mm = gsap.matchMedia()

      // Heading lines rise on enter (both layouts)
      mm.add({ motion: MQ.motion }, () => {
        gsap
          .timeline({ scrollTrigger: { trigger: q('[data-method-head]')[0], start: SCROLL_START, once: true } })
          .add(fadeUp(q('[data-head-line]'), { y: 30, stagger: 0.15 }))
      })

      // ---- Desktop stage ----
      mm.add({ desktop: MQ.desktop, reduce: MQ.reduce }, (ctx) => {
        const { desktop, reduce } = ctx.conditions as { desktop: boolean; reduce: boolean }
        if (!desktop) return
        const stage = q('[data-stage]')[0] as HTMLElement
        const svg = el.querySelector<SVGSVGElement>('[data-route="d"]')!
        const path = svg.querySelector<SVGPathElement>('[data-jet]')!

        // Ring: turns with scroll (0 to -120° across the section) over a slow idle drift
        const ring = q('[data-ring]')[0]
        const idle = gsap.to(q('[data-ring-idle]'), { rotation: 360, duration: 120, ease: 'none', repeat: -1, paused: reduce })
        if (!reduce) {
          gsap.fromTo(ring, { rotation: 0 }, { rotation: -120, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
        }
        if (reduce) return () => idle.kill()

        // Split once the fonts are in, so the body lines break where they will stay
        const splits: SplitText[] = []
        let cancelled = false
        fontsReady().then(() => {
          if (cancelled) return
          ctx.add(() => {
            const tl = routeTimeline({
              path,
              nodes: Array.from(svg.querySelectorAll('[data-node]')).map((node) => ({ node, on: node.querySelector('[data-node-on]')! })),
              steps: q('[data-step-inner]') as HTMLElement[],
              sprays: Array.from(svg.querySelectorAll('[data-spray]')),
              endOn: svg.querySelector('[data-end-on]'),
              tip: svg.querySelector<SVGGElement>('[data-tip]')!,
              tipScale: 1,
              nodeAt: fractions(path, G.nodes),
              sprayAt: fractions(path, G.sprays),
              nodeRadius: 70,
              splits,
            })
            ScrollTrigger.create({ animation: tl, trigger: stage, start: 'top 60%', end: 'bottom 85%', scrub: 1 })
          })
        })
        return () => {
          cancelled = true
          splits.forEach((sp) => sp.revert())
        }
      })

      // ---- Phone column ----
      mm.add({ mobile: MQ.mobile, reduce: MQ.reduce }, (ctx) => {
        const { mobile, reduce } = ctx.conditions as { mobile: boolean; reduce: boolean }
        if (!mobile) return
        const list = q('[data-steps]')[0] as HTMLElement
        const svg = el.querySelector<SVGSVGElement>('[data-route="m"]')!
        const ghost = svg.querySelector<SVGPathElement>('[data-ghost]')!
        const path = svg.querySelector<SVGPathElement>('[data-jet]')!
        const startPeg = svg.querySelector<SVGGElement>('[data-peg="start"]')!
        const endPeg = svg.querySelector<SVGGElement>('[data-peg="end"]')!
        const nodes = q('[data-m-node]') as HTMLElement[]
        let tl: gsap.core.Timeline | null = null
        let trigger: ScrollTrigger | null = null
        let span = { start: 0, end: 0 }

        // Build the route through wherever the nodes landed
        const build = () => {
          const box = list.getBoundingClientRect()
          svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`)
          const pts = nodes.map((n) => {
            const r = n.getBoundingClientRect()
            return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }
          })
          const gx = pts[0].x
          const start = { x: gx, y: pts[0].y - 64 } // a short lead-in above the first step
          const end = { x: gx, y: box.height - 22 }
          const all = [start, ...pts, end]
          let d = `M ${start.x} ${start.y}`
          for (let i = 1; i < all.length; i++) {
            const a = all[i - 1]
            const b = all[i]
            const dy = b.y - a.y
            const w = i % 2 ? 13 : -13 // a gentle wave, alternating sides
            d += ` C ${a.x + w} ${a.y + dy * 0.38} ${b.x + w} ${b.y - dy * 0.38} ${b.x} ${b.y}`
          }
          ghost.setAttribute('d', d)
          path.setAttribute('d', d)
          startPeg.setAttribute('transform', `translate(${start.x} ${start.y}) scale(0.24)`)
          endPeg.setAttribute('transform', `translate(${end.x} ${end.y}) scale(0.24)`)
          span = { start: start.y, end: end.y }
          return pts
        }

        let pts = build()
        if (reduce) {
          const ro = new ResizeObserver(() => void (pts = build()))
          ro.observe(list)
          return () => ro.disconnect()
        }

        const splits: SplitText[] = []
        const setup = () => {
          trigger?.kill()
          tl?.kill()
          splits.splice(0).forEach((sp) => sp.revert())
          tl = routeTimeline({
            path,
            nodes: nodes.map((node) => ({ node, on: node.querySelector('[data-m-node-on]')! })),
            steps: q('[data-step-inner]') as HTMLElement[],
            sprays: [],
            endOn: endPeg.querySelector('[data-end-on]'),
            tip: svg.querySelector<SVGGElement>('[data-tip]')!,
            tipScale: 0.3,
            nodeAt: fractions(path, pts),
            sprayAt: [],
            nodeRadius: 18,
            splits,
          })
          // The head stays about two thirds down the screen the whole way
          trigger = ScrollTrigger.create({
            animation: tl,
            trigger: list,
            start: () => `top+=${span.start} 66%`,
            end: () => `top+=${span.end} 66%`,
            scrub: 1,
          })
        }
        let cancelled = false
        fontsReady().then(() => !cancelled && ctx.add(setup))

        // The column reflows (fonts, rotation, browser bars): rebuild from fresh measurements
        let last = list.offsetHeight
        let timer = 0
        const ro = new ResizeObserver(() => {
          if (Math.abs(list.offsetHeight - last) < 2) return
          last = list.offsetHeight
          clearTimeout(timer)
          timer = window.setTimeout(() => {
            pts = build()
            ctx.add(setup)
            ScrollTrigger.refresh()
          }, 150)
        })
        ro.observe(list)
        return () => {
          cancelled = true
          ro.disconnect()
          clearTimeout(timer)
          splits.forEach((sp) => sp.revert())
        }
      })
    },
    { scope: root, dependencies: [near] },
  )

  return (
    <section ref={root} id="method" data-theme="light" aria-labelledby="method-title" className="relative overflow-x-clip">
      <div data-stage className="method-stage px-page pt-[var(--pad)] pb-[clamp(72px,10vw,120px)] lg:p-0">
        {/* Heading and link */}
        <div data-method-head className="flex flex-col-reverse gap-8 lg:block">
          <h2 id="method-title" className="display lg:absolute" style={{ left: u(104), top: u(230) }}>
            <span data-head-line className="block">
              {METHOD.heading[0]}
            </span>
            <span data-head-line className="block text-cobalt">
              {METHOD.heading[1]}
            </span>
          </h2>
          <div className="flex justify-end lg:absolute lg:right-[var(--pad)]" style={{ top: u(127) }}>
            <ArrowLink href={METHOD.link.href} onClick={(e) => openQuote(e, 1)}>
              {METHOD.link.label}
            </ArrowLink>
          </div>
        </div>

        <RingBadge />
        <DesktopRoute />

        {/* Steps: absolutely placed beside their nodes on the stage, a column on a phone */}
        <ol data-steps className="relative mt-[clamp(88px,22vw,120px)] lg:contents">
          <PhoneRoute />
          {METHOD.steps.map((s, i) => {
            const n = G.nodes[i]
            return (
              <li
                key={s.num}
                data-side={s.side}
                className="method-step"
                style={{ ['--nx' as string]: n.x, ['--ny' as string]: n.y }}
              >
                <div data-step-inner className="relative">
                  <p className="step-pill">
                    <span data-step-pill className="inline-flex rounded-full bg-cobalt px-[1em] py-[0.5em] leading-none font-medium text-limestone">
                      {s.pill}
                    </span>
                  </p>
                  <h3 className="step-title relative flex items-center gap-[0.19em] font-serif leading-none tracking-[-0.02em] whitespace-nowrap">
                    {/* Phone node, on the gutter line */}
                    <span aria-hidden="true" data-m-node className="absolute top-1/2 left-[calc(-1*var(--m-gutter))] grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ghost font-sans text-[13px] font-medium tracking-normal text-slate/50 ring-[5px] ring-limestone lg:hidden">
                      {s.num}
                      <span data-m-node-on className="absolute inset-0 grid place-items-center rounded-full bg-slate text-limestone">
                        {s.num}
                      </span>
                    </span>
                    <span className="sr-only">{`${s.num}. `}</span>
                    <MaskWord>{s.title[0]}</MaskWord>
                    <StepIcon name={s.icon} className="size-[0.69em] shrink-0" />
                    {s.title[1].split(' ').map((w) => (
                      <MaskWord key={w}>{w}</MaskWord>
                    ))}
                  </h3>
                  <div className="step-body">
                    <p data-step-body className="text-slate/72">
                      {s.description}
                    </p>
                    {i === METHOD.steps.length - 1 && (
                      <div data-step-cta className="mt-[1.6em] inline-block">
                        <Button href={METHOD.cta.href} variant="dark" size="stage" arrow onClick={(e) => openQuote(e, 1)} className="step-cta">
                          {METHOD.cta.label}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/** A title word in its own mask, so it can rise into place. Bottom padding keeps descenders clear of the mask. */
function MaskWord({ children }: { children: React.ReactNode }) {
  return (
    <span className="-mb-[0.16em] inline-block overflow-hidden pb-[0.16em] align-bottom">
      <span data-word className="inline-block">
        {children}
      </span>
    </span>
  )
}

/** A peg stuck in the ground: oval cap, a darker lip behind it, a soft ground shadow. Centred on the cap. */
function Peg({ cap, lip, children }: { cap: string; lip: string; children?: React.ReactNode }) {
  return (
    <>
      <ellipse cx={-6} cy={55} rx={52} ry={15} fill="var(--color-slate)" fillOpacity={0.22} />
      <ellipse cx={-11} cy={4} rx={44} ry={56} fill={lip} />
      <ellipse cx={0} cy={0} rx={44} ry={56} fill={cap} />
      {children}
    </>
  )
}

/** The progress tip: a limestone-ringed cobalt circle with a water drop. Centred on the origin. */
function Tip() {
  return (
    <g data-tip style={{ opacity: 0 }}>
      <circle r={42} fill="var(--color-limestone)" />
      <circle r={32} fill="var(--color-cobalt)" />
      <path d="M0 -15C0 -15 -12 -2 -12 5C-12 11 -7 15 0 15C7 15 12 11 12 5C12 -2 0 -15 0 -15Z" fill="var(--color-limestone)" />
    </g>
  )
}

function DesktopRoute() {
  const sprayTransform = (c: Pt) =>
    `translate(${c.x} ${c.y}) rotate(21) scale(1.4535) translate(${-DROPLETS_CENTRE.x} ${-DROPLETS_CENTRE.y})`
  return (
    <svg
      data-route="d"
      viewBox={`0 0 ${G.w} ${G.h}`}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible lg:block"
    >
      <path d={METHOD_ROUTE} fill="none" stroke="var(--color-ghost)" strokeWidth={G.stroke} strokeLinecap="round" />
      <path data-jet d={METHOD_ROUTE} fill="none" stroke="var(--color-cobalt)" strokeWidth={G.stroke} strokeLinecap="round" />

      {G.sprays.map((c, i) => (
        <g key={i} data-spray>
          <g transform={sprayTransform(c)}>
            {HERO_DROPLETS.map(([cx, cy, r, o], j) => (
              <circle key={j} cx={cx} cy={cy} r={r} fill="var(--color-cobalt)" fillOpacity={o} />
            ))}
          </g>
        </g>
      ))}

      <g transform={`translate(${G.start.x} ${G.start.y})`}>
        <Peg cap="var(--color-cobalt)" lip="var(--color-cobalt-deep)" />
      </g>
      <g transform={`translate(${G.end.x} ${G.end.y})`}>
        <Peg cap="var(--color-ghost)" lip="var(--color-ghost-deep)" />
        <g data-end-on>
          <ellipse cx={-11} cy={4} rx={44} ry={56} fill="var(--color-cobalt-deep)" />
          <ellipse cx={0} cy={0} rx={44} ry={56} fill="var(--color-cobalt)" />
        </g>
      </g>

      {G.nodes.map((n, i) => (
        <g key={i} transform={`translate(${n.x} ${n.y})`}>
          <g data-node>
            <circle r={70} fill="var(--color-limestone)" />
            <circle r={60} fill="var(--color-ghost)" />
            <NodeNum n={i} fill="rgb(43 46 47 / 0.5)" />
            <g data-node-on>
              <circle r={60} fill="var(--color-slate)" />
              <NodeNum n={i} fill="var(--color-limestone)" />
            </g>
          </g>
        </g>
      ))}

      <Tip />
    </svg>
  )
}

function NodeNum({ n, fill }: { n: number; fill: string }) {
  return (
    <text textAnchor="middle" dominantBaseline="central" fill={fill} style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 34 }}>
      {METHOD.steps[n].num}
    </text>
  )
}

/** Phone route: drawn after mount through the measured node positions. */
function PhoneRoute() {
  return (
    <svg data-route="m" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible lg:hidden">
      <path data-ghost fill="none" stroke="var(--color-ghost)" strokeWidth={11} strokeLinecap="round" />
      <path data-jet fill="none" stroke="var(--color-cobalt)" strokeWidth={11} strokeLinecap="round" />
      <g data-peg="start">
        <Peg cap="var(--color-cobalt)" lip="var(--color-cobalt-deep)" />
      </g>
      <g data-peg="end">
        <Peg cap="var(--color-ghost)" lip="var(--color-ghost-deep)" />
        <g data-end-on>
          <ellipse cx={-11} cy={4} rx={44} ry={56} fill="var(--color-cobalt-deep)" />
          <ellipse cx={0} cy={0} rx={44} ry={56} fill="var(--color-cobalt)" />
        </g>
      </g>
      <Tip />
    </svg>
  )
}

/** Large ring cut off by the right edge: a cobalt band with mono text turning around it. */
function RingBadge() {
  const R = 259
  const circle = `M 302 ${302 - R} A ${R} ${R} 0 1 1 302 ${302 + R} A ${R} ${R} 0 1 1 302 ${302 - R}`
  return (
    <div
      data-ring
      aria-hidden="true"
      className="pointer-events-none absolute hidden lg:block"
      style={{ left: u(G.ring.x - 302), top: u(G.ring.y - 302), width: u(604), height: u(604) }}
    >
      <svg data-ring-idle viewBox="0 0 604 604" className="h-full w-full overflow-visible">
        <defs>
          <path id="method-ring" d={circle} />
        </defs>
        <circle cx={302} cy={302} r={227} fill="none" stroke="var(--color-cobalt)" strokeOpacity={0.14} strokeWidth={70} />
        <text fill="rgb(43 46 47 / 0.75)" style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 22, textTransform: 'uppercase' }}>
          <textPath href="#method-ring" textLength={2 * Math.PI * R - 4} lengthAdjust="spacing">
            {METHOD.ring}
          </textPath>
        </text>
      </svg>
    </div>
  )
}
