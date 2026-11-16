// The recorded play of levels 2 and 3 (one place: the crate crosses the edge between them), in Node and in all three
// browsers. Like level 1's, it accepts two verdicts, `ok` and `content-changed`, and in every case plays the recording
// once more and saves where this engine ended; CI then compares each browser's hashes with Node's.
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
import { LEVEL_2_OPENED, LEVEL_2_TICKS, level2Play } from '../fixtures/level-2-play.ts'
import { saveHashes } from '../fixtures/save-hashes.ts'

// The recording is read through a glob so a missing file is an empty object, not a failed import.
const recordings = import.meta.glob<string>('/replays/level-2.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const text: string | undefined = recordings['/replays/level-2.json']

const made: Sim[] = []
afterEach(() => {
  for (const sim of made.splice(0)) sim.dispose()
})
async function fresh(): Promise<Sim> {
  const sim = await createGameSim({
    content: await loadTheGame(),
    plugins: gamePlugins,
    level: LEVEL_2_OPENED,
  })
  made.push(sim)
  return sim
}

/** Plays `level2Play` on a new sim and gives the recording, for the one time the golden file does not exist yet. */
async function record(): Promise<Replay> {
  const recorder = createRecorder(await fresh(), { meta: { level: LEVEL_2_OPENED, players: '1' } })
  for (let tick = 0; tick < LEVEL_2_TICKS; tick++) recorder.step(level2Play(tick))
  return recorder.replay()
}

/** The recording, or the failure that says how to take one. */
async function recording(): Promise<Replay> {
  if (text === undefined) {
    throw new Error(
      `REPLAY NOT RECORDED. Commit this as replays/level-2.json:\n${writeReplay(await record())}`,
    )
  }
  return parseReplay(text)
}

test('the recorded play of levels 2 and 3 still plays, and this engine reports where it ends', async () => {
  const replay = await recording()
  const verdict = verifyReplay(await fresh(), replay)
  if (!verdict.ok && verdict.reason !== 'content-changed') {
    const where =
      verdict.reason === 'diverged' ? `at tick ${verdict.tick}` : 'detail' in verdict ? verdict.detail : ''
    throw new Error(
      `The game no longer plays the way it was recorded: ${verdict.reason}, ${where}. If the game's code was meant to change the play, take a new recording: delete replays/level-2.json, push, and commit what the Node job prints.`,
    )
  }
  await saveHashes(playReplay(await fresh(), replay), 'level-2')
})

test('in the recorded play the crate is pushed across the edge into level 3, while the levels are as recorded', async () => {
  const replay = await recording()
  if (verifyReplay(await fresh(), replay).ok !== true) {
    console.log('The levels changed since the recording, so where the crate ends is not checked.')
    return
  }
  const sim = await fresh()
  playReplay(sim, replay)
  const crate = sim.query(Thing, Transform).find((entity) => entity.get(Thing).id === 'level-2.crate-1')
  const x = crate?.get(Transform).x ?? Number.NaN
  // Level 2 is 16 tiles wide and opened at 0, so past 16 the crate is in level 3.
  expect(x).toBeGreaterThan(16)
})

test.skipIf(text === undefined)('the recording is written the one standard way', () => {
  expect(writeReplay(parseReplay(text ?? ''))).toBe(text)
})
