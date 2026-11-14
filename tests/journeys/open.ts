// What every journey shares: one real browser per test file, a fresh page per test, and a few ways to look at the
// running game. Journeys wait on the game itself (its tick, its state), never on a sleep.
import { createGameSim, parseReplay, type Replay, type Sim } from '@automataframework/framework/headless'
import { type Browser, type BrowserType, chromium, firefox, type Page, webkit } from 'playwright'
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

export interface Opened {
  readonly page: Page
  /** Console errors and uncaught errors seen so far. */
  readonly errors: string[]
  /** The address each console error came from (a browser's words for a failed request do not name the file). */
  readonly errorUrls: string[]
  /** Every address the page asked for so far (not the empty `data:,` icon link). */
  readonly requested: string[]
  /** Every answer the page got so far: the address and the status. */
  readonly answered: { readonly url: string; readonly status: number }[]
  /** Content-Security-Policy violations the page reported, as "directive: blocked thing". Empty unless `csp` was set. */
  readonly violations: string[]
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
  page.on('pageerror', (error) => errors.push(error.message))

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
  const { block } = options
  await page.route('**/*', async (route) => {
    if (block?.test(route.request().url()) === true) return route.abort()
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

  await page.goto(base.href)
  await page.waitForSelector('#game[data-state="playing"], #game[data-state="problem"]', {
    state: 'attached',
  })
  return { page, errors, errorUrls, requested, answered, violations, close: () => context.close() }
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
export async function replayOf(page: Page): Promise<Replay> {
  const text = await page.evaluate(() => JSON.stringify(window.automataGame?.replay()))
  return parseReplay(text)
}

/** The tick the page's game has reached. */
export const tickOf = (page: Page): Promise<number> => page.evaluate(() => window.automataGame?.sim.tick ?? 0)

/** Waits until the game's sim has reached `tick`. Journeys wait on the game, never on a sleep. */
export async function untilTick(page: Page, tick: number): Promise<void> {
  await page.waitForFunction((target) => (window.automataGame?.sim.tick ?? 0) >= target, tick)
}

/**
 * A Node sim of the game, made the way the page makes its own (the game's plugins, player 1, the default seed), so a
 * replay from the page can be checked against it. `files` replaces game files, as for `openGame`.
 */
export async function nodeSim(files: Readonly<Record<string, string | undefined>> = {}): Promise<Sim> {
  return createGameSim({ content: await loadTheGame(files), plugins: gamePlugins })
}
