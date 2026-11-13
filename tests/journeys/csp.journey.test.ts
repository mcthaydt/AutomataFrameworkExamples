// The Site puts a strict Content-Security-Policy on the game: scripts only from the page's own origin, and no eval.
// The game must start under it and the browser must report nothing blocked. (Firefox once reported the framework's
// eval probe, a caught `new Function`, as a violation; the framework now never makes it.)
import { afterAll, afterEach, expect, test } from 'vitest'
import { closeBrowser, type Opened, openGame, untilTick } from './open.ts'

/** The policy the Site sends with the game (script-src only; wasm-unsafe-eval is for the physics engine). */
const SITE_POLICY = "script-src 'self' 'wasm-unsafe-eval'"

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
