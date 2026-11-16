// A first-time player is asked which language to play in, with flags, before anything is said in any language. The
// built game in a real browser: the device's language is already chosen, Go starts the game in it, the choice is kept
// across a real reload, every flag and Go are big enough to press and on screen at the five sizes, and each language's
// font loads from the page's own origin under the Site's strict policy.
import type { Page } from 'playwright'
import { afterAll, afterEach, expect, test } from 'vitest'
import { say } from '../fixtures/words.ts'
import { closeBrowser, fontLoaded, fontsReady, type Opened, openGame, SIZES } from './open.ts'

/** The Site's whole policy (see `csp.journey.test.ts`): everything from the page's own origin. */
const POLICY =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' data: blob:; worker-src 'self' blob:; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'"

const OUT = 'tests/journeys/__screenshots__'

let opened: Opened | undefined
afterEach(async () => {
  await opened?.close()
  opened = undefined
})
afterAll(closeBrowser)

const state = (page: Opened['page']): Promise<string | null> =>
  page.locator('#game').getAttribute('data-state')
const untilPlaying = async (page: Opened['page']): Promise<void> => {
  await page.waitForSelector('#game[data-state="playing"]', { state: 'attached' })
}
/** Waits until a face of this family has been fetched and is ready to draw with. */
const untilFont = (page: Page, family: string): Promise<unknown> =>
  page.waitForFunction(
    (name) =>
      [...document.fonts].some(
        (face) => face.family.replace(/["']/g, '') === name && face.status === 'loaded',
      ),
    family,
  )

test('a device that speaks Korean opens on the Korean flag, and Go starts the game in Korean', async () => {
  opened = await openGame({ language: 'ask', device: 'ko-KR', size: 'phone-390x844' })
  const { page, errors } = opened
  expect(await state(page)).toBe('picking')
  expect(await page.locator('canvas').count(), 'no game behind the flags').toBe(0)
  expect(await page.locator('.automata-flag').count()).toBe(6)
  expect(await page.locator('.automata-flag[aria-pressed="true"]').getAttribute('data-language')).toBe('ko')
  // No language is the default: the page says none until one is chosen.
  expect(await page.evaluate(() => document.documentElement.hasAttribute('lang'))).toBe(false)

  await page.locator('.automata-picker-go').click()
  await untilPlaying(page)
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('ko')
  expect(await page.getByText(say('level.level-1.goal', 'ko'), { exact: true }).isVisible()).toBe(true)
  expect(errors).toEqual([])
})

test('the choice is kept across a real reload: the second visit has no flags', async () => {
  opened = await openGame({ language: 'ask', device: 'ko-KR' })
  const { page } = opened
  await page.locator('.automata-flag[data-language="ja"]').click()
  await page.locator('.automata-picker-go').click()
  await untilPlaying(page)
  await page.reload()
  await untilPlaying(page)
  expect(await page.locator('.automata-picker').count()).toBe(0)
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('ja')
  expect(await page.getByText(say('level.level-1.goal', 'ja'), { exact: true }).isVisible()).toBe(true)
})

for (const [name, size] of Object.entries(SIZES) as [
  keyof typeof SIZES,
  (typeof SIZES)[keyof typeof SIZES],
][]) {
  test(`at ${name}, every flag and Go are at least 48 pixels and on the screen`, async () => {
    opened = await openGame({ size: name, language: 'ask', device: 'es-MX' })
    const { page } = opened
    await fontsReady(page)
    const buttons = [...(await page.locator('.automata-flag').all()), page.locator('.automata-picker-go')]
    expect(buttons).toHaveLength(7)
    for (const button of buttons) {
      const box = await button.boundingBox()
      const label = (await button.getAttribute('data-language')) ?? 'go'
      expect(box, label).not.toBeNull()
      if (box === null) continue
      expect(box.width, label).toBeGreaterThanOrEqual(48)
      expect(box.height, label).toBeGreaterThanOrEqual(48)
      expect(box.x, label).toBeGreaterThanOrEqual(0)
      expect(box.y, label).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width, label).toBeLessThanOrEqual(size.width)
      expect(box.y + box.height, label).toBeLessThanOrEqual(size.height)
    }
    await page.screenshot({ path: `${OUT}/picker-${name}.png` })
  })
}

// The picker shows its title in the chosen flag's language, so the font for that language is on show before the
// game is: Korean, Japanese and Chinese each have a partner for Fredoka. A look at each is a picture.
for (const [device, file, family] of [
  ['ko-KR', 'korean', 'Jua'],
  ['ja-JP', 'japanese', 'M PLUS Rounded 1c'],
  ['zh-CN', 'chinese', 'ZCOOL KuaiLe'],
] as const) {
  test(`the picker's title is set in ${family} for a ${file} device`, async () => {
    opened = await openGame({ size: 'phone-390x844', language: 'ask', device })
    const { page } = opened
    await untilFont(page, family)
    const title = page.locator('.automata-picker-title')
    expect(await title.isVisible()).toBe(true)
    expect((await title.innerText()).length).toBeGreaterThan(0)
    await fontsReady(page)
    await page.screenshot({ path: `${OUT}/${file}-390x844.png` })
  })
}

for (const [language, family, weight, others] of [
  ['ko', 'Jua', '400', ['M PLUS Rounded 1c', 'ZCOOL KuaiLe']],
  ['ja', 'M PLUS Rounded 1c', '500', ['Jua', 'ZCOOL KuaiLe']],
  ['zh', 'ZCOOL KuaiLe', '400', ['Jua', 'M PLUS Rounded 1c']],
] as const) {
  test(`under the Site's whole policy a ${language} page loads only its own partner font, from its own origin`, async () => {
    opened = await openGame({ size: 'phone-390x844', language, csp: POLICY })
    const { page, violations, answered } = opened
    await untilPlaying(page)
    await untilFont(page, family)
    expect(violations, 'the policy blocked nothing').toEqual([])
    expect(await fontLoaded(page, family, weight)).toBe(true)
    const fetched = answered.map((one) => one.url)
    for (const other of others) {
      const file = other.toLowerCase().replaceAll(' ', '-')
      expect(
        fetched.some((url) => url.includes(file)),
        `a ${language} page does not fetch ${other}`,
      ).toBe(false)
    }
  })
}
