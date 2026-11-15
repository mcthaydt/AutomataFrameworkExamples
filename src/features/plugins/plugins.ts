// Everything the sim side of this game is made of, in one list. The page, the tests and the recorded play all build
// their sim from it, so they can never disagree about what the game is. It is empty for now: the hero walks, jumps,
// double jumps, wall jumps and dashes from the framework's own moves (the hero's character file and its tuning file),
// so the game has no sim code until the rules of its levels come in.
import type { PluginDef } from '@automataframework/framework/headless'

/** Pass it to `createGameSim` and `startGame` as `plugins`. */
export const gamePlugins: readonly PluginDef[] = []
