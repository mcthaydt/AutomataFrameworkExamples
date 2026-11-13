import {
  Body,
  controlsCommand,
  createGameSim,
  Player,
  type Sim,
  Transform,
} from '@automataframework/framework/headless'
import { afterEach, expect, test } from 'vitest'
import { gamePlugins } from '#src/features/plugins/plugins.ts'
import { loadTestGame } from '../../fixtures/test-game.ts'

// Every test makes its own sims and disposes them: Koota allows 16 live worlds.
const made: Sim[] = []
afterEach(() => {
  for (const sim of made.splice(0)) sim.dispose()
})

/** A sim of the test game with `players` in, after 10 idle ticks so every hero is standing on the floor. */
async function standing(players: readonly number[] = [1]): Promise<Sim> {
  const sim = await createGameSim({ content: await loadTestGame(), plugins: gamePlugins, players })
  made.push(sim)
  for (let i = 0; i < 10; i++) sim.step([])
  return sim
}

const heroOf = (sim: Sim, number = 1) => {
  const found = sim.query(Player, Body, Transform).find((entity) => entity.get(Player).number === number)
  if (found === undefined) throw new Error(`no hero ${number}`)
  return found
}
const x = (sim: Sim, number = 1): number => heroOf(sim, number).get(Transform).x
const y = (sim: Sim, number = 1): number => heroOf(sim, number).get(Transform).y
const vx = (sim: Sim, number = 1): number => heroOf(sim, number).get(Body).vx

/** Holds `held` for player `number`, from now: the sim sends one command, which stays until the next one. */
function hold(sim: Sim, held: readonly string[], number = 1, seq = 0): void {
  sim.step([controlsCommand(sim.tick, number, seq, held)])
}
function run(sim: Sim, ticks: number): void {
  for (let i = 0; i < ticks; i++) sim.step([])
}

test('holding right runs right at RUN_SPEED', async () => {
  const sim = await standing()
  hold(sim, ['right'])
  run(sim, 59)
  expect(vx(sim)).toBe(6)
  expect(x(sim)).toBeGreaterThan(10.5 + 4)
})

test('holding left runs left', async () => {
  const sim = await standing()
  hold(sim, ['left'])
  run(sim, 59)
  expect(vx(sim)).toBe(-6)
  expect(x(sim)).toBeLessThan(10.5 - 4)
})

test('left and right together stand still', async () => {
  const sim = await standing()
  hold(sim, ['left', 'right'])
  run(sim, 59)
  expect(vx(sim)).toBe(0)
  expect(Math.abs(x(sim) - 10.5)).toBeLessThan(0.01)
})

test('letting go stops the hero on the next tick', async () => {
  const sim = await standing()
  hold(sim, ['right'])
  run(sim, 29)
  hold(sim, [], 1, 1)
  expect(vx(sim)).toBe(0)
})

test('a jump leaves the ground and comes back to it', async () => {
  const sim = await standing()
  hold(sim, ['jump'])
  let highest = y(sim)
  for (let i = 0; i < 60; i++) {
    sim.step([])
    highest = Math.min(highest, y(sim))
  }
  expect(highest).toBeLessThan(7.5 - 1.5)
  run(sim, 30)
  expect(Math.abs(y(sim) - 7.5)).toBeLessThan(0.05)
})

test('one press is one jump, however long it is held', async () => {
  const sim = await standing()
  hold(sim, ['jump'])
  for (let tick = 1; tick < 240; tick++) {
    sim.step([])
    if (tick >= 100) expect(Math.abs(y(sim) - 7.5), `tick ${tick}`).toBeLessThan(0.05)
  }
})

test('pressing jump in the air does nothing, at the very top too', async () => {
  // Sim A: one press. Sim B: the same press, then let go and press again on alternate ticks for 60 ticks, which
  // includes the one tick at the top of the jump where the hero is not moving up or down.
  const once = await standing()
  hold(once, ['jump'])
  const again = await standing()
  hold(again, ['jump'])
  let highestOnce = y(once)
  let highestAgain = y(again)
  for (let i = 0; i < 60; i++) {
    once.step([])
    again.step([controlsCommand(again.tick, 1, i + 1, i % 2 === 0 ? [] : ['jump'])])
    highestOnce = Math.min(highestOnce, y(once))
    highestAgain = Math.min(highestAgain, y(again))
  }
  expect(highestAgain).toBe(highestOnce)
})

test('each player moves only their own hero', async () => {
  const sim = await standing([1, 2])
  sim.step([controlsCommand(sim.tick, 2, 0, ['right'])])
  run(sim, 59)
  expect(Math.abs(x(sim, 1) - 10.5)).toBeLessThan(0.01)
  expect(x(sim, 2)).toBeGreaterThan(20.5 + 4)
})

test('the same inputs end on the same hash twice', async () => {
  const play = async (): Promise<string> => {
    const sim = await standing()
    sim.step([controlsCommand(sim.tick, 1, 0, ['right'])])
    for (let i = 1; i < 120; i++)
      sim.step(i === 40 ? [controlsCommand(sim.tick, 1, 1, ['right', 'jump'])] : [])
    return sim.hash()
  }
  expect(await play()).toBe(await play())
})

test('gamePlugins is the hero', () => expect(gamePlugins.map((plugin) => plugin.name)).toEqual(['hero']))
