// The Site puts a strict Content-Security-Policy on the game: scripts only from the page's own origin, and no eval.
// The game must start under it and the browser must report nothing blocked. (Firefox once reported the framework's
// eval probe, a caught `new Function`, as a violation; the framework now never makes it.)
import { afterAll, afterEach, expect, test } from 'vitest'
import { closeBrowser, fontLoaded, fontsReady, type Opened, openGame, untilTick } from './open.ts'

/** The policy the Site sends with the game (script-src only; wasm-unsafe-eval is for the physics engine). */
const SITE_POLICY = "script-src 'self' 'wasm-unsafe-eval'"

/**
 * The Site's whole policy, copied from its `public/_headers` as of AutomataFrameworkSite commit cdee802 (2026-11-14). A
 * later change there is noticed by comparing this line with that file. The look's fonts and icons must load under every
 * directive of it, not only its script line.
 */
const SITE_WHOLE_POLICY =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' data: blob:; worker-src 'self' blob:; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'"

let opened: Opened | undefined
afterEach(async () => {
  await opened?.close()
  opened = undefined
})
afterAll(closeBrowser)

test("under the Site's strict policy the game starts and nothing is blocked", async () => {
  opened = await openGame({ csp: SITE_POLICY })
  const { page, errors, violations } = opened
  await untilTick(page, 30)
  expect(violations, 'the policy blocked nothing').toEqual([])
  expect(errors, 'the page logged no errors').toEqual([])
})

test("under the Site's whole policy the look loads and nothing is blocked", async () => {
  opened = await openGame({ size: 'phone-390x844', csp: SITE_WHOLE_POLICY })
  const { page, errors, violations } = opened
  await page.touchscreen.tap(195, 422)
  await page.getByRole('button', { name: 'Jump' }).waitFor()
  await fontsReady(page)
  await untilTick(page, 30)
  expect(violations, 'the policy blocked nothing').toEqual([])
  expect(errors, 'the page logged no errors').toEqual([])
  expect(await fontLoaded(page, 'IBM Plex Sans Condensed', '600')).toBe(true)
  const mask = await page.getByRole('button', { name: 'Jump' }).evaluate((b) => {
    const picture = getComputedStyle(b, '::before')
    return picture.maskImage || picture.getPropertyValue('-webkit-mask-image')
  })
  expect(mask, "Jump's picture").not.toBe('none')
})

test("under the Site's whole policy the problem screen loads its font", async () => {
  opened = await openGame({
    size: 'phone-390x844',
    csp: SITE_WHOLE_POLICY,
    files: { 'content/levels/level-1.json': '{ "format": 1,' },
  })
  const { page, violations } = opened
  await fontsReady(page)
  expect(violations, 'the policy blocked nothing').toEqual([])
  expect(await fontLoaded(page, 'JetBrains Mono', '400')).toBe(true)
})
