// The strict check. The test game's files are built in `tests/fixtures/test-game.ts`, where no editor can reach them,
// so its recorded play ends on the same hash for ever, unless the game's code changed. Only `ok` passes, in Node and
// in all three browsers. Without it, the first editor change to the real level would turn the real game's check into
// "the engines agree with each other" and a change to the hero could slip through as long as every engine broke the
// same way.
import {
  createGameSim,
  createRecorder,
  parseReplay,
  type Replay,
  type Sim,
  verifyReplay,
  writeReplay,
} from '@automataframework/framework/headless'
import { afterEach, expect, test } from 'vitest'
import { gamePlugins } from '#src/features/plugins/plugins.ts'
import { loadTestGame } from '../fixtures/test-game.ts'
import { TEST_GAME_TICKS, testGamePlay } from '../fixtures/test-game-play.ts'

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
  const sim = await createGameSim({ content: await loadTestGame(), plugins: gamePlugins })
  made.push(sim)
  return sim
}

async function record(): Promise<Replay> {
  const recorder = createRecorder(await fresh())
  for (let tick = 0; tick < TEST_GAME_TICKS; tick++) recorder.step(testGamePlay(tick))
  return recorder.replay()
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

test.skipIf(text === undefined)('the recording is written the one standard way', () => {
  expect(writeReplay(parseReplay(text ?? ''))).toBe(text)
})
