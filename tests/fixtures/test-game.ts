// A test game the real game's files cannot change. An editor may move the crate in `content/levels/level-1.json`; a
// unit test built on that file would break. This one is built here, with `writeContent`, and has the real game's
// paths so a test reads like it was playing the real game: a floor 32 tiles wide, a start for players 1 and 2, and no
// things. Its hero is moved by the framework, as the real one is, and the game's own rules (`src/features/rules/`) are
// the only code it runs; `rulesLevel` is the same floor with a spark, a door and a camera, for the recorded play that
// guards those rules.
import {
  formatDiagnostic,
  type GameContent,
  LANGUAGES,
  loadGame,
  PROJECT_FILE,
  writeContent,
} from '@automataframework/framework/headless'
import { gameFiles } from './game-files.ts'

const WIDE = 32
const TALL = 9

/** The floor: rows of air, and the bottom row solid. */
const floor: readonly string[] = [
  ...Array.from({ length: TALL - 1 }, () => '.'.repeat(WIDE)),
  '#'.repeat(WIDE),
]

const starts = [
  { player: 1, x: 10.5, y: 7.5 },
  { player: 2, x: 20.5, y: 7.5 },
]

/**
 * The test game's floor with a spark at 14.5, a door at 28.5 and a camera that pulls back as far as 14 tiles wide: the
 * level the recorded play of the game's rules is made on. Two heroes who spread past 12 tiles are brought together.
 */
export const rulesLevel: string = writeContent('level', {
  format: 1,
  id: 'level-1',
  view: { w: 8, h: 9, most: { w: 14, h: 9 } },
  tiles: floor,
  things: [
    { id: 'spark-1', character: 'spark', x: 14.5, y: 7.5 },
    { id: 'door-1', character: 'door', x: 28.5, y: 7 },
  ],
  starts,
})

/** The real game's words, in the real game's six languages: the page says the same things whichever game it plays. */
const messagePaths: readonly string[] = LANGUAGES.map((language) => `content/messages/${language}.json`)

const project = `format = 1
name = "Test Game"
start = "level-1"
hero = "hero"
source = "en"
players = 2

[[content]]
type = "level"
path = "content/levels/level-1.json"

[[content]]
type = "character"
path = "content/characters/hero.json"

[[content]]
type = "character"
path = "content/characters/crate.json"

[[content]]
type = "character"
path = "content/characters/door.json"

[[content]]
type = "character"
path = "content/characters/spark.json"

[[content]]
type = "tuning"
path = "content/tunings/hero-moves.json"
${messagePaths.map((path) => `\n[[content]]\ntype = "messages"\npath = "${path}"\n`).join('')}`

/** Every file of the test game, by its path from the game's root. */
export const testGameFiles: Readonly<Record<string, string>> = {
  [PROJECT_FILE]: project,
  ...Object.fromEntries(messagePaths.map((path) => [path, gameFiles[path] ?? ''])),
  // The hero's numbers and controls are the real game's: the hero the framework moves is the same hero here.
  'content/tunings/hero-moves.json': gameFiles['content/tunings/hero-moves.json'] ?? '',
  // The door and the spark are the real game's too: the rules look for characters of those two kinds.
  'content/characters/door.json': gameFiles['content/characters/door.json'] ?? '',
  'content/characters/spark.json': gameFiles['content/characters/spark.json'] ?? '',
  'content/levels/level-1.json': writeContent('level', {
    format: 1,
    id: 'level-1',
    tiles: floor,
    things: [],
    starts,
  }),
  'content/characters/hero.json': writeContent('character', {
    format: 1,
    id: 'hero',
    body: 'dynamic',
    size: { w: 0.8, h: 1 },
    color: '#d7263d',
    upright: true,
    moves: { tuning: 'hero-moves', 'double-jump': true, 'wall-jump': true, dash: true },
  }),
  'content/characters/crate.json': writeContent('character', {
    format: 1,
    id: 'crate',
    body: 'dynamic',
    size: { w: 1, h: 1 },
    color: '#f2c14e',
    upright: false,
  }),
}

/** A `read` over them; an override replaces a file and `undefined` makes it missing. */
export function readTestGame(
  overrides: Readonly<Record<string, string | undefined>> = {},
): (path: string) => Promise<string> {
  const files: Record<string, string | undefined> = { ...testGameFiles, ...overrides }
  return async (path) => {
    const text = files[path]
    if (text === undefined) throw new Error(`${path}: no such file`)
    return text
  }
}

/** The game `read` holds, loaded. Throws, naming every problem with `formatDiagnostic`, if it does not load. */
export async function loadGameFrom(read: (path: string) => Promise<string>): Promise<GameContent> {
  const loaded = await loadGame(read)
  if (!loaded.ok)
    throw new Error(`The test game did not load:\n${loaded.diagnostics.map(formatDiagnostic).join('\n')}`)
  return loaded.value
}

export async function loadTestGame(): Promise<GameContent> {
  return loadGameFrom(readTestGame())
}
