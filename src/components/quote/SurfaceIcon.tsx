/** Small line icons for the surface tiles. Stroke follows the text colour, so they invert when selected. */
export default function SurfaceIcon({ name, className = '' }: { name: string; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      {name === 'driveway' && (
        <g {...common}>
          <path d="M11 4L4 28M21 4l7 24" />
          <path d="M16 6v3M16 13v4M16 21v5" />
        </g>
      )}
      {name === 'patio' && (
        <g {...common}>
          <rect x="4" y="6" width="24" height="20" rx="1.5" />
          <path d="M4 13h24M4 20h24M13 6v7M20 13v7M11 20v6" />
        </g>
      )}
      {name === 'render' && (
        <g {...common}>
          <path d="M5 14L16 5l11 9v13H5z" />
          <path d="M13 27v-7h6v7M9 17h3M20 17h3" />
        </g>
      )}
      {name === 'roof' && (
        <g {...common}>
          <path d="M3 21L16 8l13 13" />
          <path d="M8 16h16M11 13h10M6 26h20" />
        </g>
      )}
      {name === 'decking' && (
        <g {...common}>
          <path d="M4 9h24M4 15h24M4 21h24M4 27h24" />
          <path d="M10 9v6M22 15v6M14 21v6" />
        </g>
      )}
      {name === 'other' && (
        <g {...common}>
          <circle cx="16" cy="16" r="11" />
          <path d="M16 11v10M11 16h10" />
        </g>
      )}
    </svg>
  )
}
