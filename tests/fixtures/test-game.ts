// A test game the real game's files cannot change. An editor may move the crate in `content/levels/level-1.json`; a
// unit test built on that file would break. This one is built here, with `writeContent`, and has the real game's
// paths so a test reads like it was playing the real game: a floor 32 tiles wide, a start for players 1 and 2, and
// no things.
import {
  formatDiagnostic,
  type GameContent,
  loadGame,
  PROJECT_FILE,
  writeContent,
} from '@automataframework/framework/headless'

const WIDE = 32
const TALL = 9

const project = `format = 1
name = "Test Game"
start = "level-1"
hero = "hero"

[[content]]
type = "level"
path = "content/levels/level-1.json"

[[content]]
type = "character"
path = "content/characters/hero.json"

[[content]]
type = "character"
path = "content/characters/crate.json"
`

/** Every file of the test game, by its path from the game's root. */
export const testGameFiles: Readonly<Record<string, string>> = {
  [PROJECT_FILE]: project,
  'content/levels/level-1.json': writeContent('level', {
    format: 1,
    id: 'level-1',
    tiles: [...Array.from({ length: TALL - 1 }, () => '.'.repeat(WIDE)), '#'.repeat(WIDE)],
    things: [],
    starts: [
      { player: 1, x: 10.5, y: 7.5 },
      { player: 2, x: 20.5, y: 7.5 },
    ],
  }),
  'content/characters/hero.json': writeContent('character', {
    format: 1,
    id: 'hero',
    body: 'dynamic',
    size: { w: 0.8, h: 1 },
    color: '#d7263d',
    upright: true,
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

export async function loadTestGame(): Promise<GameContent> {
  const loaded = await loadGame(readTestGame())
  if (!loaded.ok)
    throw new Error(`The test game did not load:\n${loaded.diagnostics.map(formatDiagnostic).join('\n')}`)
  return loaded.value
}
