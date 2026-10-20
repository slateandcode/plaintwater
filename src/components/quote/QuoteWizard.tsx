'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'
import { QUOTE } from '@/lib/content'
import { LOGO_WAVE } from '@/lib/paths'
import { useSite } from '@/lib/site'
import {
  PHOTO_MAX_BYTES,
  PHOTO_MAX_COUNT,
  contactSchema,
  quoteSchema,
  summarise,
  type QuoteAnswers,
} from '@/lib/quote'
import SurfaceIcon from './SurfaceIcon'

const S = QUOTE.steps
const E = QUOTE.errors
const TOTAL = 6
const REVIEW = 7
const STORE = 'pw-quote'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7
type Contact = QuoteAnswers['contact']
type State = Omit<QuoteAnswers, 'contact' | 'company'> & { contact: Contact }
type Photo = { file: File; url: string }
type Status = 'idle' | 'sending' | 'error' | 'done'

const EMPTY: State = {
  surfaces: [],
  extras: [],
  contact: { firstName: '', postcode: '', via: 'phone', phone: '', email: '' },
}

const QUESTION: Record<Step, string> = {
  1: S.surfaces.question,
  2: S.size.question,
  3: S.condition.question,
  4: S.extras.question,
  5: S.timing.question,
  6: S.contact.question,
  7: S.review.question,
}

/** Big phone photos are scaled down before upload so a request stays small. Undecodable files go as they are. */
async function shrink(file: File, max = 2000): Promise<File> {
  try {
    const bmp = await createImageBitmap(file)
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
    if (k === 1 && file.size < 1.5 * 1024 * 1024) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * k)
    canvas.height = Math.round(bmp.height * k)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

/**
 * The click-through quote. Every step but the contact details is tap to
 * choose. Single-choice steps advance on their own a beat after a tap;
 * multi-choice steps have Continue. Answers survive a refresh (sessionStorage,
 * photos excepted) and are validated with the same schema the server uses.
 */
export default function QuoteWizard() {
  const root = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const id = useId().replace(/:/g, '')

  const [step, setStep] = useState<Step>(1)
  const [a, setA] = useState<State>(EMPTY)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [failure, setFailure] = useState('')
  const [returnToReview, setReturnToReview] = useState(false)
  const [announce, setAnnounce] = useState('')
  const honeypot = useRef<HTMLInputElement>(null)

  const busy = useRef(false)
  const pending = useRef<{ dir: number; h0: number; focus: boolean } | null>(null)
  const [restored, setRestored] = useState(false)

  // ---- Persistence ----
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? 'null')
      if (saved?.a) {
        setA({ ...EMPTY, ...saved.a, contact: { ...EMPTY.contact, ...saved.a.contact } })
        if (saved.step >= 1 && saved.step <= REVIEW) setStep(saved.step)
      }
    } catch {}
    setRestored(true)
  }, [])
  // Saves only once the restore has been applied, so a fresh mount never overwrites what was stored.
  useEffect(() => {
    if (!restored) return
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ a, step }))
    } catch {}
  }, [a, step, restored])

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos])

  const { contextSafe } = useGSAP({ scope: root })

  // ---- Moving between steps ----
  const go = contextSafe((next: Step, opts: { focus?: boolean } = {}) => {
    if (busy.current || next === step) return
    const dir = next > step ? 1 : -1
    setErrors({})
    const h0 = body.current!.offsetHeight
    pending.current = { dir, h0, focus: opts.focus ?? true }
    if (prefersReducedMotion()) {
      setStep(next)
      return
    }
    busy.current = true
    gsap.to(panel.current, {
      x: -24 * dir,
      autoAlpha: 0,
      duration: 0.35,
      ease: EASE.soft,
      onComplete: () => setStep(next),
    })
  })

  // After the new step renders: grow or shrink the card to it, slide it in, move focus.
  useLayoutEffect(() => {
    const p = pending.current
    if (!p) return
    pending.current = null
    const n = step === REVIEW ? TOTAL : step
    setAnnounce(step === REVIEW ? QUOTE.reviewStep : QUOTE.announce(n, TOTAL, QUESTION[step]))
    const done = () => {
      busy.current = false
      if (p.focus) heading.current?.focus({ preventScroll: true })
    }
    if (prefersReducedMotion()) return done()
    const h1 = panel.current!.offsetHeight
    gsap.fromTo(body.current, { height: p.h0 }, { height: h1, duration: 0.45, ease: EASE.inOut, clearProps: 'height' })
    gsap.fromTo(panel.current, { x: 24 * p.dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.45, ease: EASE.inOut, onComplete: done })
    // The current segment fills
    gsap.fromTo(root.current!.querySelector(`[data-seg="${n}"] span`), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: EASE.inOut })
  }, [step])

  const next = (from: Step) => {
    if (returnToReview && from < REVIEW) {
      setReturnToReview(false)
      return go(REVIEW)
    }
    go((from + 1) as Step)
  }

  // ---- Requests from elsewhere: "Book a survey" (step 1), "Send us a photo" (step 6) ----
  const request = useSite((s) => s.quoteRequest)
  const lastNonce = useRef<number | null>(null)
  useEffect(() => {
    if (!request || request.nonce === lastNonce.current) return
    lastNonce.current = request.nonce
    if (status === 'done') reset(false)
    const target = request.step as Step
    if (target === 6) setA((v) => ({ ...v, photoFirst: true }))
    if (target === step) {
      // Already there: just bring focus once the page has scrolled.
      setTimeout(() => heading.current?.focus({ preventScroll: true }), 1450)
      return
    }
    go(target, { focus: false })
    setTimeout(() => heading.current?.focus({ preventScroll: true }), 1450)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  // ---- Answers ----
  const toggle = (key: 'surfaces' | 'extras', value: string) => {
    setErrors({})
    setA((v) => {
      const has = v[key].includes(value)
      let list = has ? v[key].filter((x) => x !== value) : [...v[key], value]
      // "Nothing extra" excludes the rest, and the rest exclude it
      if (key === 'extras') list = value === 'none' && !has ? ['none'] : list.filter((x) => x !== 'none' || value === 'none')
      return { ...v, [key]: list }
    })
  }

  const choose = (key: 'size' | 'condition' | 'timing', value: string, advance: boolean, from: Step) => {
    setA((v) => ({ ...v, [key]: value }))
    if (advance) setTimeout(() => next(from), 350) // a brief selected flash, then on
  }

  const setContact = (patch: Partial<Contact>) => {
    setErrors({})
    setA((v) => ({ ...v, contact: { ...v.contact, ...patch } }))
  }

  // ---- Photos ----
  const addPhotos = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.some((f) => !f.type.startsWith('image/'))) return setErrors({ photos: E.photoType })
    if (list.some((f) => f.size > PHOTO_MAX_BYTES)) return setErrors({ photos: E.photoSize })
    if (photos.length + list.length > PHOTO_MAX_COUNT) return setErrors({ photos: E.photoCount })
    setErrors({})
    const shrunk = await Promise.all(list.map((f) => shrink(f)))
    setPhotos((p) => [...p, ...shrunk.map((file) => ({ file, url: URL.createObjectURL(file) }))])
  }
  const removePhoto = (i: number) =>
    setPhotos((p) => {
      URL.revokeObjectURL(p[i].url)
      return p.filter((_, j) => j !== i)
    })

  // ---- Validation per step ----
  const validate = (s: Step) => {
    if (s === 1 && !a.photoFirst && a.surfaces.length === 0) {
      setErrors({ surfaces: E.surfaces })
      return false
    }
    if (s === 6) {
      const r = contactSchema.safeParse(a.contact)
      if (!r.success) {
        const errs: Record<string, string> = {}
        r.error.issues.forEach((i) => (errs[String(i.path[0])] ??= i.message))
        setErrors(errs)
        root.current?.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus()
        return false
      }
    }
    return true
  }

  const submitStep = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (step === REVIEW) return send()
    if (!validate(step)) return
    next(step)
  }

  // ---- Sending ----
  const send = async () => {
    const payload = { ...a, company: honeypot.current?.value ?? '' }
    const parsed = quoteSchema.safeParse(payload)
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.path[0]
      go(first === 'contact' ? 6 : 1)
      return
    }
    setStatus('sending')
    setFailure('')
    const form = new FormData()
    form.append('answers', JSON.stringify(parsed.data))
    photos.forEach((p) => form.append('photos', p.file, p.file.name))
    try {
      const res = await fetch('/api/quote', { method: 'POST', body: form })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) throw new Error(json.error === 'rate' ? E.rate : E.send)
      setStatus('done')
      try {
        sessionStorage.removeItem(STORE)
      } catch {}
    } catch (err) {
      setFailure(err instanceof Error && err.message === E.rate ? E.rate : E.send)
      setStatus('error')
    }
  }

  const reset = (focus = true) => {
    setA(EMPTY)
    setPhotos([])
    setErrors({})
    setStatus('idle')
    setFailure('')
    setReturnToReview(false)
    pending.current = { dir: -1, h0: body.current?.offsetHeight ?? 0, focus }
    setStep(1)
  }

  // ---- Success: content out, a jet line draws across the card, the thanks rises ----
  useLayoutEffect(() => {
    if (status !== 'done') return
    const el = root.current!
    if (prefersReducedMotion()) return
    gsap
      .timeline()
      .fromTo(el.querySelector('[data-success-line]'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 1.1, ease: EASE.inOut })
      .fromTo(el.querySelectorAll('[data-success-copy]'), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: EASE.inOut }, 0.6)
    el.querySelector<HTMLElement>('[data-success-title]')?.focus({ preventScroll: true })
  }, [status])

  const segN = step === REVIEW ? TOTAL + 1 : step

  return (
    <div ref={root} data-theme="light" className="quote-card relative overflow-hidden rounded-card bg-paper text-slate">
      <p className="sr-only" aria-live="polite">
        {status === 'done' ? QUOTE.success.title(a.contact.firstName) : announce}
      </p>

      {status === 'done' ? (
        <div className="flex min-h-[360px] flex-col justify-center gap-5">
          <svg viewBox="0 0 330 39" aria-hidden="true" className="w-full overflow-visible">
            <path data-success-line d={LOGO_WAVE.d} transform="translate(0 3.34)" fill="none" stroke="var(--color-cobalt)" strokeWidth={2.2} strokeLinecap="round" />
          </svg>
          <h3 data-success-copy data-success-title tabIndex={-1} className="quote-title outline-none">
            {QUOTE.success.title(a.contact.firstName)}
          </h3>
          <p data-success-copy className="text-body-lg text-slate/75">
            {QUOTE.success.body}
          </p>
          <p data-success-copy>
            <button type="button" onClick={() => reset()} className="link-draw text-body font-medium text-cobalt">
              {QUOTE.success.again}
            </button>
          </p>
        </div>
      ) : (
        <>
          {/* Header: title, reply time, progress */}
          <div data-quote-head className="flex flex-col gap-[clamp(14px,1.3vw,20px)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="quote-title">{QUOTE.title}</p>
                <p className="mono mt-1.5 text-muted">{QUOTE.reply}</p>
              </div>
              {step > 1 && (
                <button type="button" onClick={() => go((step - 1) as Step)} className="link-draw mt-1 shrink-0 text-[15px] font-medium text-cobalt">
                  ← {QUOTE.back}
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <ol className="flex flex-1 gap-1.5" aria-hidden="true">
                {Array.from({ length: TOTAL }, (_, i) => (
                  <li key={i} data-seg={i + 1} className="h-[3px] flex-1 overflow-hidden rounded-full bg-slate/12">
                    <span className="block h-full origin-left bg-cobalt" style={{ transform: `scaleX(${i + 1 <= segN ? 1 : 0})` }} />
                  </li>
                ))}
              </ol>
              <p className="mono shrink-0 text-muted">{step === REVIEW ? QUOTE.reviewStep : QUOTE.stepOf(step, TOTAL)}</p>
            </div>
          </div>

          {/* Steps */}
          <div ref={body} className="-mx-2 overflow-hidden px-2 pt-[clamp(20px,2vw,28px)] pb-1">
            <div ref={panel}>
              <form onSubmit={submitStep} noValidate aria-labelledby={`${id}-q`}>
                <h3 ref={heading} id={`${id}-q`} tabIndex={-1} className="quote-question outline-none">
                  {QUESTION[step]}
                </h3>

                {step === 1 && (
                  <>
                    <p className="mt-1 text-[15px] text-slate/72">{S.surfaces.hint}</p>
                    <div role="group" aria-labelledby={`${id}-q`} className="mt-4 grid grid-cols-2 gap-2.5">
                      {S.surfaces.options.map((o) => (
                        <Tile key={o.value} label={o.label} icon={o.value} checked={a.surfaces.includes(o.value)} onToggle={() => toggle('surfaces', o.value)} onEnter={submitStep} />
                      ))}
                    </div>
                    <FieldError id={`${id}-err`} msg={errors.surfaces} />
                    <Continue />
                  </>
                )}

                {step === 2 && (
                  <Radios name="size" labelledBy={`${id}-q`} options={S.size.options} value={a.size} onChoose={(v, adv) => choose('size', v, adv, 2)} />
                )}
                {step === 3 && (
                  <Radios name="condition" labelledBy={`${id}-q`} options={S.condition.options} value={a.condition} onChoose={(v, adv) => choose('condition', v, adv, 3)} />
                )}

                {step === 4 && (
                  <>
                    <p className="mt-1 text-[15px] text-slate/72">{S.extras.hint}</p>
                    <div role="group" aria-labelledby={`${id}-q`} className="mt-4 flex flex-wrap gap-2">
                      {S.extras.options.map((o) => (
                        <Chip key={o.value} label={o.label} checked={a.extras.includes(o.value)} onToggle={() => toggle('extras', o.value)} onEnter={submitStep} />
                      ))}
                    </div>
                    <Continue />
                  </>
                )}

                {step === 5 && (
                  <Radios name="timing" labelledBy={`${id}-q`} options={S.timing.options} value={a.timing} onChoose={(v, adv) => choose('timing', v, adv, 5)} />
                )}

                {step === 6 && (
                  <ContactStep
                    id={id}
                    c={a.contact}
                    set={setContact}
                    errors={errors}
                    photos={photos}
                    addPhotos={addPhotos}
                    removePhoto={removePhoto}
                  />
                )}

                {step === REVIEW && (
                  <>
                    <dl className="mt-4 divide-y divide-slate/12 border-y border-slate/12">
                      {summarise({ ...a, company: '' }).map((row, i) => (
                        <div key={row.key} className="flex items-start gap-3 py-2.5">
                          <dt className="mono w-[6.5rem] shrink-0 pt-[0.2em] text-muted">{row.label}</dt>
                          <dd className="min-w-0 flex-1 text-[15px] leading-snug">{row.value}</dd>
                          <button
                            type="button"
                            onClick={() => {
                              setReturnToReview(true)
                              go((i === 5 ? 6 : i + 1) as Step)
                            }}
                            className="link-draw shrink-0 text-[14px] font-medium text-cobalt"
                            aria-label={`${S.review.edit} ${row.label.toLowerCase()}`}
                          >
                            {S.review.edit}
                          </button>
                        </div>
                      ))}
                      <div className="flex items-start gap-3 py-2.5">
                        <dt className="mono w-[6.5rem] shrink-0 pt-[0.2em] text-muted">{QUOTE.summary.photos}</dt>
                        <dd className="flex-1 text-[15px]">{photos.length ? QUOTE.summary.photoCount(photos.length) : QUOTE.summary.noPhotos}</dd>
                      </div>
                    </dl>
                    {status === 'error' && (
                      <p role="alert" className="mt-4 rounded-lg bg-cobalt/8 px-3.5 py-3 text-[14px] text-slate">
                        {failure}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="group/btn relative isolate mt-5 inline-flex h-[54px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-btn bg-cobalt text-[16px] font-medium text-limestone transition-transform duration-300 ease-pw-out active:scale-[0.98] disabled:opacity-70"
                    >
                      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-cobalt-deep opacity-0 transition-opacity duration-400 ease-pw-out group-hover/btn:opacity-100" />
                      {status === 'sending' ? `${S.review.sending}…` : status === 'error' ? E.retry : S.review.submit}
                      {status !== 'sending' && (
                        <span aria-hidden="true" className="transition-transform duration-400 ease-pw-out group-hover/btn:translate-x-1">
                          →
                        </span>
                      )}
                    </button>
                  </>
                )}

                {/* Honeypot: off screen, out of the tab order, ignored by people */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label>
                    {QUOTE.honeypot}
                    <input ref={honeypot} type="text" name="company" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Continue() {
  return (
    <button
      type="submit"
      className="group/btn relative isolate mt-5 inline-flex h-[50px] items-center gap-2.5 overflow-hidden rounded-btn bg-cobalt px-6 text-[16px] font-medium text-limestone transition-transform duration-300 ease-pw-out active:scale-[0.98]"
    >
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-cobalt-deep opacity-0 transition-opacity duration-400 ease-pw-out group-hover/btn:opacity-100" />
      {QUOTE.continue}
      <span aria-hidden="true" className="transition-transform duration-400 ease-pw-out group-hover/btn:translate-x-1">
        →
      </span>
    </button>
  )
}

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null
  return (
    <p id={id} className="mt-2 text-[14px] text-cobalt" role="alert">
      {msg}
    </p>
  )
}

/** The tick in a selected tile's corner, drawn in as it appears. */
function Tick() {
  const ref = useRef<SVGPathElement>(null)
  useGSAP(() => {
    if (!prefersReducedMotion()) gsap.fromTo(ref.current, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.4, ease: EASE.out })
  })
  return (
    <span aria-hidden="true" className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-limestone">
      <svg viewBox="0 0 12 12" className="size-3">
        <path ref={ref} d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="var(--color-cobalt)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

/** A multi-select tile with an icon (step 1). Space toggles, Enter continues. */
function Tile({ label, icon, checked, onToggle, onEnter }: { label: string; icon: string; checked: boolean; onToggle: () => void; onEnter: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onEnter()
        }
      }}
      className={`quote-option relative flex min-h-[84px] flex-col items-start justify-between gap-3 rounded-xl border-2 p-3.5 text-left text-[15px] leading-tight font-medium ${
        checked ? 'border-cobalt bg-cobalt text-limestone' : 'border-slate/18 text-slate'
      }`}
    >
      <SurfaceIcon name={icon} className="size-7" />
      {label}
      {checked && <Tick />}
    </button>
  )
}

/** A multi-select chip (step 4). */
function Chip({ label, checked, onToggle, onEnter }: { label: string; checked: boolean; onToggle: () => void; onEnter: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onEnter()
        }
      }}
      className={`quote-option rounded-full border-2 px-4 py-2.5 text-[15px] leading-none ${
        checked ? 'border-cobalt bg-cobalt font-medium text-limestone' : 'border-slate/22 text-slate'
      }`}
    >
      {label}
    </button>
  )
}

/**
 * A single-choice group with roving focus. Arrows move the choice without
 * leaving the step; a tap, Space or Enter chooses and moves on.
 */
function Radios({
  name,
  labelledBy,
  options,
  value,
  onChoose,
}: {
  name: string
  labelledBy: string
  options: { value: string; label: string; hint?: string }[]
  value?: string
  onChoose: (v: string, advance: boolean) => void
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const current = Math.max(0, options.findIndex((o) => o.value === value))
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = options.length
    let j: number | null = null
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % n
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + n) % n
    if (j !== null) {
      e.preventDefault()
      onChoose(options[j].value, false)
      refs.current[j]?.focus()
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChoose(options[i].value, true)
    }
  }
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="mt-4 flex flex-col gap-2">
      {options.map((o, i) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => void (refs.current[i] = el)}
            type="button"
            role="radio"
            name={name}
            aria-checked={on}
            tabIndex={i === current ? 0 : -1}
            onClick={() => onChoose(o.value, true)}
            onKeyDown={(e) => onKey(e, i)}
            className={`quote-option flex w-full items-center justify-between gap-4 rounded-xl border-2 px-4 py-3.5 text-left ${
              on ? 'border-cobalt bg-cobalt text-limestone' : 'border-slate/18 text-slate'
            }`}
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-[16px] leading-tight font-medium">{o.label}</span>
              {o.hint && <span className={`text-[14px] leading-snug ${on ? 'text-limestone/80' : 'text-slate/72'}`}>{o.hint}</span>}
            </span>
            <span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-limestone' : 'border-slate/30'}`}>
              {on && <span className="size-2 rounded-full bg-limestone" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Step 6: the only typed fields, and the optional photos. */
function ContactStep({
  id,
  c,
  set,
  errors,
  photos,
  addPhotos,
  removePhoto,
}: {
  id: string
  c: Contact
  set: (p: Partial<Contact>) => void
  errors: Record<string, string>
  photos: Photo[]
  addPhotos: (f: FileList | File[]) => void
  removePhoto: (i: number) => void
}) {
  const file = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const T = S.contact

  const field = (key: 'firstName' | 'postcode' | 'phone' | 'email', label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-${key}`} className="mono text-muted">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        name={key}
        value={c[key] ?? ''}
        onChange={(e) => set({ [key]: e.target.value })}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `${id}-${key}-err` : undefined}
        className={`quote-input ${errors[key] ? 'border-cobalt' : ''}`}
        {...props}
      />
      <FieldError id={`${id}-${key}-err`} msg={errors[key]} />
    </div>
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setOver(false)
      if (e.dataTransfer.files.length) addPhotos(e.dataTransfer.files)
    },
    [addPhotos],
  )

  return (
    <div className="mt-4 flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {field('firstName', T.firstName, { autoComplete: 'given-name', placeholder: 'Sam' })}
        {field('postcode', T.postcode, { autoComplete: 'postal-code', placeholder: 'GU1 3AA', autoCapitalize: 'characters' })}
      </div>

      <div className="flex flex-col gap-2.5">
        <div role="radiogroup" aria-label={`${T.via.phone} or ${T.via.email.toLowerCase()}`} className="inline-flex w-fit rounded-full bg-slate/8 p-1">
          {(['phone', 'email'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={c.via === v}
              onClick={() => set({ via: v })}
              className={`rounded-full px-4 py-2 text-[14px] leading-none font-medium transition-colors duration-300 ${c.via === v ? 'bg-slate text-limestone' : 'text-slate/70'}`}
            >
              {T.via[v]}
            </button>
          ))}
        </div>
        {c.via === 'phone'
          ? field('phone', T.phone, { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '07700 900123' })
          : field('email', T.email, { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'sam@example.com' })}
      </div>

      <div>
        <input
          ref={file}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            if (e.target.files) addPhotos(e.target.files)
            e.target.value = ''
          }}
        />
        {photos.length < PHOTO_MAX_COUNT && (
          <button
            type="button"
            onClick={() => file.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
            aria-describedby={errors.photos ? `${id}-photos-err` : undefined}
            className={`flex w-full items-center gap-3.5 rounded-xl border-2 border-dashed px-4 py-4 text-left transition-colors duration-300 ${
              over ? 'border-cobalt bg-cobalt/6' : 'border-slate/28 bg-slate/[0.03] hover:border-slate/45'
            }`}
          >
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-slate/8 text-[20px] leading-none">
              +
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-[15px] leading-tight font-medium">{T.dropzone}</span>
              <span className="mono text-muted">{T.dropzoneHint}</span>
            </span>
          </button>
        )}
        <FieldError id={`${id}-photos-err`} msg={errors.photos} />
        {photos.length > 0 && (
          <ul className="mt-3 flex gap-2">
            {photos.map((p, i) => (
              <li key={p.url} className="relative size-16 overflow-hidden rounded-lg bg-ghost">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.file.name} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`${T.remove}: ${p.file.name}`}
                  className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-ink/70 text-[12px] leading-none text-limestone"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Continue />
      </div>
    </div>
  )
}
