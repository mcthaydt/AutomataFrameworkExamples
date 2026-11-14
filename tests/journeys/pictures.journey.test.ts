// Pictures for a person to look at, for the drunk-grandma test: the game on a phone, a tablet and a desktop, upright
// and sideways, the screen that says a file is broken, and the words after the crate is pushed. Nothing compares them
// with anything; CI copies them to the `ci-screens` branch, and the checks here are about the words, not the pixels.
import { afterAll, afterEach, expect, test } from 'vitest'
import { WORDS } from '#src/features/play/words.ts'
import { pinnedFiles } from '../fixtures/pinned-level.ts'
import {
  closeBrowser,
  fontsReady,
  type Opened,
  openGame,
  SIZES,
  untilTick,
  untilWatchTick,
  WATCHING_WORDS,
} from './open.ts'

const OUT = 'tests/journeys/__screenshots__'

let opened: Opened | undefined
afterEach(async () => {
  await opened?.close()
  opened = undefined
})
afterAll(closeBrowser)

const overlaps = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

for (const [name, size] of Object.entries(SIZES) as [
  keyof typeof SIZES,
  (typeof SIZES)[keyof typeof SIZES],
][]) {
  test(`how it looks at ${name}`, async () => {
    opened = await openGame({ size: name })
    const { page } = opened
    // A finger on the screen brings up the buttons, as it does for a player on a phone or a tablet.
    if (size.touch) await page.touchscreen.tap(size.width / 2, size.height / 2)
    await untilTick(page, 30)
    const words = await page.locator('.play-words').boundingBox()
    expect(words, 'the words are on screen').not.toBeNull()
    if (words !== null) {
      expect(words.x).toBeGreaterThanOrEqual(0)
      expect(words.x + words.width).toBeLessThanOrEqual(size.width)
      for (const button of await page.getByRole('button').all()) {
        const box = await button.boundingBox()
        expect(box !== null && overlaps(words, box), 'the words sit under no button').toBe(false)
      }
    }
    await fontsReady(page)
    await page.screenshot({ path: `${OUT}/${name}.png` })
  })
}

test('how it looks when a file is broken', async () => {
  opened = await openGame({
    size: 'phone-390x844',
    files: { 'content/levels/level-1.json': '{ "format": 1,' },
  })
  await fontsReady(opened.page)
  await opened.page.screenshot({ path: `${OUT}/problem-390x844.png` })
})

test('how it looks when the crate has been pushed', async () => {
  // The pinned level, so the crate is where the push needs it whatever an editor has done to the real level.
  opened = await openGame({ size: 'phone-390x844', files: pinnedFiles })
  const { page } = opened
  await page.keyboard.down('ArrowRight')
  await untilTick(page, 180)
  await page.keyboard.up('ArrowRight')
  expect(await page.getByText(WORDS.done, { exact: true }).isVisible()).toBe(true)
  await fontsReady(page)
  await page.screenshot({ path: `${OUT}/done-390x844.png` })
})

test('how it looks with Jump held', async () => {
  opened = await openGame({ size: 'phone-390x844' })
  const { page } = opened
  await page.touchscreen.tap(195, 422)
  const jump = page.getByRole('button', { name: 'Jump' })
  await jump.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 1, bubbles: true })
  await untilTick(page, 30)
  await fontsReady(page)
  await page.screenshot({ path: `${OUT}/held-390x844.png` })
})

for (const name of ['phone-844x390', 'tablet-820x1180', 'tablet-1180x820'] as const) {
  test(`how it looks when a file is broken at ${name}`, async () => {
    opened = await openGame({ size: name, files: { 'content/levels/level-1.json': '{ "format": 1,' } })
    await fontsReady(opened.page)
    await opened.page.screenshot({ path: `${OUT}/problem-${name.split('-')[1]}.png` })
  })
}

// The game before anyone has pressed Play: playing its own recording, with the words that say so. No touch buttons.
for (const name of Object.keys(SIZES) as (keyof typeof SIZES)[]) {
  test(`how it looks watching at ${name}`, async () => {
    opened = await openGame({ size: name, search: '?watch' })
    const { page } = opened
    await untilWatchTick(page, 60)
    expect(await page.getByText(WATCHING_WORDS).isVisible()).toBe(true)
    expect(await page.getByRole('button').count(), 'no touch buttons while it plays itself').toBe(0)
    await fontsReady(page)
    await page.screenshot({ path: `${OUT}/watching-${name}.png` })
  })
}
