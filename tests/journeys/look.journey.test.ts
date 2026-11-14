// The Blueprint look on the built page, in each browser, at every size: dark paper, the one font, the buttons as paper
// chips that turn peach red under a thumb, a broken file said on the same paper, and a page that still plays when its font
// files never arrive. Layout and focus are checked here because a screenshot proves neither.
import type { Page } from 'playwright'
import { afterAll, afterEach, expect, test } from 'vitest'
import { WORDS } from '#src/features/play/words.ts'
import { pinnedFiles } from '../fixtures/pinned-level.ts'
import {
  closeBrowser,
  ENGINE,
  fontLoaded,
  fontsReady,
  type Opened,
  openGame,
  SIZES,
  untilTick,
} from './open.ts'

let opened: Opened | undefined
afterEach(async () => {
  await opened?.close()
  opened = undefined
})
afterAll(closeBrowser)

const PAPER = 'rgb(17, 19, 20)'
const CHALK = 'rgb(182, 191, 193)'
const MARKER = 'rgb(241, 90, 48)'
const LEVEL = 'content/levels/level-1.json'
const LABELS = ['Left', 'Right', 'Jump'] as const

interface Box {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}
const overlaps = (a: Box, b: Box): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

const sizes = Object.entries(SIZES) as [keyof typeof SIZES, (typeof SIZES)[keyof typeof SIZES]][]

/** What the page itself says about its colours and about whether it scrolls sideways. */
const pageLook = (page: Page): Promise<{ body: string; strip: string; sideways: boolean }> =>
  page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    strip: getComputedStyle(document.querySelector('.play-words') ?? document.body).backgroundColor,
    sideways: document.documentElement.scrollWidth > window.innerWidth,
  }))

/** Each button's box, colours and picture, as the browser draws them. */
const buttonsLook = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLButtonElement>('.automata-touch-button')].map((b) => {
      const rect = b.getBoundingClientRect()
      const style = getComputedStyle(b)
      const picture = getComputedStyle(b, '::before')
      return {
        label: b.textContent ?? '',
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        background: style.backgroundColor,
        edge: style.borderTopColor,
        pictureWidth: picture.width,
        mask: picture.maskImage || picture.getPropertyValue('-webkit-mask-image'),
      }
    }),
  )

for (const [name, size] of sizes) {
  test(`at ${name}, the game wears the look`, async () => {
    opened = await openGame({ size: name })
    const { page } = opened
    // A finger on the screen brings up the buttons, as it does for a player on a phone or a tablet.
    if (size.touch) await page.touchscreen.tap(size.width / 2, size.height / 2)
    await untilTick(page, 30)
    await fontsReady(page)

    const look = await pageLook(page)
    expect(look.body).toBe(PAPER)
    expect(look.strip).toBe(PAPER)
    expect(await fontLoaded(page, 'Fredoka', '600')).toBe(true)
    expect(look.sideways, 'nothing scrolls sideways').toBe(false)

    if (!size.touch) return
    const buttons = await buttonsLook(page)
    expect(buttons.map((b) => b.label)).toEqual([...LABELS])
    const words = await page.locator('.play-words').boundingBox()
    for (const [i, b] of buttons.entries()) {
      expect(b.box.width, b.label).toBeGreaterThanOrEqual(64)
      expect(b.box.height, b.label).toBeGreaterThanOrEqual(64)
      expect(b.box.x, b.label).toBeGreaterThanOrEqual(0)
      expect(b.box.x + b.box.width, b.label).toBeLessThanOrEqual(size.width)
      expect(b.box.y + b.box.height, b.label).toBeLessThanOrEqual(size.height)
      expect(words !== null && overlaps(words, b.box), `${b.label} sits under the words`).toBe(false)
      for (const other of buttons.slice(i + 1)) expect(overlaps(b.box, other.box), b.label).toBe(false)
      expect(b.pictureWidth, `${b.label}'s picture`).toBe('28px')
      expect(b.mask, `${b.label}'s picture`).not.toBe('none')
      expect(b.background, b.label).toBe(PAPER)
      expect(b.edge, b.label).toBe(CHALK)
    }
  })
}

for (const [name, size] of sizes.filter(([, s]) => s.touch)) {
  test(`at ${name}, holding Jump turns it peach red and the hero jumps`, async () => {
    opened = await openGame({ size: name })
    const { page } = opened
    await page.touchscreen.tap(size.width / 2, size.height / 2)
    const jump = page.getByRole('button', { name: 'Jump' })
    await jump.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 1, bubbles: true })
    const background = (): Promise<string> => jump.evaluate((b) => getComputedStyle(b).backgroundColor)
    expect(await background()).toBe(MARKER)
    await untilTick(page, (await page.evaluate(() => window.automataGame?.sim.tick ?? 0)) + 10)
    await jump.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 1, bubbles: true })
    expect(await background()).toBe(PAPER)

    const replay = JSON.parse(await page.evaluate(() => JSON.stringify(window.automataGame?.replay()))) as {
      commands: { type: string; payload: unknown }[]
    }
    const held = replay.commands.filter((c) => c.type === 'controls').map((c) => c.payload)
    expect(JSON.stringify(held)).toContain('"jump"')
  })
}

for (const [name, size] of sizes) {
  test(`at ${name}, a broken file is said on the dark paper and fits the screen`, async () => {
    opened = await openGame({ size: name, files: { [LEVEL]: '{ "format": 1,' } })
    const { page } = opened
    await fontsReady(page)
    const alert = page.getByRole('alert')
    const shown = await alert.evaluate((screen) => {
      const style = getComputedStyle(screen)
      return {
        background: style.backgroundColor,
        color: style.color,
        sideways: screen.scrollWidth > screen.clientWidth,
      }
    })
    expect(shown.background).toBe(PAPER)
    expect(shown.color).toBe(CHALK)
    expect(shown.sideways, 'the screen scrolls only downwards').toBe(false)
    // The title and the fix line are on screen without scrolling sideways.
    for (const words of [WORDS.problemTitle, WORDS.problemFix]) {
      const box = await page.getByText(words, { exact: true }).boundingBox()
      expect(box, words).not.toBeNull()
      if (box !== null) expect(box.x + box.width, words).toBeLessThanOrEqual(size.width)
    }
    expect(await page.locator('canvas').count()).toBe(0)
  })
}

test('at desktop-1280x720, pushing the crate says well done, with a tick', async () => {
  // The pinned level, so the crate is where the push needs it whatever an editor has done to the real level.
  opened = await openGame({ size: 'desktop-1280x720', files: pinnedFiles })
  const { page } = opened
  await page.keyboard.down('ArrowRight')
  await untilTick(page, 180)
  await page.keyboard.up('ArrowRight')
  await fontsReady(page)
  expect(await page.getByText(WORDS.done, { exact: true }).isVisible()).toBe(true)
  const goal = await page.locator('.play-goal').evaluate((p) => {
    const tick = getComputedStyle(p, '::before')
    return {
      done: p.classList.contains('play-done'),
      color: getComputedStyle(p).color,
      tickWidth: tick.width,
      mask: tick.maskImage || tick.getPropertyValue('-webkit-mask-image'),
    }
  })
  expect(goal.done).toBe(true)
  expect(goal.color).toBe(CHALK)
  expect(goal.tickWidth).toBe('20px')
  expect(goal.mask).not.toBe('none')
})

test('at tablet-1180x820, Tab shows where the keyboard is', async () => {
  opened = await openGame({ size: 'tablet-1180x820' })
  const { page } = opened
  await page.touchscreen.tap(590, 410)
  await page.getByRole('button', { name: 'Jump' }).waitFor()
  const onButton = (): Promise<boolean> =>
    page.evaluate(() => document.activeElement?.matches('.automata-touch-button:focus-visible') ?? false)
  // WebKit only visits buttons with Alt held, as Safari does; the others need plain Tab. Try the engine's own first.
  const keys = ENGINE === 'webkit' ? ['Alt+Tab', 'Tab'] : ['Tab', 'Alt+Tab']
  for (const key of keys) {
    for (let presses = 0; presses < 8 && !(await onButton()); presses++) await page.keyboard.press(key)
    if (await onButton()) break
  }
  expect(await onButton(), 'the keyboard reached a button').toBe(true)
  const ring = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement ?? document.body)
    return { color: style.outlineColor, width: style.outlineWidth, style: style.outlineStyle }
  })
  expect(ring).toEqual({ color: CHALK, width: '3px', style: 'solid' })
})

test('with the fonts blocked, the game still starts and the words are still above it', async () => {
  const block = /\.woff2?$/
  opened = await openGame({ size: 'phone-844x390', block })
  const { page, errorUrls } = opened
  await page.touchscreen.tap(422, 195)
  await untilTick(page, 30)
  await fontsReady(page)
  expect(await page.locator('#game').getAttribute('data-state')).toBe('playing')
  const words = await page.locator('.play-words').boundingBox()
  const canvas = await page.locator('canvas').boundingBox()
  expect(words).not.toBeNull()
  expect(canvas).not.toBeNull()
  if (words !== null && canvas !== null) {
    expect(words.y + words.height, 'the words end where the game begins').toBeLessThanOrEqual(canvas.y + 0.5)
    for (const b of await buttonsLook(page)) expect(overlaps(b.box, words), b.label).toBe(false)
  }
  // A failed request is logged by each browser in its own words, and some do not say which file: Chromium and WebKit
  // give the address; Firefox may give none, and then its words are about a font that did not load. Anything else
  // (an uncaught error, a message about the game) is a real fault.
  const { errors } = opened
  for (const [i, url] of errorUrls.entries()) {
    const aboutTheBlockedFont =
      block.test(url) || (url === '' && /font|failed to load|network|net::/i.test(errors[i] ?? ''))
    expect(
      aboutTheBlockedFont,
      `an error that is not about the blocked fonts: ${url} ${errors[i] ?? ''}`,
    ).toBe(true)
  }
})

test('at 320 wide, the three buttons fit side by side', async () => {
  opened = await openGame({ size: 'phone-390x844' })
  const { page } = opened
  await page.setViewportSize({ width: 320, height: 568 })
  await page.touchscreen.tap(160, 284)
  await page.getByRole('button', { name: 'Jump' }).waitFor()
  await fontsReady(page)
  const buttons = await buttonsLook(page)
  expect(buttons).toHaveLength(3)
  for (const [i, b] of buttons.entries()) {
    expect(b.box.x, b.label).toBeGreaterThanOrEqual(0)
    expect(b.box.x + b.box.width, b.label).toBeLessThanOrEqual(320)
    for (const other of buttons.slice(i + 1)) expect(overlaps(b.box, other.box), b.label).toBe(false)
  }
  expect((await pageLook(page)).sideways, 'nothing scrolls sideways').toBe(false)
})
