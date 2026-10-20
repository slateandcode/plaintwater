import type { Metadata, Viewport } from 'next'
import { sans, serif, garamond, mono } from './fonts'
import { SITE } from '@/lib/content'
import SmoothScroll from '@/components/providers/SmoothScroll'
import Nav from '@/components/nav/Nav'
import Preloader from '@/components/intro/Preloader'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: 'en_GB',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Plainwater: a jet of water washing through the word Plainwater' }],
  },
  twitter: { card: 'summary_large_image', title: SITE.title, description: SITE.description, images: ['/og.png'] },
  alternates: { canonical: '/' },
}

/* Structured data for the (fictional) business. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE.url}/#business`,
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  email: SITE.email,
  image: `${SITE.url}/og.png`,
  foundingDate: String(SITE.founded),
  areaServed: SITE.area,
  priceRange: '££',
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '08:00',
    closes: '18:00',
  },
  sameAs: [SITE.instagram],
}

export const viewport: Viewport = {
  themeColor: '#ECE8E1',
}

/*
  Runs before first paint: marks JS as available, measures the real viewport
  width (without the scrollbar) for the stage unit, and picks the intro so
  nothing flashes first: the full preloader on the first visit of a session,
  a short fade on repeat visits, none under reduced motion.
*/
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');d.style.setProperty('--vw',d.clientWidth+'px');try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add(sessionStorage.getItem('pw-intro-seen')?'intro-repeat':'intro-pending');if('scrollRestoration' in history)history.scrollRestoration='manual';}}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${sans.variable} ${serif.variable} ${garamond.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SmoothScroll>
          <Preloader />
          <Nav />
          {children}
        </SmoothScroll>
      </body>
    </html>
  )
}
