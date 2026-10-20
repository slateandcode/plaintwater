import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { PHOTO_MAX_BYTES, PHOTO_MAX_COUNT, PHOTO_TYPES, quoteSchema, summarise } from '@/lib/quote'
import { SITE } from '@/lib/content'

export const runtime = 'nodejs'

/*
  Quote requests. Multipart: `answers` (JSON) plus up to three `photos`.
  Validated with the same zod schema as the wizard, a honeypot field and a
  simple per-IP rate limit. With RESEND_API_KEY set the summary is emailed with
  the photos attached; without it the payload is logged and the request still
  succeeds, so the demo works anywhere.
*/

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
// Per server instance. Good enough to stop a burst; not a global limit.
const hits = new Map<string, number[]>()

function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > MAX_PER_WINDOW
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local'
  if (limited(ip)) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-request' }, { status: 400 })
  }

  let raw: unknown
  try {
    raw = JSON.parse(String(form.get('answers') ?? ''))
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-request' }, { status: 400 })
  }

  const parsed = quoteSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid', issues: parsed.error.issues.map((i) => i.path.join('.')) }, { status: 422 })
  }
  const answers = parsed.data

  // Honeypot filled: pretend it worked and drop it.
  if (answers.company) return NextResponse.json({ ok: true })

  const photos = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)
  if (photos.length > PHOTO_MAX_COUNT || photos.some((f) => f.size > PHOTO_MAX_BYTES || !PHOTO_TYPES.includes(f.type))) {
    return NextResponse.json({ ok: false, error: 'photos' }, { status: 422 })
  }

  const rows = summarise(answers)
  const key = process.env.RESEND_API_KEY

  if (!key) {
    console.log('[quote] RESEND_API_KEY not set, logging the request instead', {
      rows,
      photos: photos.map((p) => ({ name: p.name, type: p.type, bytes: p.size })),
    })
    return NextResponse.json({ ok: true })
  }

  try {
    const resend = new Resend(key)
    const html = `
      <div style="font-family:Helvetica,Arial,sans-serif;color:#2B2E2F;max-width:560px">
        <h2 style="font-weight:500;margin:0 0 16px">New quote request</h2>
        <table style="border-collapse:collapse;width:100%">
          ${rows
            .map(
              (r) => `<tr>
                <td style="padding:10px 12px 10px 0;border-top:1px solid #DAD5CA;font-family:monospace;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#6A6963;vertical-align:top;white-space:nowrap">${esc(r.label)}</td>
                <td style="padding:10px 0;border-top:1px solid #DAD5CA">${esc(r.value)}</td>
              </tr>`,
            )
            .join('')}
        </table>
        <p style="color:#6A6963;font-size:13px;margin-top:16px">${photos.length} photo${photos.length === 1 ? '' : 's'} attached.</p>
      </div>`
    const { error } = await resend.emails.send({
      from: process.env.QUOTE_FROM_EMAIL || `Plainwater <quotes@plainwater.co>`,
      to: process.env.QUOTE_TO_EMAIL || SITE.email,
      replyTo: answers.contact.via === 'email' ? answers.contact.email?.trim() : undefined,
      subject: `Quote request: ${answers.contact.firstName}, ${answers.contact.postcode.toUpperCase()}`,
      html,
      attachments: await Promise.all(photos.map(async (p) => ({ filename: p.name || 'photo.jpg', content: Buffer.from(await p.arrayBuffer()) }))),
    })
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[quote] send failed', err)
    return NextResponse.json({ ok: false, error: 'send' }, { status: 502 })
  }
}
