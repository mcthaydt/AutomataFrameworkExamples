// What player 1 does in the recorded play of the test game: run right, jump, run left. The test game's files live in
// `tests/fixtures/test-game.ts`, where no editor can reach them, so this play always ends on the same hash unless the
// game's code changed. That is what makes it the strict check.
import { type Command, controlsCommand } from '@automataframework/framework/headless'

/** How long the recorded play lasts, in ticks (four seconds). */
export const TEST_GAME_TICKS = 240

/** Player 1's commands for `tick`: right from 10, add jump at 100, let go at 150, left from 180, let go at 220. */
export function testGamePlay(tick: number): Command[] {
  if (tick === 10) return [controlsCommand(tick, 1, 0, ['right'])]
  if (tick === 100) return [controlsCommand(tick, 1, 1, ['jump', 'right'])]
  if (tick === 150) return [controlsCommand(tick, 1, 2, [])]
  if (tick === 180) return [controlsCommand(tick, 1, 3, ['left'])]
  if (tick === 220) return [controlsCommand(tick, 1, 4, [])]
  return []
}
