// The built game playing itself and handing over, driven from outside by a real browser: with `?watch` in its address it
// plays its own recording, and a page that frames it can tell it to play. Journeys wait on the game's own tick, never on
// a sleep, and never compare pictures to know whether the game moved (the sim's tick says so).
import { parseContent, writeContent } from '@automataframework/framework/headless'
import { afterAll, afterEach, expect, test } from 'vitest'
import { PLAY_MESSAGE } from '#src/features/play/handover.ts'
import { WORDS } from '#src/features/play/words.ts'
import { gameFiles } from '../fixtures/game-files.ts'
import {
  closeBrowser,
  fontsReady,
  framesPass,
  type Opened,
  openGame,
  SIZES,
  tickOf,
  untilTick,
  untilWatchTick,
  WATCHING_WORDS,
  watchTickOf,
} from './open.ts'

const LEVEL = 'content/levels/level-1.json'
const RECORDING = 'replays/level-1.json'

let opened: Opened | undefined
afterEach(async () => {
  await opened?.close()
  opened = undefined
})
afterAll(closeBrowser)

const stateOf = (surface: Opened['game']): Promise<string | null> =>
  surface.locator('#game').getAttribute('data-state')
const untilState = (surface: Opened['game'], state: string): Promise<unknown> =>
  surface.waitForSelector(`#game[data-state="${state}"]`, { state: 'attached' })

test('with ?watch the game plays itself: the picture moves and nobody pressed anything', async () => {
  opened = await openGame({ search: '?watch' })
  const { page, errors, answered } = opened
  expect(await stateOf(page)).toBe('watching')
  expect(await page.evaluate(() => window.automataGame)).toBeUndefined()
  await untilWatchTick(page, 30)
  const first = await page.locator('canvas').screenshot()
  // Past tick 10, where the recording starts to run, so the hero is somewhere else than where it began.
  await untilWatchTick(page, 90)
  const second = await page.locator('canvas').screenshot()
  expect(first.equals(second), 'the canvas is drawn, and the picture changed').toBe(false)
  expect(await page.getByText(WATCHING_WORDS).isVisible()).toBe(true)
  expect(await page.locator('button').count(), 'no touch buttons while watching').toBe(0)
  expect(errors).toEqual([])
  expect(answered.filter((a) => a.status >= 400)).toEqual([])
})

for (const [name, size] of Object.entries(SIZES) as [
  keyof typeof SIZES,
  (typeof SIZES)[keyof typeof SIZES],
][]) {
  test(`at ${name}, the words say the game is playing itself, big enough to read, above the game`, async () => {
    opened = await openGame({ size: name, search: '?watch' })
    const { page } = opened
    await untilWatchTick(page, 30)
    await fontsReady(page)
    const words = page.locator('.play-watching')
    // A screen no finger touches says "Click"; one that is touched says "Tap" (the engines differ in whether a test's
    // touch emulation counts as a coarse pointer, so a touch size may say either).
    expect(await words.innerText()).toMatch(WATCHING_WORDS)
    if (!SIZES[name].touch) expect(await words.innerText()).toBe(WORDS.watchingClick)
    expect(
      Number.parseFloat(await words.evaluate((e) => getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(18)
    const strip = await page.locator('.play-words').boundingBox()
    const canvas = await page.locator('canvas').boundingBox()
    expect(strip !== null && canvas !== null).toBe(true)
    if (strip === null || canvas === null) return
    expect(strip.x).toBeGreaterThanOrEqual(0)
    expect(strip.x + strip.width).toBeLessThanOrEqual(size.width)
    expect(strip.y + strip.height).toBeLessThanOrEqual(canvas.y + 0.5)
    expect(canvas.y + canvas.height).toBeCloseTo(size.height, 0)
  })
}

test('it starts again after it ends', async () => {
  opened = await openGame({ search: '?watch' })
  const { page } = opened
  await page.waitForFunction(() => (window.automataWatch?.rounds ?? 0) >= 1)
  // The tick falls back to the start of the recording once the rest is over.
  await page.waitForFunction(() => (window.automataWatch?.sim.tick ?? 9999) < 20)
  expect(await stateOf(page)).toBe('watching')
})

test('a moved crate still plays, with no problem screen', async () => {
  const parsed = parseContent('level', gameFiles[LEVEL] ?? '', LEVEL)
  if (!parsed.ok) throw new Error('the level did not parse')
  const moved = writeContent('level', {
    ...parsed.value,
    things: parsed.value.things.map((thing) => (thing.id === 'crate-1' ? { ...thing, x: 12.5 } : thing)),
  })
  opened = await openGame({ search: '?watch', files: { [LEVEL]: moved } })
  const { page, errors } = opened
  expect(await stateOf(page)).toBe('watching')
  await untilWatchTick(page, 60)
  expect(await page.getByRole('alert').count()).toBe(0)
  expect(errors).toEqual([])
})

test('with no recording the game opens ready to play', async () => {
  opened = await openGame({ search: '?watch', files: { [RECORDING]: undefined } })
  const { page } = opened
  expect(await stateOf(page)).toBe('playing')
  expect(await page.evaluate(() => window.automataWatch)).toBeUndefined()
  expect(await page.getByText(WORDS.goal, { exact: true }).isVisible()).toBe(true)
  await untilTick(page, 5)
})

test('without ?watch nothing changed: it plays at once and never asks for the recording', async () => {
  opened = await openGame()
  const { page, requested } = opened
  expect(await stateOf(page)).toBe('playing')
  expect(requested.filter((url) => url.includes('replays/'))).toEqual([])
})

test('a tap on the game takes over, from the start, and then a touch brings up the buttons', async () => {
  opened = await openGame({ size: 'phone-390x844', search: '?watch' })
  const { page } = opened
  await untilWatchTick(page, 30)
  await page.touchscreen.tap(195, 500)
  await untilState(page, 'playing')
  expect(await watchTickOf(page)).toBe(-1)
  expect(await page.getByText(WORDS.goal, { exact: true }).isVisible()).toBe(true)
  expect(await page.locator('canvas').count()).toBe(1)
  await page.touchscreen.tap(195, 300)
  for (const name of ['Left', 'Right', 'Jump']) {
    const box = await page.getByRole('button', { name }).boundingBox()
    expect(box?.width ?? 0, name).toBeGreaterThanOrEqual(48)
    expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(48)
  }
})

test('a key takes over too, so no one needs a mouse', async () => {
  opened = await openGame({ search: '?watch' })
  const { page } = opened
  await untilWatchTick(page, 30)
  await page.keyboard.press('Space')
  await untilState(page, 'playing')
  expect(await tickOf(page)).toBeLessThan(60)
})

test('turning the phone keeps the game watching', async () => {
  opened = await openGame({ size: 'phone-390x844', search: '?watch' })
  const { page } = opened
  await untilWatchTick(page, 30)
  await page.setViewportSize({ width: 844, height: 390 })
  const before = await watchTickOf(page)
  await untilWatchTick(page, before + 20)
  expect(await stateOf(page)).toBe('watching')
  const canvas = await page.locator('canvas').boundingBox()
  expect((canvas?.y ?? 0) + (canvas?.height ?? 0)).toBeCloseTo(390, 0)
})

test('framed: the page hears watching, says play, and hears playing, with no reload', async () => {
  opened = await openGame({ search: '?watch', framed: {} })
  const { page, game } = opened
  await opened.untilHeard(1)
  expect(await opened.heard()).toEqual([{ automata: 'state', state: 'watching' }])
  await untilWatchTick(game, 20)
  await opened.post(PLAY_MESSAGE)
  await untilState(game, 'playing')
  await opened.untilHeard(2)
  expect(await opened.heard()).toEqual([
    { automata: 'state', state: 'watching' },
    { automata: 'state', state: 'playing' },
  ])
  expect(await opened.frameLoads(), 'the frame loaded once').toBe(1)
  // The level starts from its beginning, and the keys reach the game.
  expect(await tickOf(game)).toBeLessThan(60)
  await game.locator('#game').click()
  await page.keyboard.down('ArrowRight')
  await untilTick(game, 90)
  await page.keyboard.up('ArrowRight')
  const held = await game.evaluate(() =>
    (window.automataGame?.replay().commands ?? []).map((c) => JSON.stringify(c.payload)),
  )
  expect(held.some((payload) => payload.includes('right'))).toBe(true)
})

test('framed: junk is ignored', async () => {
  opened = await openGame({ search: '?watch', framed: {} })
  const { game } = opened
  await untilWatchTick(game, 10)
  for (const junk of [{}, null, 'play', 7, { automata: 'stop' }, { automata: 'state', state: 'playing' }])
    await opened.post(junk)
  await framesPass(game, 5)
  expect(await stateOf(game)).toBe('watching')
  // Still alive: the recording goes on.
  const before = await watchTickOf(game)
  await untilWatchTick(game, before + 10)
})

test("framed by a stranger's page: it neither hears the game nor can start it", async () => {
  opened = await openGame({ search: '?watch', framed: { from: 'other' } })
  const { game } = opened
  await untilWatchTick(game, 10)
  await opened.post(PLAY_MESSAGE)
  await framesPass(game, 5)
  expect(await stateOf(game), 'a page at another origin cannot start it').toBe('watching')
  expect(await opened.heard(), 'the game tells only its own origin').toEqual([])
})

test('framed: play sent while the game is still loading is not lost', async () => {
  opened = await openGame({ search: '?watch', framed: {}, hold: /replays\// })
  const { game } = opened
  // The game's script has started listening once it has set up what a journey reads.
  await game.waitForFunction(() => 'automataWatch' in window)
  await opened.post(PLAY_MESSAGE)
  opened.release()
  await untilState(game, 'playing')
  expect(await game.locator('canvas').count()).toBe(1)
  expect(await tickOf(game)).toBeLessThan(60)
})

test('framed: scrolled off the outer page, the game is still, and goes on when scrolled back', async () => {
  opened = await openGame({ search: '?watch', framed: { tall: true } })
  const { page, game } = opened
  // Below the fold at first: not seen, so not playing.
  await framesPass(page, 5)
  expect(await watchTickOf(game)).toBe(0)
  await page.evaluate(() => window.scrollTo(0, 3000))
  await untilWatchTick(game, 20)
  await page.evaluate(() => window.scrollTo(0, 0))
  await framesPass(page, 10)
  const still = await watchTickOf(game)
  await framesPass(page, 30)
  expect(await watchTickOf(game), 'the game did not move while it was off the screen').toBe(still)
  await page.evaluate(() => window.scrollTo(0, 3000))
  await untilWatchTick(game, still + 10)
})

test('framed: a wheel over the watching game scrolls the page', async () => {
  opened = await openGame({ size: 'phone-390x844', search: '?watch', framed: { tall: true } })
  const { page, game } = opened
  await page.evaluate(() => window.scrollTo(0, 3000))
  await untilWatchTick(game, 10)
  await page.mouse.move(195, 400)
  await page.mouse.wheel(0, -400)
  await page.waitForFunction(() => window.scrollY < 3000)
})
