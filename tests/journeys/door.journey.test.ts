// A player walks through the whole game on the real levels: pushes the crate onto the plate, hops over it and goes
// through the gate and the door, comes out beside the door in level 2 (which leads back, and does not take the hero back
// at once), runs right across the button and the edge into level 3 with no break, and touches the goal. The page
// says each level's goal and then "well done". The game is played by its own keys; the journey waits on its tick.
import { afterAll, afterEach, expect, test } from 'vitest'
import { say } from '../fixtures/words.ts'
import { closeBrowser, type Opened, openGame, replayOf, tickOf, untilTick } from './open.ts'

let opened: Opened | undefined
afterEach(async () => {
  await opened?.close()
  opened = undefined
})
afterAll(closeBrowser)

/** Where the first hero is, in tiles, read from the game's own snapshot (the one entity that has a player). */
const heroX = (page: Opened['page']): Promise<number> =>
  page.evaluate(() => {
    const game = window.automataGame
    const hero = game?.sim.describeSnapshot().entities.find((entity) => 'player' in entity.components)
    const at = hero?.components.transform as { x: number } | undefined
    return at?.x ?? Number.NaN
  })

/** Waits until the first hero has walked to `x` tiles. */
async function untilHeroAt(page: Opened['page'], x: number): Promise<void> {
  await page.waitForFunction((wanted) => {
    const game = window.automataGame
    const hero = game?.sim.describeSnapshot().entities.find((entity) => 'player' in entity.components)
    const at = hero?.components.transform as { x: number } | undefined
    return at !== undefined && at.x >= wanted
  }, x)
}

const saysGoal = (page: Opened['page'], level: string): Promise<void> =>
  page.getByText(say(`level.${level}.goal`), { exact: true }).waitFor({ state: 'visible' })

test('the whole game: the plate, the gate, the door, the way back that stays shut, the edge and the goal', async () => {
  opened = await openGame()
  const { page, errors } = opened
  await saysGoal(page, 'level-1')
  expect(await heroX(page)).toBeCloseTo(2.5, 1)

  // Push the crate two tiles onto the plate, and let go as it lands: the gate opens and stays open while it is there.
  await page.keyboard.down('ArrowRight')
  await untilHeroAt(page, 10)
  await page.keyboard.up('ArrowRight')
  await untilTick(page, (await tickOf(page)) + 12)

  // Hop over the crate, through the gate, into the door.
  await page.keyboard.down('Space')
  await page.keyboard.down('ArrowRight')
  await saysGoal(page, 'level-2')
  await page.keyboard.up('Space')
  await page.keyboard.up('ArrowRight')

  // Level 2 is a new game that opened beside the way back, and the hero is still in it a second later.
  expect((await replayOf(page)).meta).toMatchObject({ level: 'level-2', arrive: 'thing:door-in' })
  const arrived = await tickOf(page)
  await untilTick(page, arrived + 60)
  await saysGoal(page, 'level-2')
  expect(await page.locator('#game').getAttribute('data-state')).toBe('playing')

  // Run right: over the button, across the edge into level 3 with no break, and onto the goal.
  await page.keyboard.down('ArrowRight')
  await saysGoal(page, 'level-3')
  const crossed = await tickOf(page)
  expect(crossed).toBeGreaterThan(arrived + 60)
  await page.getByText(say('goal.done'), { exact: true }).waitFor({ state: 'visible' })
  await page.keyboard.up('ArrowRight')

  // One game ran from the door to the goal: it is still the one that opened level 2.
  const replay = await replayOf(page)
  expect(replay.meta).toMatchObject({ level: 'level-2', arrive: 'thing:door-in' })
  expect(replay.ticks).toBeGreaterThan(crossed)
  expect(errors).toEqual([])
})
