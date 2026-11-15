// This game's room server: the file the framework's README calls "your own server file". It loads the game from the
// folder it runs in, exactly as the page does, and hands it, with the game's code, to the framework's room server. A
// room is where two or more players, each on their own device, play one game that one server decides. Run it with
// `node server.ts`; it prints `{"event":"listening","port":<n>}` and plays on `PORT`, else on any free port.
// The pages of this game do not go online: this file exists to prove, in `tests/server/`, that the game can.
// It is the one file that may import the server entry (`tests/architecture.test.ts` fails on any other).
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  formatDiagnostic,
  type GameContent,
  loadGame,
  type PluginDef,
} from '@automataframework/framework/headless'
import { runRoomServer } from '@automataframework/framework/server'
import { gamePlugins } from './src/features/plugins/plugins.ts'

/** The game a room plays: its content read from disk, and its code. Throws, naming each problem, if it does not load. */
export async function serverGame(): Promise<{
  readonly content: GameContent
  readonly plugins: readonly PluginDef[]
}> {
  const loaded = await loadGame((path) => readFile(path, 'utf8'))
  if (!loaded.ok)
    throw new Error(`The game did not load:\n${loaded.diagnostics.map(formatDiagnostic).join('\n')}`)
  return { content: loaded.value, plugins: gamePlugins(loaded.value.project.start) }
}

// Only when this file is the one that was run: a test imports `serverGame` and starts its own server on its own port.
if (process.argv[1] === fileURLToPath(import.meta.url)) await runRoomServer({ game: await serverGame() })
