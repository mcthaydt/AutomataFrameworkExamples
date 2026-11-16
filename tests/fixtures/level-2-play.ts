// What player 1 does in the recorded play of levels 2 and 3, which are one place: hold right from tick 10, and never let
// go. The hero pushes the crate and the critter (which stands still until the Characters slice) over the button, which
// stays down and opens the gate, across the edge into level 3, and then touches the goal.
import { type Command, controlsCommand } from '@automataframework/framework/headless'

/** The level the recorded play opens: levels 2 and 3 are one place, and the sim is opened at the first of them. */
export const LEVEL_2_OPENED = 'level-2'

/** How long the recorded play lasts, in ticks (5.5 seconds). */
export const LEVEL_2_TICKS = 330

/** Player 1's commands for `tick`. Most ticks send nothing. */
export function level2Play(tick: number): Command[] {
  if (tick === 10) return [controlsCommand(tick, 1, 0, ['right'])]
  return []
}
