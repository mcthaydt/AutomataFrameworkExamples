// Everything the sim side of this game is made of, in one list. The page, the tests and the recorded plays all build
// their sim from it, so they can never disagree about what the game is. The hero walks, jumps, double jumps, wall
// jumps and dashes from the framework's own moves (the hero's character file and its tuning file), so the game's own
// code is only its rules: the door, the sparks and keeping the players together.
import type { PluginDef } from '@automataframework/framework/headless'
import { rulesPlugin } from '../rules/rules.ts'

/**
 * The game's plugins for a sim that plays `level`: pass it to `createGameSim`, `startGame` and `watchReplay` as
 * `plugins`. The level is named because the rules read that level's camera limits.
 */
export function gamePlugins(level: string): readonly PluginDef[] {
  return [rulesPlugin(level)]
}
