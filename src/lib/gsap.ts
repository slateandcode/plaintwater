'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { CustomEase } from 'gsap/CustomEase'
import { useGSAP } from '@gsap/react'

let registered = false

if (typeof window !== 'undefined' && !registered) {
  registered = true
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase)

  // The house curves. Nothing on the site uses GSAP's or the browser's defaults.
  CustomEase.create('pw.inOut', '0.76,0,0.24,1') // slow, fast, slow: almost everything that moves
  CustomEase.create('pw.soft', '0.65,0,0.35,1') // same shape, gentler: fades that run alongside a move
  CustomEase.create('pw.out', '0.16,1,0.3,1') // small UI feedback only (hover, press)

  gsap.defaults({ ease: 'pw.inOut', duration: 1 })
  ScrollTrigger.config({ ignoreMobileResize: true })
}

export const EASE = {
  inOut: 'pw.inOut',
  soft: 'pw.soft',
  out: 'pw.out',
  /** Pops only: the badge, method nodes, pegs. */
  pop: 'back.inOut(1.4)',
} as const

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase, useGSAP }
