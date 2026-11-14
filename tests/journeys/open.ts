// What every journey shares: one real browser per test file, a fresh page per test, and a few ways to look at the
// running game. Journeys wait on the game itself (its tick, its state), never on a sleep.
import { createGameSim, parseReplay, type Replay, type Sim } from '@automataframework/framework/headless'
import { type Browser, type BrowserType, chromium, type Frame, firefox, type Page, webkit } from 'playwright'
import { inject } from 'vitest'
import { gamePlugins } from '#src/features/plugins/plugins.ts'
import { loadTheGame } from '../fixtures/game-files.ts'

const BROWSERS = { chromium, webkit, firefox } satisfies Record<string, BrowserType>

function engine(name: string | undefined): keyof typeof BROWSERS {
  if (name === undefined || name === '') return 'chromium'
  if (name === 'chromium' || name === 'webkit' || name === 'firefox') return name
  throw new Error(`ENGINE is "${name}", which is not chromium, webkit or firefox.`)
}

/** The browser the journeys run in, from the ENGINE environment variable. */
export const ENGINE: 'chromium' | 'webkit' | 'firefox' = engine(process.env.ENGINE)

/** The window sizes the journeys and the pictures use, and whether the screen is touched with fingers. */
export const SIZES = {
  'phone-390x844': { width: 390, height: 844, touch: true },
  'phone-844x390': { width: 844, height: 390, touch: true },
  'tablet-820x1180': { width: 820, height: 1180, touch: true },
  'tablet-1180x820': { width: 1180, height: 820, touch: true },
  'desktop-1280x720': { width: 1280, height: 720, touch: false },
} as const

/** Where a journey looks at the game: the page itself, or the frame it sits in when a page frames it. */
export type Surface = Page | Frame

/** The frame's own address, or the address of the page that frames it. */
export interface Framed {
  /** An outer page taller than the window, with the game below the fold. */
  readonly tall?: boolean
  /** Default `'same'`: the outer page has the game's origin. `'other'`: it does not (a stranger's page). */
  readonly from?: 'same' | 'other'
}

export interface Opened {
  /** What the visitor sees: the game's page, or the outer page when `framed`. */
  readonly page: Page
  /** Where the game is: `page`, or the frame inside it when `framed`. */
  readonly game: Surface
  /** Console errors and uncaught errors seen so far. */
  readonly errors: string[]
  /** The address each error came from, in step with `errors` (`''` for an uncaught error or a browser that gives none). */
  readonly errorUrls: string[]
  /** Every address the page asked for so far (not the empty `data:,` icon link). */
  readonly requested: string[]
  /** Every answer the page got so far: the address and the status. */
  readonly answered: { readonly url: string; readonly status: number }[]
  /** Content-Security-Policy violations the page reported, as "directive: blocked thing". Empty unless `csp` was set. */
  readonly violations: string[]
  /** Framed only: what the outer page has heard from the game's window, in order. */
  heard(): Promise<unknown[]>
  /** Framed only: waits until the outer page has heard `count` messages from the game. */
  untilHeard(count: number): Promise<void>
  /** Framed only: posts `data` from the outer page to the game, as the Site's Play button does. */
  post(data: unknown): Promise<void>
  /** Framed only: how many times the frame has loaded. */
  frameLoads(): Promise<number>
  /** Lets go of every request held back by `hold`. */
  release(): void
  close(): Promise<void>
}

let browser: Browser | undefined
const launch = async (): Promise<Browser> => {
  browser ??= await BROWSERS[ENGINE].launch()
  return browser
}

/** Closes the browser this test file launched. Call it once, after the last test. */
export async function closeBrowser(): Promise<void> {
  await browser?.close()
  browser = undefined
}

/**
 * Opens the built game in ENGINE and waits until #game is no longer 'loading'. `files` replaces a file the page
 * fetches (by its path from the game's root); `undefined` answers 404.
 */
export async function openGame(
  options: {
    size?: keyof typeof SIZES
    files?: Readonly<Record<string, string | undefined>>
    /** A Content-Security-Policy to put on the page, as a host would; the page's violations come back in `violations`. */
    csp?: string
    /** Addresses to answer with a failed request, as when a font file is slow or blocked. */
    block?: RegExp
    /** The address's query, with its `?`: `'?watch'` makes the game play its recording by itself. */
    search?: string
    /** Puts the game in a frame of an outer page, as the Site does, and watches what the two say to each other. */
    framed?: Framed
    /** Addresses to hold back until `release()`, as when a file is slow. Nothing waits for the game to be ready. */
    hold?: RegExp
  } = {},
): Promise<Opened> {
  const size = SIZES[options.size ?? 'desktop-1280x720']
  const context = await (await launch()).newContext({
    viewport: { width: size.width, height: size.height },
    hasTouch: size.touch,
  })
  const page = await context.newPage()
  const errors: string[] = []
  const errorUrls: string[] = []
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    errors.push(message.text())
    errorUrls.push(message.location().url)
  })
  page.on('pageerror', (error) => {
    errors.push(error.message)
    errorUrls.push('')
  })

  const requested: string[] = []
  const answered: { url: string; status: number }[] = []
  page.on('request', (request) => {
    if (request.url() !== 'data:,') requested.push(request.url())
  })
  page.on('response', (response) => answered.push({ url: response.url(), status: response.status() }))

  const violations: string[] = []
  const { csp } = options
  if (csp !== undefined) {
    await page.exposeFunction('automataViolation', (what: string) => violations.push(what))
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        void (window as unknown as { automataViolation(what: string): void }).automataViolation(
          `${event.effectiveDirective}: ${event.blockedURI} ${event.sample}`,
        )
      })
    })
  }

  const base = new URL(inject('siteUrl'))
  const files = options.files ?? {}
  const { block, hold, framed } = options
  const search = options.search ?? ''
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  // A page that is not the game's, at an address nobody serves: the route answers for it, so nothing listens there. It is
  // another loopback address, not another host: Chromium keeps a public page from framing a loopback one.
  const outerOrigin = framed?.from === 'other' ? `http://127.0.0.2:${base.port}` : base.origin
  const outerUrl = `${outerOrigin}${base.pathname}outer-page.html`
  await page.route('**/*', async (route) => {
    if (block?.test(route.request().url()) === true) return route.abort()
    if (route.request().url() === outerUrl)
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: outerPage(`${base.href}${search}`, framed),
      })
    if (hold?.test(route.request().url()) === true) await gate
    // A host sends the policy with the page itself; every other file is served as it is.
    if (csp !== undefined && route.request().resourceType() === 'document') {
      const response = await route.fetch()
      return route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } })
    }
    const path = decodeURIComponent(new URL(route.request().url()).pathname.slice(base.pathname.length))
    if (!(path in files)) return route.continue()
    const body = files[path]
    if (body === undefined) return route.fulfill({ status: 404, body: 'Not found' })
    return route.fulfill({ status: 200, contentType: 'text/plain', body })
  })

  const ready = '#game[data-state="watching"], #game[data-state="playing"], #game[data-state="problem"]'
  let game: Surface = page
  if (framed === undefined) {
    await page.goto(`${base.href}${search}`)
    if (hold === undefined) await page.waitForSelector(ready, { state: 'attached' })
  } else {
    await page.goto(outerUrl)
    const element = await page.waitForSelector('iframe')
    const frame = await element.contentFrame()
    if (frame === null) throw new Error('the outer page has no frame')
    game = frame
    if (hold === undefined) await frame.waitForSelector(ready, { state: 'attached' })
  }
  return {
    page,
    game,
    errors,
    errorUrls,
    requested,
    answered,
    violations,
    heard: () => page.evaluate(() => (window as unknown as { heard: unknown[] }).heard),
    untilHeard: async (count) => {
      await page.waitForFunction((n) => (window as unknown as { heard: unknown[] }).heard.length >= n, count)
    },
    post: (data) => page.evaluate((d) => (window as unknown as { post(x: unknown): void }).post(d), data),
    frameLoads: () => page.evaluate(() => (window as unknown as { frameLoads: number }).frameLoads),
    release,
    close: () => context.close(),
  }
}

/** The outer page: the game in a frame, a note of every message the frame sends up, and a way to post one down. */
function outerPage(gameUrl: string, framed: Framed | undefined): string {
  return `<!doctype html><meta charset="utf-8"><title>outer</title>
<style>html,body{margin:0}#above{height:${framed?.tall === true ? 3000 : 0}px}iframe{display:block;width:100%;height:100vh;border:0}</style>
<div id="above"></div><iframe src="${gameUrl}"></iframe>
<script>
  const frame = document.querySelector('iframe')
  window.heard = []
  window.frameLoads = 0
  window.post = (data) => frame.contentWindow.postMessage(data, '*')
  frame.addEventListener('load', () => { window.frameLoads += 1 })
  addEventListener('message', (event) => { if (event.source === frame.contentWindow) window.heard.push(event.data) })
</script>`
}

/** Waits until every font the page asked for has arrived (or failed), so a measurement is taken with the final text. */
export async function fontsReady(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
}

/**
 * Whether a face of this family and weight has really been fetched. Never `document.fonts.check`: by its rules it is
 * also `true` when no face of that name was declared at all, so it would pass with the import lost.
 */
export function fontLoaded(page: Page, family: string, weight: string): Promise<boolean> {
  return page.evaluate(
    ([name, wanted]) =>
      [...document.fonts].some(
        (face) =>
          face.family.replace(/["']/g, '') === name && face.weight === wanted && face.status === 'loaded',
      ),
    [family, weight] as const,
  )
}

/** The play so far, from the page. */
export async function replayOf(page: Surface): Promise<Replay> {
  const text = await page.evaluate(() => JSON.stringify(window.automataGame?.replay()))
  return parseReplay(text)
}

/** The tick the page's game has reached. */
export const tickOf = (page: Surface): Promise<number> =>
  page.evaluate(() => window.automataGame?.sim.tick ?? 0)

/** Waits until the game's sim has reached `tick`. Journeys wait on the game, never on a sleep. */
export async function untilTick(page: Surface, tick: number): Promise<void> {
  await page.waitForFunction((target) => (window.automataGame?.sim.tick ?? 0) >= target, tick)
}

/** The tick the recording that is playing itself has reached (`-1` while nothing is being watched). */
export const watchTickOf = (page: Surface): Promise<number> =>
  page.evaluate(() => window.automataWatch?.sim.tick ?? -1)

/** Waits until the recording that is playing itself has reached `tick`. */
export async function untilWatchTick(page: Surface, tick: number): Promise<void> {
  await page.waitForFunction((target) => (window.automataWatch?.sim.tick ?? -1) >= target, tick)
}

/**
 * Waits for `n` animation frames of the page, which is as long as a journey ever waits for something not to happen: a
 * frame is what moves the game, so after `n` of them a game that was going to move has moved.
 */
export function framesPass(page: Surface, n: number): Promise<void> {
  return page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        let left = count
        const next = (): void => {
          left -= 1
          if (left <= 0) resolve()
          else requestAnimationFrame(next)
        }
        requestAnimationFrame(next)
      }),
    n,
  )
}

/**
 * A Node sim of the game, made the way the page makes its own (the game's plugins, player 1, the default seed), so a
 * replay from the page can be checked against it. `files` replaces game files, as for `openGame`.
 */
export async function nodeSim(files: Readonly<Record<string, string | undefined>> = {}): Promise<Sim> {
  return createGameSim({ content: await loadTheGame(files), plugins: gamePlugins })
}
