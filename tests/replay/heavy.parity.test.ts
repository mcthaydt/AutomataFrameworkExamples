// The crate's "How heavy", on the real level 1, in Node and all three browsers: the hero holds right from tick 10 and
// pushes the crate onto the plate, which opens the gate. At the default weight it gets there in a second and a half; at
// the heaviest the crate can be set to it still gets there, inside ten seconds, and takes longer. Every engine must
// open the gate on the same tick and end on the same hash.
import { createGameSim, createRecorder, type Played, type Sim } from '@automataframework/framework/headless'
import { afterEach, expect, test } from 'vitest'
import { gamePlugins } from '#src/features/plugins/plugins.ts'
import { loadTheGame } from '../fixtures/game-files.ts'
import { level1Play } from '../fixtures/level-1-play.ts'
import { saveHashes } from '../fixtures/save-hashes.ts'

/** Ten seconds of sim time. */
const TEN_SECONDS = 600
/** The heaviest the crate can be set to (the number the crate file says). */
const MOST = 16

const made: Sim[] = []
afterEach(() => {
  for (const sim of made.splice(0)) sim.dispose()
})

/** Level 1 with the crate set to `kilos`, played with the hero holding right until the gate opens. */
async function push(kilos: number | undefined): Promise<{ opened: number; played: Played }> {
  const content = await loadTheGame()
  const level = content.levels['level-1']
  if (level === undefined) throw new Error('the game has no level-1')
  const things = level.things.map((thing) =>
    thing.id === 'crate-1' && kilos !== undefined ? { ...thing, values: { heavy: kilos } } : thing,
  )
  const sim = await createGameSim({
    content: { ...content, levels: { ...content.levels, 'level-1': { ...level, things } } },
    plugins: gamePlugins,
  })
  made.push(sim)
  const recorder = createRecorder(sim)
  let opened = -1
  for (let tick = 0; tick < TEN_SECONDS && opened < 0; tick++) {
    const result = recorder.step(tick === 10 ? level1Play(10) : [])
    if (result.events.some((event) => event.type === 'gate.opened')) opened = tick
  }
  return { opened, played: recorder.replay() }
}

test('at the default weight the hero pushes the crate onto the plate and the gate opens', async () => {
  const { opened } = await push(undefined)
  expect(opened).toBeGreaterThan(10)
  expect(opened).toBeLessThan(TEN_SECONDS)
})

test('at the heaviest weight the gate still opens inside ten seconds, and later', async () => {
  const light = await push(1)
  const heavy = await push(MOST)
  expect(heavy.opened).toBeGreaterThan(0)
  expect(heavy.opened).toBeLessThan(TEN_SECONDS)
  expect(heavy.opened).toBeGreaterThan(light.opened)
  // Every engine writes where it ended, for CI to compare with Node's.
  await saveHashes(heavy.played, 'heavy')
})

test('the crate gets heavier to push all the way up', async () => {
  const opened: number[] = []
  for (const kilos of [0.5, 1, 4, 8, MOST]) opened.push((await push(kilos)).opened)
  // Never sooner for a heavier crate, and the heaviest is plainly slower than the lightest.
  expect(opened).toEqual([...opened].sort((a, b) => a - b))
  expect((opened.at(-1) ?? 0) - (opened[0] ?? 0)).toBeGreaterThan(60)
})
