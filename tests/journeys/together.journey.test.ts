// Two people play on one keyboard: the first presses the people button, the framework's "Add a player" screen says
// player 1 is in, Enter shares the keyboard and says player 2 is in, Done goes back to the level. Player 1 is on the
// letter keys and player 2 on the arrows; player 2 takes the crate through the door, and both are still in the game on
// the other side. On a phone the same button says plainly that two players need a keyboard or gamepads. The game is
// played by its own keys; the journey waits on its tick and its state, never on a sleep.
import { frameworkWords } from '@automataframework/framework/headless'
import { afterAll, afterEach, expect, test } from 'vitest'
import { say } from '../fixtures/words.ts'
import { closeBrowser, type Opened, openGame, tickOf, untilTick } from './open.ts'

let opened: Opened | undefined
afterEach(async () => {
  await opened?.close()
  opened = undefined
})
afterAll(closeBrowser)

const framework = frameworkWords('en')
const ADD = framework('automata.players.title')

/** Where each player's hero is, in tiles, from the game's own snapshot. */
const heroes = (page: Opened['page']): Promise<Record<number, number>> =>
  page.evaluate(() => {
    const out: Record<number, number> = {}
    for (const entity of window.automataGame?.sim.describeSnapshot().entities ?? []) {
      const player = entity.components.player as { number: number } | undefined
      const at = entity.components.transform as { x: number } | undefined
      if (player !== undefined && at !== undefined) out[player.number] = at.x
    }
    return out
  })

const playersOf = (page: Opened['page']): Promise<readonly number[]> =>
  page.evaluate(() => [...(window.automataGame?.players() ?? [])])

const saysGoal = (page: Opened['page'], level: string): Promise<void> =>
  page.getByText(say(`level.${level}.goal`), { exact: true }).waitFor({ state: 'visible' })

test('two on one keyboard: add a player, share the keys, and both go on through the door', async () => {
  opened = await openGame()
  const { page, errors } = opened
  await saysGoal(page, 'level-1')
  expect(await playersOf(page)).toEqual([1])

  // The people button opens the framework's own screen, which says who is in and how to join.
  await page.getByRole('button', { name: ADD, exact: true }).click()
  await page.getByText(framework('automata.players.in', { player: 1 }), { exact: true }).waitFor()
  await page.getByText(framework('automata.players.keyboard'), { exact: true }).waitFor()
  await page.keyboard.press('Enter')
  await page.getByText(framework('automata.players.in', { player: 2 }), { exact: true }).waitFor()
  await page.getByRole('button', { name: framework('automata.players.done'), exact: true }).click()
  await page.getByText(framework('automata.players.title'), { exact: true }).waitFor({ state: 'detached' })

  // Back in the level, the game runs again and player 2's hero has come in.
  await untilTick(page, (await tickOf(page)) + 10)
  expect(await playersOf(page)).toEqual([1, 2])
  const before = await heroes(page)
  expect(Object.keys(before)).toEqual(['1', '2'])

  // The arrows are player 2's now: they push the crate onto the plate, hop through the gate and into the door.
  await page.keyboard.down('ArrowRight')
  await page.waitForFunction(() => {
    for (const entity of window.automataGame?.sim.describeSnapshot().entities ?? []) {
      const player = entity.components.player as { number: number } | undefined
      const at = entity.components.transform as { x: number } | undefined
      if (player?.number === 2 && at !== undefined) return at.x >= 10
    }
    return false
  })
  await page.keyboard.up('ArrowRight')
  // Player 1 did not move: the arrows are not theirs any more.
  expect((await heroes(page))[1]).toBeCloseTo(before[1] ?? Number.NaN, 1)
  await untilTick(page, (await tickOf(page)) + 12)
  await page.keyboard.down('ArrowUp')
  await page.keyboard.down('ArrowRight')
  await saysGoal(page, 'level-2')
  await page.keyboard.up('ArrowUp')
  await page.keyboard.up('ArrowRight')

  // Level 2 opened with both of them beside its way back, and the arrows still move player 2 (right, away from that
  // door) and not player 1.
  await untilTick(page, (await tickOf(page)) + 30)
  expect(await playersOf(page)).toEqual([1, 2])
  const arrived = await heroes(page)
  await page.keyboard.down('ArrowRight')
  await untilTick(page, (await tickOf(page)) + 20)
  await page.keyboard.up('ArrowRight')
  const after = await heroes(page)
  expect(after[2]).toBeGreaterThan((arrived[2] ?? Number.NaN) + 0.5)
  expect(after[1]).toBeCloseTo(arrived[1] ?? Number.NaN, 1)
  expect(errors).toEqual([])
})

test('on a phone, the people button says two players need a keyboard or gamepads, and the game goes on', async () => {
  opened = await openGame({ size: 'phone-390x844' })
  const { page, errors } = opened
  await saysGoal(page, 'level-1')
  await page.getByRole('button', { name: ADD, exact: true }).tap()
  await page.getByText(say('players.touch'), { exact: true }).waitFor()
  expect(await page.getByText(framework('automata.players.in', { player: 1 }), { exact: true }).count()).toBe(
    0,
  )
  const tick = await tickOf(page)
  await untilTick(page, tick + 10)
  expect(await playersOf(page)).toEqual([1])
  expect(errors).toEqual([])
})
