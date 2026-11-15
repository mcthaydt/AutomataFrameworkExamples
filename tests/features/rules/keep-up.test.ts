// Keeping the players within the camera: a player left behind is brought back beside the others, and a game with one
// player, or a level with no camera limit, is never touched.
import { controlsCommand, Player, type Sim, Transform } from '@automataframework/framework/headless'
import { afterEach, expect, test } from 'vitest'
import { tinySim } from '../../fixtures/tiny.ts'

const made: Sim[] = []
afterEach(() => {
  for (const sim of made.splice(0)) sim.dispose()
})
async function make(...args: Parameters<typeof tinySim>): Promise<Sim> {
  const sim = await tinySim(...args)
  made.push(sim)
  return sim
}

/** Where each player's hero is, along the floor, by player number. */
function placesOf(sim: Sim): Record<number, number> {
  return Object.fromEntries(
    sim.query(Player, Transform).map((hero) => [hero.get(Player).number, hero.get(Transform).x]),
  )
}

/** The camera may pull back to 14 tiles wide, so the players may be 12 apart. */
const view = { w: 8, h: 9, most: { w: 14, h: 9 } }

test('a player who walks off is brought back within what the camera shows', async () => {
  const sim = await make({ view, players: [1, 2] })
  sim.step([controlsCommand(0, 1, 0, ['left'])])
  let widest = 0
  for (let i = 0; i < 60; i++) {
    sim.step([])
    const places = placesOf(sim)
    widest = Math.max(widest, Math.abs((places[1] ?? 0) - (places[2] ?? 0)))
  }
  // 12 tiles, and a tick of walking (a tenth of a tile) between the rule and the next look.
  expect(widest).toBeLessThanOrEqual(12.2)
  expect(placesOf(sim)[2] ?? 99).toBeLessThan(13)
})

test('a level with no camera limit lets the players spread as far as they like', async () => {
  const sim = await make({ players: [1, 2] })
  sim.step([controlsCommand(0, 1, 0, ['left'])])
  for (let i = 0; i < 100; i++) sim.step([])
  const places = placesOf(sim)
  expect(places[1] ?? 99).toBeLessThan(3)
  expect(places[2]).toBeCloseTo(20.5, 1)
})

test('a game of one player is never moved by it', async () => {
  const sim = await make({ view, players: [1] })
  sim.step([controlsCommand(0, 1, 0, ['left'])])
  for (let i = 0; i < 100; i++) sim.step([])
  expect(placesOf(sim)[1] ?? 99).toBeLessThan(3)
})
