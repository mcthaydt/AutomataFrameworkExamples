// What player 1 does in the recorded play of level 1: hold right from tick 10 (the hero walks to the crate and pushes
// it), add jump at 200, let go of everything at 260, hold left from 300, let go at 340. A command is sent only when the
// keys change, because the sim keeps what a player holds until the next one; so the recording is about twenty lines.
import { type Command, controlsCommand } from '@automataframework/framework/headless'

/** How long the recorded play lasts, in ticks (six seconds). */
export const LEVEL_1_TICKS = 360

/** Player 1's commands for `tick`. Most ticks send nothing. */
export function level1Play(tick: number): Command[] {
  if (tick === 10) return [controlsCommand(tick, 1, 0, ['right'])]
  if (tick === 200) return [controlsCommand(tick, 1, 1, ['jump', 'right'])]
  if (tick === 260) return [controlsCommand(tick, 1, 2, [])]
  if (tick === 300) return [controlsCommand(tick, 1, 3, ['left'])]
  if (tick === 340) return [controlsCommand(tick, 1, 4, [])]
  return []
}
