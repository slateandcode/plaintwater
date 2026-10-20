# Plainwater: build prompt

You are building **Plainwater**, a demo website for a fictional high-end pressure washing company, for Slate & Code Studio. It is a portfolio piece that will be screen-recorded for social media, so the bar is Awwwards level: every interaction has to feel deliberate, smooth and expensive. Nothing should look like a template.

Read this whole file before writing any code. Then reply with a short plan (component list, file structure, the order you will build in) and wait for a go-ahead. After that, build phase by phase (see "Build order" at the end). Stop at the end of each phase so it can be reviewed.

---

## 1. Source of truth

- **Figma file key:** `Axflpmxql829F7fT9c2P4m` (file name "Plainwater Cleaning", Page 1).
- If the Figma MCP is connected, use it to pull screenshots, exact values and to export assets. Node IDs:

| Section | Frame name | Node ID |
|---|---|---|
| Hero | Desktop 1 / Hero complete | `20:2` |
| 2. About | Section 2 / About | `22:133` |
| 3. Services | Section 3 / Services | `45:2` |
| 4. Our work | Section 4 / Our work | `46:2` |
| 5. Method (steps) | Section 5 / Method | `48:2` |
| 6. Questions | Section 6 / Before you book | `53:2` |
| 7. Contact and footer | Section 7 / Contact and footer | `50:2` |

- Most frames contain Figma Motion keyframes. Use `get_motion_context` on a frame to read exact timings and easing if you need them. The timings in this document are taken from there.
- **Scale:** every Figma frame is **2562px wide, which is 2x a 1281px desktop**. Divide Figma px values by 2 to get CSS px at a 1281px viewport, then make them fluid (see Typography). Never ship the raw Figma px values.
- Ignore any layer the user has hidden or deleted. Ignore the empty frame also called "Section 2 / About" that sits behind section 3, and ignore the separate "Desktop 1" and "Moodboard" frames.
- Layer names that say "(swap to Neue Montreal)" or "(swap to Apple Garamond)" were set in stand-in fonts inside Figma. In code, use the real fonts listed below.

---

## 2. Stack

- **Next.js**, latest stable, App Router, TypeScript, `src/` directory.
- **React** (whatever version the Next.js release ships with).
- **Tailwind CSS v4** with design tokens declared in `@theme` in `globals.css`.
- **GSAP 3** with `@gsap/react` (`useGSAP`), plus the plugins **ScrollTrigger, SplitText, DrawSVGPlugin and CustomEase**. All GSAP plugins are free now, so install from the public `gsap` package. Register the plugins once, in a client-side `lib/gsap.ts`.
- **Lenis** (`lenis` package) for smooth scrolling, wired into the GSAP ticker so ScrollTrigger stays in sync.
- **zod** for form validation, both client side and server side.
- **Resend** (optional) to email quote requests. If `RESEND_API_KEY` is not set, log the payload on the server and return success, so the demo still works.
- `next/image` for every image and `next/font` for every font.
- Deploy target: Vercel.

Do not add any other animation library. Do not use Framer Motion or Motion for anything. GSAP does everything.

### Suggested structure

```
src/
  app/
    layout.tsx          fonts, metadata, Lenis provider, grain overlay, nav
    page.tsx            section order
    globals.css         tokens, base styles
    api/quote/route.ts  quote form endpoint (or a Server Action)
  components/
    intro/Preloader.tsx
    nav/Nav.tsx, MobileMenu.tsx, Logo.tsx
    sections/Hero.tsx, About.tsx, Services.tsx, Work.tsx, Method.tsx, Questions.tsx, Contact.tsx, Footer.tsx
    ui/Button.tsx, Pill.tsx, SectionTag.tsx, PhotoCard.tsx, Badge.tsx, BeforeAfter.tsx, QuoteWizard/*, Accordion.tsx, WordReveal.tsx
  lib/
    gsap.ts             plugin registration and CustomEase definitions
    motion.ts           shared eases, durations, reduced-motion helper
    content.ts          ALL copy, jobs, services, FAQ, form options
    paths.ts            SVG path data (hero jet, method route, footer jet, logo wave)
public/
  fonts/  images/
```

All copy lives in `lib/content.ts`. Components never hardcode copy.

---

## 3. Design tokens

### Colour

| Token | Hex | Use |
|---|---|---|
| `limestone` | `#ECE8E1` | Main light background |
| `paper` | `#F7F4EE` | Cards, photo borders, form card |
| `slate` | `#2B2E2F` | Main text, dark buttons, active nodes |
| `ink` | `#1F2122` | Dark section background (Our work) |
| `muted` | `#6A6963` | Mono labels and secondary text on light backgrounds |
| `concrete` | `#9A9890` | Rare tertiary |
| `cobalt` | `#1F3BB3` | THE accent. Buttons, jet, pills, section 2 and contact backgrounds |
| `cobalt-deep` | `#14205E` | Peg lip shadows, pressed states |
| `sandstone` | `#D8C6A3` | Accent text on cobalt and ink (second lines of headings) |
| `ghost` | `#DAD5CA` | The method route still ahead, upcoming nodes |
| `ghost-deep` | `#BDB6A8` | Ghost peg lip |

Rule: on light sections cobalt stays at around 5% of the surface. Never introduce new colours, gradients or glows.

### Grain

Every section has a subtle paper grain over its flat colour. Build one fixed, full-viewport overlay (`pointer-events: none`, above content, below the nav and the preloader) using a tiled noise texture (an SVG `feTurbulence` data URI or a small tiled PNG). Target look: grain is visible on flat colour when you look for it, invisible at a glance. Roughly 5 to 7% on light sections and 4 to 5% on dark ones. Tune the blend mode so it reads on limestone, cobalt and ink alike.

This matters for the jet effect too. The jet "eraser" strokes are filled with the section's background colour, and the global grain sits on top of them, so the channel cut into the letters blends in without a flat band.

### Typography

| Role | Font | Notes |
|---|---|---|
| Sans (body, UI, statement, card titles) | **Neue Montreal** (PP Neue Montreal), 400 and 500 | Local files in `public/fonts/neue-montreal/`, loaded with `next/font/local` as `--font-sans` |
| Serif (display headings, step titles, wordmarks, quotes) | **Apple Garamond** if licensed web files are supplied in `public/fonts/serif/`, otherwise **EB Garamond** 400 and 400 italic from `next/font/google` | Expose as `--font-serif`. Build it so swapping is a one-line change. |
| Mono (labels, tags, meta, counters) | **Chivo Mono** 400 and 500 from `next/font/google` | Always uppercase, letter-spacing `0.06em` |

Fluid type scale. Figma px are in brackets; desktop values are Figma divided by 2 at 1281px, scaled with vw and clamped:

| Token | Figma | CSS |
|---|---|---|
| `display` (section headings) | 200 to 210 | `clamp(52px, 8.2vw, 150px)`, line-height 0.92, letter-spacing -0.02em |
| `title` (step titles) | 104 | `clamp(40px, 4.06vw, 76px)`, line-height 1 |
| `statement` (section 2) | 88 | `clamp(30px, 3.43vw, 64px)`, line-height 1.12, letter-spacing -0.03em, weight 500 |
| `card-title` | 72 | `clamp(28px, 2.8vw, 52px)`, letter-spacing -0.03em, weight 500 |
| `question` (FAQ) | 46 | `clamp(20px, 1.8vw, 34px)`, weight 500 |
| `body-lg` | 34 to 36 | `clamp(16px, 1.35vw, 24px)`, line-height 1.45 |
| `body` | 30 to 32 | `clamp(15px, 1.2vw, 20px)`, line-height 1.5 |
| `button` | 30 to 34 | `clamp(14px, 1.15vw, 18px)`, weight 500 |
| `mono` | 17 to 22 | `clamp(11px, 0.78vw, 14px)` uppercase |

Minimums matter. Halving Figma's mono sizes gives 9px, which is too small for the web, so never go below the clamp minimums.

The hero and the method section are exceptions: they use the stage unit system (section 4.1), so their type scales with the stage.

### Spacing, radius, shadow

- Page side padding: `clamp(20px, 4.4vw, 80px)` (Figma 112 at 2562).
- Radius: buttons 10px (Figma 10 at 2x, so 5px), but use 8px at desktop for a crisp look. Pills fully rounded. Cards 16px (Figma 16, keep it). Photo prints 4px.
- Card shadow (photo prints): `0 2px 5px rgba(43,46,47,.06), 0 15px 30px rgba(43,46,47,.18)`.
- Stacked service cards: shadow cast upward, `0 -6px 17px rgba(43,46,47,.12)`.
- Gun: `filter: drop-shadow(8px 22px 22px rgba(26,28,29,.26))` so the shadow follows the cut-out.

---

## 4. Motion system

### Eases (define once with CustomEase in `lib/gsap.ts`)

- `pw.inOut` = `cubic-bezier(0.76, 0, 0.24, 1)`. **The house ease: slow, fast, slow.** Use it for almost everything that moves.
- `pw.soft` = `cubic-bezier(0.65, 0, 0.35, 1)`. Same shape, gentler. Use it for opacity fades that run alongside a `pw.inOut` move.
- `pw.out` = `cubic-bezier(0.16, 1, 0.3, 1)`. Only for small UI feedback (hover, press).
- `back.inOut(1.4)`: only for pops (the badge, method nodes, pegs). Nowhere else.
- Never use default eases, `bounce` or `elastic`.

### Rules

- Animate only `transform`, `opacity`, `clip-path` and SVG stroke (DrawSVG). Never animate width, height, top or left.
- Reveal pattern ("fade up"): from `opacity 0, y: 0.5em to 40px`, to `opacity 1, y 0`. Use `pw.inOut` for y and `pw.soft` for opacity, over 0.9 to 1.2s. Stagger related items by 0.08 to 0.15s.
- Scroll reveals fire once at `start: "top 75%"` unless stated otherwise. Scrubbed animations are called out explicitly per section.
- Every section's sequence ends in a calm hold. Nothing loops except the badge rotation and the review marquee (if ever reintroduced).
- Run SplitText only after `document.fonts.ready`, and call `ScrollTrigger.refresh()` after fonts and images load.
- Clean up every GSAP context on unmount (`useGSAP` handles it if you scope properly). No hydration mismatches: anything measured happens client side after mount.
- **Reduced motion** (`prefers-reduced-motion: reduce`): skip the preloader, turn off Lenis smoothing, render every section in its final state, show the method route fully drawn, and keep the before/after slider usable by drag and keyboard. Build this from day one, not at the end.
- Lenis: `lerp: 0.1`, `smoothWheel: true`, no smooth touch (native touch scrolling on mobile). Stop Lenis while the preloader and the mobile menu are open. Anchor links and "Book a survey" buttons scroll with `lenis.scrollTo` using `pw.inOut` over 1.4s.

### 4.1 Stage units (hero and method only)

The hero and the method section depend on exact geometry: the jet must pass through specific letters, and the route must hit nodes that sit next to text. So on desktop (≥ 1024px) these two sections are built as a **stage**, a fixed 2562-unit coordinate system scaled to the viewport:

```css
/* hero: fit inside the viewport (contain) */
.hero-stage { --u: min(calc(100vw / 2562), calc(100svh / 1378)); width: calc(var(--u) * 2562); height: calc(var(--u) * 1378); }
/* method: scale by width only (it is a tall scrolling section) */
.method-stage { --u: calc(100vw / 2562); width: 100vw; height: calc(var(--u) * 3450); }
```

Every child is absolutely positioned with Figma coordinates times `var(--u)`, for example `left: calc(var(--u) * 517)` and `font-size: calc(var(--u) * 330)`. Write a tiny helper (`u(517)` returns `calc(var(--u) * 517)`) so the code stays readable. Each SVG overlay uses the Figma frame as its viewBox (`0 0 2562 1378` and `0 0 2562 3450`) and fills the stage, so path coordinates can be pasted straight from Figma.

The hero stage is centred in a `100svh` section. Background colour and grain fill whatever space is left around it.

Below 1024px, both sections switch to their own mobile layouts (described per section). Do not shrink the desktop stage onto a phone.

---

## 5. Global elements

### 5.1 Preloader (new, not in Figma: design it from this spec)

Concept: the first rinse.

1. Full-screen limestone panel with grain, above everything. Lenis stopped, body scroll locked.
2. Centre: the Plainwater wordmark (serif caps, `clamp(44px, 9vw, 140px)`), set twice and stacked. The bottom copy is slate. The top copy is a dirty olive-brown (`#57534A` with a little grain) and fully covers the slate one.
3. Under it, a mono line: `EXTERIOR SURFACE RESTORATION`. Bottom right, a mono counter `00` to `100`.
4. The counter is driven by real loading: hero images (gun, both patio photos), fonts and `document.fonts.ready`. Minimum 1.6s, maximum 3s, so it never feels fake-slow.
5. While the counter runs, a thin cobalt jet line (2 to 3px) draws left to right across the middle of the wordmark with DrawSVG, using `pw.inOut`. In sync with the line's head, the dirty copy is clipped away (`clip-path: inset(0 0 0 X%)` with X going 0 to 100). The wordmark is literally washed clean.
6. At 100: hold for 0.25s. Then the wordmark and labels fade up and out (y -20px, 0.5s), and the panel lifts with `clip-path: inset(0 0 100% 0)` over 0.9s using `pw.inOut`.
7. **The hero timeline starts when the lift is about 50% done**, so the two overlap with no dead frame.
8. Show the full intro only on the first visit per session (`sessionStorage`). Repeat visits get a 0.35s limestone fade. Reduced motion: no preloader.

### 5.2 Logo

The wordmark is `PLAINWATER` in serif caps (Figma: 47px in a 330 x 39 group) with a thin wave of water cutting through the letters, the same trick as the hero, at miniature scale. Build it as one component that is reused in the nav, the section 2 header and the preloader end state:

- Text box offset 20 units from the left of the group. The SVG wave spans the full 330-unit width (viewBox `0 0 330 35`, offset y +3).
- Wave path: `M 0 26.91 C 60.97 26.91 83.04 -6.31 133.48 1.07 C 183.91 8.45 180.76 37.98 231.2 34.29 C 278.48 30.6 287.94 8.45 330 4.76`
- Eraser stroke 9.35 in the current background colour, then the jet stroke 2.95 in cobalt (on light backgrounds) or limestone (on cobalt), both with round caps.
- On load and on hover, the wave redraws with DrawSVG (0.8s, `pw.inOut`).

### 5.3 Nav

- Content: Logo · `Services` · `Process` · `Our work` · `Questions` · `Book a survey` button (cobalt, limestone text).
- **The Figma nav still says "Reviews", but the reviews section was removed. Use "Questions" and link it to the FAQ.** Links: Services to #services, Process to #method, Our work to #work, Questions to #questions, Book a survey to #contact (and it should open step 1 of the quote wizard).
- Hero state (desktop): it sits on the hero stage at the Figma positions. Logo group at (156, 74). Links centred at y 84, gap 64, Figma 30px. CTA at (2168, 64), 282 x 80. A hairline rule (slate 22%) at y 176 from x 112 to 2450.
- After about 120px of scroll, it becomes a fixed compact bar: limestone at 85% opacity with `backdrop-filter: blur(12px)`, a hairline bottom border, about 64px tall. It hides on scroll down and slides back on scroll up (translateY, 0.5s, `pw.inOut`).
- Theme switch: every section carries `data-theme="light" | "cobalt" | "dark"`. When the compact nav sits over cobalt or ink, swap its text, logo and CTA to light variants (cross-fade colours, 0.3s).
- Link hover: a 1px underline that draws left to right (`scaleX` 0 to 1, origin left, 0.4s `pw.out`) and leaves right to left.
- Mobile (< 1024px): logo plus a `Menu` pill. It opens a full-screen cobalt overlay with the links in large serif (`clamp(44px, 12vw, 72px)`) fading up with a stagger, mono contact details at the bottom, and a close button. Lock scroll and stop Lenis while it is open.

### 5.4 Section tags and links

Small pill tag top left of some sections: a label in a pill (`slate 8%` fill on light, `limestone 12 to 14%` on cobalt and ink). **No numbers.** The user removed numbered tags, so the contact section's "08" goes too: it is just a `Contact` pill. Top right of most sections is a small text link with a ↗ arrow, which nudges up and right 2px on hover.

### 5.5 Buttons

- Primary: cobalt fill, limestone text, 8px radius, generous padding (Figma: 26 x 44 at 2x). Hover: the fill darkens to `cobalt-deep` and the arrow (if any) slides right 4px. Press: scale 0.98.
- Dark variant: slate fill (used in the method section).
- Text link: cobalt, underlined, with the same underline draw on hover.

---

## 6. Sections

Section order and ids: `#hero`, `#about`, `#services`, `#work`, `#method`, `#questions`, `#contact` (contact plus footer).

### 6.1 Hero (`#hero`, light, Figma `20:2`)

**Composition (stage coordinates, 2562 x 1378, limestone).** Layer order, bottom to top:

1. Background (limestone plus global grain).
2. **Before photo print**: group at (139, 201), about 357 x 423, rotated so it leans left (Figma +5°, CSS `rotate(-5deg)`). Paper frame (padding 14 units), image 300 x 340 = **dirty patio**, caption row: `BEFORE` (mono, slate) left and `JOB 0412` (mono, muted) right. Print shadow.
3. **After photo print**: frame at (2099, 203), 368 x 488, leaning right (Figma -4°, CSS `rotate(4deg)`). Image 340 x 420. It holds **two stacked images: clean patio underneath, dirty patio on top**. Caption: `AFTER` (mono, cobalt) left and `JOB 0412` right.
4. **Badge**: 200 x 200 cobalt circle centred at (2420, 702), overlapping the after card's bottom-right corner. Circular mono text in limestone, `PLAINWATER · EXTERIOR CLEANING · EST. 2014 ·`, on a radius of 75 units (use SVG `textPath` on a circle). A small limestone wave mark in the centre. Soft shadow.
5. **Headline (h1)**: `Plainwater` / `Washing` displayed in uppercase, serif, Figma 330px, slate `#2B2E2F`, centred in the box x 517 to 2046, y 309. Tune line-height (about 1.17) so the cap tops land at about y 386 and y 773. It must be real, selectable text.
6. **Jet eraser**: SVG path, stroke = limestone, width 64, round caps.
7. **Jet water**: same path, stroke = cobalt, width 21, round caps.

   Path (SVG in viewBox `0 0 2562 1378`):
   ```
   <path transform="translate(607 574)" d="M 0 97.63 C 395.17 32.80 1167.60 -62.77 1122 57.63 C 1065 208.13 604.5 174.13 662.5 298.63 C 720.5 423.13 1586 383.13 1633.5 473.13 C 1681 563.13 1236.5 586.63 1284 674.13 C 1331.5 761.63 1827.5 762.63 2057.5 786.13"/>
   ```
   It starts at the nozzle, swoops up through the bottom of PLAINWATER, back across the middle, through WASHING, then curls and exits off the right edge. The eraser cuts a clean channel through the letters with the water running inside it. Verify the cut positions visually against Figma, especially if the serif is EB Garamond rather than Apple Garamond, and nudge the path if a cut lands badly.
8. **Spray droplets**: about 22 small cobalt dots (4 to 12 units, opacity 0.15 to 0.7, a few blurred) in a cone just after the nozzle, around (632 to 835, 607 to 684).
9. **Gun**: transparent PNG of the pressure washer trigger gun with lance, bounding box (124, 417), 550 x 688 (already rotated about -23° in the export). Its nozzle tip must sit exactly at the jet's start (607, 671). Drop-shadow filter.
10. **Nav and top rule** (section 5.3).
11. **Bottom bar**: hairline rule at y 1160 (x 112 to 2450). Bottom left at (112, 1196): primary button `Get a free quote` (to #contact), then the text link `See before and afters` (to #work). At (900, 1202): review block with a round avatar (76 units), the quote in serif italic `“Our patio looks newer than the day it was laid.”` (Figma 38) and the mono line `SARAH K.  ·  SANDSTONE PATIO, RESTORED`.

**Load sequence** (t = 0 when the preloader lift is 50% done). This mirrors the Figma timeline. All moves use `pw.inOut` and fades use `pw.soft`:

| t (s) | What happens |
|---|---|
| 0.2 to 1.8 | Top rule draws left to right (DrawSVG or scaleX) |
| 0.3 to 1.5 | Logo, links and CTA fade down into place (y -12 to 0), staggered 0.1 |
| 0.4 to 2.0 | Headline rises 44 units and fades in (no scale) |
| 0.6 to 1.8 | Before card fades up 48 units and rotates in from +8° of its rest angle |
| 0.8 to 2.0 | After card, same but from -8°. It shows the DIRTY image. |
| 1.4 to 3.0 | Gun glides in from (-720, +180) and scale 0.92 to its rest position |
| 3.0 to 3.4 | **Held beat. Nothing moves.** This pause is what makes the shot land. |
| 3.4 | Fire: gun recoils (-18, +7 units in 0.08s, `power2.out`) then settles back by 4.0 |
| 3.4 to 5.6 | Eraser and jet draw together from the nozzle to the end of the path with DrawSVG, `pw.inOut`, 2.2s. Slow out of the nozzle, fast through the letters, easing out as it exits. |
| 3.4 to 5.4 | Droplets burst in (0.15s) and drift +28 units while fading to 70% |
| 4.6 to 5.8 | **After card wash**: the dirty image's clip-path wipes left to right (`inset(0 0 0 0)` to `inset(0 0 0 100%)`), revealing the clean photo |
| 5.5 to 5.95 | After card label cross-fades from `BEFORE` (slate) to `AFTER` (cobalt) |
| 5.0 to 6.6 | Bottom rule draws |
| 5.4 to 6.5 | CTA row fades up 20 units |
| 5.7 to 6.8 | Review block fades up 20 units |
| 5.8 to 6.7 | Badge pops in: scale 0.3 to 1 with `back.inOut(1.4)` |
| after | Hold. The badge text keeps rotating slowly (one turn per 24s, linear). Nothing else moves. |

**Scroll-out (desktop, subtle):** while the hero scrolls away (scrubbed), the gun and photo prints drift up 6 to 8% slower than the page and the badge rotation speeds up a little. Keep it gentle.

**Interactions:** photo prints straighten a little and lift on hover (rotate toward 0°, y -6px, shadow deepens, 0.6s `pw.out`). Hovering the gun replays the droplet burst. Do not re-run the jet.

**Mobile hero (< 1024px):** its own composition, same concept and same motion order.
- Logo and Menu on top. Headline in two lines, centred, `clamp(56px, 17vw, 120px)`.
- The gun is smaller, enters from the left edge below the first line, and points up and right.
- Write a mobile jet path that leaves the nozzle and passes through each headline line once (the eraser still cuts the letters), then exits right. Get it right visually.
- Only the after card shows (smaller, top right, overlapping the first line's edge) with the wash. The badge sits on its corner. Hide the before card.
- CTA full width at the bottom, review under it, and the timeline compressed by about 20%.
- Use `100svh` so mobile browser UI does not cut the CTA.

### 6.2 About (`#about`, cobalt, Figma `22:133`)

**Layout:** cobalt background with grain.
- Top left: `About` pill tag. Top centre: a small serif `About` (Figma 41) stacked above the Logo in limestone. Top right: link `Our method ↗` (to #method).
- Centre: the statement, Neue Montreal 500, centred, max width about 74% of the viewport (Figma 1900 of 2562), with **inline pills** that flow with the text like words:

> We bring tired **[image pill: dirty driveway]** driveways, patios and render back to how they were first laid. Over **[stat pill: ↗ 1,800+]** surfaces restored so far, from mossy **[image pill: mossy courtyard]** town courtyards to long country drives, every one tested first by a small crew **[round image: crew]** *who set the pressure to the stone, and never the other way round.*

- Every word from "who" onward is `sandstone #D8C6A3`. Everything before it is limestone.
- Image pills: about 2.4em wide and 1em tall, fully rounded, `object-fit: cover`. The crew image is a 1em circle. The stat pill is a translucent limestone (16%) capsule containing a limestone circle with a cobalt ↗ arrow, followed by `1,800+` in Neue Montreal 500 at about 0.48em.
- Bottom: the monogram divider. A hairline (limestone 30%) left and right, a small sandstone dot each side, and a double-ring circle with `PW` in serif in the middle (Figma: y 1170, lines 400 units each).

**Motion: word-by-word fade up.** This must feel like the About section on **https://hartwell-gardens.vercel.app/**. If that project's source is available locally, reuse its word reveal component and match it. Otherwise:
- Split the statement into words with SplitText. The pills are separate tokens in the same flow and are not split.
- On scroll into view (`top 75%`), each word goes from `opacity 0, y 0.45em` to `opacity 1, y 0`, 0.9s, `pw.inOut`, stagger 0.045s in reading order. Pills animate in their slot in the sequence and also scale from 0.6 to 1.
- Then the divider lines draw outward from the centre (1.4s) and the monogram scales from 0.7 to 1 with a fade.
- Tags and link fade in first (0.1 to 0.9s).
- Wrap each word so descenders are not clipped. Keep line breaks natural, with no fixed widths per line.

**Mobile:** statement `clamp(26px, 7.2vw, 40px)`, left aligned; pills scale with the em.

### 6.3 Services (`#services`, light, Figma `45:2`)

**Header:** serif display heading `What we` / `bring back` (slate) top left. Top right, bottom-aligned with the heading: the intro paragraph `Five surfaces, one rule. We test a patch first, then clean at the pressure the material can take, not the pressure the machine can give.`

**Stacking cards: the cards come UP over each other as you scroll down.** Five cards, full content width, about 400px tall at 1281 (Figma 2338 x 800), 16px radius, upward shadow.

Card anatomy:
- Header row, 65px (Figma 130): mono number `(01)` · title (Neue Montreal 500, card-title size) · mono material tags on the right. Hairline under the header.
- Body: description (body-lg, max 700 units wide) on the left, three "what's included" lines below it (mono, each with a hairline above), and a large image on the right (Figma 1180 x 582, 8px radius).

| # | Title | Tags | Fill / text | Description | Included |
|---|---|---|---|---|---|
| 01 | Driveways | BLOCK PAVING · TARMAC · RESIN | `#DCD6CB` / slate | Block paving, tarmac and resin brought back to one even colour. Weeds out of the joints, oil and tyre marks lifted, sand brushed back in. | ROTARY SURFACE CLEAN · OIL AND TYRE MARKS TREATED · JOINTS RE-SANDED |
| 02 | Patios and stone | SANDSTONE · LIMESTONE · PORCELAIN | `paper` / slate | Sandstone, limestone and porcelain cleaned at the pressure the stone can take, then sealed if it needs protecting from the next winter. | TEST PATCH FIRST · BLACK SPOT LICHEN TREATED · OPTIONAL BREATHABLE SEAL |
| 03 | Render and walls | K REND · MONOCOUCHE · BRICK | `slate` / limestone | Soft wash for K Rend, monocouche and painted walls. Algae and green streaks lifted without blasting the finish off the house. | SOFT WASH, NO BLASTING · BIOCIDE AGAINST REGROWTH · WINDOWS AND SILLS RINSED |
| 04 | Roofs and gutters | TILE · SLATE · MOSS REMOVAL | `cobalt` / limestone | Moss removed by hand and soft wash, never a jet straight at the tiles. Gutters cleared and downpipes checked while we are up there. | HAND SCRAPE AND SOFT WASH · GUTTERS AND DOWNPIPES CLEARED · PHOTOS FROM THE ROOF |
| 05 | Decking and fences | HARDWOOD · COMPOSITE · SOFTWOOD | `#E6E1D8` / slate | Hardwood and composite cleaned back to the grain, then oiled or stained so it does not turn green again by spring. | GRAIN-SAFE PRESSURE · ANTI-SLIP TREATMENT · OIL OR STAIN FINISH |

On dark cards (03, 04), mono and secondary text is limestone at 70%. Card 02 uses the clean patio photo.

**Scroll behaviour:**
- Each card is `position: sticky` with `top: calc(navHeight + 24px + index * 65px)`, so each new card stops 65px lower than the last and every earlier card's header strip stays visible. Give each card enough scroll runway (about 70 to 80svh) to slide up from below the fold and settle.
- As card N+1 travels up over card N, card N scales to about 0.96 and gets a 12% darkening overlay, scrubbed to the overlap (`scrub: true`, eased with `pw.inOut`). The cards underneath step back in depth.
- When the last card settles, hold briefly, then the whole stack releases and scrolls on.
- Before the stack starts: the heading lines fade up (y 60 units, staggered 0.15s) and the intro follows.
- Card hover (desktop): image zooms 1.04 inside its mask (1.2s `pw.out`) and the header arrow shifts.

**Mobile:** peek 48px, cards auto height with the image on top (16:10), then title, description and included lines. Keep the stacking.

### 6.4 Our work (`#work`, dark ink, Figma `46:2`)

**Header:** serif display `Same stone.` (limestone) / `Four hours apart.` (sandstone). Top right: `All projects ↗`. Intro right, bottom-aligned (limestone 72%): `Drag the line. Every job on this page is our own, photographed on the day, from the same spot, before we packed the van.`

**Before/after comparison:**
- Full content width, aspect about 2.34 : 1 (Figma 2338 x 1000), 8px radius.
- Clean image underneath. The dirty image on top, clipped with `clip-path: inset(0 calc(100% - var(--pos)) 0 0)`, so dirty is on the LEFT of the line.
- A 2px limestone divider at `--pos`. Pills `BEFORE` top left and `AFTER` top right (ink 55% fill, mono limestone).
- Handle: an 80px cobalt circle centred on the divider with `‹ DRAG ›` in mono limestone and a soft shadow.

**Behaviour:**
1. On entering the viewport (`top 70%`): the frame fades up (y 90 units, scale 0.96 to 1, 1.2s). Then **an automatic wash**: `--pos` starts at 100% (fully dirty, handle at the right edge) and sweeps to 50% over 1.7s with `pw.inOut`. Then a small demo nudge (50 to 40% over 0.8s, back to 50% over 0.8s) to show it moves. The `AFTER` pill fades in as the clean side appears. Then it **stops**.
2. From then on the user controls it. Pointer drag anywhere on the image (use pointer events and `setPointerCapture`), touch drag (`touch-action: pan-y` so vertical page scroll still works), and click to jump with a quick 0.4s `pw.out` glide. The handle scales to 0.92 while dragging.
3. If the user grabs it during the auto-sweep, kill the auto-sweep immediately and hand over control.
4. Accessibility: the handle is `role="slider"` with `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow`, `aria-label="Before and after comparison"`. Arrow keys move ±5%, Shift+Arrow ±10%, Home/End to the ends. Visible focus ring.
5. Cursor `ew-resize` over the image.

**Meta row** under the image: mono label plus a Neue Montreal 500 value, four columns with even gaps. **Job switcher** on the right: counter `01 / 04` plus four thumbnails (the active one has a 3px cobalt outline, the others at 45% opacity, full opacity on hover). Clicking a thumbnail cross-fades both images and the meta values (0.6s) and replays a short sweep from 70% to 50%.

| Job | Before / after | Surface | Time on site | Method | Finish |
|---|---|---|---|---|---|
| 0412 | Sandstone patio (the hero patio photos) | Indian sandstone, 64 m² | 4 hrs 20 min | Rotary clean, low pressure | Sealed, matt |
| 0388 | Block paving driveway | Block paving, 48 m² | 3 hrs 10 min | Rotary clean, joints re-sanded | Kiln-dried sand |
| 0371 | Rendered front of house | K Rend, two storeys | 5 hrs | Soft wash, biocide | Rinsed, no sealant |
| 0354 | Hardwood deck | Hardwood, 22 m² | 2 hrs 40 min | Low pressure, grain-safe | Oiled |

**Mobile:** the image goes full bleed at 4:3. Meta becomes a 2 x 2 grid. Thumbnails sit in a row under it.

### 6.5 Method / steps (`#method`, light, Figma `48:2`)

This is the jet-route section. It should feel like the "How it works" section on **https://hartwell-gardens.vercel.app/** (a thick route that draws as you scroll, with steps on alternating sides), using the cobalt jet as the route. If the Hartwell source is available locally, study its implementation and match the feel.

**Desktop: stage 2562 x 3450 (width-scaled).**
- Serif display heading top left at (104, 230): `Four steps,` (slate) / `no shortcuts.` (cobalt). Top right: `Book a survey ↗`.
- **Ring badge**: a large ring centred at (2490, 540), radius 262, 70-unit band of cobalt at 14%. Mono slate text around it at 75%: `PLAINWATER · EXTERIOR CLEANING · PRESSURE SET TO THE STONE ·`. It is cut off by the right edge on purpose.

**The route.** One SVG in viewBox `0 0 2562 3450`, drawn twice: the ghost route (stroke `ghost`, width 56, round caps) and the jet route on top (stroke `cobalt`, width 56).
```
M 140 700 C 480 700 800 690 900 1000 C 960 1204 1160 1340 1380 1340 C 1640 1340 1760 1120 1620 980 C 1480 840 1240 900 1240 1100 C 1240 1320 1650 1440 1660 1660 C 1660 1880 1560 1990 1280 1990 C 1000 1990 900 2100 900 2320 C 900 2540 1000 2650 1280 2650 C 1560 2650 1660 2760 1660 2980 C 1660 3180 1520 3300 1280 3300
```
That is: one loop between steps 1 and 2, then a clean meander to the end. Keep exactly one loop.

- **Pegs at both ends** (like a peg stuck in the ground): an 88 x 112 oval cap, a lip of the same oval offset (-11, +4) behind it in a darker shade, and a soft ground-shadow ellipse (104 x 30, slate 22%) under it.
  - Start peg at (140, 700): cobalt cap, `cobalt-deep` lip.
  - End peg at (1280, 3300): starts as `ghost` / `ghost-deep` and turns cobalt when the jet arrives.
- **Nodes** on the route at N1 (900, 1000), N2 (1660, 1660), N3 (900, 2320) and N4 (1660, 2980). Each one is a 120-unit circle inside a 140-unit limestone ring (so the route appears to pass behind it). Upcoming state: `ghost` fill, slate number at 50%. Active state: slate fill, limestone number (`01` to `04`, Neue Montreal 500).
- **Progress tip**: a small limestone-ringed cobalt circle with a limestone water-drop icon that rides the head of the drawn jet.
- **Spray droplets**: a few small cobalt dots scattered along the route just after N1 and near the start. They burst in when the tip passes.

**Steps.** Each step is a pill, then a title row, then a description. Steps on the left are right-aligned with their right edge 110 units left of the node. Steps on the right are left-aligned starting 110 units right of the node. The title row is vertically centred on the node.

| # | Side | Block origin | Pill (cobalt, limestone text) | Title (serif; the icon sits inline between the words) | Description (body, slate 72%) |
|---|---|---|---|---|---|
| 01 | left | (170, 855) | Free, about 30 minutes | The [clipboard icon] survey | We walk the job with you, identify the stone and check anything nearby that water could hurt. Written quote within 48 hours. |
| 02 | right | (1770, 1515) | Before we touch the rest | The [droplet icon] test patch | A small hidden corner first, at low pressure. We see how the surface reacts and get your sign-off before going any further. |
| 03 | left | (170, 2175) | Usually done in a day | The [spray lance icon] clean | Rotary cleaner for flat stone, soft wash for render and roofs. Pressure set to the material, never to what the machine can do. |
| 04 | right | (1770, 2835) | 12-month check-in | The [shield with tick icon] seal | Joints re-sanded, sealed if the surface needs it, and we come back after a year to check it is holding up. Then a slate button: `Book a survey →` (to #contact). |

Icons are about 72 units, line style, slate strokes (3.5) with cobalt accents and a light cobalt (18%) fill. Export them from Figma as SVG, or redraw them cleanly.

**Scroll behaviour (scrubbed):**
- The jet route draws with DrawSVG tied to scroll (`scrub: 0.6`), from when the section's top hits about 60% of the viewport to when its bottom reaches about 85%. The ghost route is always fully visible.
- The progress tip follows the drawn head (`getPointAtLength`).
- Compute each node's position along the route once on mount: sample the path and find the length closest to each node's coordinates. As drawn progress passes a node's fraction, the node switches to active (0.5s, scale 0.7 to 1 with `back.inOut(1.4)`) and its step block fades up (y 40 units, 1s). Scrolling back reverses both.
- The end peg turns cobalt when progress reaches 1.
- The ring badge rotates with scroll (0 to -120° across the section) on top of a slow idle drift.
- Heading lines fade up on enter.
- Reduced motion: everything is shown complete with all nodes active.

**Mobile:** drop the stage. A single vertical route down the left gutter (a slightly wavy cobalt line over a ghost line, 10 to 12px), starting with a peg and ending with a peg. Nodes on the line, step blocks stacked to the right of it, left-aligned. Same scrubbed draw and node activation.

### 6.6 Questions (`#questions`, light, Figma `53:2`)

**Layout:** two columns.
- Left column (sticky while the accordion scrolls, `top: navHeight + 48px`): serif display `Before` (slate) / `you book.` (cobalt), the intro `The six things people ask us before a first job. If yours is not here, send us a photo and ask.`, and a primary button `Send us a photo →` that opens the quote wizard at its photo step (or #contact).
- Top right link: `Ask us anything ↗`.
- Right column: the accordion.

**Accordion:** rows separated by hairlines (slate 20%). Each row has a mono `(01)`, the question (Neue Montreal 500, question size), and a 72-unit circle icon on the right (outline slate 25% with a plus). The open row's circle fills cobalt and the plus rotates 45° into a limestone ×. One row open at a time, the first open by default. The answer is body text (slate 75%) up to about 900 units wide, with a mono cobalt tag line under it.

| # | Question | Answer | Tag line |
|---|---|---|---|
| 01 | Will pressure washing damage my patio? | Not the way we do it. We identify the stone, run a test patch at low pressure and only go as high as the surface allows. Sandstone and render get a soft wash, never a blast. | LOW PRESSURE FIRST · SOFT WASH FOR SOFT STONE |
| 02 | Do you need my water and electricity? | Usually not. The van carries its own water and a petrol machine, so all we need is access. On longer jobs we might ask to top up from an outside tap. | SELF-SUFFICIENT VAN · NO EXTENSION LEADS |
| 03 | How long will it stay clean? | Most patios and drives stay clean for two to three years. A biocide treatment slows regrowth, and sealing porous stone buys more time again. | BIOCIDE INCLUDED · SEALING ON REQUEST |
| 04 | What happens to the run-off and my plants? | We cover beds and lawn edges, rinse plants before and after, and keep dirty water away from drains wherever the council asks us to. | PLANTS PROTECTED · RUN-OFF CONTROLLED |
| 05 | Do I need to be home? | Only for the survey and to sign off the test patch. After that we just need side access and somewhere to park the van. | ACCESS IS ENOUGH |
| 06 | Are you insured? | Yes. We are fully insured for public liability, and the certificate comes with every written quote. | CERTIFICATE WITH EVERY QUOTE |

**Motion:**
- On enter: heading lines fade up, then the rows reveal one by one (hairline draws left to right, the row fades up 30 units, stagger 0.12s), then row 01 opens.
- Open and close animate height smoothly (GSAP height auto, or CSS `grid-template-rows: 0fr to 1fr` driven by a class). 0.7s `pw.inOut`, with the answer fading up slightly after the height starts. The icon rotates and fills over 0.5s.
- Accessible accordion: buttons with `aria-expanded` and `aria-controls`, answers in regions, full keyboard support.

**Mobile:** single column, heading on top, not sticky.

### 6.7 Contact and footer (`#contact`, cobalt, Figma `50:2`)

**Layout:**
- `Contact` pill tag top left (no number) and `Instagram ↗` top right.
- Left column: serif display in three lines, `Got a surface` / `that's seen` (limestone) / `better days?` (sandstone). Under it, two contact columns with mono labels: `EMAIL` hello@plainwater.co and `HOURS` Mon to Sat, 8am to 6pm.
- Right column: **the quote card** (paper, 16px radius, deep soft shadow, about 520px wide on desktop).

**Quote wizard: click-through, not a free-text form.** Every step except the contact details is tap-to-choose.

Card header: `Get a written quote` (Neue Montreal 500), mono `REPLY WITHIN 48 HRS`, a segmented progress bar (one segment per step; done segments cobalt, the current one animating its fill), and a mono `STEP 2 OF 6`. A `Back` text button appears from step 2.

| Step | Question | Type | Options |
|---|---|---|---|
| 1 | What needs cleaning? | Multi-select tiles, at least 1, then Continue | Driveway · Patio · Render and walls · Roof and gutters · Decking and fences · Something else. Each tile has a small line icon, selected = cobalt fill with limestone text and icon, and a tick in the corner. |
| 2 | Roughly how big is it? | Single select, auto-advances | Small: up to 20 m², a path or small patio · Medium: 20 to 60 m², a typical patio or single drive · Large: over 60 m², a double drive or big garden · Not sure, you tell me at the survey |
| 3 | What's it like right now? | Single select, auto-advances | Just grubby · Green and mossy · Black spots and lichen · Oil, rust or tyre marks · Not sure |
| 4 | Anything extra? | Multi-select, optional, then Continue | Sealing · Re-sanding the joints · Gutter clear · Windows and sills rinsed · Nothing extra |
| 5 | When are you thinking? | Single select, auto-advances | As soon as possible · Within the next month · Just getting prices for now |
| 6 | Where should we send it? | The ONLY typed fields | First name · Postcode (UK format check) · a toggle between Phone and Email, then that one field. Optional photo upload: dropzone `Add a photo of the area` / `IT SPEEDS UP THE QUOTE`, images only, up to 3, 10 MB each, thumbnail previews with remove. |
| 7 | Review | Summary | A compact summary of every answer, each with an edit link back to its step, then the primary button `Send for a quote →`. |

**Wizard behaviour:**
- Single-select steps auto-advance 350ms after a tap, after a brief selected-state flash.
- Step transitions: the outgoing step slides left 24px and fades (0.35s). The incoming step comes in from the right (0.45s, `pw.inOut`). The card's height animates smoothly to the new content. Moving back reverses the direction.
- Option tiles: hover lifts 2px with a border tint. Selected fills cobalt. Ticks draw in with DrawSVG.
- Keyboard: single-select groups are `role="radiogroup"` with arrow keys, multi-select tiles are checkboxes, Enter continues, and focus moves to each new step's heading. Screen readers hear the step changes (`aria-live="polite"`).
- Persist progress in `sessionStorage` so a refresh does not lose answers.
- Validation with zod. Show errors inline under the field in plain language, never as alerts.
- Submit: POST to `/api/quote` (or a Server Action) as multipart (answers plus photos). The server validates with the same zod schema, includes a hidden honeypot field, and applies a simple rate limit by IP. If `RESEND_API_KEY` is set, email a nicely formatted summary with the photos attached. If not, log it and return ok.
- Success state: the card content fades out, a thin cobalt jet line draws across the card, and the text `Thanks, {first name}.` / `We'll send a written quote within 48 hours.` fades up, with a small `Start a new quote` link. Failure state: an inline message and a retry button, and nothing entered is lost.
- Any "Book a survey" or "Get a free quote" button on the page scrolls here and focuses step 1. "Send us a photo" in the FAQ jumps to step 6's upload with the earlier steps optional.

**Footer** (same cobalt section, under the contact block):
- **Giant wordmark** `PLAINWATER` in serif caps, limestone, spanning the content width (Figma 380px in a 2562 frame, x 103 to 2460, y 1314).
- **Jet through the wordmark**, the same trick as the hero, in reverse colours: eraser stroke cobalt (width 76) and water stroke limestone (width 24). Path in the section's coordinate space (viewBox `0 0 2562 1863`, or scale it to the wordmark box):
  ```
  <path transform="translate(-60 1341)" d="M 0 218.7 C 495.54 218.7 674.88 -51.3 1084.8 8.7 C 1494.72 68.7 1469.1 308.7 1879.02 278.7 C 2263.32 248.7 2340.18 68.7 2682 38.7"/>
  ```
  It enters off the left edge, waves through the letters and exits right.
- Footer row: hairline (limestone 25%), then in mono limestone 70%: `© 2026 PLAINWATER` · `FULLY INSURED` · `PRIVACY` · `SITE BY SLATE & CODE` (not in Figma; add it as the studio credit and leave the link as a `STUDIO_URL` constant in `content.ts` to fill in) · `BACK TO TOP ↑` (Lenis `scrollTo(0)`).

**Motion:**
- Heading lines fade up (stagger 0.15s), contact details follow.
- The quote card rises 100 units with its inner header and step 1 staggering in.
- The wordmark rises 90 units at `top 85%` of its own trigger. Then the eraser and water draw through it together over 2s with `pw.inOut`. This is the page's closing shot, the bookend to the hero, so give it room.
- The footer row fades in last.

**Mobile:** heading, contact details, then the quote card at full width. The wordmark scales to the screen width with a mobile jet path through it. The footer row stacks.

---

## 7. Assets

Put real files in `public/images/` (AVIF/WebP through `next/image`, sized properly, `priority` only for hero images). Until a file exists, render a solid placeholder block in the right colour and aspect ratio, and keep a list of missing assets in the README.

| Asset | Source | Notes |
|---|---|---|
| `hero/gun.png` | Figma node `20:3` ("Washer Gun 1"), export as PNG @2x, transparent | Nozzle tip must align with the jet start |
| `patio-dirty.jpg` and `patio-clean.jpg` | Supplied by the user (same shot, identical framing) | Used in the hero prints, the services card 02 and work job 0412. As a fallback only, export the dirty image from the before card in `20:2` and the clean image from node `43:9`. The Figma clean copy is low resolution, so replace it as soon as the full-size file is supplied. |
| Section 2 pills | Dirty driveway, mossy courtyard, crew portrait | Placeholders until supplied |
| Services images 01, 03, 04, 05 | Driveway, render, roof, decking | About 2:1 |
| Work jobs 0388, 0371, 0354 | Before/after pairs with identical framing | About 2.34:1, plus thumbnails |
| Review avatar | | Round |
| Step icons (4) | Figma node `48:2`, groups named "Icon / ..." | SVG |
| Favicon / OG image | Generate from the logo on limestone | 1200 x 630 OG image with the hero composition |

---

## 8. Quality bar

**Feel**
- Everything moves on the house ease. Nothing linear except the badge's rotation and DrawSVG scrubbing. No jank on a mid-range laptop at 60fps.
- Every section has a clear hero moment: hero = the shot through the letters, About = words rising, Services = cards stacking up, Work = the auto-wash, Method = the route drawing node to node, Questions = row one opening, Contact = the wizard and then the jet through the footer wordmark.
- No em dashes anywhere in the site copy. Use the copy in this file exactly.

**Responsive:** test at 390, 768, 1024, 1281, 1440, 1920 and 2560 widths. No horizontal scroll at any width. Nothing important hidden behind mobile browser bars.

**Accessibility:** semantic landmarks, one h1 (hero), logical heading order, alt text on every image, visible focus rings (2px cobalt, offset 3px; limestone on cobalt), full keyboard use of the nav, slider, accordion and wizard. Check contrast for sandstone text on cobalt and for mono muted text, and darken slightly if a combination fails AA for body sizes.

**Performance:** Lighthouse mobile ≥ 90 performance, ≥ 95 accessibility, best practices and SEO. LCP under 2.5s, CLS under 0.05. Fonts with `display: swap` and size-adjusted fallbacks to avoid layout shift. Below-the-fold sections can lazy-mount their GSAP setup.

**SEO:** title `Plainwater | Pressure washing, done properly`. Description: `Patios, driveways, render and roofs cleaned at the pressure the surface can take. Test patch first, written quote in 48 hours.` Open Graph and Twitter cards, `LocalBusiness` JSON-LD with the fictional details, `sitemap.ts` and `robots.ts`.

---

## 9. Build order

Stop after each phase and summarise what was built and what to review.

1. **Foundation.** Scaffold, tokens, fonts, grain overlay, Lenis plus GSAP setup with custom eases, reduced-motion helper, `content.ts`, `paths.ts`, Logo component, Nav (desktop and mobile), buttons, pills, section shells with ids and themes.
2. **Hero.** Static stage first and checked against the Figma screenshot of `20:2` at 1440 and 1920. Then the full load timeline, the eraser cut, the wash, the badge, scroll-out, then the mobile hero.
3. **Preloader**, wired so the hero timeline starts mid-lift.
4. **About** (word reveal plus pills plus divider) and **Services** (sticky stacking cards).
5. **Our work** (auto-wash slider plus job switcher) and **Method** (scrubbed route, nodes, pegs, tip, ring, mobile route).
6. **Questions** (sticky column plus accordion) and **Contact** (quote wizard plus API route plus success state) and **Footer** (wordmark jet).
7. **QA pass**: every width listed above, reduced motion, keyboard-only run, Lighthouse, a check of every section against its Figma frame, and a missing-assets list in the README.

If anything in this file conflicts with the Figma file, this file wins on behaviour and copy, and Figma wins on visual detail (spacing, sizes, colours). Ask before inventing anything that is not covered here.
