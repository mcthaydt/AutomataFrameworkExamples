// The built game, played by a real browser from outside: the page opens, says what to do, and what was played replays
// to the same hash in Node. Journeys wait on the game's own tick, never on a sleep.
import { playReplay, Thing, Transform, verifyReplay } from '@automataframework/framework/headless'
import { afterAll, afterEach, expect, test } from 'vitest'
import { WORDS } from '#src/features/play/words.ts'
import { PINNED_CRATE_X, pinnedFiles } from '../fixtures/pinned-level.ts'
import { closeBrowser, nodeSim, type Opened, openGame, replayOf, tickOf, untilTick } from './open.ts'

let opened: Opened | undefined
afterEach(async () => {
  await opened?.close()
  opened = undefined
})
afterAll(closeBrowser)

const visible = async (page: Opened['page'], words: string): Promise<boolean> =>
  page.getByText(words, { exact: true }).isVisible()

test('the game opens, says what to do, and nothing goes wrong', async () => {
  opened = await openGame()
  const { page, errors } = opened
  expect(await page.locator('#game').getAttribute('data-state')).toBe('playing')
  expect(await visible(page, WORDS.goal)).toBe(true)
  expect(await visible(page, WORDS.keys)).toBe(true)
  const canvases = page.locator('canvas')
  expect(await canvases.count()).toBe(1)
  expect(await canvases.isVisible()).toBe(true)
  const box = await canvases.boundingBox()
  // The words have a strip of their own above the game; the game takes the rest of the window.
  const words = await page.locator('.play-words').boundingBox()
  expect(Math.round(box?.width ?? 0)).toBe(1280)
  expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(720)
  expect(box?.y ?? 0).toBeGreaterThanOrEqual((words?.y ?? 0) + (words?.height ?? 0) - 0.5)
  expect(errors).toEqual([])
})

test('holding the right arrow key pushes the crate, and what was played replays to the same hash in Node', async () => {
  // The level is one this file owns (`pinned-level.ts`), so an editor moving the real crate cannot break the push.
  opened = await openGame({ files: pinnedFiles })
  const { page } = opened
  await page.keyboard.down('ArrowRight')
  await untilTick(page, 180)
  await page.keyboard.up('ArrowRight')
  const replay = await replayOf(page)

  const checking = await nodeSim(pinnedFiles)
  expect(verifyReplay(checking, replay)).toEqual({ ok: true })
  checking.dispose()

  const played = await nodeSim(pinnedFiles)
  playReplay(played, replay)
  const crate = played.query(Thing, Transform).find((entity) => entity.get(Thing).id === 'crate-1')
  expect(crate?.get(Transform).x).toBeGreaterThan(PINNED_CRATE_X + 1)
  played.dispose()

  // And the page told the player so: the words changed from "push" to "you did it".
  expect(await visible(page, WORDS.done)).toBe(true)
})

test('on a phone, a touch brings up Left, Right and Jump, and holding Right runs the hero', async () => {
  opened = await openGame({ size: 'phone-390x844' })
  const { page } = opened
  await page.touchscreen.tap(195, 300)
  for (const name of ['Left', 'Right', 'Jump']) {
    const button = page.getByRole('button', { name })
    expect(await button.isVisible(), name).toBe(true)
    const box = await button.boundingBox()
    expect(box?.width ?? 0, name).toBeGreaterThanOrEqual(48)
    expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(48)
  }
  expect(await visible(page, WORDS.touch)).toBe(true)

  const right = page.getByRole('button', { name: 'Right' })
  await right.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 1, bubbles: true })
  await untilTick(page, (await tickOf(page)) + 60)
  await right.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 1, bubbles: true })

  const replay = await replayOf(page)
  const held = replay.commands
    .filter((command) => command.type === 'controls')
    .map((command) => command.payload)
  expect(JSON.stringify(held)).toContain('"right"')
  const checking = await nodeSim()
  expect(verifyReplay(checking, replay)).toEqual({ ok: true })
  checking.dispose()
})

test('turning the phone keeps the game on screen and playing', async () => {
  opened = await openGame({ size: 'phone-390x844' })
  const { page } = opened
  await page.setViewportSize({ width: 844, height: 390 })
  expect(await page.locator('#game').getAttribute('data-state')).toBe('playing')
  const before = await tickOf(page)
  await untilTick(page, before + 10)
  const box = await page.locator('canvas').boundingBox()
  expect(Math.round(box?.width ?? 0)).toBe(844)
  expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(390)
  const words = await page.locator('.play-words').boundingBox()
  expect(words?.x ?? -1).toBeGreaterThanOrEqual(0)
  expect(words?.y ?? -1).toBeGreaterThanOrEqual(0)
  expect((words?.x ?? 0) + (words?.width ?? 0)).toBeLessThanOrEqual(844)
  expect((words?.y ?? 0) + (words?.height ?? 0)).toBeLessThanOrEqual(390)
})
