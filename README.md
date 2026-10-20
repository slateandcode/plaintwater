# Plainwater

Demo site for a fictional high-end pressure washing company. A Slate & Code Studio portfolio piece.
Built from `PLAINWATER_BUILD_PROMPT.md` and the Figma file `Axflpmxql829F7fT9c2P4m`.

Next.js 16 (App Router) · Tailwind CSS v4 · GSAP 3 (ScrollTrigger, SplitText, DrawSVG, CustomEase) · Lenis · zod · Resend (optional).

```bash
npm install
npm run dev        # http://localhost:3310
npm run build
```

Copy `.env.example` to `.env.local` to email quote requests through Resend (`RESEND_API_KEY`, `QUOTE_TO_EMAIL`, `QUOTE_FROM_EMAIL`, the from domain must be verified in Resend). Without a key the server logs the payload and returns success.

### Quote requests

- `POST /api/quote`, multipart: `answers` (JSON) and up to three `photos`. Validated with the same zod schema as the wizard (`src/lib/quote.ts`), a honeypot field (`company`, silently accepted and dropped) and a per-instance rate limit (5 per 10 minutes per IP).
- Photos are scaled to 2000px JPEG in the browser before upload, so a request stays under Vercel's 4.5 MB function body limit. A file the browser cannot decode (some HEIC) is sent as it is and may hit that limit.
- Wizard progress (not photos) is kept in `sessionStorage` under `pw-quote`.

## Where things live

- `src/lib/content.ts`: every word of copy, the jobs, services, FAQ and quote options. `STUDIO_URL` is the footer credit link.
- `src/lib/paths.ts`: SVG path data (hero jet, method route, footer jet, logo wave) in Figma coordinates.
- `src/lib/gsap.ts`: plugin registration and the house eases (`pw.inOut`, `pw.soft`, `pw.out`).
- `src/lib/motion.ts`: durations, the fade-up reveal, reduced-motion helpers.
- `src/lib/stage.ts`: `u(n)` for the hero and method stages (Figma px times `--u`).
- `src/app/fonts.ts`: fonts. The display serif is a one-line swap there.

## Fonts

- **Neue Montreal** (400, 500) and **Apple Garamond** (400) are converted from the locally installed files with `python scripts/build-fonts.py "%LOCALAPPDATA%/Microsoft/Windows/Fonts"` (subset to Latin, woff2). Check the web licence for Apple Garamond before a public launch; swapping to EB Garamond is one line in `fonts.ts`.
- **EB Garamond** (Google) is used where Figma uses it: the logo wordmark and the italic quotes (there is no Apple Garamond italic).
- **Chivo Mono** (Google) for labels.

## Missing assets

Placeholders render as solid blocks in the right colour and aspect ratio until these arrive.

| Asset | Used in | Status |
|---|---|---|
| `patio-dirty.jpg`, `patio-clean.jpg` | Hero prints, services 02, work job 0412 | Supplied |
| `hero/gun.png` | Hero | Supplied (Figma node `20:3`) |
| `crew-at-work.jpg` | About crew pill | Supplied ("Hero image.png"), crop to taste |
| Dirty driveway, mossy courtyard | About image pills | Missing |
| Driveway, render, roof, decking photos (about 2:1) | Services 01, 03, 04, 05 | Missing |
| Before/after pairs for jobs 0388, 0371, 0354 (about 2.34:1, identical framing) plus thumbnails | Our work | Missing |
| Reviewer avatar (round) | Hero review | Missing |
| Favicon and OG image | Metadata | To generate |
| Privacy page | Footer "Privacy" (plain text for now) | Missing |

## QA (2026-10-17)

Run against the production build (`npm run build && npm run start:qa`, port 3311) in headless Chrome.

- **Widths** 390, 768, 1024, 1281, 1440, 1920, 2560: no horizontal scroll, no console errors.
- **Reduced motion**: no preloader, Lenis smoothing off, every section in its final state (route drawn, all nodes lit, After photo washed). Only intentionally hidden things stay hidden (closed FAQ answers, inactive job photos, hover layers).
- **Keyboard**: one pass reaches every control once in reading order, with a visible focus ring. Scroll reveals use opacity only, so content waiting to be revealed is still focusable (focusing it scrolls it into view and plays its reveal). The compact nav is inert at the top of the page, where the hero carries the nav.
- **Contrast**: body and label combinations pass AA. The one exception is About's "pencilled in" starting state (words at 24% before they ink in), which is the Hartwell model by design; the text is fully readable to assistive tech.
- **Lighthouse** (mobile / desktop): Accessibility 96 / 96, Best practices 100 / 100, SEO 100 / 100, Performance 87 / 100. Mobile LCP is the hero headline at first paint (about 0.3s observed, 2.1s with applied throttling); Lighthouse's simulated model reports about 4s because it charges the whole JS bundle to it. CLS is effectively 0.
- **SEO**: title and description, Open Graph and Twitter cards with `/og.png` (a capture of the hero), `LocalBusiness` JSON-LD, `sitemap.xml`, `robots.txt`, favicon (`icon.svg`) and `apple-icon.png`.

Below-the-fold sections build their GSAP timelines only when they come within about 1.5 screens (`useNear` in `src/lib/motion.ts`), and the quote wizard loads as its own chunk then, which keeps the main thread quiet while the page loads.
