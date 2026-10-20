'use client'

type Props = {
  href: string
  children: React.ReactNode
  className?: string
  external?: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

/** The small top-right section link: label plus ↗, which nudges up and right 2px on hover. */
export default function ArrowLink({ href, children, className = '', external, onClick }: Props) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`group/al inline-flex items-center gap-[0.45em] text-[clamp(13px,1.02vw,18px)] leading-none ${className}`}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span className="link-draw">{children}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 18.5 18.5"
        className="size-[0.62em] overflow-visible transition-transform duration-400 ease-pw-out group-hover/al:translate-x-0.5 group-hover/al:-translate-y-0.5"
      >
        <path d="M1.25 17.25L17.25 1.25M17.25 12.45V1.25H6.05" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {external && <span className="sr-only">(opens in a new tab)</span>}
    </a>
  )
}
