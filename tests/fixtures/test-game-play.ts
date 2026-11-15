// The recorded play of the test game: two players on `rulesLevel`, who between them take the spark, are pulled together
// by the camera's limit, and stand in the door. The test game's files live in `tests/fixtures/test-game.ts`, where no
// editor can reach them, so this play always ends on the same hash unless the game's code changed. That is what makes it
// the strict check, and it is the only recording that guards every rule of the game at once (the spark, the door, keeping
// the players within the camera, and the hero's moves).
import { createGameSim, type Sim } from '@automataframework/framework/headless'
import { gamePlugins } from '#src/features/plugins/plugins.ts'
import { type Course, drive, type Driven, holder, walker } from './bot.ts'
import { loadGameFrom, readTestGame, rulesLevel } from './test-game.ts'

/** How long the play may take before it is given up as lost, in ticks (ten seconds). */
export const TEST_GAME_LIMIT = 600

/** The way across the test game's floor: straight to the door at 28.5, with nothing to hop. */
const COURSE: Course = { hops: [], door: 28.5 }

/** A fresh sim of the test game's rules level with both players in it. */
export async function testGameSim(): Promise<Sim> {
  const content = await loadGameFrom(readTestGame({ 'content/levels/level-1.json': rulesLevel }))
  return createGameSim({ content, plugins: gamePlugins('level-1'), level: 'level-1', players: [1, 2] })
}

/**
 * Plays `sim` to the end of the level. Player 1 walks to the door, taking the spark on the way. Player 2 walks the other
 * way for 2.3 seconds, far enough that the camera's limit (14 tiles wide, so at most 12 apart) brings them to player 1,
 * and then follows to the door, a step behind.
 */
export function playTestGame(sim: Sim): Driven {
  const first = walker(COURSE)
  const second = walker(COURSE, { start: 150, rank: 1 })
  const away = holder(['left'], 10, 150)
  return drive(sim, {
    plans: { 1: first, 2: (look) => (look.tick < 150 ? away(look) : second(look)) },
    limit: TEST_GAME_LIMIT,
    meta: { level: 'level-1', players: '1,2' },
  })
}
