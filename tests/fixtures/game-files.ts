// The game at the repo's root, as text, for tests that run in Node and in a browser alike. Vite's `import.meta.glob`
// reads the files at build time, so no test needs `node:fs` to see them.
import { formatDiagnostic, type GameContent, loadGame } from '@automataframework/framework/headless'

const raw = import.meta.glob<string>(['/automata.toml', '/content/**/*.json'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** Every file of the game at the repo's root, by its path from the root: 'automata.toml', 'content/...'. */
export const gameFiles: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(raw).map(([path, text]) => [path.replace(/^\//, ''), text]),
)

/** A `read` over them, as `loadGame` takes it. An override replaces a file; `undefined` makes it missing. */
export function readGame(
  overrides: Readonly<Record<string, string | undefined>> = {},
): (path: string) => Promise<string> {
  const files: Record<string, string | undefined> = { ...gameFiles, ...overrides }
  return async (path) => {
    const text = files[path]
    if (text === undefined) throw new Error(`${path}: no such file`)
    return text
  }
}

/** The game, loaded. Throws, naming every problem with `formatDiagnostic`, if it does not load. */
export async function loadTheGame(
  overrides: Readonly<Record<string, string | undefined>> = {},
): Promise<GameContent> {
  const loaded = await loadGame(readGame(overrides))
  if (!loaded.ok)
    throw new Error(`The game did not load:\n${loaded.diagnostics.map(formatDiagnostic).join('\n')}`)
  return loaded.value
}
