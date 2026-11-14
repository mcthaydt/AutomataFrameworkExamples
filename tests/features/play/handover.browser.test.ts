// The two messages between the game and the page that frames it, with a real same-origin frame as the game. A message
// from a stranger is made by hand (a `MessageEvent` with the stranger's source and origin), so what is checked is the
// listener's rule and not the browser's delivery.
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { listenForPlay, PLAY_MESSAGE, tellParent } from '#src/features/play/handover.ts'

let frame: HTMLIFrameElement
let stranger: HTMLIFrameElement
let undo: (() => void) | undefined

/** A frame made from text, which has this page's origin: the stand-in for the game. */
function frameOf(): HTMLIFrameElement {
  const made = document.createElement('iframe')
  made.srcdoc = '<!doctype html><title>game</title>'
  document.body.append(made)
  return made
}
/** The window of a frame that has loaded. */
const windowOf = (element: HTMLIFrameElement): Window => {
  if (element.contentWindow === null) throw new Error('the frame has no window')
  return element.contentWindow
}
const loaded = (element: HTMLIFrameElement): Promise<void> =>
  new Promise((resolve) => element.addEventListener('load', () => resolve(), { once: true }))

beforeEach(async () => {
  frame = frameOf()
  stranger = frameOf()
  await Promise.all([loaded(frame), loaded(stranger)])
})
afterEach(() => {
  undo?.()
  undo = undefined
  frame.remove()
  stranger.remove()
})

/**
 * What this window hears at its own origin, as the data of each message. (Not by source: the call is made from this
 * test's own window, so the browser says this window sent it; in the game it is the frame's own window.)
 */
function hear(): unknown[] {
  const heard: unknown[] = []
  const on = (event: MessageEvent): void => {
    if (event.origin === window.origin && (event.data as { automata?: unknown } | null)?.automata === 'state')
      heard.push(event.data)
  }
  window.addEventListener('message', on)
  undo = () => window.removeEventListener('message', on)
  return heard
}
/** A message as the frame's window would receive it from `source` at `origin`. */
const messageFrom = (data: unknown, source: Window | null, origin: string): MessageEvent =>
  new MessageEvent('message', { data, source, origin })

test('the parent is told each state, at this origin only', async () => {
  const heard = hear()
  for (const state of ['watching', 'playing', 'problem'] as const) tellParent(windowOf(frame), state)
  await vi.waitFor(() => expect(heard).toHaveLength(3))
  expect(heard).toEqual([
    { automata: 'state', state: 'watching' },
    { automata: 'state', state: 'playing' },
    { automata: 'state', state: 'problem' },
  ])
})

test('play from the parent is heard once per message', async () => {
  const child = windowOf(frame)
  const onPlay = vi.fn()
  undo = listenForPlay(child, onPlay)
  child.postMessage(PLAY_MESSAGE, window.origin)
  await vi.waitFor(() => expect(onPlay).toHaveBeenCalledTimes(1))
  child.postMessage(PLAY_MESSAGE, window.origin)
  await vi.waitFor(() => expect(onPlay).toHaveBeenCalledTimes(2))
})

test('play from another window, another origin, or with other data is ignored', () => {
  const child = windowOf(frame)
  const onPlay = vi.fn()
  undo = listenForPlay(child, onPlay)
  const origin = window.origin
  // Another window at the right origin: a sibling frame, or the game's own window posting to itself.
  child.dispatchEvent(messageFrom(PLAY_MESSAGE, windowOf(stranger), origin))
  child.dispatchEvent(messageFrom(PLAY_MESSAGE, child, origin))
  child.dispatchEvent(messageFrom(PLAY_MESSAGE, null, origin))
  // The right window at another origin.
  child.dispatchEvent(messageFrom(PLAY_MESSAGE, child.parent, 'https://elsewhere.example'))
  // The right window and origin, with something else to say.
  for (const data of [{}, null, 'play', 7, { automata: 'stop' }, { automata: 'state', state: 'playing' }])
    child.dispatchEvent(messageFrom(data, child.parent, origin))
  expect(onPlay).not.toHaveBeenCalled()
  // And the one that is right is heard, so the checks above were not passing by deafness.
  child.dispatchEvent(messageFrom(PLAY_MESSAGE, child.parent, origin))
  expect(onPlay).toHaveBeenCalledTimes(1)
})

test('with no parent, telling does nothing and does not throw', () => {
  const alone = { origin: 'http://localhost' } as unknown as Window
  Object.assign(alone, { parent: alone })
  expect(() => tellParent(alone, 'watching')).not.toThrow()
  // A parent that cannot be posted to is the same: the game goes on without telling.
  const refusing = {
    origin: 'null',
    parent: {
      postMessage() {
        throw new Error('no')
      },
    },
  } as unknown as Window
  expect(() => tellParent(refusing, 'watching')).not.toThrow()
})

test('listening stops when it is told to', () => {
  const child = windowOf(frame)
  const onPlay = vi.fn()
  const stop = listenForPlay(child, onPlay)
  stop()
  child.dispatchEvent(messageFrom(PLAY_MESSAGE, child.parent, window.origin))
  expect(onPlay).not.toHaveBeenCalled()
})
