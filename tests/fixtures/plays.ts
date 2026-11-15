// How each level of the game is played in the tests and in the recordings: the course through it, in tiles from its left
// edge, for `walker` (`bot.ts`). The numbers come from the levels' own layout (`content/levels/`) and the hero's
// numbers (`content/tunings/hero-moves.json`): the hero walks 6 tiles a second and a jump rises about 2.4 tiles and stays
// up 0.8 seconds, so a hop is begun about 2 tiles before what it clears, and a double jump or a dash lets it cross the
// gap in level 3 that a jump cannot. If a level is laid out again, its course changes here and the recording is taken again.
import { createGameSim, type Sim } from '@automataframework/framework/headless'
import { gamePlugins } from '#src/features/plugins/plugins.ts'
import { type Course, type Driven, drive, walker } from './bot.ts'
import { loadTheGame } from './game-files.ts'

/** Level 1: a ledge one tile high at 12 to 18 (jump), a crate to push toward a pit at 26 to 28, the door at 35.5. */
export const LEVEL_1: Course = { hops: [{ from: 10.2, to: 11.2, kind: 'jump' }], door: 35.5 }

/** Level 2: a block three tiles high at 12 to 15 (a double jump), a pit six wide at 20 (a double jump), the door at 40. */
export const LEVEL_2: Course = {
  hops: [
    { from: 8, to: 8.8, kind: 'double' },
    { from: 19.4, to: 20.2, kind: 'double' },
  ],
  door: 40,
}

/** Level 3: a shaft between 10 and 12 (wall jumps), a gap seven wide at 20 (a jump and a dash), the door at 38.5. */
export const LEVEL_3: Course = {
  hops: [{ from: 19.8, to: 20.3, kind: 'dash' }],
  shaft: { from: 10, to: 12 },
  door: 38.5,
}

/** The courses by level, so a recording says which one it is. */
export const COURSES: Readonly<Record<string, Course>> = {
  'level-1': LEVEL_1,
  'level-2': LEVEL_2,
  'level-3': LEVEL_3,
}

/** How long a play may take before it is given up as lost, in ticks (forty seconds). */
export const LIMIT = 2400

/** One recorded play: where its file is, which level it is on, who is in at the start, and how it is played. */
export interface Recording {
  readonly name: string
  readonly file: string
  readonly level: string
  readonly players: readonly number[]
  /** Plays it on `sim`, a fresh sim of this level with these players. */
  play(sim: Sim): Driven
}

const alone = (level: string): Recording => ({
  name: level,
  file: `replays/${level}.json`,
  level,
  players: [1],
  play: (sim) =>
    drive(sim, {
      plans: { 1: walker(COURSES[level] as Course) },
      limit: LIMIT,
      meta: { level, players: '1' },
    }),
})

/** The four recordings: each level played by one player, and level one played by two, the second joining at tick 30. */
export const RECORDINGS: readonly Recording[] = [
  alone('level-1'),
  alone('level-2'),
  alone('level-3'),
  {
    name: 'co-op',
    file: 'replays/co-op.json',
    level: 'level-1',
    players: [1],
    play: (sim) =>
      drive(sim, {
        plans: { 1: walker(LEVEL_1, { start: 60 }), 2: walker(LEVEL_1, { start: 90, rank: 1 }) },
        joins: { 2: 30 },
        limit: LIMIT,
        meta: { level: 'level-1', players: '1' },
      }),
  },
]

/** A fresh sim of the game for a recording, on the game's files (or these in place of them). */
export async function simFor(
  recording: Recording,
  files: Readonly<Record<string, string | undefined>> = {},
): Promise<Sim> {
  return createGameSim({
    content: await loadTheGame(files),
    plugins: gamePlugins(recording.level),
    level: recording.level,
    players: recording.players,
  })
}
