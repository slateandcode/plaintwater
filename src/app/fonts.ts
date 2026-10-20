import localFont from 'next/font/local'
import { Chivo_Mono, EB_Garamond } from 'next/font/google'

/** Sans: body, UI, the About statement, card titles. */
export const sans = localFont({
  src: [
    { path: '../../public/fonts/neue-montreal/NeueMontreal-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/neue-montreal/NeueMontreal-Medium.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap',
  variable: '--nf-sans',
  adjustFontFallback: 'Arial',
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
})

/**
 * Serif: display headings, step titles, wordmarks.
 * To swap to EB Garamond, replace this with:
 *   EB_Garamond({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--nf-serif' })
 */
export const serif = localFont({
  src: '../../public/fonts/serif/AppleGaramond-Regular.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--nf-serif',
  adjustFontFallback: 'Times New Roman',
  fallback: ['Georgia', 'serif'],
})

/**
 * EB Garamond, as Figma uses it: the logo wordmark (roman) and the italic
 * quotes (Apple Garamond has no italic cut installed).
 */
export const garamond = EB_Garamond({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  // Small text only (logo, review quote): not worth a preload ahead of the headline
  preload: false,
  variable: '--nf-garamond',
})

/** Mono: labels, tags, meta, counters. Always uppercase. */
export const mono = Chivo_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
  variable: '--nf-mono',
})
