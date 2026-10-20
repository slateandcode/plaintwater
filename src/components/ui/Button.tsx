'use client'

import { forwardRef } from 'react'

type Variant = 'primary' | 'dark' | 'light'

type Props = {
  href?: string
  variant?: Variant
  /** Trailing arrow that slides right 4px on hover. */
  arrow?: boolean
  /** stage: no height, padding or type size of its own; the caller sizes it (hero stage). */
  size?: 'md' | 'sm' | 'stage'
  className?: string
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
  type?: 'button' | 'submit'
  disabled?: boolean
} & Omit<React.HTMLAttributes<HTMLElement>, 'onClick'>

const FILL: Record<Variant, string> = {
  primary: 'bg-cobalt text-limestone',
  dark: 'bg-slate text-limestone',
  light: 'bg-limestone text-cobalt',
}

/* The hover fill is its own layer fading in, so only opacity animates. */
const HOVER: Record<Variant, string> = {
  primary: 'bg-cobalt-deep',
  dark: 'bg-ink',
  light: 'bg-paper',
}

/**
 * Primary (cobalt), dark (slate, used in the method section) or light (for cobalt
 * backgrounds). Hover deepens the fill, press scales to 0.98.
 */
const Button = forwardRef<HTMLAnchorElement & HTMLButtonElement, Props>(function Button(
  { href, variant = 'primary', arrow = false, size = 'md', className = '', children, type = 'button', ...rest },
  ref,
) {
  const cls = [
    'group/btn relative isolate inline-flex items-center justify-center gap-[0.6em] overflow-hidden whitespace-nowrap',
    'rounded-btn font-medium',
    'transition-transform duration-300 ease-pw-out active:scale-[0.98]',
    size === 'md' && 'text-button h-[clamp(48px,4.4vw,60px)] px-[clamp(22px,1.75vw,32px)]',
    size === 'sm' && 'text-button h-[clamp(42px,3.4vw,50px)] px-[clamp(18px,1.4vw,26px)]',
    FILL[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const inner = (
    <>
      <span
        aria-hidden="true"
        className={`absolute inset-0 -z-10 opacity-0 transition-opacity duration-400 ease-pw-out group-hover/btn:opacity-100 ${HOVER[variant]}`}
      />
      <span>{children}</span>
      {arrow && (
        <span aria-hidden="true" className="inline-block transition-transform duration-400 ease-pw-out group-hover/btn:translate-x-1">
          →
        </span>
      )}
    </>
  )

  if (href) {
    return (
      <a ref={ref} href={href} className={cls} {...rest}>
        {inner}
      </a>
    )
  }
  return (
    <button ref={ref} type={type} className={cls} {...rest}>
      {inner}
    </button>
  )
})

export default Button
