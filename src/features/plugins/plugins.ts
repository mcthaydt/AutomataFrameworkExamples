// Everything the sim side of this game is made of, in one list. The page, the tests and the recorded play all build
// their sim from it, so they can never disagree about what the game is.
import type { PluginDef } from '@automataframework/framework/headless'
import { heroPlugin } from '../hero/hero.ts'

/** Pass it to `createGameSim` and `startGame` as `plugins`. */
export const gamePlugins: readonly PluginDef[] = [heroPlugin]
