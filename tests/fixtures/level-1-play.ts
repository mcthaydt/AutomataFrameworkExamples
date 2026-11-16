// What player 1 does in the recorded play of level 1: hold right from tick 10 (the hero walks to the crate and pushes it
// two tiles onto the plate, which opens the gate), let go at 88, then jump and hold right at 120 (the hero hops over the
// crate, runs through the gate and touches the door). A command is sent only when the keys change, because the sim keeps
// what a player holds until the next one; so the recording is three lines.
import { type Command, controlsCommand } from '@automataframework/framework/headless'

/** How long the recorded play lasts, in ticks (four seconds). */
export const LEVEL_1_TICKS = 240

/** Player 1's commands for `tick`. Most ticks send nothing. */
export function level1Play(tick: number): Command[] {
  if (tick === 10) return [controlsCommand(tick, 1, 0, ['right'])]
  if (tick === 88) return [controlsCommand(tick, 1, 1, [])]
  if (tick === 120) return [controlsCommand(tick, 1, 2, ['jump', 'right'])]
  return []
}
