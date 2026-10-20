'use client'

import { NAV } from '@/lib/content'
import { openQuote, scrollToHash, site, useSite } from '@/lib/site'
import Logo from './Logo'

/** Logo linking back to the top. */
export function HomeLink({ className = '', drawOnMount }: { className?: string; drawOnMount?: boolean }) {
  return (
    <a href="#top" aria-label={NAV.home} className={`block ${className}`} onClick={(e) => scrollToHash(e, '#top')}>
      <Logo className="h-full w-full" drawOnMount={drawOnMount} />
    </a>
  )
}

/** The four section links, each with the drawn underline. */
export function NavLinks({
  className = '',
  linkClassName = '',
  style,
}: {
  className?: string
  linkClassName?: string
  style?: React.CSSProperties
}) {
  return (
    <ul className={className} style={style}>
      {NAV.links.map((l) => (
        <li key={l.href}>
          <a href={l.href} className={`link-draw ${linkClassName}`} onClick={(e) => scrollToHash(e, l.href)}>
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

/** "Book a survey": scrolls to the contact section and opens step 1 of the quote wizard. */
export function surveyClick(e: React.MouseEvent) {
  openQuote(e, 1)
}

/** The Menu pill (below 1024px). */
export function MenuButton({ className = '' }: { className?: string }) {
  const open = useSite((s) => s.menuOpen)
  return (
    <button
      type="button"
      data-menu-button
      aria-expanded={open}
      aria-controls="site-menu"
      onClick={() => site.set({ menuOpen: !site.get().menuOpen })}
      className={`mono inline-flex h-10 items-center gap-2 rounded-full bg-[var(--tag-fill)] px-4 transition-transform duration-300 ease-pw-out active:scale-[0.97] ${className}`}
    >
      <span aria-hidden="true" className="flex flex-col gap-[3px]">
        <span className="block h-px w-3.5 bg-current" />
        <span className="block h-px w-3.5 bg-current" />
      </span>
      {NAV.menu}
    </button>
  )
}
