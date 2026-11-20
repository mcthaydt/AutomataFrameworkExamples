// The page: loads the game's files, asks a first-time player which language to play in, starts the game in an element,
// and puts words on top of it. The sim decides everything; this file only shows it and says what to do. Every word a
// player reads is in `content/messages/` and is said in the player's language (`locale.words`); the three sentences in
// `words.ts` are for the developer, before any file has loaded. Whatever goes wrong becomes a screen of plain words,
// never a blank canvas and never an error nobody reads. In `watch` mode the game first plays its own recording by
// itself, and `takeOver` hands the same page over to a player, from the start of the level, with nothing reloaded.
import {
  type Arrive,
  createLocale,
  type Diagnostic,
  type Frames,
  followLanguage,
  type Game,
  type GameContent,
  type Host,
  heroControls,
  type Input,
  type Locale,
  languagePicker,
  loadGame,
  openSettings,
  playHint,
  type Replay,
  startGame,
  type Watch,
  type Way,
  watchReplay,
  webHost,
} from '@automataframework/framework'
import { gamePlugins } from '../plugins/plugins.ts'
import './blueprint.css'
import './play.css'
import type { Mode } from './mode.ts'
import { whileSeen } from './seen.ts'
import { createStrip, type Strip } from './strip.ts'
import { createTogether, type Together } from './together.ts'
import { listenToTakeOver, loadRecording, takeOverKeys } from './watching.ts'
import { followVisit } from './ways.ts'
import { GAME_ID, WORDS } from './words.ts'

export { listenForPlay, PLAY_MESSAGE, tellParent } from './handover.ts'
export { modeOf } from './mode.ts'
export { picturesFrom, readFrom } from './read.ts'
export { createStrip, type Strip } from './strip.ts'
export { GAME_ID, WORDS } from './words.ts'

/** `picking`: a first-time player is choosing a language, so nothing is said in any language yet. */
export type PlayState = 'loading' | 'picking' | 'watching' | 'playing' | 'problem'

export interface PlayOptions {
  readonly root: HTMLElement
  readonly read: (path: string) => Promise<string>
  /** Fetches the game's painted pictures, like `content/figures/hero.png`. A game with a figure cannot start without it. */
  readonly readPicture?: (path: string) => Promise<Blob>
  /** Default `webHost()`. */
  readonly host?: Host
  /** Default: the page's animation frames. */
  readonly frames?: Frames
  /** Default: whether the screen is touched with a finger, `(pointer: coarse)`. */
  readonly coarse?: boolean
  /** Default `startGame`; a test passes one that throws. */
  readonly start?: typeof startGame
  /** Default `'play'`: `'watch'` plays the first level's recording by itself until `takeOver`. */
  readonly mode?: Mode
  /** Default `watchReplay`; a test passes one that throws. */
  readonly watch?: typeof watchReplay
  /** Called each time the state changes, `loading` excluded. */
  readonly onState?: (state: Exclude<PlayState, 'loading'>) => void
}

export interface Play {
  /** A getter: it changes on hand-over, and again once a first-time player has picked a language. */
  readonly state: Exclude<PlayState, 'loading'>
  /** `undefined` while watching, while picking a language, and on a problem. */
  readonly game: Game | undefined
  /** The recording that is playing; `undefined` unless watching. Its sim and rounds say how far it has got. */
  readonly watch: Watch | undefined
  /** Watching: stops the recording and starts the level with the controls live. Otherwise does nothing. */
  takeOver(): Promise<void>
  /** Stops the game and empties the root. Safe to call twice. */
  stop(): void
}

const pageFrames: Frames = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const made = document.createElement(tag)
  made.className = className
  if (text !== undefined) made.textContent = text
  return made
}

const reasonOf = (error: unknown): string =>
  error instanceof Error ? error.message : error === undefined ? 'No reason was given.' : String(error)

/** One problem on the screen of words: where it is, when it names a file, and what is wrong. */
interface ProblemLine {
  readonly where?: string
  readonly what: string
}

/** A diagnostic split the way `formatDiagnostic` joins it: `file: place: ` then the message. */
const lineOf = (d: Diagnostic): ProblemLine => ({
  where: d.path === '' ? `${d.file}: ` : `${d.file}: ${d.path}: `,
  what: d.message,
})

/** Loads the game through `read` and starts it in `root`. Never rejects: anything that goes wrong is a screen of words. */
export async function play(options: PlayOptions): Promise<Play> {
  const { root, read, host = webHost(), start = startGame, mode = 'play', watch = watchReplay } = options
  const pictures = options.readPicture === undefined ? {} : { readPicture: options.readPicture }
  const coarse = options.coarse ?? window.matchMedia('(pointer: coarse)').matches
  const frames = options.frames ?? pageFrames
  let state: PlayState = 'loading'
  let game: Game | undefined
  let watching: Watch | undefined
  let seen: (Host & { destroy(): void }) | undefined
  let unlistenTakeOver: (() => void) | undefined
  let takingOver: Promise<void> | undefined
  let stopped = false
  // What `begin` needs, once the game's files have loaded.
  let content: GameContent
  let locale: Locale | undefined
  let stage: HTMLElement
  let words: HTMLElement
  /** Puts the strip's words in the player's language again: the picker's choice, or any later change of language. */
  let drawWords: () => void = () => {}
  let unfollowLanguage: (() => void) | undefined
  let unfollowWords: (() => void) | undefined
  let picker: { destroy(): void } | undefined
  let unfollowDevice: (() => void) | undefined
  let stopVisit: (() => void) | undefined
  let together: Together | undefined

  const setState = (next: PlayState): void => {
    state = next
    root.dataset.state = next
    if (next !== 'loading') options.onState?.(next)
  }
  /** A sentence in the player's language, or the developer's own once there is none: the page may be stopped before. */
  const say = (key: string, developers: string): string => {
    const current = locale
    return current !== undefined && current.language() !== undefined ? current.words(key) : developers
  }
  /** Stops watching: the listeners, the recording and what looks at the window. The root is left as it is. */
  const stopWatching = (): void => {
    unlistenTakeOver?.()
    unlistenTakeOver = undefined
    watching?.stop()
    watching = undefined
    seen?.destroy()
    seen = undefined
  }
  const stop = (): void => {
    if (stopped) return
    stopped = true
    stopWatching()
    picker?.destroy()
    picker = undefined
    unfollowWords?.()
    unfollowLanguage?.()
    unfollowDevice?.()
    stopVisit?.()
    together?.destroy()
    game?.stop()
    root.replaceChildren()
    root.classList.remove('play-root')
  }
  // Only handed out once loading is over, so its state is never `loading`.
  const made: Play = {
    get state() {
      return state as Exclude<PlayState, 'loading'>
    },
    get game() {
      return game
    },
    get watch() {
      return watching
    },
    takeOver() {
      if (state !== 'watching') return Promise.resolve()
      // A second press while the first is starting the game is the same hand-over, not another game.
      takingOver ??= (async () => {
        stopWatching()
        stage.replaceChildren()
        await beginSafely()
      })()
      return takingOver
    },
    stop,
  }

  /**
   * A screen of words in place of the game. `lines` are what went wrong, one per problem, in order: `where` (the file
   * and the place in it, set quieter than the rest) and `what` (a sentence for a person). Together they read exactly
   * as `formatDiagnostic` gives them.
   */
  const problem = (title: string, lines: readonly ProblemLine[], fix?: string): Play => {
    stopWatching()
    root.replaceChildren()
    const screen = element('div', 'play-problem')
    screen.setAttribute('role', 'alert')
    const list = element('ul', '')
    for (const line of lines) {
      const item = element('li', '')
      // Two plain inline spans, one after the other: a block or a flex box would put a line break into the text.
      if (line.where !== undefined) item.append(element('span', 'play-where', line.where))
      item.append(element('span', 'play-what', line.what))
      list.append(item)
    }
    screen.append(element('h1', '', title), list)
    if (fix !== undefined) screen.append(element('p', '', fix))
    root.append(screen)
    game = undefined
    setState('problem')
    return made
  }

  /**
   * Asks a first-time player which language to play in, with flags, before anything is said in any language. `false`
   * when the page was stopped while the flags were up.
   */
  const pickLanguage = async (current: Locale): Promise<boolean> => {
    words.replaceChildren()
    stage.replaceChildren()
    setState('picking')
    const shown = languagePicker({ mount: stage, locale: current, frames })
    picker = shown
    await shown.done
    // `done` never settles after `stop`, so a page that is still here has a language now.
    picker = undefined
    shown.destroy()
    stage.replaceChildren()
    return !stopped
  }

  /** The game for a player: the goal and how to move in the strip, the level on the stage, the controls live. */
  const begin = async (): Promise<void> => {
    if (locale === undefined) return
    const spoken = locale
    if (!spoken.asked() && !(await pickLanguage(spoken))) return

    // The strip: the goal of the level player 1 is in, and how to do it at a keyboard or a gamepad. A touch screen has
    // the thumbs' own hints.
    let here = content.project.start
    let reached = false
    const strip: Strip = createStrip(words)
    // What the player used last, once they have used something; until then a coarse pointer means a finger.
    let used: ReturnType<Input['device']> | undefined
    const device = (): ReturnType<Input['device']> => used ?? (coarse ? 'touch' : 'keyboard')
    const dash = content.characters[content.project.hero]?.moves?.dash === true
    // A sentence the people button asked the second line to say instead of how to move, until the level changes.
    let told: string | undefined
    together?.destroy()
    together = createTogether({
      strip: words,
      over: root,
      locale: spoken,
      game: () => game,
      touch: () => device() === 'touch',
      tell: (text) => {
        told = text
        drawWords()
      },
      most: content.project.players ?? 1,
      changed: () => drawWords(),
    })
    const people = together
    drawWords = (): void => {
      if (reached) strip.done(spoken.words('goal.done'))
      else strip.say(spoken.words(`level.${here}.goal`))
      // Who has a seat now: a player who has just joined has one only once the game has let them in.
      const playing = game?.input.seats().map((seat) => seat.player) ?? [1]
      const hint = (
        kind: ReturnType<Input['device']>,
        first: (action: string) => string | undefined,
        shift?: 'left' | 'right',
      ): string => playHint({ device: kind, first, dash, words: shiftSaid(spoken.words, shift) })
      strip.how(
        told ??
          (playing.length < 2 || game === undefined || device() === 'touch'
            ? hint(device(), (action) => game?.input.inputsFor(1, action)[0])
            : playing
                .map((player) => {
                  const own = inputsOf(game as Game, player)
                  return spoken.words('players.hint', {
                    player,
                    hint: hint(own.kind, own.first, own.shift),
                  })
                })
                .join(' ')),
      )
    }
    drawWords()
    unfollowWords?.()
    unfollowWords = spoken.onChange(() => {
      people.relabel()
      drawWords()
    })

    // What was done for good in this visit: the next level opens with it, so a gate a button held open stays open.
    const kept: string[] = []

    /** Opens `level`, the heroes coming in as `arrive` says. A game that cannot start is a screen of words. */
    const open = async (level: string, arrive?: Arrive): Promise<void> => {
      let started: Game
      try {
        started = await start({
          content,
          plugins: gamePlugins,
          ...pictures,
          mount: stage,
          host,
          locale: spoken,
          frames,
          level,
          // Everyone who joined comes through the door too. One player is the game's default, so it is not said.
          ...(people.players().length > 1 ? { players: people.players() } : {}),
          ...(arrive === undefined ? {} : { arrive }),
          ...(kept.length === 0 ? {} : { facts: [...kept] }),
        })
      } catch (error) {
        problem(say('page.cannot-start', WORDS.cannotStart), [{ what: reasonOf(error) }])
        return
      }
      if (stopped) {
        started.stop()
        return
      }
      game = started
      people.seat(started)
      unfollowDevice?.()
      const unfollowKind = started.input.onDevice((player, kind) => {
        if (player === 1) used = kind
        drawWords()
      })
      // A player joining, or a gamepad coming or going, changes who holds which keys: the strip says it again.
      const unfollowSeats = started.input.onSeats(() => drawWords())
      unfollowDevice = () => {
        unfollowKind()
        unfollowSeats()
      }
      stopVisit = followVisit({
        game: started,
        content,
        level,
        onDoor: (way) => void through(started, way),
        onEntered: (entered) => {
          here = entered
          told = undefined
          reached = false
          drawWords()
        },
        onFact: (fact) => {
          if (!kept.includes(fact)) kept.push(fact)
        },
        onGoal: () => {
          reached = true
          drawWords()
        },
      })
      here = level
      reached = false
      told = undefined
      drawWords()
      setState('playing')
    }

    /** A hero went through a door: the game is held still, and the level it leads to opens, with no screen between. */
    const through = async (door: Game, way: Way): Promise<void> => {
      door.pause()
      // The hero went through during a step: let the frame finish with its sim before the game is stopped, or the rest
      // of the frame would use a sim that is gone.
      await Promise.resolve()
      door.stop()
      stage.replaceChildren()
      if (stopped) return
      try {
        await open(way.level, way.thing === undefined ? undefined : { thing: way.thing })
      } catch (error) {
        problem(say('page.cannot-start', WORDS.cannotStart), [{ what: reasonOf(error) }])
      }
    }

    await open(here)
  }

  /** `begin`, with anything that goes wrong on the way shown as words. */
  const beginSafely = async (): Promise<void> => {
    try {
      await begin()
    } catch (error) {
      problem(say('page.cannot-start', WORDS.cannotStart), [{ what: reasonOf(error) }])
    }
  }

  /**
   * Plays the recording by itself, with the strip saying so, and listens for what hands the page to a player.
   * `false`, with the stage as it was, when the recording cannot be watched: the visitor then gets the game.
   */
  const watchIt = async (recording: Replay): Promise<boolean> => {
    const looking = whileSeen(host, root)
    try {
      watching = await watch({
        content,
        plugins: gamePlugins,
        ...pictures,
        mount: stage,
        host: looking,
        frames,
        replay: recording,
      })
    } catch (error) {
      looking.destroy()
      console.info(`The game could not play its recording (${reasonOf(error)}), so it opens ready to play.`)
      return false
    }
    seen = looking
    const watchingWords = element('p', 'play-watching')
    words.replaceChildren(watchingWords)
    // Nobody has been asked yet, so these words are in the device's language, else the game's own (a watching locale).
    drawWords = (): void => {
      watchingWords.textContent = locale?.words(coarse ? 'watch.tap' : 'watch.click') ?? ''
    }
    drawWords()
    unfollowWords = locale?.onChange(() => drawWords())
    const keys = takeOverKeys(heroControls(content))
    unlistenTakeOver = listenToTakeOver(root, () => void made.takeOver(), keys)
    setState('watching')
    return true
  }

  root.replaceChildren()
  root.classList.add('play-root')
  setState('loading')
  // No letters: nobody has a language yet, so the mark only turns.
  const loading = element('div', 'play-loading')
  loading.setAttribute('role', 'status')
  loading.setAttribute('aria-busy', 'true')
  root.append(loading)

  try {
    const loaded = await loadGame(read)
    if (!loaded.ok) return problem(WORDS.problemTitle, loaded.diagnostics.map(lineOf), WORDS.problemFix)
    content = loaded.value

    // The player's language: the one they picked before, else the host's. A player who has neither is asked first. A
    // game that watches itself says its words in the device's language, or the game's own, until someone is asked.
    const settings = await openSettings({ game: GAME_ID, store: host.store })
    locale = createLocale({ content, host, settings, watching: mode === 'watch' })
    unfollowLanguage = followLanguage(locale)

    words = element('div', 'play-words')
    stage = element('div', 'play-stage')
    root.replaceChildren(words, stage)
    const recording = mode === 'watch' ? await loadRecording(content.project.start, read) : undefined
    if (recording !== undefined && (await watchIt(recording))) return made
    const going = beginSafely()
    // A first-time player is choosing a language: the page is theirs to stop, and the game starts when Go is pressed.
    if (made.state === 'picking') return made
    await going
    return made
  } catch (error) {
    // `loadGame` reports a bad file as words; this is a read that failed in some other way.
    return problem(say('page.cannot-start', WORDS.cannotStart), [{ what: reasonOf(error) }])
  }
}

/**
 * What a player plays with, and the first input of each action on it, for the words that say so. A player who holds
 * only keys is at the keyboard and one who holds only a gamepad is on it, whatever was pressed last (the press that let
 * a gamepad join counts as player 1's, before the pad was theirs); one who holds both is on what they used last. The
 * keys are the player's own half of a shared keyboard, or the whole keyboard's.
 */
function inputsOf(
  game: Game,
  player: number,
): {
  kind: ReturnType<Input['device']>
  first: (action: string) => string | undefined
  shift?: 'left' | 'right'
} {
  const devices = game.input.seats().find((seat) => seat.player === player)?.devices ?? []
  const pads = devices.some((device) => device.startsWith('pad-'))
  const keyboard = devices.find((device) => device.startsWith('keyboard'))
  const kind =
    keyboard !== undefined && !pads
      ? 'keyboard'
      : pads && keyboard === undefined
        ? 'gamepad'
        : game.input.device(player)
  const controls = game.input.controls()
  const first = (action: string): string | undefined => {
    const control = controls[action]
    if (control === undefined) return undefined
    if (kind === 'gamepad') return control.pad?.[0]
    if (keyboard === 'keyboard-1') return control.shared?.[0][0]
    if (keyboard === 'keyboard-2') return control.shared?.[1][0]
    return control.keys[0]
  }
  // Each half of a shared keyboard has one Shift of its own, and the framework calls both "Shift": say which.
  const half = keyboard === 'keyboard-1' ? 0 : keyboard === 'keyboard-2' ? 1 : undefined
  if (kind !== 'keyboard' || half === undefined) return { kind, first }
  const keys = Object.values(controls).flatMap((control) => control.shared?.[half] ?? [])
  const left = keys.includes('ShiftLeft')
  const right = keys.includes('ShiftRight')
  return left === right ? { kind, first } : { kind, first, shift: left ? 'left' : 'right' }
}

/** `words`, with the framework's one word for Shift said as the game's left or right Shift when `side` is given. */
function shiftSaid(words: Locale['words'], side: 'left' | 'right' | undefined): Locale['words'] {
  if (side === undefined) return words
  return ((key: string, values?: Parameters<Locale['words']>[1]) =>
    key === 'automata.key.shift' ? words(`keys.shift-${side}`) : words(key, values)) as Locale['words']
}
