// The two things `play` needs to watch the game play itself: the recording to watch, and what ends the watching.
// Anything wrong with the recording is never a problem screen: a visitor who came to play gets the game, and one
// sentence in the console says why for whoever looks.
import { parseReplay, type Replay } from '@automataframework/framework'
import { CONTROLS } from './controls.ts'
import { recordingPath } from './mode.ts'

/**
 * The recording of the first level: read through `read`, parsed, and checked to have something to play. `undefined`,
 * with one `console.info` sentence, when the file is missing, is not a replay, or has no ticks.
 */
export async function loadRecording(
  start: string,
  read: (path: string) => Promise<string>,
): Promise<Replay | undefined> {
  const path = recordingPath(start)
  try {
    const replay = parseReplay(await read(path))
    if (replay.ticks > 0) return replay
    console.info(`${path} has nothing to play, so the game opens ready to play.`)
  } catch (error) {
    const why = error instanceof Error ? error.message : String(error)
    console.info(`The recording ${path} cannot be watched (${why}), so the game opens ready to play.`)
  }
  return undefined
}

/** The keys that take over: Enter, Space and every key a control uses. */
const TAKE_OVER_KEYS: ReadonlySet<string> = new Set([
  'Enter',
  'NumpadEnter',
  'Space',
  ...Object.values(CONTROLS).flatMap((control) => control.keys),
])

/**
 * Calls `onTakeOver` for a click on `root` or a key from `TAKE_OVER_KEYS` (so a keyboard player is not made to find a
 * mouse). A click, not a pointer press, so a finger dragged across the game scrolls the page and starts nothing.
 * Returns the undo.
 */
export function listenToTakeOver(root: HTMLElement, onTakeOver: () => void): () => void {
  const clicked = (): void => onTakeOver()
  const pressed = (event: KeyboardEvent): void => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
    if (TAKE_OVER_KEYS.has(event.code)) onTakeOver()
  }
  root.addEventListener('click', clicked)
  // On the window, as the framework's keyboard is: a watching game takes no focus, so a key never reaches the root.
  window.addEventListener('keydown', pressed)
  return () => {
    root.removeEventListener('click', clicked)
    window.removeEventListener('keydown', pressed)
  }
}
