import type { Step } from '@/lib/content'

const SLATE = 'var(--color-slate)'
const COBALT = 'var(--color-cobalt)'
const TINT = 'rgb(31 59 179 / 0.18)'

/** The four method icons, from Figma node 48:2 ("Icon / ..."): slate line, cobalt accents, light cobalt fill. */
export default function StepIcon({ name, className = '' }: { name: Step['icon']; className?: string }) {
  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true" className={className} data-step-icon>
      {name === 'clipboard' && (
        <>
          <path d="M22 15.75H50C51.7949 15.75 53.25 17.2051 53.25 19V57C53.25 58.7949 51.7949 60.25 50 60.25H22C20.2051 60.25 18.75 58.7949 18.75 57V19C18.75 17.2051 20.2051 15.75 22 15.75Z" fill={TINT} stroke={SLATE} strokeWidth="3.5" />
          <rect x="27" y="9" width="18" height="9" rx="3" fill={COBALT} />
          <path d="M26 30H46M26 39H46M26 48H38" stroke={SLATE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === 'droplet' && (
        <>
          <path d="M36 10C36 10 16 32 16 44C16 54 25 60 36 60C47 60 56 54 56 44C56 32 36 10 36 10Z" fill={TINT} stroke={SLATE} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M26 42C26 48 30 52 35 53" stroke={COBALT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === 'lance' && (
        <>
          <path d="M8 44L38 20" stroke={SLATE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M36 24L44 18" stroke={COBALT} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M48 16L66 8M50 22H70M48 28L66 36" stroke={COBALT} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === 'shield' && (
        <>
          <path d="M36 9L58 17V35C58 49 48 58 36 63C24 58 14 49 14 35V17L36 9Z" fill={TINT} stroke={SLATE} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M25 36L33 44L47 28" stroke={COBALT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}
