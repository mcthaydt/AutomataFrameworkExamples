// The two messages between the game and the page that frames it (the Site's home page, or anyone's): the game says
// which state it is in, and the page says "play". Nothing else is sent or heard, and a message from anywhere but the
// page that frames this one, at this one's own origin, is ignored: a stranger's page can never start the game.

export type State = 'watching' | 'playing' | 'problem'

/** What the game tells the page that frames it. */
export type Told = { readonly automata: 'state'; readonly state: State }

/** What the page tells the game when its Play button is pressed. */
export const PLAY_MESSAGE = { automata: 'play' } as const

/**
 * Tells the page that frames this one which state the game is in. Does nothing when no page does, and never throws
 * (a page with no origin cannot be posted to).
 */
export function tellParent(win: Window, state: State): void {
  if (win.parent === win) return
  const told: Told = { automata: 'state', state }
  try {
    // `win.origin`, not `win.location.origin`: a frame made from text has the page's origin but a "null" address.
    win.parent.postMessage(told, win.origin)
  } catch {
    // The game is the same with or without a page to tell.
  }
}

/** Calls `onPlay` for `PLAY_MESSAGE` from the parent at this origin; anything else is ignored. Returns the undo. */
export function listenForPlay(win: Window, onPlay: () => void): () => void {
  const heard = (event: MessageEvent): void => {
    if (win.parent === win || event.source !== win.parent || event.origin !== win.origin) return
    const data: unknown = event.data
    if (typeof data !== 'object' || data === null) return
    if ((data as { automata?: unknown }).automata !== PLAY_MESSAGE.automata) return
    onPlay()
  }
  win.addEventListener('message', heard)
  return () => win.removeEventListener('message', heard)
}
