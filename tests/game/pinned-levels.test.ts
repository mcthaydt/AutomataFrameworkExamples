// The pinned copies of the three levels (`tests/fixtures/levels/`) are what the tests play to their ends, so they must
// be valid levels, in the standard form, and each must be finished by the bots of `plays.ts` (which is the proof that the
// door can be reached, that the sparks and the crate are where the course expects, and that the bots still play).
import { parseContent, type Sim, writeContent } from '@automataframework/framework/headless'
import { afterEach, expect, test } from 'vitest'
import { Progress } from '#src/features/rules/rules.ts'
import { pinnedLevels } from '../fixtures/pinned-levels.ts'
import { type Recording, RECORDINGS, simFor } from '../fixtures/plays.ts'

const made: Sim[] = []
afterEach(() => {
  for (const sim of made.splice(0)) sim.dispose()
})

test('there is a pinned copy of each of the three levels', () => {
  expect(Object.keys(pinnedLevels).sort()).toEqual([
    'content/levels/level-1.json',
    'content/levels/level-2.json',
    'content/levels/level-3.json',
  ])
})

test('each is a valid level, written the one standard way', () => {
  for (const [path, text] of Object.entries(pinnedLevels)) {
    const parsed = parseContent('level', text, path)
    if (!parsed.ok) throw new Error(`${path} did not parse`)
    expect(writeContent('level', parsed.value), path).toBe(text)
  }
})

/** Where a play on the pinned levels ended. */
interface Ended {
  readonly sim: Sim
  readonly doneAt: number | undefined
  readonly trail: string
}

/** Plays `recording` on the pinned levels. */
async function play(recording: Recording): Promise<Ended> {
  const sim = await simFor(recording, pinnedLevels)
  made.push(sim)
  const played = recording.play(sim)
  return { sim, doneAt: played.doneAt, trail: played.trail }
}

for (const recording of RECORDINGS) {
  test(`the bots finish "${recording.name}" on the pinned levels, after more than three seconds`, async () => {
    const { sim, doneAt, trail } = await play(recording)
    expect(doneAt, trail).toBeDefined()
    // A level that is over in a few ticks was not played.
    expect(doneAt ?? 0, trail).toBeGreaterThan(200)
    const progress = sim.resource(Progress)
    expect(progress.done).toBe(true)
    expect(progress.inDoor, trail).toEqual(recording.name === 'co-op' ? [1, 2] : [1])
  })
}
