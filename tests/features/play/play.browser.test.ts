// The page's pieces in each real browser: real DOM, real key and pointer events, hand-driven frames. The test game
// (`tests/fixtures/test-game.ts`) is the one played, so no editor's change to the real level can break these.
import { Player, parseContent, Transform, writeContent } from '@automataframework/framework'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { type Play, type PlayOptions, play, readFrom, WORDS } from '#src/features/play/play.ts'
import { manualFrames } from '../../fixtures/frames.ts'
import { readTestGame, testGameFiles } from '../../fixtures/test-game.ts'

const FRAME = 1000 / 60
const LEVEL = 'content/levels/level-1.json'

let root: HTMLDivElement
let running: Play | undefined

/** A host that is always on screen, so no test depends on the machine's own window. */
const host: NonNullable<PlayOptions['host']> = {
  target: 'web',
  visible: () => true,
  onVisibility: () => () => {},
}

beforeEach(() => {
  root = document.createElement('div')
  root.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px'
  document.body.append(root)
  // The test machines have a mouse; say so, so "buttons hidden until a touch" does not depend on which one it is.
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
})
afterEach(() => {
  running?.stop()
  running = undefined
  root.remove()
  vi.restoreAllMocks()
})

/** A level of the test game with the crate 4 tiles to the right of the hero's start. */
function levelWithCrate(): string {
  const parsed = parseContent('level', testGameFiles[LEVEL] ?? '', LEVEL)
  if (!parsed.ok) throw new Error('the test game level did not parse')
  return writeContent('level', {
    ...parsed.value,
    things: [{ id: 'crate-1', character: 'crate', x: 14.5, y: 7.5 }],
  })
}

async function begin(
  extra: { files?: Record<string, string | undefined>; coarse?: boolean } & Partial<PlayOptions> = {},
): Promise<{ play: Play; frames: ReturnType<typeof manualFrames> }> {
  const { files, coarse = false, ...rest } = extra
  const frames = manualFrames()
  running = await play({ root, read: readTestGame(files), host, frames, coarse, ...rest })
  return { play: running, frames }
}

const text = (selector: string): string | null | undefined => root.querySelector(selector)?.textContent
const key = (type: 'keydown' | 'keyup', code: string): void => {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, cancelable: true }))
}
const pointer = (type: string, pointerType: string): void => {
  root.dispatchEvent(new PointerEvent(type, { pointerId: 1, pointerType, bubbles: true, cancelable: true }))
}
/** Delivers `n` frames, one display refresh apart. */
const run = (frames: ReturnType<typeof manualFrames>, n: number): void => {
  for (let i = 0; i < n; i++) frames.advance(FRAME)
}
const heroX = (game: NonNullable<Play['game']>): number => {
  const hero = game.sim.query(Player, Transform)[0]
  if (hero === undefined) throw new Error('no hero')
  return hero.get(Transform).x
}
const overlaps = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
const inside = (inner: DOMRect, outer: DOMRect): boolean =>
  inner.left >= outer.left - 0.5 &&
  inner.right <= outer.right + 0.5 &&
  inner.top >= outer.top - 0.5 &&
  inner.bottom <= outer.bottom + 0.5

test('play fills the root, starts the game and says so', async () => {
  const { play: made } = await begin()
  expect(made.state).toBe('playing')
  expect(root.dataset.state).toBe('playing')
  const canvas = root.querySelector('canvas')
  expect(canvas).not.toBeNull()
  const box = canvas?.getBoundingClientRect()
  expect(Math.round(box?.width ?? 0)).toBe(390)
  expect(Math.round(box?.height ?? 0)).toBe(844)
  expect(made.game?.sim.tick).toBe(0)
})

test('the words say who you are and how to move with keys', async () => {
  await begin({ coarse: false })
  expect(text('.play-goal')).toBe(WORDS.goal)
  expect(text('.play-how')).toBe(WORDS.keys)
})

test('on a touch screen the words name the buttons', async () => {
  await begin({ coarse: true })
  expect(text('.play-goal')).toBe(WORDS.goal)
  expect(text('.play-how')).toBe(WORDS.touch)
})

test('the first touch switches the words to the buttons, for good', async () => {
  await begin({ coarse: false })
  pointer('pointerdown', 'touch')
  expect(text('.play-how')).toBe(WORDS.touch)
  pointer('pointerdown', 'mouse')
  expect(text('.play-how')).toBe(WORDS.touch)
})

test('a mouse click does not switch the words', async () => {
  await begin({ coarse: false })
  pointer('pointerdown', 'mouse')
  expect(text('.play-how')).toBe(WORDS.keys)
})

test('holding the right arrow key moves the hero', async () => {
  const { play: made, frames } = await begin()
  const game = made.game
  if (game === undefined) throw new Error('the game did not start')
  const before = heroX(game)
  key('keydown', 'ArrowRight')
  frames.at(0) // the first frame only sets the clock
  run(frames, 60)
  key('keyup', 'ArrowRight')
  expect(game.sim.tick).toBe(60)
  expect(heroX(game)).toBeGreaterThan(before + 4)
})

test('the words stay inside a small phone and are big enough to read', async () => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [844, 390],
  ] as const) {
    root.style.width = `${width}px`
    root.style.height = `${height}px`
    await begin()
    const words = root.querySelector('.play-words')
    if (words === null) throw new Error('no words')
    expect(inside(words.getBoundingClientRect(), root.getBoundingClientRect()), `${width}x${height}`).toBe(
      true,
    )
    expect(Number.parseFloat(getComputedStyle(words).fontSize), `${width}x${height}`).toBeGreaterThanOrEqual(
      18,
    )
    running?.stop()
  }
})

test('the words never sit under a touch button', async () => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [844, 390],
  ] as const) {
    root.style.width = `${width}px`
    root.style.height = `${height}px`
    await begin()
    pointer('pointerdown', 'touch')
    const words = root.querySelector('.play-words')?.getBoundingClientRect()
    const buttons = [...root.querySelectorAll('button')]
    expect(buttons.map((button) => button.textContent)).toEqual(['Left', 'Right', 'Jump'])
    for (const button of buttons) {
      const box = button.getBoundingClientRect()
      expect(box.width, `${width}x${height}`).toBeGreaterThanOrEqual(48)
      expect(words !== undefined && overlaps(words, box), `${width}x${height} ${button.textContent}`).toBe(
        false,
      )
    }
    running?.stop()
  }
})

test('pushing the crate changes the words to say so', async () => {
  const { play: made, frames } = await begin({ files: { [LEVEL]: levelWithCrate() } })
  const game = made.game
  if (game === undefined) throw new Error('the game did not start')
  expect(text('.play-goal')).toBe(WORDS.goal)
  key('keydown', 'ArrowRight')
  frames.at(0)
  run(frames, 20)
  // Still walking towards the crate: nothing has been pushed yet.
  expect(text('.play-goal')).toBe(WORDS.goal)
  run(frames, 100)
  key('keyup', 'ArrowRight')
  expect(heroX(game)).toBeGreaterThan(14.5)
  expect(text('.play-goal')).toBe(WORDS.done)
  // And it stays said.
  run(frames, 30)
  expect(text('.play-goal')).toBe(WORDS.done)
})

test('a game that does not load shows every problem in order, and no canvas', async () => {
  const { play: made } = await begin({
    files: { [LEVEL]: '{ "format": 1,', 'content/characters/crate.json': undefined },
  })
  expect(made.state).toBe('problem')
  expect(made.game).toBeUndefined()
  expect(root.dataset.state).toBe('problem')
  expect(root.querySelector('canvas')).toBeNull()
  const alert = root.querySelector('[role="alert"]')
  expect(alert).not.toBeNull()
  expect(alert?.querySelector('h1')?.textContent).toBe(WORDS.problemTitle)
  expect([...(alert?.querySelectorAll('li') ?? [])].map((item) => item.textContent)).toEqual([
    'content/levels/level-1.json: This file is not valid JSON. Check for a missing comma, quote or bracket.',
    'content/characters/crate.json: This file is listed in automata.toml but is missing.',
  ])
  expect(alert?.querySelector('p')?.textContent).toBe(WORDS.problemFix)
})

test('a read that throws something odd is still a problem screen, not a rejection', async () => {
  for (const odd of ['x', undefined]) {
    const { play: made } = await begin({ read: () => Promise.reject(odd) })
    expect(made.state).toBe('problem')
    expect(made.game).toBeUndefined()
    expect(root.querySelector('[role="alert"]')).not.toBeNull()
    running?.stop()
  }
})

test('a game that cannot start says so, with the reason', async () => {
  const { play: made } = await begin({ start: () => Promise.reject(new Error('No WebGL')) })
  expect(made.state).toBe('problem')
  expect(made.game).toBeUndefined()
  const alert = root.querySelector('[role="alert"]')
  expect(alert?.querySelector('h1')?.textContent).toBe(WORDS.cannotStart)
  expect(alert?.querySelector('li')?.textContent).toBe('No WebGL')
  expect(alert?.querySelector('p')).toBeNull()
})

test('stop empties the root and can be called twice', async () => {
  const { play: made } = await begin()
  made.stop()
  expect(root.children).toHaveLength(0)
  expect(() => made.stop()).not.toThrow()
})

test('readFrom fetches beside its base and rejects when the file is not there', async () => {
  const read = readFrom(new URL('/', location.href))
  expect(await read('automata.toml')).toMatch(/^format = 1/)
  // The dev server answers an unknown path with the page itself (200), as a single-page host would, so the missing
  // file is a 404 made here: what this checks is what `readFrom` does with a refusal, not what a server does.
  vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 404 })))
  try {
    await expect(read('no-such-file.json')).rejects.toThrow('no-such-file.json')
  } finally {
    vi.unstubAllGlobals()
  }
})

test('readFrom calls a web page a missing file: a host that answers every path with its home page', async () => {
  // A single-page host (Cloudflare Pages with no 404.html is one) answers a missing path with its home page and a 200.
  // The game reads only TOML and JSON, so a page is never the file; the person should be told "no such file", not sent
  // looking for a comma that is not there.
  const read = readFrom(new URL('/', location.href))
  const answerWith = (body: string, type: string): void => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(new Response(body, { status: 200, headers: { 'content-type': type } })),
    )
  }
  try {
    for (const type of ['text/html', 'text/html; charset=utf-8', 'TEXT/HTML']) {
      answerWith('<!doctype html><html><body>Home</body></html>', type)
      await expect(read('content/characters/crate.json'), type).rejects.toThrow(
        'content/characters/crate.json: no such file',
      )
    }
    // JSON and plain text still read, whatever else the host says.
    for (const type of ['application/json', 'text/plain; charset=utf-8', 'application/toml']) {
      answerWith('{"format":1}', type)
      expect(await read('content/characters/crate.json'), type).toBe('{"format":1}')
    }
  } finally {
    vi.unstubAllGlobals()
  }
})

test('both entries of the framework share one Player', async () => {
  // A bundler that copied the shared code into each entry would make two of everything, and a hero made with one
  // would be invisible to the other.
  const [browser, headless] = await Promise.all([
    import('@automataframework/framework'),
    import('@automataframework/framework/headless'),
  ])
  expect(browser.Player).toBe(headless.Player)
})
