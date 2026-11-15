// A small sim for the tests of the game's rules: the test game's floor (32 tiles wide, players 1 and 2 starting at 10.5
// and 20.5, standing on the floor), with the things, the camera limits and the players a test asks for, and the game's
// plugins. The real levels are not used, so no editor's change to them can turn a rules test red.
import {
  type ContentValue,
  createGameSim,
  parseContent,
  type Sim,
  writeContent,
} from '@automataframework/framework/headless'
import { gamePlugins } from '#src/features/plugins/plugins.ts'
import { loadGameFrom, readTestGame, testGameFiles } from './test-game.ts'

const LEVEL = 'content/levels/level-1.json'

type LevelFile = ContentValue<'level'>

/** What a test changes about the floor: what stands on it, how far the camera may pull back, who is in the game. */
export interface Tiny {
  readonly things?: LevelFile['things']
  readonly view?: LevelFile['view']
  readonly players?: readonly number[]
}

/** The test game's floor with `tiny` on it. Dispose it when done. */
export async function tinySim(tiny: Tiny = {}): Promise<Sim> {
  const parsed = parseContent('level', testGameFiles[LEVEL] ?? '', LEVEL)
  if (!parsed.ok) throw new Error('the test game level did not parse')
  const level = writeContent('level', {
    ...parsed.value,
    ...(tiny.things === undefined ? {} : { things: tiny.things }),
    ...(tiny.view === undefined ? {} : { view: tiny.view }),
  })
  const content = await loadGameFrom(readTestGame({ [LEVEL]: level }))
  return createGameSim({
    content,
    plugins: gamePlugins('level-1'),
    level: 'level-1',
    players: tiny.players ?? [1],
  })
}
