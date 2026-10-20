/*
  SVG path data, in the coordinate space of each Figma frame so values paste
  straight across. Transforms from Figma are kept separate.
*/

/** Hero jet, viewBox 0 0 2562 1378. Starts at the nozzle (607, 671). */
export const HERO_JET = {
  transform: 'translate(607 574)',
  d: 'M 0 97.63 C 395.17 32.80 1167.60 -62.77 1122 57.63 C 1065 208.13 604.5 174.13 662.5 298.63 C 720.5 423.13 1586 383.13 1633.5 473.13 C 1681 563.13 1236.5 586.63 1284 674.13 C 1331.5 761.63 1827.5 762.63 2057.5 786.13',
  eraser: 64,
  water: 21,
}

/** Where the jet leaves the nozzle on the desktop stage: the path's first point. */
export const HERO_NOZZLE = { x: 607, y: 671.63 }

/**
 * Gun angles that line the lance up with the jet's first segment, so the water
 * leaves straight out of the opening: desktop jet starts at -9.32°, phone at
 * -28.95°, and the lance sits at -40.53° in the upright PNG.
 */
export const GUN_ANGLE = { desktop: 31.21, mobile: 11.58 }

/**
 * Spray droplets just after the nozzle, in stage coordinates (Figma node 25:98):
 * [cx, cy, r, opacity, blurred].
 */
export const HERO_DROPLETS: [number, number, number, number, 0 | 1][] = [
  [633.9, 650.2, 2.0, 0.15, 1],
  [655.7, 653.6, 4.5, 0.51, 0],
  [678.1, 659.9, 2.5, 0.24, 0],
  [672.9, 671.7, 5.0, 0.6, 0],
  [695.9, 681.9, 3.0, 0.33, 1],
  [682.4, 643.3, 5.5, 0.69, 0],
  [705.0, 651.0, 3.5, 0.42, 0],
  [700.2, 664.9, 6.0, 0.15, 0],
  [723.3, 676.5, 4.0, 0.51, 1],
  [736.0, 624.0, 2.0, 0.24, 0],
  [731.7, 640.9, 4.5, 0.6, 0],
  [755.0, 652.9, 2.5, 0.33, 0],
  [750.6, 669.8, 5.0, 0.69, 1],
  [762.2, 610.5, 3.0, 0.42, 0],
  [758.2, 629.4, 5.5, 0.15, 0],
  [781.7, 642.9, 3.5, 0.51, 0],
  [805.7, 659.3, 6.0, 0.24, 1],
  [801.8, 679.2, 4.0, 0.6, 0],
  [811.7, 609.6, 2.0, 0.33, 0],
  [808.2, 631.6, 4.5, 0.69, 0],
  [832.4, 649.4, 2.5, 0.42, 1],
  [828.9, 671.4, 5.0, 0.15, 0],
]

/**
 * Mobile hero board, 390 x 480 units. The jet leaves the nozzle, cuts along
 * the bottom of PLAINWATER, doubles back between the lines, runs through
 * WASHING and exits right.
 */
export const HERO_MOBILE = {
  w: 390,
  h: 480,
  nozzle: { x: 125, y: 312 },
  /** Gun on the board: width and rest angle (the lance points about 25° up). */
  gun: { w: 150, r: 11.58 },
  d: 'M 125 312 C 172 286 250 274 330 278 C 384 281 380 312 300 315 C 225 318 152 322 160 344 C 168 364 280 356 335 358 C 382 360 384 390 332 400 C 280 410 262 434 330 444 C 368 450 400 448 432 450',
  eraser: 13,
  water: 4.3,
}

/** Method route, viewBox 0 0 2562 3450. One loop between steps 1 and 2. */
export const METHOD_ROUTE =
  'M 140 700 C 480 700 800 690 900 1000 C 960 1204 1160 1340 1380 1340 C 1640 1340 1760 1120 1620 980 C 1480 840 1240 900 1240 1100 C 1240 1320 1650 1440 1660 1660 C 1660 1880 1560 1990 1280 1990 C 1000 1990 900 2100 900 2320 C 900 2540 1000 2650 1280 2650 C 1560 2650 1660 2760 1660 2980 C 1660 3180 1520 3300 1280 3300'

/** Method stage geometry (Figma 48:2), in stage units. */
export const METHOD_GEO = {
  w: 2562,
  h: 3450,
  start: { x: 140, y: 700 },
  end: { x: 1280, y: 3300 },
  nodes: [
    { x: 900, y: 1000 },
    { x: 1660, y: 1660 },
    { x: 900, y: 2320 },
    { x: 1660, y: 2980 },
  ],
  /** Spray bursts along the route: centre of each group, rotated 21°, scaled to 295 wide. */
  sprays: [
    { x: 621.85, y: 710.34 },
    { x: 1117.85, y: 1269.34 },
  ],
  ring: { x: 2490, y: 540 },
  stroke: 56,
}

/** Centre of the hero droplet set, so it can be re-placed elsewhere. */
export const DROPLETS_CENTRE = { x: 733.4, y: 646.2 }

/** Footer jet through the giant wordmark, viewBox 0 0 2562 1863. */
export const FOOTER_JET = {
  transform: 'translate(-60 1341)',
  d: 'M 0 218.7 C 495.54 218.7 674.88 -51.3 1084.8 8.7 C 1494.72 68.7 1469.1 308.7 1879.02 278.7 C 2263.32 248.7 2340.18 68.7 2682 38.7',
  eraser: 76,
  water: 24,
}

/** Logo wave, viewBox 0 0 330 35. */
export const LOGO_WAVE = {
  d: 'M 0 26.91 C 60.97 26.91 83.04 -6.31 133.48 1.07 C 183.91 8.45 180.76 37.98 231.2 34.29 C 278.48 30.6 287.94 8.45 330 4.76',
  eraser: 9.35,
  water: 2.95,
}
