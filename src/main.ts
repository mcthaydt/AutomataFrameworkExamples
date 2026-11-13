// The page's script: starts the game in #game. The game's files (`automata.toml` and the content it lists) are read
// beside the page, so the same build works from any path.
import type { Game } from '@automataframework/framework'
import { play, readFrom } from './features/play/play.ts'

declare global {
  interface Window {
    /** The running game, for journeys and agents to look at. `undefined` while loading and when there is a problem. */
    automataGame: Game | undefined
  }
}

const root = document.getElementById('game')
if (root === null) throw new Error('index.html has no #game element.')
const running = await play({ root, read: readFrom(new URL('./', location.href)) })
window.automataGame = running.game
