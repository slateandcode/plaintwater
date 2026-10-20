'use client'

/*
  The hand-off between the preloader and the hero. The hero builds its load
  timeline and waits on `onHeroCue`; whoever owns the intro calls `releaseHero`
  (the preloader, about half way through its lift).
*/

let released = false
const waiting = new Set<() => void>()

export function onHeroCue(cb: () => void) {
  if (released) {
    cb()
    return () => {}
  }
  waiting.add(cb)
  return () => void waiting.delete(cb)
}

export function releaseHero() {
  if (released) return
  released = true
  waiting.forEach((cb) => cb())
  waiting.clear()
}

export const heroReleased = () => released

/** Wait for every image in `scope` to decode, with a ceiling so a slow image never blocks the intro. */
export function decodeImages(images: Iterable<HTMLImageElement>, timeoutMs = 3000) {
  const all = Promise.all(
    Array.from(images).map((img) => {
      if (img.complete && img.naturalWidth) return img.decode().catch(() => undefined)
      return new Promise<void>((resolve) => {
        const done = () => resolve()
        img.addEventListener('load', () => img.decode().then(done, done), { once: true })
        img.addEventListener('error', done, { once: true })
      })
    }),
  ).then(() => undefined)
  return Promise.race([all, new Promise<void>((r) => setTimeout(r, timeoutMs))])
}
