// The built game, played by a real browser from outside: the page opens, says what to do, and what was played replays
// to the same hash in Node. Journeys wait on the game's own tick, never on a sleep.
import { playReplay, Thing, Transform, verifyReplay } from '@automataframework/framework/headless'
import { afterAll, afterEach, expect, test } from 'vitest'
import { PINNED_CRATE_X, pinnedFiles } from '../fixtures/pinned-level.ts'
import { KEYBOARD_WORDS, say, THUMB_WORDS } from '../fixtures/words.ts'
import { closeBrowser, nodeSim, type Opened, openGame, replayOf, tickOf, untilTick } from './open.ts'
import { SLIDE_PX, thumb } from './thumbs.ts'

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
  expect(await visible(page, say('level.level-1.goal'))).toBe(true)
  expect(await visible(page, KEYBOARD_WORDS)).toBe(true)
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

  // And the page told the player so: the words changed from the goal of the level to "well done".
  expect(await visible(page, say('goal.done'))).toBe(true)
})

test('on a phone, a touch brings up the two thumbs, and sliding the walking thumb runs the hero', async () => {
  opened = await openGame({ size: 'phone-390x844' })
  const { page } = opened
  await page.touchscreen.tap(97, 300)
  for (const name of [THUMB_WORDS.walk, THUMB_WORDS.jump]) {
    const half = page.getByRole('group', { name })
    expect(await half.isVisible(), name).toBe(true)
    const box = await half.boundingBox()
    expect(box?.width ?? 0, name).toBeGreaterThanOrEqual(44)
    expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(44)
  }
  const dash = await page.getByRole('button', { name: THUMB_WORDS.dash }).boundingBox()
  expect(dash?.width ?? 0).toBeGreaterThanOrEqual(48)
  expect(dash?.height ?? 0).toBeGreaterThanOrEqual(48)

  await thumb(page, 'walk', 'down')
  await thumb(page, 'walk', 'move', SLIDE_PX)
  await untilTick(page, (await tickOf(page)) + 60)
  await thumb(page, 'walk', 'up', SLIDE_PX)
  await thumb(page, 'jump', 'down')
  await untilTick(page, (await tickOf(page)) + 5)
  await thumb(page, 'jump', 'up')
  // A thumb is the device now, so the strip has no key words: the thumbs carry their own hints.
  expect(await page.locator('.play-how').isHidden()).toBe(true)

  const replay = await replayOf(page)
  const held = JSON.stringify(
    replay.commands.filter((command) => command.type === 'controls').map((command) => command.payload),
  )
  expect(held).toContain('"right"')
  expect(held).toContain('"jump"')
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
