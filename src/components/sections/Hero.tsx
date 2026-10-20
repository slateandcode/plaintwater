'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { gsap, ScrollTrigger, EASE, useGSAP } from '@/lib/gsap'
import { MQ, fontsReady } from '@/lib/motion'
import { HERO, NAV } from '@/lib/content'
import { GUN_ANGLE, HERO_DROPLETS, HERO_JET, HERO_MOBILE, HERO_NOZZLE } from '@/lib/paths'
import { gunBox, place, placeClass, type Box } from '@/lib/stage'
import { decodeImages, onHeroCue, releaseHero } from '@/lib/intro'
import { openQuote, scrollToHash } from '@/lib/site'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import PhotoCard from '@/components/ui/PhotoCard'
import { HomeLink, MenuButton, surveyClick } from '@/components/nav/NavParts'

/*
  Geometry. `d` boxes are Figma stage coordinates (2562 x 1378), `m` boxes are
  the mobile board (390 x 480). Prints and the gun are placed by their
  unrotated box plus a rest angle, as CSS rotates them about their centre.
*/
const BEFORE: Box = { x: 155.23, y: 214.35, w: 323.66, r: -5 }
const AFTER = { d: { x: 2082, y: 215, w: 368, r: 4 }, m: { x: 240, y: 30, w: 140, r: 4 } }
const BADGE = { d: { x: 2320, y: 602, w: 200, h: 200 }, m: { x: 340, y: 193, w: 70, h: 70 } }
const HEADLINE = { d: { x: 0, y: 309, w: 2562, fs: 330 }, m: { x: 0, y: 236.6, w: 390, fs: 66 } }
const GUN = { d: gunBox(HERO_NOZZLE, 550.261, GUN_ANGLE.desktop), m: gunBox(HERO_MOBILE.nozzle, HERO_MOBILE.gun.w, GUN_ANGLE.mobile) }

const PRINT_SIZES = '(min-width: 1024px) 14vw, 38vw'

/**
 * Hero (#hero, light). Desktop is a 2562 x 1378 stage scaled to fit the
 * viewport and centred in 100svh. Below 1024px the same elements sit on a
 * 390 x 480 board between a top bar and a bottom bar.
 *
 * The server render is the final composition (what reduced motion shows).
 * With motion, everything the load timeline reveals carries `data-intro` and
 * is held hidden until the timeline takes it.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null)
  const played = useRef(false)

  // Without a preloader in the page, the hero cues itself once fonts and its images are in.
  useGSAP(
    () => {
      if (document.querySelector('[data-preloader]')) return
      const imgs = root.current!.querySelectorAll('img')
      Promise.all([fontsReady(), decodeImages(imgs)]).then(releaseHero)
    },
    { scope: root },
  )

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const mm = gsap.matchMedia()

      // The callback only runs while at least one condition matches, hence `mobile`.
      mm.add({ desktop: MQ.desktop, mobile: MQ.mobile, reduce: MQ.reduce }, (ctx: gsap.Context) => {
        const { desktop, reduce } = ctx.conditions as { desktop: boolean; reduce: boolean }
        if (reduce) return

        const board = q(desktop ? '.hero-stage' : '.hero-board')[0] as HTMLElement
        const k = () => board.offsetWidth / (desktop ? 2562 : 390)
        const v = (n: number) => () => n * k()

        const show = (t: gsap.TweenTarget) => gsap.set(t, { visibility: 'inherit' })
        const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.inOut } })

        // Nav and top rule
        const navItems = q(desktop ? '[data-hn]' : '[data-hn-m]')
        tl.add(() => show(q('[data-rule]')), 0)
        tl.fromTo(q('[data-rule="top"]'), { scaleX: 0 }, { scaleX: 1, duration: 1.6, transformOrigin: '0 50%' }, 0.2)
        tl.fromTo(navItems, { y: v(-12) }, { y: 0, duration: 1, stagger: 0.1 }, 0.3)
        tl.fromTo(navItems, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, stagger: 0.1, ease: EASE.soft }, 0.3)
        tl.fromTo(q('[data-hero-nav] [data-wave]'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.8 }, 0.6)

        // Headline grows from nothing to full size, slow, fast, slow
        tl.fromTo(q('[data-h="title"]'), { scale: 0 }, { scale: 1, duration: 1.6, ease: EASE.inOut, transformOrigin: '50% 50%' }, 0.4)

        // Prints fade up and turn in from 8° off their rest angle
        const printIn = (sel: string, rest: number, off: number, at: number) => {
          const t = q(sel)
          tl.fromTo(t, { y: v(48), rotation: rest + off }, { y: 0, rotation: rest, duration: 1.2 }, at)
          tl.fromTo(t, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: EASE.soft }, at)
        }
        if (desktop) printIn('[data-h="before"]', BEFORE.r!, 8, 0.6)
        printIn('[data-h="after"]', 4, -8, 0.8)

        // The after print starts dirty, labelled BEFORE
        tl.fromTo(q('[data-dirty]'), { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 100%)', duration: 1.2 }, 4.6)
        tl.fromTo(q('[data-h="after"] [data-label="before"]'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.45, ease: EASE.soft }, 5.5)
        tl.fromTo(q('[data-h="after"] [data-label="after"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: EASE.soft }, 5.5)

        // Gun glides in, holds, fires
        const gun = q('[data-h="gun"]')
        tl.fromTo(gun, { x: v(-720), y: v(180), scale: 0.92 }, { x: 0, y: 0, scale: 1, duration: 1.6 }, 1.4)
        tl.fromTo(gun, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: EASE.soft }, 1.4)
        // 3.0 to 3.4: the held beat. Nothing moves.
        tl.to(gun, { x: v(-18), y: v(7), duration: 0.08, ease: 'power2.out' }, 3.4)
        tl.to(gun, { x: 0, y: 0, duration: 0.52, ease: EASE.soft }, 3.48)

        // The shot: eraser and water draw together from the nozzle
        const jet = q(desktop ? '[data-jet="d"]' : '[data-jet="m"]')
        tl.add(() => show(jet), 3.4)
        tl.fromTo(q(desktop ? '[data-jet="d"] path' : '[data-jet="m"] path'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 2.2 }, 3.4)

        // Spray bursts and drifts
        const drops = q(desktop ? '[data-drops="d"]' : '[data-drops="m"]')
        tl.add(spray(drops), 3.42) // as the water leaves the nozzle

        // Bottom bar
        tl.fromTo(q('[data-rule="bottom"]'), { scaleX: 0 }, { scaleX: 1, duration: 1.6, transformOrigin: '0 50%' }, 5.0)
        tl.fromTo(q('[data-h="cta"]'), { y: v(20) }, { y: 0, duration: 1.1 }, 5.4)
        tl.fromTo(q('[data-h="cta"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.1, ease: EASE.soft }, 5.4)
        tl.fromTo(q('[data-h="review"]'), { y: v(20) }, { y: 0, duration: 1.1 }, 5.7)
        tl.fromTo(q('[data-h="review"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.1, ease: EASE.soft }, 5.7)

        // Badge pops
        const badge = q('[data-h="badge"]')
        tl.fromTo(badge, { scale: 0.3 }, { scale: 1, duration: 0.9, ease: EASE.pop }, 5.8)
        tl.fromTo(badge, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: EASE.soft }, 5.8)
        tl.call(() => void (played.current = true))

        // The sequence keeps the brief's order and beats, played quicker; the phone runs tighter again
        tl.timeScale(desktop ? 1.6 : 2)

        // The only loop: the badge text turns once every 24s
        const spin = gsap.to(q('[data-badge-ring]'), { rotation: 360, duration: 24, ease: 'none', repeat: -1, transformOrigin: '50% 50%' })

        // Dev only: scrub the intro from the console (window.__pwHero.progress(0.5)); ?introPause holds it at 0.
        if (process.env.NODE_ENV !== 'production') {
          ;(window as unknown as { __pwHero: gsap.core.Timeline }).__pwHero = tl
          if (location.search.includes('introPause')) return
        }

        let off = () => {}
        if (played.current) tl.progress(1)
        else off = onHeroCue(() => tl.play())

        // Scroll-out: prints and gun drift a touch slower than the page, the badge spins up
        if (desktop) {
          gsap.to(q('[data-drift]'), {
            y: () => el.offsetHeight * 0.07,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
              onUpdate: (self) => spin.timeScale(1 + self.progress * 2.5),
            },
          })
        }

        // Hover: prints straighten and lift; the gun replays its spray
        const cleanups: (() => void)[] = []
        // Handlers run inside this context so anything they tween is reverted with it.
        const safe = (fn: () => void) => ctx.add(fn) as unknown as () => void
        const hoverable = window.matchMedia('(hover: hover)').matches
        if (hoverable) {
          q('[data-h="before"], [data-h="after"]').forEach((wrap) => {
            const card = wrap.querySelector<HTMLElement>('[data-print]')!
            const rest = wrap.dataset.h === 'before' ? BEFORE.r! : 4
            const enter = safe(() => {
              if (!played.current) return
              card.classList.add('is-lifted')
              gsap.to(card, { rotation: -rest * 0.6, y: -6, duration: 0.6, ease: EASE.out, overwrite: 'auto' })
            })
            const leave = safe(() => {
              card.classList.remove('is-lifted')
              gsap.to(card, { rotation: 0, y: 0, duration: 0.6, ease: EASE.out, overwrite: 'auto' })
            })
            wrap.addEventListener('pointerenter', enter)
            wrap.addEventListener('pointerleave', leave)
            cleanups.push(() => {
              wrap.removeEventListener('pointerenter', enter)
              wrap.removeEventListener('pointerleave', leave)
            })
          })
          const gunHit = q('[data-gun-hit]')[0]
          let burst: gsap.core.Timeline | null = null
          const replay = safe(() => {
            if (!played.current || burst?.isActive()) return
            burst = spray(drops)
          })
          gunHit?.addEventListener('pointerenter', replay)
          cleanups.push(() => gunHit?.removeEventListener('pointerenter', replay))
        }

        return () => {
          off()
          cleanups.forEach((c) => c())
        }
      })
    },
    { scope: root },
  )

  const gunStyle = { ...place(GUN.d, GUN.m) }

  return (
    <section ref={root} id="hero" data-theme="light" aria-label="Plainwater" className="relative overflow-hidden">
      <div className="hero-frame">
        <div className="hero-stage">
          <HeroNav />

          <div className="hero-art">
            <div className="hero-board">
              {/* Before print (desktop only) */}
              <div data-drift className={`${placeClass(BEFORE)} max-lg:hidden`} style={place(BEFORE)}>
                <div data-h="before" data-intro className="rot" style={{ ['--r' as string]: BEFORE.r }}>
                  <PhotoCard
                    src="/images/patio-dirty.jpg"
                    alt={HERO.before.alt}
                    job={HERO.before.job}
                    labels={[{ text: HERO.before.label, tone: 'slate' }]}
                    image={{ w: 300.23, h: 339.87 }}
                    pad={[13.86, 11.7, 5]}
                    sizes={PRINT_SIZES}
                    eager
                  />
                </div>
              </div>

              {/* After print: clean photo under the dirty one, washed by the jet */}
              <div data-drift className={placeClass(AFTER.d, AFTER.m)} style={place(AFTER.d, AFTER.m)}>
                <div data-h="after" data-intro className="rot [--print-scale:0.3804] lg:[--print-scale:1]">
                  <PhotoCard
                    src="/images/patio-clean.jpg"
                    alt={HERO.after.alt}
                    overlay={{ src: '/images/patio-dirty.jpg', alt: '' }}
                    job={HERO.after.job}
                    labels={[
                      { text: HERO.after.label, tone: 'cobalt' },
                      { text: HERO.before.label, tone: 'slate', hidden: true },
                    ]}
                    image={{ w: 340, h: 420 }}
                    sizes={PRINT_SIZES}
                    eager
                  />
                </div>
              </div>

              <div className={placeClass(BADGE.d, BADGE.m)} style={place(BADGE.d, BADGE.m)}>
                <div data-h="badge" data-intro className="h-full w-full">
                  <Badge className="h-full w-full" />
                </div>
              </div>

              {/*
                No data-intro on the headline: it paints in the server HTML (under the
                preloader panel) so it counts as the LCP at first paint; the load
                timeline hides it on hydration, while the panel still covers it.
              */}
              <h1
                data-h="title"
                className={`${placeClass(HEADLINE.d, HEADLINE.m)} text-center font-serif leading-[1.17] whitespace-nowrap uppercase`}
                style={place(HEADLINE.d, HEADLINE.m)}
              >
                <span className="block">{HERO.lines[0]}</span>
                <span className="block">{HERO.lines[1]}</span>
              </h1>

              {/* The jet: an eraser stroke in the background colour cuts the letters, the water runs inside it */}
              <svg
                data-jet="d"
                data-intro
                viewBox="0 0 2562 1378"
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible max-lg:hidden"
                aria-hidden="true"
              >
                <g transform={HERO_JET.transform} fill="none" strokeLinecap="round">
                  <path d={HERO_JET.d} stroke="var(--bg)" strokeWidth={HERO_JET.eraser} />
                  <path d={HERO_JET.d} stroke="var(--color-cobalt)" strokeWidth={HERO_JET.water} />
                </g>
              </svg>
              <svg
                data-jet="m"
                data-intro
                viewBox={`0 0 ${HERO_MOBILE.w} ${HERO_MOBILE.h}`}
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible lg:hidden"
                aria-hidden="true"
              >
                <g fill="none" strokeLinecap="round">
                  <path d={HERO_MOBILE.d} stroke="var(--bg)" strokeWidth={HERO_MOBILE.eraser} />
                  <path d={HERO_MOBILE.d} stroke="var(--color-cobalt)" strokeWidth={HERO_MOBILE.water} />
                </g>
              </svg>

              <Droplets />

              {/* Gun: the outer box carries the drift and an unrotated drop shadow, the inner box the rest angle */}
              <div
                data-drift
                className={placeClass(GUN.d, GUN.m)}
                style={{ ...gunStyle, filter: 'drop-shadow(calc(var(--u) * 16) calc(var(--u) * 44) calc(var(--u) * 22) rgb(26 28 29 / 0.26))' }}
              >
                <div data-h="gun" data-intro className="h-full w-full">
                  <div className="rot relative h-full w-full">
                    <Image
                      src="/images/hero/gun.png"
                      alt={HERO.gunAlt}
                      fill
                      sizes="(min-width: 1024px) 22vw, 34vw"
                      loading="eager"
                      fetchPriority="high"
                      className="object-contain"
                      data-gun-hit
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <HeroBottom />
        </div>
      </div>
    </section>
  )
}

/**
 * The spray builds with the jet instead of popping in: every droplet leaves
 * the nozzle and travels out to its place, nearest first, so the mist thickens
 * as the water starts pushing through. Then the cloud drifts on downstream and
 * settles a little lighter. Droplet coordinates are the desktop stage's (the
 * phone group is the same set, transformed), so one nozzle point serves both.
 */
function spray(drops: Element[]) {
  const tl = gsap.timeline()
  drops.forEach((group) => {
    const dots = Array.from(group.querySelectorAll('circle')).map((c) => {
      const cx = Number(c.getAttribute('cx'))
      const cy = Number(c.getAttribute('cy'))
      return { c, dx: HERO_NOZZLE.x - cx, dy: HERO_NOZZLE.y - cy, d: Math.hypot(HERO_NOZZLE.x - cx, HERO_NOZZLE.y - cy) }
    })
    tl.set(group, { autoAlpha: 1, x: 0 }, 0)
    dots.forEach(({ c, dx, dy, d }) => {
      tl.fromTo(
        c,
        { x: dx, y: dy, scale: 0.25, opacity: 0 },
        { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.55 + d / 420, ease: EASE.out, transformOrigin: '50% 50%' },
        0.05 + d / 280,
      )
    })
    tl.to(group, { x: 16, duration: 2.4, ease: EASE.inOut }, 0.2)
    tl.to(group, { opacity: 0.8, duration: 1.2, ease: EASE.soft }, 1.4)
  })
  return tl
}

function Droplets() {
  const dots = HERO_DROPLETS.map(([cx, cy, r, o, b], i) => (
    <circle key={i} cx={cx} cy={cy} r={r} fill="var(--color-cobalt)" fillOpacity={o} filter={b ? 'url(#drop-blur)' : undefined} />
  ))
  return (
    <>
      <svg viewBox="0 0 2562 1378" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible max-lg:hidden" aria-hidden="true">
        <defs>
          <filter id="drop-blur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>
        <g data-drops="d" data-intro style={{ opacity: 0.7 }}>
          {dots}
        </g>
      </svg>
      <svg
        viewBox={`0 0 ${HERO_MOBILE.w} ${HERO_MOBILE.h}`}
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible lg:hidden"
        aria-hidden="true"
      >
        <g data-drops="m" data-intro style={{ opacity: 0.7 }}>
          {/* The desktop spray, turned to the phone gun's angle and scaled to its size */}
          <g transform={`translate(${HERO_MOBILE.nozzle.x} ${HERO_MOBILE.nozzle.y}) rotate(${GUN_ANGLE.mobile - GUN_ANGLE.desktop}) scale(0.24) translate(${-HERO_NOZZLE.x} ${-HERO_NOZZLE.y})`}>
            {HERO_DROPLETS.map(([cx, cy, r, o], i) => (
              <circle key={i} cx={cx} cy={cy} r={r * 1.4} fill="var(--color-cobalt)" fillOpacity={o} />
            ))}
          </g>
        </g>
      </svg>
    </>
  )
}

/** The nav as it sits on the hero stage (Figma positions), or the phone's top bar. */
function HeroNav() {
  return (
    <div data-hero-nav className="px-page flex h-[var(--nav-h)] shrink-0 items-center justify-between lg:block lg:h-auto lg:px-0">
      <div
        data-hn
        data-hn-m
        data-intro
        className={`${placeClass({ x: 156, y: 74 })} max-lg:h-[17px] [&_svg]:h-full [&_svg]:w-auto`}
        style={place({ x: 156, y: 74, w: 330, h: 39 })}
      >
        <HomeLink className="h-full" drawOnMount={false} />
      </div>
      <nav aria-label="Main" className="dpos inset-x-0 hidden justify-center lg:flex" style={place({ x: 0, y: 84, fs: 30 })}>
        <ul className="flex leading-none" style={{ gap: 'calc(var(--u) * 64)' }}>
          <NavItems />
        </ul>
      </nav>
      <div data-hn data-intro className="dpos hidden lg:block" style={place({ x: 2168, y: 64, w: 282, h: 80, fs: 30 })}>
        <Button href={NAV.cta.href} onClick={surveyClick} size="stage" className="h-full w-full rounded-[calc(var(--u)*10)] text-[length:inherit]">
          {NAV.cta.label}
        </Button>
      </div>
      <div data-hn-m data-intro className="lg:hidden">
        <MenuButton />
      </div>
      <div data-rule="top" data-intro className="dpos hidden h-px bg-[var(--rule)] lg:block" style={place({ x: 112, y: 176, w: 2338 })} />
    </div>
  )
}

/** Nav links as separate list items, so the load timeline can stagger them. */
function NavItems() {
  return (
    <>
      {NAV.links.map((l) => (
        <li key={l.href} data-hn data-intro>
          <a href={l.href} className="link-draw block" onClick={(e) => scrollToHash(e, l.href)}>
            {l.label}
          </a>
        </li>
      ))}
    </>
  )
}

/** Rule, CTA row and the review. On desktop at their stage positions; on a phone stacked at the bottom. */
function HeroBottom() {
  return (
    <div className="px-page flex shrink-0 flex-col gap-5 pb-[max(20px,env(safe-area-inset-bottom))] lg:block lg:p-0">
      <div data-rule="bottom" data-intro className="dpos hidden h-px bg-[var(--rule)] lg:block" style={place({ x: 112, y: 1160, w: 2338 })} />
      <div data-h="cta" data-intro className="dpos flex items-center" style={{ ...place({ x: 112, y: 1196 }), gap: 'calc(var(--u) * 48)' }}>
        <Button
          href={HERO.primary.href}
          onClick={(e) => openQuote(e, 1)}
          size="stage"
          className="h-[52px] w-full text-[16px] lg:h-[calc(var(--u)*90)] lg:w-auto lg:rounded-[calc(var(--u)*10)] lg:px-[calc(var(--u)*44)] lg:text-[calc(var(--u)*32)]"
        >
          {HERO.primary.label}
        </Button>
        <a href={HERO.secondary.href} onClick={(e) => scrollToHash(e, HERO.secondary.href)} className="text-link hidden font-medium text-cobalt lg:inline lg:text-[calc(var(--u)*30)]">
          {HERO.secondary.label}
        </a>
      </div>
      <figure data-h="review" data-intro className="dpos flex items-center gap-3 lg:gap-[calc(var(--u)*24)]" style={place({ x: 900, y: 1202 })}>
        <span aria-hidden="true" className="block size-11 shrink-0 rounded-full bg-ghost-deep lg:size-[calc(var(--u)*76)]" />
        <div className="flex min-w-0 flex-col gap-1 lg:gap-[calc(var(--u)*8)]">
          <blockquote className="font-garamond text-[17px] leading-tight italic lg:text-[calc(var(--u)*38)] lg:whitespace-nowrap">
            <p>{HERO.review.quote}</p>
          </blockquote>
          <figcaption className="mono text-muted whitespace-pre lg:text-[max(11px,calc(var(--u)*18))]">
            {`${HERO.review.name}  ·  ${HERO.review.detail}`}
          </figcaption>
        </div>
      </figure>
    </div>
  )
}
