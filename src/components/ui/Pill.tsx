type Props = {
  children: React.ReactNode
  className?: string
  /** tag: the section tag (theme-tinted fill). solid: cobalt with limestone text (method steps). glass: ink at 55% (image labels). */
  tone?: 'tag' | 'solid' | 'glass'
  as?: 'span' | 'p' | 'div'
}

const TONE = {
  tag: 'bg-[var(--tag-fill)] text-current',
  solid: 'bg-cobalt text-limestone',
  glass: 'bg-ink/55 text-limestone backdrop-blur-sm',
}

/** A fully rounded mono label. */
export default function Pill({ children, className = '', tone = 'tag', as: Tag = 'span' }: Props) {
  return (
    <Tag
      className={`mono inline-flex items-center rounded-full px-[1.1em] py-[0.62em] leading-none whitespace-nowrap ${TONE[tone]} ${className}`}
    >
      {children}
    </Tag>
  )
}

/** Section tag, top left of some sections. No numbers. Set in sans, as Figma has it. */
export function SectionTag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`inline-flex items-center rounded-full bg-[var(--tag-fill)] px-[1.08em] py-[0.58em] text-[clamp(12px,0.94vw,16px)] leading-none whitespace-nowrap ${className}`}
    >
      {children}
    </p>
  )
}
