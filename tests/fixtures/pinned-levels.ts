// The three levels the tests play to their ends. The real levels in `content/levels/` are the editors' to change: an
// editor may move the door, the crate or a spark, and a test that plays "walk to the door" on the real file would turn red
// on a change that is allowed. These are copies, kept as files (`tests/fixtures/levels/`, written by the same content
// writer, which Biome leaves alone as it does `content/`), so a change to the real levels never reaches them. If a level is
// laid out again on purpose, copy its file here and the bots' course (`plays.ts`) with it.

const raw = import.meta.glob<string>('./levels/*.json', { query: '?raw', import: 'default', eager: true })

/** The pinned levels as game files: the real path of each level, and the text it has there. */
export const pinnedLevels: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(raw).map(([path, text]) => [`content/levels/${path.replace('./levels/', '')}`, text]),
)
