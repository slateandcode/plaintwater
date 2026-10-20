import { z } from 'zod'
import { QUOTE } from './content'

/*
  The quote request: one zod schema used by the wizard (per step and on
  review) and by the API route, so both sides agree on what is valid.
*/

const values = <T extends { value: string }[]>(opts: T) => opts.map((o) => o.value) as [string, ...string[]]

const S = QUOTE.steps
const E = QUOTE.errors

export const SURFACES = values(S.surfaces.options)
export const SIZES = values(S.size.options)
export const CONDITIONS = values(S.condition.options)
export const EXTRAS = values(S.extras.options)
export const TIMINGS = values(S.timing.options)

/** UK postcode, outward and inward parts, space optional. */
export const POSTCODE = /^(GIR ?0AA|[A-PR-UWYZ][A-HK-Y]?\d[A-Z\d]? ?\d[ABD-HJLNP-UW-Z]{2})$/i

const phone = z
  .string()
  .trim()
  .refine((v) => /^\+?[\d\s()-]+$/.test(v) && v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 13, E.phone)

export const contactSchema = z
  .object({
    firstName: z.string().trim().min(1, E.firstName).max(60, E.firstName),
    postcode: z.string().trim().regex(POSTCODE, E.postcode),
    via: z.enum(['phone', 'email']),
    phone: z.string().optional(),
    email: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.via === 'phone' && !phone.safeParse(v.phone ?? '').success) ctx.addIssue({ code: 'custom', path: ['phone'], message: E.phone })
    if (v.via === 'email' && !z.email().safeParse((v.email ?? '').trim()).success) ctx.addIssue({ code: 'custom', path: ['email'], message: E.email })
  })

export const quoteSchema = z
  .object({
    surfaces: z.array(z.enum(SURFACES)),
    size: z.enum(SIZES).optional(),
    condition: z.enum(CONDITIONS).optional(),
    extras: z.array(z.enum(EXTRAS)),
    timing: z.enum(TIMINGS).optional(),
    /** Started from "Send us a photo": the questions before the contact step are optional. */
    photoFirst: z.boolean().optional(),
    contact: contactSchema,
    /** Honeypot. People never see it; bots fill it in. */
    company: z.string().max(200).optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.photoFirst && v.surfaces.length === 0) ctx.addIssue({ code: 'custom', path: ['surfaces'], message: E.surfaces })
  })

export type QuoteAnswers = z.infer<typeof quoteSchema>

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024
export const PHOTO_MAX_COUNT = 3

/** Human-readable label for a stored option value. */
export function labelFor(step: 'surfaces' | 'size' | 'condition' | 'extras' | 'timing', value: string) {
  return (S[step].options as { value: string; label: string }[]).find((o) => o.value === value)?.label ?? value
}

/** The answers as label/value rows, for the review step and the email. */
export function summarise(a: QuoteAnswers) {
  const T = QUOTE.summary
  const list = (step: 'surfaces' | 'extras', v: string[]) => (v.length ? v.map((x) => labelFor(step, x)).join(', ') : T.none)
  const one = (step: 'size' | 'condition' | 'timing', v?: string) => (v ? labelFor(step, v) : T.none)
  const c = a.contact
  return [
    { key: 'surfaces', label: T.surfaces, value: list('surfaces', a.surfaces) },
    { key: 'size', label: T.size, value: one('size', a.size) },
    { key: 'condition', label: T.condition, value: one('condition', a.condition) },
    { key: 'extras', label: T.extras, value: list('extras', a.extras) },
    { key: 'timing', label: T.timing, value: one('timing', a.timing) },
    {
      key: 'contact',
      label: T.contact,
      value: [c.firstName, c.postcode.toUpperCase(), c.via === 'phone' ? c.phone : c.email].filter(Boolean).join(' · '),
    },
  ] as const
}
