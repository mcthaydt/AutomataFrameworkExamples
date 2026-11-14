// The page's script: starts the game in #game. The game's files (`automata.toml` and the content it lists) are read
// beside the page, so the same build works from any path. With `?watch` in the address the game first plays its own
// recording, and a page that frames it can tell it to play (see `features/play/handover.ts`).
import type { Game, Watch } from '@automataframework/framework'
import { listenForPlay, tellParent } from './features/play/handover.ts'
import { modeOf } from './features/play/mode.ts'
import { type Play, play, readFrom } from './features/play/play.ts'

declare global {
  interface Window {
    /** The running game, for journeys and agents to look at. `undefined` while loading, while watching, and on a problem. */
    automataGame: Game | undefined
    /** The recording that is playing: its `sim.tick` and `rounds` say how far it has got. `undefined` unless watching. */
    automataWatch: Watch | undefined
  }
}

const root = document.getElementById('game')
if (root === null) throw new Error('index.html has no #game element.')

// Listening starts before the game does, so a "play" that arrives while the game is still loading is kept, not lost.
let running: Play | undefined
let playAsked = false
listenForPlay(window, () => {
  if (running === undefined) playAsked = true
  else void running.takeOver()
})
// Getters, so what an agent or a journey reads is always the game as it is now, after a hand-over too.
Object.defineProperty(window, 'automataGame', { get: () => running?.game, configurable: true })
Object.defineProperty(window, 'automataWatch', { get: () => running?.watch, configurable: true })

running = await play({
  root,
  read: readFrom(new URL('./', location.href)),
  mode: modeOf(location.search),
  onState: (state) => tellParent(window, state),
})
if (playAsked) await running.takeOver()
