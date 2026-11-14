// Whether the page watches the game play itself or plays it: one word in the address. This file imports nothing, so
// `scripts/copy-game.ts` can read it in Node (the page's own entry, `play.ts`, needs a browser to load).

export type Mode = 'play' | 'watch'

/** `watch` when the address's query has a `watch` key, whatever its value; `play` otherwise. */
export function modeOf(search: string): Mode {
  return new URLSearchParams(search).has('watch') ? 'watch' : 'play'
}

/** Where the recording a game watches lives, from the game's root: `replays/<start>.json`. */
export function recordingPath(start: string): string {
  return `replays/${start}.json`
}
