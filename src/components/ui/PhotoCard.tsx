import Image from 'next/image'

type Props = {
  /** Photo underneath (or the only photo). */
  src: string
  alt: string
  /** Optional photo on top, clipped away by the wash (the after print's dirty layer). */
  overlay?: { src: string; alt: string }
  job: string
  /** Caption labels. Two labels cross-fade (BEFORE in slate, then AFTER in cobalt). */
  labels: { text: string; tone: 'slate' | 'cobalt'; hidden?: boolean }[]
  /** Photo size in card units (Figma px). */
  image: { w: number; h: number }
  /** Paper padding in card units: top, sides, bottom. */
  pad?: [number, number, number]
  sizes: string
  className?: string
  /** Load straight away (above the fold). */
  eager?: boolean
}

/**
 * A paper print: photo in a paper frame with a mono caption row. Sized in card
 * units (`--cu`, stage units times `--print-scale`), so the same print works at
 * full size on the desktop stage and scaled down on the mobile board.
 */
export default function PhotoCard({ src, alt, overlay, job, labels, image, pad = [14, 14, 16], sizes, className = '', eager }: Props) {
  const loading = eager ? 'eager' : 'lazy'
  const cu = (n: number) => `calc(var(--cu) * ${n})`
  return (
    <div
      className={`print relative ${className}`}
      style={{ padding: `${cu(pad[0])} ${cu(pad[1])} ${cu(pad[2])}` }}
      data-print
    >
      <div className="relative overflow-hidden" style={{ width: cu(image.w), height: cu(image.h), borderRadius: cu(2) }}>
        <Image src={src} alt={alt} fill sizes={sizes} loading={loading} className="object-cover" />
        {overlay && (
          // Rendered washed away (the final state); the hero timeline brings it back and wipes it off.
          <div className="absolute inset-0" style={{ clipPath: 'inset(0% 0% 0% 100%)' }} data-dirty>
            <Image src={overlay.src} alt={overlay.alt} fill sizes={sizes} loading={loading} className="object-cover" />
          </div>
        )}
      </div>
      <div className="print-caption mono relative flex justify-between whitespace-nowrap">
        <span className="relative">
          {labels.map((l, i) => (
            <span
              key={l.text}
              data-label={l.text.toLowerCase()}
              className={`${i > 0 ? 'absolute top-0 left-0' : ''} font-medium ${l.tone === 'cobalt' ? 'text-cobalt' : 'text-slate'}`}
              style={l.hidden ? { opacity: 0 } : undefined}
              aria-hidden={l.hidden || undefined}
            >
              {l.text}
            </span>
          ))}
        </span>
        <span className="text-muted">{job}</span>
      </div>
    </div>
  )
}
