// A first-time player is asked which language to play in, with flags, before anything is said in any language; the
// choice is kept; and the game that plays itself says its words in the device's language until someone is asked. Each
// test makes its own host, because a host keeps what the player chose.
import { testHost } from '@automataframework/framework'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { type Play, play } from '#src/features/play/play.ts'
import { manualFrames } from '../../fixtures/frames.ts'
import { readTestGame } from '../../fixtures/test-game.ts'
import { LEVEL, levelWithCrate, RECORDING, recordTestGame } from '../../fixtures/test-game-recording.ts'
import { say } from '../../fixtures/words.ts'

let root: HTMLDivElement
let running: Play | undefined

beforeEach(() => {
  root = document.createElement('div')
  root.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px'
  document.body.append(root)
})
afterEach(() => {
  running?.stop()
  running = undefined
  root.remove()
  document.documentElement.removeAttribute('lang')
  vi.restoreAllMocks()
})

const text = (selector: string): string | null | undefined => root.querySelector(selector)?.textContent
const flag = (language: string): HTMLButtonElement => {
  const found = root.querySelector<HTMLButtonElement>(`.automata-flag[data-language="${language}"]`)
  if (found === null) throw new Error(`no ${language} flag`)
  return found
}
const go = (): HTMLButtonElement => {
  const found = root.querySelector<HTMLButtonElement>('.automata-picker-go')
  if (found === null) throw new Error('no Go button')
  return found
}

test('a first visit shows the flags before anything is said, and no game', async () => {
  running = await play({
    root,
    read: readTestGame(),
    host: testHost({ deviceLanguages: ['ko-KR'] }),
    frames: manualFrames(),
    coarse: false,
  })
  expect(running.state).toBe('picking')
  expect(root.dataset.state).toBe('picking')
  expect(running.game).toBeUndefined()
  expect(root.querySelector('canvas')).toBeNull()
  expect(root.querySelectorAll('.automata-flag')).toHaveLength(6)
  // The strip has nothing to say yet, so it is out of the way and the flags fill the game.
  const words = root.querySelector('.play-words')
  if (words === null) throw new Error('no strip')
  expect(getComputedStyle(words).display).toBe('none')
  // No language is the default: the page has none until one is chosen, even when the device suggests one.
  expect(document.documentElement.hasAttribute('lang')).toBe(false)
})

test('choosing a flag and pressing Go starts the game in that language, and the page says so', async () => {
  running = await play({
    root,
    read: readTestGame(),
    host: testHost(),
    frames: manualFrames(),
    coarse: false,
  })
  expect(document.documentElement.hasAttribute('lang')).toBe(false)
  flag('ja').click()
  go().click()
  await vi.waitFor(() => expect(running?.state).toBe('playing'))
  expect(running.game).toBeDefined()
  expect(root.querySelector('.automata-picker')).toBeNull()
  expect(document.documentElement.lang).toBe('ja')
  expect(text('.play-goal')).toBe(say('level.level-1.goal', 'ja'))
})

test('Go does nothing until a flag is chosen', async () => {
  running = await play({
    root,
    read: readTestGame(),
    host: testHost(),
    frames: manualFrames(),
    coarse: false,
  })
  // The picker opens on the device's own language when the game has it; this device has none to suggest.
  expect(running.state).toBe('picking')
  go().click()
  expect(running.state).toBe('picking')
  expect(root.querySelector('canvas')).toBeNull()
})

test('a second visit with the same store never shows the picker', async () => {
  const host = testHost()
  running = await play({ root, read: readTestGame(), host, frames: manualFrames(), coarse: false })
  flag('es').click()
  go().click()
  await vi.waitFor(() => expect(running?.state).toBe('playing'))
  running.stop()
  running = await play({ root, read: readTestGame(), host, frames: manualFrames(), coarse: false })
  expect(running.state).toBe('playing')
  expect(root.querySelector('.automata-picker')).toBeNull()
  expect(text('.play-goal')).toBe(say('level.level-1.goal', 'es'))
})

test("a host that already knows the player's language starts the game at once", async () => {
  running = await play({
    root,
    read: readTestGame(),
    host: testHost({ language: 'pt' }),
    frames: manualFrames(),
    coarse: false,
  })
  expect(running.state).toBe('playing')
  expect(text('.play-goal')).toBe(say('level.level-1.goal', 'pt'))
})

test('in watch mode the recording plays with no picker, and takeOver shows it before the game', async () => {
  const recording = (await recordTestGame()).text
  running = await play({
    root,
    read: readTestGame({ [LEVEL]: levelWithCrate(), [RECORDING]: recording }),
    host: testHost({ deviceLanguages: ['ko-KR'] }),
    frames: manualFrames(),
    coarse: false,
    mode: 'watch',
  })
  expect(running.state).toBe('watching')
  expect(root.querySelector('.automata-picker')).toBeNull()
  // Nobody has been asked, so the words are in the device's language, and nothing is kept.
  expect(text('.play-watching')).toBe(say('watch.click', 'ko'))
  void running.takeOver()
  await vi.waitFor(() => expect(running?.state).toBe('picking'))
  expect(root.querySelector('.automata-picker')).not.toBeNull()
  expect(root.querySelector('canvas')).toBeNull()
  expect(running.watch).toBeUndefined()
  go().click()
  await vi.waitFor(() => expect(running?.state).toBe('playing'))
  expect(text('.play-goal')).toBe(say('level.level-1.goal', 'ko'))
})

test('stop while the flags are up leaves the root empty, and the game never starts', async () => {
  const made = await play({
    root,
    read: readTestGame(),
    host: testHost(),
    frames: manualFrames(),
    coarse: false,
  })
  expect(made.state).toBe('picking')
  made.stop()
  expect(root.children).toHaveLength(0)
  expect(made.game).toBeUndefined()
})
