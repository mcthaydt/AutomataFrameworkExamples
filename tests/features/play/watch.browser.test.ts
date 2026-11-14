// The page watching itself in each real browser: the test game plays a recording made in the test, with hand-driven
// frames. Nothing here presses a key unless the test says so, and what is checked is the sim's state, never a picture.
import { Player, parseReplay, Thing, Transform, writeReplay } from '@automataframework/framework'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { type Play, type PlayOptions, play, WORDS } from '#src/features/play/play.ts'
import { manualFrames } from '../../fixtures/frames.ts'
import { readTestGame } from '../../fixtures/test-game.ts'
import {
  LEVEL,
  levelWithCrate,
  RECORDING,
  RECORDING_TICKS,
  recordTestGame,
} from '../../fixtures/test-game-recording.ts'

const FRAME = 1000 / 60

let root: HTMLDivElement
let running: Play | undefined

const host: NonNullable<PlayOptions['host']> = {
  target: 'web',
  visible: () => true,
  onVisibility: () => () => {},
}

beforeEach(() => {
  root = document.createElement('div')
  root.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px'
  document.body.append(root)
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
})
afterEach(() => {
  running?.stop()
  running = undefined
  root.remove()
  vi.restoreAllMocks()
})

/** Plays the test game in `watch` mode (the level with a crate, its recording at the path the page reads). */
async function watchIt(
  extra: { files?: Record<string, string | undefined>; states?: string[] } & Partial<PlayOptions> = {},
): Promise<{ play: Play; frames: ReturnType<typeof manualFrames> }> {
  const { files, states, ...rest } = extra
  const frames = manualFrames()
  const recording = (await recordTestGame()).text
  running = await play({
    root,
    read: readTestGame({ [LEVEL]: levelWithCrate(), [RECORDING]: recording, ...files }),
    host,
    frames,
    coarse: false,
    mode: 'watch',
    ...(states === undefined ? {} : { onState: (state) => states.push(state) }),
    ...rest,
  })
  return { play: running, frames }
}

const text = (selector: string): string | null | undefined => root.querySelector(selector)?.textContent
const key = (type: 'keydown' | 'keyup', code: string, init: KeyboardEventInit = {}): void => {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, cancelable: true, ...init }))
}
const run = (frames: ReturnType<typeof manualFrames>, n: number): void => {
  for (let i = 0; i < n; i++) frames.advance(FRAME)
}
/** A watching game plays only once the window has said it can be seen, which takes a frame or two to arrive. */
const untilSeen = (frames: ReturnType<typeof manualFrames>): Promise<void> =>
  vi.waitFor(() => expect(frames.pending).toBe(true))
const crateX = (sim: NonNullable<Play['watch']>['sim']): number => {
  const crate = sim.query(Thing, Transform).find((entity) => entity.get(Thing).id === 'crate-1')
  if (crate === undefined) throw new Error('no crate')
  return crate.get(Transform).x
}
const heroX = (sim: NonNullable<Play['game']>['sim']): number => {
  const hero = sim.query(Player, Transform)[0]
  if (hero === undefined) throw new Error('no hero')
  return hero.get(Transform).x
}
const clicks = (): void => {
  root.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}
const untilPlaying = (): Promise<void> => vi.waitFor(() => expect(root.dataset.state).toBe('playing'))

test('in watch mode the game plays the recording by itself', async () => {
  const { play: made, frames } = await watchIt()
  expect(root.dataset.state).toBe('watching')
  expect(made.state).toBe('watching')
  expect(made.game).toBeUndefined()
  const watch = made.watch
  if (watch === undefined) throw new Error('no recording is playing')
  await untilSeen(frames)
  frames.at(0)
  run(frames, 20)
  expect(watch.sim.tick).toBe(20)
  run(frames, RECORDING_TICKS - 20)
  // Nobody pressed anything, and the hero walked into the crate and pushed it more than a tile.
  expect(crateX(watch.sim)).toBeGreaterThan(14.5 + 1)
  expect(root.querySelector('.automata-touch')).toBeNull()
  expect(root.querySelector('.play-goal')).toBeNull()
})

test('while it plays itself the words say so, and only that', async () => {
  await watchIt()
  expect(text('.play-watching')).toBe(WORDS.watching)
  expect(root.querySelector('.play-how')).toBeNull()
  expect(WORDS.watching).toBe('The game is playing by itself. Tap it to play.')
})

test('held keys and fingers do nothing to a watching game', async () => {
  const { play: made, frames } = await watchIt()
  const watch = made.watch
  if (watch === undefined) throw new Error('no recording is playing')
  // A key that is no control is held for the whole play, and a finger lands on the screen. The recording goes on as it
  // was made. (A control key would hand the game over: see "a click takes over; so do Enter, Space and the arrow keys".)
  key('keydown', 'KeyQ')
  root.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'touch', bubbles: true }))
  await untilSeen(frames)
  frames.at(0)
  run(frames, RECORDING_TICKS)
  key('keyup', 'KeyQ')
  expect(watch.sim.hash()).toBe((await recordTestGame()).replay.finalHash)
  expect(root.querySelectorAll('button')).toHaveLength(0)
})

test('after its recording it rests a second and plays again from the start', async () => {
  const { play: made, frames } = await watchIt()
  const watch = made.watch
  if (watch === undefined) throw new Error('no recording is playing')
  await untilSeen(frames)
  frames.at(0)
  run(frames, RECORDING_TICKS)
  expect(watch.rounds).toBe(1)
  run(frames, 60) // the rest
  expect(watch.sim.tick).toBe(RECORDING_TICKS)
  run(frames, 1)
  expect(watch.sim.tick).toBe(1)
  expect(crateX(watch.sim)).toBeCloseTo(14.5, 1)
})

test('takeOver starts the level from the beginning with the controls live', async () => {
  const states: string[] = []
  const { play: made, frames } = await watchIt({ states })
  await untilSeen(frames)
  frames.at(0)
  run(frames, 30)
  await made.takeOver()
  expect(made.state).toBe('playing')
  expect(root.dataset.state).toBe('playing')
  expect(made.watch).toBeUndefined()
  const game = made.game
  if (game === undefined) throw new Error('the game did not start')
  expect(game.sim.tick).toBe(0)
  expect(text('.play-goal')).toBe(WORDS.goal)
  expect(text('.play-how')).toBe(WORDS.keys)
  expect(root.querySelector('.play-watching')).toBeNull()
  expect(root.querySelectorAll('canvas')).toHaveLength(1)
  const before = heroX(game.sim)
  key('keydown', 'ArrowRight')
  frames.at(0)
  run(frames, 60)
  key('keyup', 'ArrowRight')
  expect(heroX(game.sim)).toBeGreaterThan(before + 4)
  expect(states).toEqual(['watching', 'playing'])
})

test('takeOver twice starts one game', async () => {
  const { play: made } = await watchIt()
  const first = made.takeOver()
  const second = made.takeOver()
  await Promise.all([first, second])
  expect(root.querySelectorAll('canvas')).toHaveLength(1)
  // A touch brings up the framework's buttons: one set of three, not two.
  root.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'touch', bubbles: true }))
  expect([...root.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Left', 'Right', 'Jump'])
  await made.takeOver()
  expect(root.querySelectorAll('canvas')).toHaveLength(1)
})

test('takeOver when not watching does nothing', async () => {
  const frames = manualFrames()
  running = await play({ root, read: readTestGame(), host, frames, coarse: false })
  const game = running.game
  await running.takeOver()
  expect(running.game).toBe(game)
  expect(running.state).toBe('playing')
})

test('a missing recording opens the ordinary game, and says why in the console', async () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => {})
  const { play: made } = await watchIt({ files: { [RECORDING]: undefined } })
  expect(made.state).toBe('playing')
  expect(made.game).toBeDefined()
  expect(text('.play-goal')).toBe(WORDS.goal)
  expect(info).toHaveBeenCalledTimes(1)
  expect(String(info.mock.calls[0]?.[0])).toContain(RECORDING)
})

test('a recording that is not a replay, or has nothing in it, opens the ordinary game', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
  const empty = writeReplay({ ...(await recordTestGame()).replay, ticks: 0, commands: [], checks: [] })
  for (const text of ['{', empty]) {
    const { play: made } = await watchIt({ files: { [RECORDING]: text } })
    expect(made.state, text).toBe('playing')
    expect(made.game, text).toBeDefined()
    running?.stop()
  }
})

test('a recording for another game setup opens the ordinary game', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
  const other = writeReplay({ ...(await recordTestGame()).replay, tickHz: 30 })
  const { play: made } = await watchIt({ files: { [RECORDING]: other } })
  expect(made.state).toBe('playing')
  expect(root.querySelectorAll('canvas')).toHaveLength(1)
})

test('watching that cannot start opens the ordinary game', async () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => {})
  const { play: made } = await watchIt({ watch: () => Promise.reject(new Error('no')) })
  expect(made.state).toBe('playing')
  expect(made.game).toBeDefined()
  expect(info).toHaveBeenCalledTimes(1)
})

test('a broken level is still the problem screen in watch mode', async () => {
  const { play: made } = await watchIt({ files: { [LEVEL]: '{ "format": 1,' } })
  expect(made.state).toBe('problem')
  expect(root.querySelector('[role="alert"]')).not.toBeNull()
  expect(root.querySelector('canvas')).toBeNull()
})

test('stop while watching empties the root', async () => {
  const { play: made, frames } = await watchIt()
  await untilSeen(frames)
  made.stop()
  expect(root.children).toHaveLength(0)
  expect(frames.pending).toBe(false)
  expect(() => made.stop()).not.toThrow()
})

test('a click takes over; so do Enter, Space and the arrow keys', async () => {
  const click = async (): Promise<void> => {
    const { play: made } = await watchIt()
    clicks()
    await untilPlaying()
    expect(made.game).toBeDefined()
    running?.stop()
  }
  await click()
  for (const code of ['Enter', 'Space', 'ArrowRight', 'KeyA']) {
    const { play: made } = await watchIt()
    key('keydown', code)
    await untilPlaying()
    expect(made.game, code).toBeDefined()
    running?.stop()
  }
})

test('other keys, a held key, and a key with a modifier do not take over', async () => {
  const { play: made, frames } = await watchIt()
  key('keydown', 'KeyQ')
  key('keydown', 'Enter', { repeat: true })
  key('keydown', 'Enter', { ctrlKey: true })
  key('keydown', 'Space', { metaKey: true })
  await untilSeen(frames)
  expect(made.state).toBe('watching')
})

test('a finger that only goes down and drags starts nothing', async () => {
  const { play: made } = await watchIt()
  for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
    root.dispatchEvent(new PointerEvent(type, { pointerId: 1, pointerType: 'touch', bubbles: true }))
  }
  expect(made.state).toBe('watching')
})

test('a recording parses with the framework, as the page reads it', async () => {
  expect(parseReplay((await recordTestGame()).text).ticks).toBe(RECORDING_TICKS)
})
