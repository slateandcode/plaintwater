'use client'

import { useId } from 'react'
import { HERO } from '@/lib/content'

const R = 73.5 // text baseline radius, from the Figma letter positions
const CIRCLE = `M 100 ${100 - R} A ${R} ${R} 0 1 1 100 ${100 + R} A ${R} ${R} 0 1 1 100 ${100 - R}`

/**
 * The cobalt badge: circular mono text in limestone around a small wave mark.
 * The text ring is its own layer so it can turn on its own (`data-badge-ring`).
 * Drawn in a 200-unit box (Figma node 43:57), shadow included, so it scales
 * with whatever size the wrapper gives it.
 */
export default function Badge({ className = '', text = HERO.badge }: { className?: string; text?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <div className={`relative ${className}`} aria-hidden="true" data-badge>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#2B2E2F" floodOpacity="0.2" />
          </filter>
        </defs>
        <circle cx="100" cy="100" r="100" fill="var(--color-cobalt)" filter={`url(#${id}-shadow)`} />
        <path
          d="M 72 100 C 81 90 91 90 100 100 C 109 110 119 110 128 100"
          fill="none"
          stroke="var(--color-limestone)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible" data-badge-ring>
        <defs>
          <path id={`${id}-circle`} d={CIRCLE} />
        </defs>
        <text
          fill="var(--color-limestone)"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, textTransform: 'uppercase' }}
        >
          <textPath href={`#${id}-circle`} textLength={2 * Math.PI * R - 2} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  )
}
