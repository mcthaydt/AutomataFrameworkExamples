// The page: loads the game's files, starts the game in an element, and puts words on top of it. The sim decides
// everything; this file only shows it and says what to do. Whatever goes wrong becomes a screen of plain words, never
// a blank canvas and never an error nobody reads.
import {
  type Diagnostic,
  type Frames,
  type Game,
  type Host,
  loadGame,
  startGame,
  Thing,
  Transform,
  webHost,
} from '@automataframework/framework'
import { gamePlugins } from '../plugins/plugins.ts'
import { CONTROLS } from './controls.ts'
import './blueprint.css'
import './play.css'
import { WORDS } from './words.ts'

export { CONTROLS } from './controls.ts'
export { readFrom } from './read.ts'
export { WORDS } from './words.ts'

export type PlayState = 'loading' | 'playing' | 'problem'

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
}

export interface Play {
  readonly state: 'playing' | 'problem'
  /** `undefined` on a problem. */
  readonly game: Game | undefined
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
function watching(frames: Frames, after: () => void): Frames {
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
  const { root, read, host = webHost(), start = startGame } = options
  const coarse = options.coarse ?? window.matchMedia('(pointer: coarse)').matches
  let game: Game | undefined
  let stopped = false
  let onTouch: ((event: PointerEvent) => void) | undefined

  const setState = (state: PlayState): void => {
    root.dataset.state = state
  }
  const stop = (): void => {
    if (stopped) return
    stopped = true
    if (onTouch !== undefined) root.removeEventListener('pointerdown', onTouch)
    game?.stop()
    root.replaceChildren()
    root.classList.remove('play-root')
  }

  /**
   * A screen of words in place of the game. `lines` are what went wrong, one per problem, in order: `where` (the file
   * and the place in it, set quieter than the rest) and `what` (a sentence for a person). Together they read exactly
   * as `formatDiagnostic` gives them.
   */
  const problem = (title: string, lines: readonly ProblemLine[], fix: boolean): Play => {
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
    setState('problem')
    return { state: 'problem', game: undefined, stop }
  }

  root.replaceChildren()
  root.classList.add('play-root')
  setState('loading')
  const words = element('div', 'play-words')
  words.append(element('p', 'play-loading', WORDS.loading))
  root.append(words)

  try {
    const loaded = await loadGame(read)
    if (!loaded.ok) return problem(WORDS.problemTitle, loaded.diagnostics.map(lineOf), true)
    const content = loaded.value

    const stage = element('div', 'play-stage')
    root.append(stage)
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

    try {
      game = await start({
        content,
        plugins: gamePlugins,
        mount: stage,
        controls: CONTROLS,
        host,
        frames: watching(options.frames ?? pageFrames, observe),
      })
    } catch (error) {
      return problem(WORDS.cannotStart, [{ what: reasonOf(error) }], false)
    }
    setState('playing')
    return { state: 'playing', game, stop }
  } catch (error) {
    // `loadGame` reports a bad file as words; this is a read that failed in some other way.
    return problem(WORDS.cannotStart, [{ what: reasonOf(error) }], false)
  }
}
