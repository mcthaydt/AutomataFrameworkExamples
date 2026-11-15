// The recorded plays of the real game's three levels, and of two players in the first, in Node and in all three browsers.
// `verifyReplay` is the strict check: the play ends where it was recorded. It can only hold while the game's content is
// what it was at the recording, and the whole point of the editors is to change the content. So each test accepts two
// verdicts, `ok` and `content-changed`, fails on the others, and in every case plays the recording once more; the last
// test saves where this engine ended all of them, and CI then compares each browser's hashes with Node's. (The strict
// check that survives an edit is `test-game.parity.test.ts`.)
import {
  type Played,
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
import { Progress } from '#src/features/rules/rules.ts'
import { loadTheGame } from '../fixtures/game-files.ts'
import { RECORDINGS, type Recording, simFor } from '../fixtures/plays.ts'
import { saveHashes } from '../fixtures/save-hashes.ts'

// The recordings are read through a glob so a missing file is an empty object, not a failed import.
const files = import.meta.glob<string>('/replays/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const textOf = (recording: Recording): string | undefined => files[`/${recording.file}`]

const made: Sim[] = []
afterEach(() => {
  for (const sim of made.splice(0)) sim.dispose()
})
async function fresh(recording: Recording): Promise<Sim> {
  const sim = await simFor(recording)
  made.push(sim)
  return sim
}

/** Plays the bots of `recording` on a new sim, for the one time its golden file does not exist yet. */
async function record(recording: Recording): Promise<Replay> {
  const sim = await fresh(recording)
  const played = recording.play(sim)
  if (played.doneAt === undefined) {
    throw new Error(
      `The play of "${recording.name}" never reached the door. Where the heroes were:\n${played.trail}`,
    )
  }
  return played.replay
}

/** The recording, or the failure that says how to take one. */
async function recordingOf(recording: Recording): Promise<Replay> {
  const text = textOf(recording)
  if (text === undefined) {
    const written = writeReplay(await record(recording))
    // The failure message is cut short by the test runner when the play is long, so the whole file is printed as well.
    console.log(`RECORDING ${recording.file}\n${written}\nEND RECORDING`)
    throw new Error(`REPLAY NOT RECORDED. Commit this as ${recording.file}:\n${written}`)
  }
  return parseReplay(text)
}

for (const recording of RECORDINGS) {
  test(`the recorded play "${recording.name}" still plays, and ends with the level done`, async () => {
    const replay = await recordingOf(recording)
    const sim = await fresh(recording)
    const verdict = verifyReplay(sim, replay)
    if (!verdict.ok && verdict.reason !== 'content-changed') {
      const where =
        verdict.reason === 'diverged' ? `at tick ${verdict.tick}` : 'detail' in verdict ? verdict.detail : ''
      throw new Error(
        `The game no longer plays the way "${recording.name}" was recorded: ${verdict.reason}, ${where}. If the game's code was meant to change the play, take a new recording: delete ${recording.file}, push, and commit what the Node job prints.`,
      )
    }
    // `verifyReplay` leaves the sim at the end of the play, so what the rules made of it can be read.
    if (verdict.ok) expect(sim.resource(Progress).done, 'the level was done at the end').toBe(true)
  })
}

test('in the recorded play of level 1 the hero pushes the crate, if the level is as recorded', async () => {
  const [recording] = RECORDINGS
  if (recording === undefined) throw new Error('no recordings')
  const replay = await recordingOf(recording)
  if (verifyReplay(await fresh(recording), replay).ok !== true) {
    console.log('The level changed since the recording, so where the crate ends is not checked.')
    return
  }
  const game = await loadTheGame()
  const level = game.levels[recording.level]
  const start = level?.things.find((thing) => thing.id === 'crate-1')?.x ?? Number.NaN
  const sim = await fresh(recording)
  playReplay(sim, replay)
  const crate = sim.query(Thing, Transform).find((entity) => entity.get(Thing).id === 'crate-1')
  const x = crate?.get(Transform).x ?? Number.NaN
  expect(x).toBeGreaterThan(start + 1)
  // Still inside the walls: the level is 40 tiles wide and the right wall is the last one.
  expect(x).toBeLessThan(39)
})

test('this engine reports where each recorded play ends, for the comparison with the others', async () => {
  const plays: Played[] = []
  for (const recording of RECORDINGS) {
    plays.push(playReplay(await fresh(recording), await recordingOf(recording)))
  }
  await saveHashes(plays)
})

test.skipIf(RECORDINGS.every((recording) => textOf(recording) === undefined))(
  'every recording is written the one standard way',
  () => {
    for (const recording of RECORDINGS) {
      const text = textOf(recording)
      if (text !== undefined) expect(writeReplay(parseReplay(text))).toBe(text)
    }
  },
)
