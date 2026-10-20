import type { CSSProperties } from 'react'

/**
 * Stage units for the hero and method sections. Figma frames are 2562 wide;
 * `u(517)` is 517 Figma px on the stage, so coordinates paste straight across.
 */
export const u = (n: number) => `calc(var(--u) * ${n})`

export type Box = {
  x: number
  y: number
  w?: number
  h?: number
  /** Rotation in degrees (rest angle). */
  r?: number
  /** Font size in stage units. */
  fs?: number
}

/**
 * Responsive placement in stage units: `d` applies from 1024px up (the desktop
 * stage), `m` below it (the mobile board). Pair with the `dpos` / `mpos`
 * classes, which read these variables inside their own media queries, so one
 * element can sit at Figma coordinates on desktop and somewhere else on a phone.
 */
export function place(d?: Box, m?: Box): CSSProperties {
  const style: Record<string, number> = {}
  const put = (prefix: 'd' | 'm', b?: Box) => {
    if (!b) return
    style[`--${prefix}x`] = b.x
    style[`--${prefix}y`] = b.y
    if (b.w !== undefined) style[`--${prefix}w`] = b.w
    if (b.h !== undefined) style[`--${prefix}h`] = b.h
    if (b.r !== undefined) style[`--${prefix}r`] = b.r
    if (b.fs !== undefined) style[`--${prefix}fs`] = b.fs
  }
  put('d', d)
  put('m', m)
  return style as CSSProperties
}

export const placeClass = (d?: Box, m?: Box) => [d ? 'dpos' : '', m ? 'mpos' : ''].join(' ')

/*
  The gun PNG is upright (lance pointing up and right). Its nozzle opening sits
  at this fraction of the image box, measured from the image.
*/
const GUN_ASPECT = 1402 / 1122
const NOZZLE = { fx: 1088 / 1122, fy: 99.2 / 1402 } // the opening in the nozzle face

/** The lance's axis in the upright PNG, in degrees (measured from its pixels). */
export const LANCE_ANGLE = -40.53

/**
 * Box for the gun so that, at width `w` and rotation `r`, its nozzle lands on
 * `nozzle`. Rotation is about the box centre, as CSS does it.
 */
export function gunBox(nozzle: { x: number; y: number }, w: number, r: number): Box {
  const h = w * GUN_ASPECT
  const ox = (NOZZLE.fx - 0.5) * w
  const oy = (NOZZLE.fy - 0.5) * h
  const t = (r * Math.PI) / 180
  const rx = ox * Math.cos(t) - oy * Math.sin(t)
  const ry = ox * Math.sin(t) + oy * Math.cos(t)
  const cx = nozzle.x - rx
  const cy = nozzle.y - ry
  const round = (n: number) => Math.round(n * 100) / 100
  return { x: round(cx - w / 2), y: round(cy - h / 2), w, h: round(h), r }
}
