// Playing together: the people button on the strip, and the framework's own "Add a player" screen it opens. A second
// person joins with a button on their own gamepad, or by pressing Enter to share the keyboard (one on the letter keys,
// one on the arrows). Who joined, and with what, is kept here for the visit, so a door, which starts the game again in
// the next level, brings everyone through with the same keys and gamepads. A touch screen has one pair of thumbs, so
// there the button says plainly that two players need a keyboard or gamepads, and opens nothing.
import { type Claim, type Game, type Locale, playersScreen } from '@automataframework/framework'

export interface Together {
  /** Who is playing as the next level opens: player 1, then everyone who joined, lowest first. */
  players(): readonly number[]
  /** Gives each joined player their keys or gamepad again, in a game that has just started. */
  seat(game: Game): void
  /** Says the button's name again, in the player's language. */
  relabel(): void
  /** Closes the screen if it is up, and takes the button away. */
  destroy(): void
}

export interface TogetherOptions {
  /** Where the button goes: the strip. */
  readonly strip: HTMLElement
  /** Where the screen goes, over the level. */
  readonly over: HTMLElement
  readonly locale: Pick<Locale, 'words' | 'onChange' | 'language'>
  /** The game being played now. */
  readonly game: () => Game | undefined
  /** Whether the player is on a touch screen right now (no keyboard or gamepad used yet). */
  readonly touch: () => boolean
  /** Says the touch sentence in the strip's second line, or puts the usual words back with `undefined`. */
  readonly tell: (text: string | undefined) => void
}

/** The people button in `strip`; it opens the "Add a player" screen in `over`. */
export function createTogether(options: TogetherOptions): Together {
  const { strip, over, locale } = options
  const joined = new Map<number, Claim>()
  let shown: { destroy(): void } | undefined
  let layer: HTMLElement | undefined

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'play-people'
  const relabel = (): void => {
    const name = locale.words('automata.players.title')
    button.setAttribute('aria-label', name)
    button.title = name
  }
  relabel()
  strip.append(button)

  const close = (): void => {
    shown?.destroy()
    shown = undefined
    layer?.remove()
    layer = undefined
  }

  /** The screen, drawn again with who is in now; `refused` says why the last try was not let in. */
  const draw = (game: Game, refused?: string): void => {
    shown?.destroy()
    if (layer === undefined) {
      layer = document.createElement('div')
      layer.className = 'play-players'
      over.append(layer)
    }
    const keyboardIsFree = ![...joined.values()].includes('keyboard')
    const canShare =
      keyboardIsFree && Object.values(game.input.controls()).every((control) => control.shared !== undefined)
    shown = playersScreen({
      mount: layer,
      locale,
      players: [1, ...joined.keys()].sort((a, b) => a - b),
      canShare,
      ...(refused === undefined ? {} : { refused }),
      invite: (onPad) => game.input.invite(onPad),
      onJoin: (claim) => {
        const answer = game.addPlayer(claim)
        if (!answer.ok) {
          draw(game, answer.message)
          return
        }
        joined.set(answer.player, claim)
        draw(game)
      },
      onDone: () => {
        close()
        game.resume()
        button.focus()
      },
    })
  }

  button.addEventListener('click', () => {
    const game = options.game()
    if (game === undefined || shown !== undefined) return
    if (options.touch()) {
      options.tell(locale.words('players.touch'))
      return
    }
    options.tell(undefined)
    game.pause()
    draw(game)
  })

  return {
    players: () => [1, ...joined.keys()].sort((a, b) => a - b),
    seat(game) {
      for (const [player, claim] of joined) game.input.claim(player, claim)
    },
    relabel,
    destroy() {
      close()
      button.remove()
    },
  }
}
