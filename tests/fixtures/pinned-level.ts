// A level the journeys own. The real level in `content/levels/level-1.json` is the editors' to change: an editor may
// move the crate against the right wall, to the hero's left, or delete it, and a journey that plays "push the crate"
// on that file would turn CI red on a change that is allowed. A journey that checks gameplay plays this level
// instead, written here with `writeContent` the way `test-game.ts` is. It is the real level's tiles and starts, with
// the crate 7 tiles from the hero and 5 tiles of floor behind it, and the real level's sky and ground, written out so
// a picture taken on this level (the "well done" one) shows what a player sees, and so an editor's recolour of the real
// level cannot change what these journeys play.
import { parseContent, writeContent } from '@automataframework/framework/headless'
import { gameFiles } from './game-files.ts'

/** The level's path, as the page and `loadGame` ask for it. */
export const LEVEL_FILE = 'content/levels/level-1.json'

/** The pinned level's sky and ground: palette No. 276's Black and Seashell Pink, as the real level has them today. */
const PINNED_SKY = '#111314'
const PINNED_GROUND = '#fdd4bd'

/** Where the pinned level puts `crate-1`, in tiles. */
export const PINNED_CRATE_X = 9.5

/** Where it puts `goal-1`, in tiles: clear of every start, and past the crate, so pushing the crate on reaches it. */
const PINNED_GOAL_X = 13.5

/** The pinned level's file, in the standard form. */
export const pinnedLevel: string = writeContent('level', {
  format: 1,
  id: 'level-1',
  sky: PINNED_SKY,
  ground: PINNED_GROUND,
  tiles: [...Array.from({ length: 8 }, () => `#${'.'.repeat(14)}#`), '#'.repeat(16)],
  things: [
    { id: 'crate-1', character: 'crate', x: PINNED_CRATE_X, y: 7.5 },
    { id: 'goal-1', character: 'goal', x: PINNED_GOAL_X, y: 7.5 },
  ],
  starts: [
    { player: 1, x: 2.5, y: 7.5 },
    { player: 2, x: 4, y: 7.5 },
    { player: 3, x: 5.5, y: 7.5 },
    { player: 4, x: 7, y: 7.5 },
  ],
})

/** Where the real level 2 is, and the door in it that leads back to level 1. */
const LEVEL_2_FILE = 'content/levels/level-2.json'
const WAY_BACK = 'door-in'

/**
 * Level 2 with its way back to level 1 asking for no thing to come out beside: the pinned level has no `exit` door (a
 * hero who pushes the crate on must never go through one), and a door may not name a thing its level does not have.
 */
function level2WithoutExit(): string {
  const parsed = parseContent('level', gameFiles[LEVEL_2_FILE] ?? '', LEVEL_2_FILE)
  if (!parsed.ok) throw new Error('the real level 2 did not parse')
  return writeContent('level', {
    ...parsed.value,
    things: parsed.value.things.map((thing) =>
      thing.id === WAY_BACK ? { ...thing, values: { to: { level: 'level-1' } } } : thing,
    ),
  })
}

/** The files that make the real game play the pinned level, for `openGame` and `nodeSim`. */
export const pinnedFiles: Readonly<Record<string, string>> = {
  [LEVEL_FILE]: pinnedLevel,
  [LEVEL_2_FILE]: level2WithoutExit(),
}
