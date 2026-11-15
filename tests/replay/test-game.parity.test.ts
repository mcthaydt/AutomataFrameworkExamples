// The strict check. The test game's files are built in `tests/fixtures/test-game.ts`, where no editor can reach them,
// so its recorded play ends on the same hash for ever, unless the game's code changed. Only `ok` passes, in Node and
// in all three browsers. Without it, the first editor change to the real levels would turn the real game's checks into
// "the engines agree with each other" and a change to the hero or to the rules could slip through as long as every
// engine broke the same way. The play has two players, who take the spark, are held together by the camera and stand in
// the door, so it holds the game's rules in place as well as the hero's moves.
import {
  parseReplay,
  type Replay,
  type Sim,
  verifyReplay,
  writeReplay,
} from '@automataframework/framework/headless'
import { afterEach, expect, test } from 'vitest'
import { Progress } from '#src/features/rules/rules.ts'
import { playTestGame, testGameSim } from '../fixtures/test-game-play.ts'

const recordings = import.meta.glob<string>('/replays/test-game.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const text: string | undefined = recordings['/replays/test-game.json']

const made: Sim[] = []
afterEach(() => {
  for (const sim of made.splice(0)) sim.dispose()
})
async function fresh(): Promise<Sim> {
  const sim = await testGameSim()
  made.push(sim)
  return sim
}

/** Plays the test game with the bots, and says so if they did not finish: a play that never ends is no recording. */
async function record(): Promise<Replay> {
  const sim = await fresh()
  const played = playTestGame(sim)
  const progress = sim.resource(Progress)
  if (played.doneAt === undefined || progress.sparks !== 1 || progress.inDoor.join() !== '1,2') {
    throw new Error(
      `The test game's play did not end with both players in the door and the spark taken (sparks ${progress.sparks}, in the door ${progress.inDoor.join(',')}).\n${played.trail}`,
    )
  }
  return played.replay
}

async function recording(): Promise<Replay> {
  if (text === undefined) {
    throw new Error(
      `REPLAY NOT RECORDED. Commit this as replays/test-game.json:\n${writeReplay(await record())}`,
    )
  }
  return parseReplay(text)
}

test("the test game's recorded play ends where it was recorded, in every engine", async () => {
  const verdict = verifyReplay(await fresh(), await recording())
  if (!verdict.ok) {
    const where =
      verdict.reason === 'diverged' ? `at tick ${verdict.tick}` : 'detail' in verdict ? verdict.detail : ''
    throw new Error(
      `The game's code now plays differently from the recording: ${verdict.reason} ${where}. If that was meant, take a new recording: delete replays/test-game.json, push, and commit what the Node job prints. The Owner sees the old and the new hashes first.`,
    )
  }
})

test("the bots still finish the test game, so the recording was made by a play that won", async () => {
  const sim = await fresh()
  const played = playTestGame(sim)
  const progress = sim.resource(Progress)
  expect(played.doneAt, played.trail).toBeDefined()
  expect(progress.sparks).toBe(1)
  expect(progress.inDoor).toEqual([1, 2])
})

test.skipIf(text === undefined)('the recording is written the one standard way', () => {
  expect(writeReplay(parseReplay(text ?? ''))).toBe(text)
})
