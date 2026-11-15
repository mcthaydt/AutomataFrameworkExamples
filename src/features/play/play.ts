// The page: loads the game's files, asks a first-time player which language to play in, starts the game in an element,
// and puts words on top of it. The sim decides everything; this file only shows it and says what to do. Every word a
// player reads is in `content/messages/` and is said in the player's language (`locale.words`); the three sentences in
// `words.ts` are for the developer, before any file has loaded. Whatever goes wrong becomes a screen of plain words,
// never a blank canvas and never an error nobody reads. In `watch` mode the game first plays its own recording by
// itself, and `takeOver` hands the same page over to a player, from the start of the level, with nothing reloaded.
import {
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
  Thing,
  Transform,
  type Watch,
  watchReplay,
  webHost,
} from '@automataframework/framework'
import { gamePlugins } from '../plugins/plugins.ts'
import './blueprint.css'
import './play.css'
import type { Mode } from './mode.ts'
import { whileSeen } from './seen.ts'
import { createStrip, type Strip } from './strip.ts'
import { listenToTakeOver, loadRecording, takeOverKeys } from './watching.ts'
import { GAME_ID, WORDS } from './words.ts'

export { listenForPlay, PLAY_MESSAGE, tellParent } from './handover.ts'
export { modeOf } from './mode.ts'
export { readFrom } from './read.ts'
export { createStrip, type Strip } from './strip.ts'
export { GAME_ID, WORDS } from './words.ts'

/** `picking`: a first-time player is choosing a language, so nothing is said in any language yet. */
export type PlayState = 'loading' | 'picking' | 'watching' | 'playing' | 'problem'

export interface PlayOptions {
  readonly root: HTMLElement
  readonly read: (path: string) => Promise<string>
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

/** The thing in the level file the page's words talk about, and how far it must move to count as pushed. */
const CRATE = 'crate-1'
const PUSHED_TILES = 1

const pageFrames: Frames = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
}

/** The same frames, with `after` called once each time a frame has been delivered to the game. */
function observing(frames: Frames, after: () => void): Frames {
  return {
    request: (callback) =>
      frames.request((ms) => {
        callback(ms)
        after()
      }),
    cancel: (id) => frames.cancel(id),
  }
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

    // The strip: the goal, and how to do it at a keyboard or a gamepad. A touch screen has the thumbs' own hints.
    let pushed = false
    const strip: Strip = createStrip(words)
    // What the player used last, once they have used something; until then a coarse pointer means a finger.
    let used: ReturnType<Input['device']> | undefined
    const device = (): ReturnType<Input['device']> => used ?? (coarse ? 'touch' : 'keyboard')
    const dash = content.characters[content.project.hero]?.moves?.dash === true
    drawWords = (): void => {
      if (pushed) strip.done(spoken.words('goal.pushed'))
      else strip.say(spoken.words('goal.push'))
      strip.how(
        playHint({
          device: device(),
          first: (action) => game?.input.inputsFor(1, action)[0],
          dash,
          words: spoken.words,
        }),
      )
    }
    drawWords()
    unfollowWords?.()
    unfollowWords = spoken.onChange(() => drawWords())

    // Where the level file puts the crate, so "pushed" means moved from there, whatever an editor made it.
    const startX = content.levels[content.project.start]?.things.find((thing) => thing.id === CRATE)?.x
    // Presentation only observes: after each frame, read the crate's place from the sim and change the words.
    const observe = (): void => {
      if (pushed || game === undefined || startX === undefined) return
      const crate = game.sim.query(Thing, Transform).find((entity) => entity.get(Thing).id === CRATE)
      if (crate === undefined || Math.abs(crate.get(Transform).x - startX) <= PUSHED_TILES) return
      pushed = true
      drawWords()
    }

    let started: Game
    try {
      started = await start({
        content,
        plugins: gamePlugins,
        mount: stage,
        host,
        locale: spoken,
        frames: observing(frames, observe),
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
    unfollowDevice = started.input.onDevice((player, kind) => {
      if (player !== 1) return
      used = kind
      drawWords()
    })
    drawWords()
    setState('playing')
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
