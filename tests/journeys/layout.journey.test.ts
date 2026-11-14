// The touch buttons must never sit on the hero. They take the bottom of the screen once a finger touches it, and the
// framework fits the level above them. The proof looks at what a player sees: a picture of the page, in which the hero
// is the one red thing, and the buttons are boxes on the page. Held sideways on a phone, the level fills the height,
// which is where the buttons once covered the hero's starting place.
import type { Page } from 'playwright'
import { afterAll, afterEach, expect, test } from 'vitest'
import { closeBrowser, fontsReady, type Opened, openGame, SIZES, untilTick } from './open.ts'

let opened: Opened | undefined
afterEach(async () => {
  await opened?.close()
  opened = undefined
})
afterAll(closeBrowser)

interface Box {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

const overlaps = (a: Box, b: Box): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

/**
 * The box around every red-ish pixel of a picture, or `undefined` if there are none. "Red-ish" is red well above green
 * and blue: it takes in the hero and the hero seen through a button, and none of the sky, the walls, the yellow crate
 * or the see-through buttons. The picture is read in a page of its own, with the browser's own decoder.
 */
async function redBox(page: Page, png: Buffer): Promise<Box | undefined> {
  const reader = await page.context().newPage()
  try {
    return await reader.evaluate(async (base64) => {
      const image = new Image()
      image.src = `data:image/png;base64,${base64}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      if (context === null) throw new Error('No 2D canvas to read the picture with.')
      context.drawImage(image, 0, 0)
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
      let left = canvas.width
      let top = canvas.height
      let right = -1
      let bottom = -1
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const at = (y * canvas.width + x) * 4
          const [r, g, b] = [data[at] ?? 0, data[at + 1] ?? 0, data[at + 2] ?? 0]
          if (r - Math.max(g, b) < 50) continue
          left = Math.min(left, x)
          top = Math.min(top, y)
          right = Math.max(right, x)
          bottom = Math.max(bottom, y)
        }
      }
      return right < 0 ? undefined : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
    }, png.toString('base64'))
  } finally {
    await reader.close()
  }
}

/**
 * The hero, with the buttons hidden from the picture but still measured. A solid button would hide the part of the hero
 * under it, the red box would shrink to what still shows, and the check would pass on the very overlap it is there to
 * catch.
 */
async function heroSeen(page: Page): Promise<Box | undefined> {
  const hide = await page.addStyleTag({ content: '.automata-touch { visibility: hidden !important }' })
  try {
    return await redBox(page, await page.screenshot())
  } finally {
    await hide.evaluate((node) => node.parentNode?.removeChild(node))
  }
}

const touchSizes = (Object.keys(SIZES) as (keyof typeof SIZES)[]).filter((name) => SIZES[name].touch)

for (const name of touchSizes) {
  test(`at ${name}, no button sits on the hero`, async () => {
    opened = await openGame({ size: name })
    const { page } = opened
    const size = SIZES[name]
    // A finger on the screen brings up the buttons, as it does for a player on a phone or a tablet.
    await page.touchscreen.tap(size.width / 2, size.height / 2)
    for (const label of ['Left', 'Right', 'Jump']) await page.getByRole('button', { name: label }).waitFor()
    await untilTick(page, 30)
    await fontsReady(page)

    const hero = await heroSeen(page)
    expect(hero, 'the hero is on screen').toBeDefined()
    if (hero === undefined) return
    for (const label of ['Left', 'Right', 'Jump']) {
      const box = await page.getByRole('button', { name: label }).boundingBox()
      expect(box, label).not.toBeNull()
      if (box !== null) expect(overlaps(hero, box), `${label} sits on the hero`).toBe(false)
    }
  })
}

test('the check bites: a button put over the hero is reported', async () => {
  opened = await openGame({ size: 'phone-390x844' })
  const { page } = opened
  await page.touchscreen.tap(195, 422)
  await page.getByRole('button', { name: 'Jump' }).waitFor()
  await untilTick(page, 30)
  await fontsReady(page)
  const hero = await heroSeen(page)
  expect(hero, 'the hero is on screen').toBeDefined()
  if (hero === undefined) return
  // Jump, moved to where the hero starts. The solid button would hide the hero in a picture, so only the buttons'
  // boxes (measured with the buttons hidden from the picture) can say it is there.
  await page.addStyleTag({
    content: `.automata-touch-button[data-action='jump'] { position: fixed; left: ${hero.x}px; top: ${hero.y}px }`,
  })
  const box = await page.getByRole('button', { name: 'Jump' }).boundingBox()
  expect(box).not.toBeNull()
  if (box !== null) expect(overlaps(hero, box)).toBe(true)
})
