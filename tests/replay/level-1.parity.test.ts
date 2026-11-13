// The recorded play of level 1, in Node and in all three browsers. `verifyReplay` is the strict check: the play ends
// where it was recorded. It can only hold while the game's content is what it was at the recording, and the whole
// point of the editors is to change the content. So this test accepts two verdicts, `ok` and `content-changed`, fails
// on the others, and in every case plays the recording once more and saves where this engine ended; CI then compares
// each browser's hashes with Node's. (The strict check that survives an edit is `test-game.parity.test.ts`.)
import {
  createGameSim,
  createRecorder,
  parseReplay,
  playReplay,
  type Replay,
  type Sim,
  Thing,
  Transform,
  verifyReplay,
  writeReplay,
} from '@automataframework/framework/headless'
import { afterEach, expect, test } from 'vitest'
import { gamePlugins } from '#src/features/plugins/plugins.ts'
import { loadTheGame } from '../fixtures/game-files.ts'
import { LEVEL_1_TICKS, level1Play } from '../fixtures/level-1-play.ts'
import { saveHashes } from '../fixtures/save-hashes.ts'

// The recording is read through a glob so a missing file is an empty object, not a failed import.
const recordings = import.meta.glob<string>('/replays/level-1.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const text: string | undefined = recordings['/replays/level-1.json']

const made: Sim[] = []
afterEach(() => {
  for (const sim of made.splice(0)) sim.dispose()
})
async function fresh(): Promise<Sim> {
  const sim = await createGameSim({ content: await loadTheGame(), plugins: gamePlugins })
  made.push(sim)
  return sim
}

/** Plays `level1Play` on a new sim and gives the recording, for the one time the golden file does not exist yet. */
async function record(): Promise<Replay> {
  const recorder = createRecorder(await fresh())
  for (let tick = 0; tick < LEVEL_1_TICKS; tick++) recorder.step(level1Play(tick))
  return recorder.replay()
}

/** The recording, or the failure that says how to take one. */
async function recording(): Promise<Replay> {
  if (text === undefined) {
    throw new Error(
      `REPLAY NOT RECORDED. Commit this as replays/level-1.json:\n${writeReplay(await record())}`,
    )
  }
  return parseReplay(text)
}

test('the recorded play of level 1 still plays, and this engine reports where it ends', async () => {
  const replay = await recording()
  const verdict = verifyReplay(await fresh(), replay)
  if (!verdict.ok && verdict.reason !== 'content-changed') {
    const where = verdict.reason === 'diverged' ? `at tick ${verdict.tick}` : verdict.detail
    throw new Error(
      `The game no longer plays the way it was recorded: ${verdict.reason}, ${where}. If the game's code was meant to change the play, take a new recording: delete replays/level-1.json, push, and commit what the Node job prints.`,
    )
  }
  await saveHashes(playReplay(await fresh(), replay))
})

test('in the recorded play the hero pushes the crate, while the level is as it was recorded', async () => {
  const replay = await recording()
  if (verifyReplay(await fresh(), replay).ok !== true) {
    console.log('The level changed since the recording, so where the crate ends is not checked.')
    return
  }
  const game = await loadTheGame()
  const start =
    game.levels[game.project.start]?.things.find((thing) => thing.id === 'crate-1')?.x ?? Number.NaN
  const sim = await fresh()
  playReplay(sim, replay)
  const crate = sim.query(Thing, Transform).find((entity) => entity.get(Thing).id === 'crate-1')
  const x = crate?.get(Transform).x ?? Number.NaN
  expect(x).toBeGreaterThan(start + 1)
  // Still inside the walls: the level is 16 tiles wide and the right wall is the last one.
  expect(x).toBeLessThan(15)
})

test.skipIf(text === undefined)('the recording is written the one standard way', () => {
  expect(writeReplay(parseReplay(text ?? ''))).toBe(text)
})
