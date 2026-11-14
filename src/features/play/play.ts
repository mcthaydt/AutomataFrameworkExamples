// The page: loads the game's files, starts the game in an element, and puts words on top of it. The sim decides
// everything; this file only shows it and says what to do. Whatever goes wrong becomes a screen of plain words, never
// a blank canvas and never an error nobody reads. In `watch` mode the game first plays its own recording by itself, and
// `takeOver` hands the same page over to a player, from the start of the level, with nothing reloaded.
import {
  type Diagnostic,
  type Frames,
  type Game,
  type GameContent,
  type Host,
  loadGame,
  type Replay,
  startGame,
  Thing,
  Transform,
  type Watch,
  watchReplay,
  webHost,
} from '@automataframework/framework'
import { gamePlugins } from '../plugins/plugins.ts'
import { CONTROLS } from './controls.ts'
import './blueprint.css'
import './play.css'
import type { Mode } from './mode.ts'
import { whileSeen } from './seen.ts'
import { listenToTakeOver, loadRecording } from './watching.ts'
import { WORDS } from './words.ts'

export { CONTROLS } from './controls.ts'
export { readFrom } from './read.ts'
export { WORDS } from './words.ts'

export type PlayState = 'loading' | 'watching' | 'playing' | 'problem'

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
  /** A getter: it changes on hand-over. */
  readonly state: 'watching' | 'playing' | 'problem'
  /** `undefined` while watching and on a problem. */
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
  let onTouch: ((event: PointerEvent) => void) | undefined
  // What `begin` needs, once the game's files have loaded.
  let content: GameContent
  let stage: HTMLElement
  let words: HTMLElement

  const setState = (next: PlayState): void => {
    state = next
    root.dataset.state = next
    if (next !== 'loading') options.onState?.(next)
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
    if (onTouch !== undefined) root.removeEventListener('pointerdown', onTouch)
    stopWatching()
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
        await begin()
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
  const problem = (title: string, lines: readonly ProblemLine[], fix: boolean): Play => {
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
    if (fix) screen.append(element('p', '', WORDS.problemFix))
    root.append(screen)
    game = undefined
    setState('problem')
    return made
  }

  /** The game for a player: the goal and how to move in the strip, the level on the stage, the controls live. */
  const begin = async (): Promise<void> => {
    const goal = element('p', 'play-goal', WORDS.goal)
    const how = element('p', 'play-how', coarse ? WORDS.touch : WORDS.keys)
    words.replaceChildren(goal, how)

    // The first finger on the screen is the moment the framework shows its buttons, and the words follow it for good.
    onTouch = (event) => {
      if (event.pointerType !== 'touch') return
      how.textContent = WORDS.touch
      if (onTouch !== undefined) root.removeEventListener('pointerdown', onTouch)
    }
    root.addEventListener('pointerdown', onTouch)

    // Where the level file puts the crate, so "pushed" means moved from there, whatever an editor made it.
    const startX = content.levels[content.project.start]?.things.find((thing) => thing.id === CRATE)?.x
    let pushed = false
    // Presentation only observes: after each frame, read the crate's place from the sim and change the words.
    const observe = (): void => {
      if (pushed || game === undefined || startX === undefined) return
      const crate = game.sim.query(Thing, Transform).find((entity) => entity.get(Thing).id === CRATE)
      if (crate === undefined || Math.abs(crate.get(Transform).x - startX) <= PUSHED_TILES) return
      pushed = true
      goal.textContent = WORDS.done
      // The look puts a tick before the words, so a player sees at a glance that they did it.
      goal.classList.add('play-done')
    }

    let started: Game
    try {
      started = await start({
        content,
        plugins: gamePlugins,
        mount: stage,
        controls: CONTROLS,
        host,
        frames: observing(frames, observe),
      })
    } catch (error) {
      problem(WORDS.cannotStart, [{ what: reasonOf(error) }], false)
      return
    }
    if (stopped) {
      started.stop()
      return
    }
    game = started
    setState('playing')
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
    words.replaceChildren(element('p', 'play-watching', WORDS.watching))
    unlistenTakeOver = listenToTakeOver(root, () => void made.takeOver())
    setState('watching')
    return true
  }

  root.replaceChildren()
  root.classList.add('play-root')
  setState('loading')
  words = element('div', 'play-words')
  words.append(element('p', 'play-loading', WORDS.loading))
  root.append(words)

  try {
    const loaded = await loadGame(read)
    if (!loaded.ok) return problem(WORDS.problemTitle, loaded.diagnostics.map(lineOf), true)
    content = loaded.value

    stage = element('div', 'play-stage')
    root.append(stage)
    const recording = mode === 'watch' ? await loadRecording(content.project.start, read) : undefined
    if (recording !== undefined && (await watchIt(recording))) return made
    await begin()
    return made
  } catch (error) {
    // `loadGame` reports a bad file as words; this is a read that failed in some other way.
    return problem(WORDS.cannotStart, [{ what: reasonOf(error) }], false)
  }
}
