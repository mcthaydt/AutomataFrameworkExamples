// The rules that end a level, played on a small sim: the sparks counted, who stands in the door, and the tick it is done.
import { type Command, controlsCommand, leaveCommand, type Sim } from '@automataframework/framework/headless'
import { afterEach, expect, test } from 'vitest'
import { LevelDone, Progress } from '#src/features/rules/rules.ts'
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

const spark = (n: number, x: number) => ({ id: `spark-${n}`, character: 'spark', x, y: 7.5 })
/** The door stands on the floor with its middle at `x`: it is two tiles wide and two tall. */
const door = (x: number) => ({ id: 'door-1', character: 'door', x, y: 7 })

/** Steps `sim` for `ticks`, with `commands` for each tick, and gives how many times the level was said to be done. */
function run(sim: Sim, ticks: number, commands: (tick: number) => Command[] = () => []): number {
  let said = 0
  for (let i = 0; i < ticks; i++) {
    const result = sim.step(commands(sim.tick))
    said += result.events.filter((event) => event.type === LevelDone.id).length
  }
  return said
}

/** What `player` holds from this tick on. The sequence number is the tick: one command a tick for each player. */
const hold = (sim: Sim, player: number, actions: readonly string[]): Command[] => [
  controlsCommand(sim.tick, player, sim.tick, actions),
]

/** Holds `action` for `player` until they are in the door, lets go, and lets them settle. How often the end was said. */
function walkIn(sim: Sim, player: number, action: string): number {
  let said = run(sim, 1, () => hold(sim, player, [action]))
  for (let i = 0; i < 300 && !sim.resource(Progress).inDoor.includes(player); i++) said += run(sim, 1)
  return said + run(sim, 1, () => hold(sim, player, [])) + run(sim, 20)
}

test('every spark the hero walks through is counted, once', async () => {
  const sim = await make({ things: [spark(1, 12), spark(2, 13), spark(3, 14)] })
  run(sim, 1, () => hold(sim, 1, ['right']))
  run(sim, 120)
  expect(sim.resource(Progress).sparks).toBe(3)
})

test('one hero in the door ends a one-player level, and the end is said once', async () => {
  const sim = await make({ things: [door(15)] })
  expect(sim.resource(Progress).done).toBe(false)
  let said = walkIn(sim, 1, 'right')
  expect(sim.resource(Progress).done).toBe(true)
  expect(sim.resource(Progress).doneTick).toBeGreaterThan(20)
  // Walking out of the far side of the door does not undo it, and does not say it again.
  said += run(sim, 1, () => hold(sim, 1, ['right']))
  said += run(sim, 90)
  expect(sim.resource(Progress).inDoor).toEqual([])
  expect(sim.resource(Progress).done).toBe(true)
  expect(said).toBe(1)
})

test('with two players the level is not done until the second is in the door too', async () => {
  const sim = await make({ things: [door(15)], players: [1, 2] })
  // Player 1 walks in from the left and stops; player 2 is still where it started, to the right of the door.
  let said = walkIn(sim, 1, 'right')
  expect(sim.resource(Progress).inDoor).toEqual([1])
  expect(sim.resource(Progress).done).toBe(false)
  said += walkIn(sim, 2, 'left')
  expect(sim.resource(Progress).inDoor).toEqual([1, 2])
  expect(sim.resource(Progress).done).toBe(true)
  expect(said).toBe(1)
})

test('a player who steps out of the door before the other arrives is no longer counted', async () => {
  const sim = await make({ things: [door(15)], players: [1, 2] })
  walkIn(sim, 1, 'right')
  expect(sim.resource(Progress).inDoor).toEqual([1])
  // Player 1 walks back out of the side it came in by. The door is empty again, so player 2 arriving does not finish it.
  run(sim, 1, () => hold(sim, 1, ['left']))
  run(sim, 40)
  expect(sim.resource(Progress).inDoor).toEqual([])
  const said = walkIn(sim, 2, 'left')
  expect(sim.resource(Progress).inDoor).toEqual([2])
  expect(sim.resource(Progress).done).toBe(false)
  expect(said).toBe(0)
})

test('a player who leaves the game is not waited for', async () => {
  const sim = await make({ things: [door(15)], players: [1, 2] })
  walkIn(sim, 1, 'right')
  expect(sim.resource(Progress).done).toBe(false)
  // Player 2 leaves: player 1, alone in the door, is everyone who is playing.
  const said = run(sim, 1, () => [leaveCommand(sim.tick, 2, sim.tick)]) + run(sim, 5)
  expect(sim.resource(Progress).done).toBe(true)
  expect(said).toBe(1)
})
