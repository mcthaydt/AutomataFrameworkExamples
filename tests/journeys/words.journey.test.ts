// The words that tell a player what to do sit above the game, never on it. On a phone held sideways the level fills
// the height, so words laid over it would cover the top of the level; the page gives the words a strip of their own and
// the game the rest. The checks are boxes on the page: the words end where the game's canvas begins.
import { afterAll, afterEach, expect, test } from 'vitest'
import { closeBrowser, type Opened, openGame, SIZES, untilTick } from './open.ts'

let opened: Opened | undefined
afterEach(async () => {
  await opened?.close()
  opened = undefined
})
afterAll(closeBrowser)

for (const [name, size] of Object.entries(SIZES) as [
  keyof typeof SIZES,
  (typeof SIZES)[keyof typeof SIZES],
][]) {
  test(`at ${name}, the words sit above the game and not on it`, async () => {
    opened = await openGame({ size: name })
    const { page } = opened
    // A finger on the screen switches the words to the buttons' words, which can wrap to another line.
    if (size.touch) await page.touchscreen.tap(size.width / 2, size.height / 2)
    await untilTick(page, 30)
    const words = await page.locator('.play-words').boundingBox()
    const canvas = await page.locator('canvas').boundingBox()
    expect(words, 'the words are on screen').not.toBeNull()
    expect(canvas, 'the game is on screen').not.toBeNull()
    if (words === null || canvas === null) return
    expect(words.y + words.height, 'the words end before the game begins').toBeLessThanOrEqual(canvas.y + 0.5)
    expect(canvas.y + canvas.height, 'the game runs to the bottom of the window').toBeCloseTo(size.height, 0)
    expect(canvas.width, 'the game is as wide as the window').toBeCloseTo(size.width, 0)
  })
}
