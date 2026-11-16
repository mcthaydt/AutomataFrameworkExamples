// A recording of the test game, made here in the test, so a test of watching never reads the real golden file (which an
// editor's change to the real level may move). The test game has no crate, so these tests use a level with one 4 tiles
// right of the hero, and a recording that walks into it.
import {
  controlsCommand,
  createGameSim,
  createRecorder,
  loadGame,
  parseContent,
  type Replay,
  writeContent,
  writeReplay,
} from '@automataframework/framework/headless'
import { gamePlugins } from '#src/features/plugins/plugins.ts'
import { readTestGame, testGameFiles } from './test-game.ts'

const PROJECT = 'automata.toml'
const GOAL = 'content/characters/goal.json'

export const LEVEL = 'content/levels/level-1.json'
/** Where the page looks for the recording of the first level. */
export const RECORDING = 'replays/level-1.json'
/** How long the recording is, in ticks: right from tick 5 and never let go, so the hero walks into the crate and on. */
export const RECORDING_TICKS = 200

/** A level of the test game with the crate 4 tiles to the right of the hero's start. */
export function levelWithCrate(): string {
  const parsed = parseContent('level', testGameFiles[LEVEL] ?? '', LEVEL)
  if (!parsed.ok) throw new Error('the test game level did not parse')
  return writeContent('level', {
    ...parsed.value,
    things: [{ id: 'crate-1', character: 'crate', x: 14.5, y: 7.5 }],
  })
}

/**
 * The test game with a goal 3.5 tiles right of the hero's start, and the crate where `levelWithCrate` puts it: the files
 * that replace the test game's own. Reaching the goal is what the page says "well done" for; the recorded play (and so
 * the test game's golden) never has a goal, so it is a level of its own.
 */
export function filesWithGoal(): Readonly<Record<string, string>> {
  const parsed = parseContent('level', levelWithCrate(), LEVEL)
  if (!parsed.ok) throw new Error('the test game level did not parse')
  return {
    [PROJECT]: `${testGameFiles[PROJECT] ?? ''}\n[[content]]\ntype = "character"\npath = "${GOAL}"\n`,
    [GOAL]: writeContent('character', {
      format: 1,
      id: 'goal',
      body: 'fixed',
      size: { w: 1, h: 1 },
      color: '#8d9496',
      upright: false,
      kind: 'goal',
      touch: 'sense',
    }),
    [LEVEL]: writeContent('level', {
      ...parsed.value,
      things: [...parsed.value.things, { id: 'goal-1', character: 'goal', x: 14, y: 7.5 }],
    }),
  }
}

/** The recording of that play on `files` (the test game's files, with these replaced), as the file would hold it. */
export async function recordTestGame(
  files: Readonly<Record<string, string | undefined>> = { [LEVEL]: levelWithCrate() },
): Promise<{ readonly text: string; readonly replay: Replay }> {
  const loaded = await loadGame(readTestGame(files))
  if (!loaded.ok) throw new Error('the test game did not load')
  const sim = await createGameSim({ content: loaded.value, plugins: gamePlugins })
  try {
    const recorder = createRecorder(sim)
    for (let tick = 0; tick < RECORDING_TICKS; tick++)
      recorder.step(tick === 5 ? [controlsCommand(tick, 1, 0, ['right'])] : [])
    const replay = recorder.replay()
    return { text: writeReplay(replay), replay }
  } finally {
    sim.dispose()
  }
}
