// The page's pieces in each real browser: real DOM, real key and pointer events, hand-driven frames. The test game
// (`tests/fixtures/test-game.ts`) is the one played, so no editor's change to the real level can break these.
import { Player, Transform, testHost } from '@automataframework/framework'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { type Play, type PlayOptions, play, readFrom, WORDS } from '#src/features/play/play.ts'
import { manualFrames } from '../../fixtures/frames.ts'
import { readTestGame } from '../../fixtures/test-game.ts'
import { filesWithGoal, LEVEL } from '../../fixtures/test-game-recording.ts'
import { KEYBOARD_WORDS, say } from '../../fixtures/words.ts'

const FRAME = 1000 / 60

let root: HTMLDivElement
let running: Play | undefined

/**
 * A host that is always on screen, so no test depends on the machine's own window, and whose player speaks English, so
 * the game starts at once. Each test makes its own: a host keeps what the player chose.
 */
const english = () => testHost({ language: 'en' })

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

async function begin(
  extra: { files?: Record<string, string | undefined>; coarse?: boolean } & Partial<PlayOptions> = {},
): Promise<{ play: Play; frames: ReturnType<typeof manualFrames> }> {
  const { files, coarse = false, ...rest } = extra
  const frames = manualFrames()
  running = await play({ root, read: readTestGame(files), host: english(), frames, coarse, ...rest })
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

/** The five colours of the look, as the browser reports a computed colour. */
const PAPER = 'rgb(17, 19, 20)'
const HATCH = 'rgb(34, 36, 37)'
const CHALK = 'rgb(182, 191, 193)'
const PENCIL = 'rgb(141, 148, 150)'
const MARKER = 'rgb(241, 90, 48)'

/**
 * Whether a face of this family and weight has really been fetched. Never `document.fonts.check`: by its rules it is
 * also `true` when no face of that name was declared at all, so it would pass with the import lost and the system font
 * on screen.
 */
const fontLoaded = (family: string, weight: string): boolean =>
  [...document.fonts].some(
    (face) =>
      face.family.replace(/["']/g, '') === family && face.weight === weight && face.status === 'loaded',
  )

/** Draws with the font once, so its file has been asked for and arrived before a test looks at the words. */
const labelFontReady = async (): Promise<void> => {
  await document.fonts.load("600 18px 'Fredoka'")
}

/** The WCAG contrast ratio of two computed `rgb()` colours. */
function contrast(a: string, b: string): number {
  const light = (colour: string): number => {
    const [r = 0, g = 0, bl = 0] = (colour.match(/\d+/g) ?? []).map((n) => {
      const c = Number(n) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [light(a), light(b)].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

/** The first family of an element's font, without quotes: WebKit writes `Fredoka`, the others quote it. */
const firstFamily = (element: Element): string =>
  (getComputedStyle(element).fontFamily.split(',')[0] ?? '').replace(/["']/g, '').trim()

/** A touch landing on, or lifting from, one element. */
const touchOn = (target: Element, type: 'pointerdown' | 'pointerup'): void => {
  target.dispatchEvent(
    new PointerEvent(type, { pointerId: 7, pointerType: 'touch', bubbles: true, cancelable: true }),
  )
}

/**
 * A touch brings the framework's buttons up (this file says "no touch screen", so they start hidden). They are on the
 * stage; the strip's people button is the page's own.
 */
const touchButtons = (): HTMLButtonElement[] => {
  pointer('pointerdown', 'touch')
  return [...root.querySelectorAll<HTMLButtonElement>('.play-stage button')]
}

/** One of the two thumbs' halves of the screen: the one that walks, or the one that jumps. */
const half = (name: 'walk' | 'jump'): HTMLElement => {
  const found = root.querySelector<HTMLElement>(`.automata-thumb-half[data-half="${name}"]`)
  if (found === null) throw new Error(`no ${name} half`)
  return found
}
/** A finger on a half: it lands, moves or lifts at (`x`, `y`) of the page. */
const finger = (
  target: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  x = 100,
  y = 700,
): void => {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 7,
      pointerType: 'touch',
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    }),
  )
}
const background = (selector: string): string => {
  const found = root.querySelector(selector)
  if (found === null) throw new Error(`no ${selector}`)
  return getComputedStyle(found).backgroundColor
}

test('play fills the root (the words, then the game under them), starts the game and says so', async () => {
  const { play: made } = await begin()
  expect(made.state).toBe('playing')
  expect(root.dataset.state).toBe('playing')
  const canvas = root.querySelector('canvas')
  expect(canvas).not.toBeNull()
  const box = canvas?.getBoundingClientRect()
  const words = root.querySelector('.play-words')?.getBoundingClientRect()
  expect(Math.round(box?.width ?? 0)).toBe(390)
  expect(Math.round(box?.bottom ?? 0)).toBe(844)
  expect(box?.top ?? 0).toBeGreaterThanOrEqual((words?.bottom ?? 0) - 0.5)
  expect(made.game?.sim.tick).toBe(0)
})

test('the words say who you are and how to move with keys', async () => {
  await begin({ coarse: false })
  expect(text('.play-goal')).toBe(say('level.level-1.goal'))
  expect(text('.play-how')).toBe(KEYBOARD_WORDS)
})

test('on a touch screen the strip says the goal and no more: the thumbs carry their own hints', async () => {
  await begin({ coarse: true })
  expect(text('.play-goal')).toBe(say('level.level-1.goal'))
  expect(text('.play-how')).toBe('')
  expect(root.querySelector<HTMLElement>('.play-how')?.hidden).toBe(true)
})

test('using a thumb takes the key words away, and a key brings them back', async () => {
  const { frames } = await begin({ coarse: false })
  expect(text('.play-how')).toBe(KEYBOARD_WORDS)
  pointer('pointerdown', 'touch')
  frames.at(0) // the first frame only sets the clock
  finger(half('jump'), 'pointerdown')
  run(frames, 2)
  expect(text('.play-how')).toBe('')
  finger(half('jump'), 'pointerup')
  key('keydown', 'ArrowRight')
  run(frames, 2)
  key('keyup', 'ArrowRight')
  expect(text('.play-how')).toBe(KEYBOARD_WORDS)
})

test('a mouse click does not change the words', async () => {
  await begin({ coarse: false })
  pointer('pointerdown', 'mouse')
  expect(text('.play-how')).toBe(KEYBOARD_WORDS)
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

test('the words sit above the game, never on the level', async () => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [844, 390],
  ] as const) {
    root.style.width = `${width}px`
    root.style.height = `${height}px`
    await begin()
    const words = root.querySelector('.play-words')?.getBoundingClientRect()
    const stage = root.querySelector('.play-stage')?.getBoundingClientRect()
    if (words === undefined || stage === undefined) throw new Error('no words or no stage')
    const label = `${width}x${height}`
    expect(stage.top, label).toBeGreaterThanOrEqual(words.bottom - 0.5)
    expect(stage.bottom, label).toBeCloseTo(root.getBoundingClientRect().bottom, 0)
    expect(stage.width, label).toBeCloseTo(width, 0)
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
    const buttons = [...root.querySelectorAll('.play-stage button')]
    expect(buttons.map((button) => button.textContent)).toEqual([say('controls.dash')])
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

test('reaching the goal changes the words to say so', async () => {
  const { play: made, frames } = await begin({ files: filesWithGoal() })
  const game = made.game
  if (game === undefined) throw new Error('the game did not start')
  expect(text('.play-goal')).toBe(say('level.level-1.goal'))
  key('keydown', 'ArrowRight')
  frames.at(0)
  run(frames, 20)
  // Still walking towards the goal: nothing has been reached yet.
  expect(text('.play-goal')).toBe(say('level.level-1.goal'))
  run(frames, 100)
  key('keyup', 'ArrowRight')
  expect(heroX(game)).toBeGreaterThan(14.5)
  expect(text('.play-goal')).toBe(say('goal.done'))
  // And it stays said.
  run(frames, 30)
  expect(text('.play-goal')).toBe(say('goal.done'))
})

test('the words are chalk on black paper, in the one font', async () => {
  await begin()
  await labelFontReady()
  const words = root.querySelector('.play-words')
  const goal = root.querySelector('.play-goal')
  const how = root.querySelector('.play-how')
  if (words === null || goal === null || how === null) throw new Error('no words')
  expect(getComputedStyle(words).backgroundColor).toBe(PAPER)
  expect(getComputedStyle(goal).color).toBe(CHALK)
  expect(getComputedStyle(how).color).toBe(PENCIL)
  expect(firstFamily(goal)).toBe('Fredoka')
  expect(fontLoaded('Fredoka', '600')).toBe(true)
  expect(getComputedStyle(goal).textTransform).toBe('none')
  // Fredoka has no Korean or Chinese, and a faked bold would blur the partner fonts those will use later.
  expect(getComputedStyle(goal).fontSynthesisWeight).toBe('none')
})

test('every word can be read: each text and its ground reach 4.5 to 1', () => {
  for (const [text, ground] of [
    [CHALK, PAPER],
    [PENCIL, PAPER],
    [MARKER, PAPER],
    [PAPER, MARKER],
    [CHALK, HATCH],
    // The file's name on a problem's panel: the closest pair to the line (5.05 to 1).
    [PENCIL, HATCH],
  ] as const)
    expect(contrast(text, ground), `${text} on ${ground}`).toBeGreaterThanOrEqual(4.5)
})

test('a touch button is a paper chip with a chalk edge', async () => {
  await begin()
  const buttons = touchButtons()
  expect(buttons.map((b) => b.textContent)).toEqual([say('controls.dash')])
  for (const b of buttons) {
    const style = getComputedStyle(b)
    expect(style.backgroundColor, b.textContent ?? '').toBe(PAPER)
    expect(style.borderTopWidth).toBe('1px')
    expect(style.borderTopColor).toBe(CHALK)
    expect(style.borderTopLeftRadius).toBe('2px')
    expect(style.color).toBe(CHALK)
    expect(style.textTransform).toBe('uppercase')
    // The label is as big as the words: nothing on the screen is set smaller than 18 pixels.
    expect(Number.parseFloat(style.fontSize), b.textContent ?? '').toBeGreaterThanOrEqual(18)
    expect((style.fontFamily.split(',')[0] ?? '').replace(/["']/g, '').trim()).toBe('Fredoka')
    expect(style.transitionDuration).toBe('0s')
    expect(b.offsetWidth).toBeGreaterThanOrEqual(64)
    expect(b.offsetHeight).toBeGreaterThanOrEqual(64)
  }
})

test('a held button turns peach red with paper words', async () => {
  await begin()
  const [dash] = touchButtons()
  if (dash === undefined) throw new Error('no Dash button')
  touchOn(dash, 'pointerdown')
  expect(getComputedStyle(dash).backgroundColor).toBe(MARKER)
  expect(getComputedStyle(dash).color).toBe(PAPER)
  touchOn(dash, 'pointerup')
  expect(getComputedStyle(dash).backgroundColor).toBe(PAPER)
  expect(getComputedStyle(dash).color).toBe(CHALK)
})

test('the ring, the knob and the arrow of the thumbs are chalk at rest and peach red while held', async () => {
  await begin()
  pointer('pointerdown', 'touch')
  // Nothing is drawn under a thumb that has not landed.
  expect(getComputedStyle(root.querySelector('.automata-thumb-ring') ?? root).display).toBe('none')
  expect(getComputedStyle(root.querySelector('.automata-thumb-arrow') ?? root).display).toBe('none')
  // A thumb lands on the walking half: the ring is paper with a chalk edge and a chalk knob, until the thumb slides.
  finger(half('walk'), 'pointerdown', 100, 700)
  expect(getComputedStyle(root.querySelector('.automata-thumb-ring') ?? root).display).toBe('block')
  expect(background('.automata-thumb-ring')).toBe(PAPER)
  expect(background('.automata-thumb-knob')).toBe(CHALK)
  finger(half('walk'), 'pointermove', 140, 700)
  expect(background('.automata-thumb-ring')).toBe(MARKER)
  expect(background('.automata-thumb-knob')).toBe(PAPER)
  finger(half('walk'), 'pointerup', 140, 700)
  // A thumb on the jumping half: the arrow shows, peach red.
  finger(half('jump'), 'pointerdown', 300, 700)
  expect(getComputedStyle(root.querySelector('.automata-thumb-arrow') ?? root).display).toBe('block')
  expect(background('.automata-thumb-arrow')).toBe(MARKER)
  finger(half('jump'), 'pointerup', 300, 700)
  expect(getComputedStyle(root.querySelector('.automata-thumb-arrow') ?? root).display).toBe('none')
})

test('every button has its picture above its word', async () => {
  await begin()
  for (const b of touchButtons()) {
    const picture = getComputedStyle(b, '::before')
    expect(picture.width, b.textContent ?? '').toBe('28px')
    expect(picture.display).toBe('block')
    const mask = picture.maskImage || picture.getPropertyValue('-webkit-mask-image')
    expect(mask, b.textContent ?? '').not.toBe('none')
    expect(mask).not.toBe('')
  }
})

test("the keyboard's place on a button is ringed in chalk", async () => {
  await begin()
  const [first] = touchButtons()
  if (first === undefined) throw new Error('no buttons')
  first.focus({ focusVisible: true })
  // A browser that ignores that option needs a real key press to say "the keyboard is here".
  for (let tries = 0; tries < 6 && !(document.activeElement?.matches(':focus-visible') ?? false); tries++)
    await userEvent.keyboard('{Tab}')
  const focused = document.activeElement
  if (!(focused instanceof HTMLButtonElement) || !focused.matches(':focus-visible'))
    throw new Error('the keyboard did not reach a button')
  const style = getComputedStyle(focused)
  expect(style.outlineColor).toBe(CHALK)
  expect(style.outlineWidth).toBe('3px')
  expect(style.outlineStyle).toBe('solid')
  expect(style.outlineOffset).toBe('2px')
})

test('reaching the goal marks the words as done', async () => {
  const { play: made, frames } = await begin({ files: filesWithGoal() })
  if (made.game === undefined) throw new Error('the game did not start')
  expect(root.querySelector('.play-goal')?.classList.contains('play-done')).toBe(false)
  key('keydown', 'ArrowRight')
  frames.at(0)
  run(frames, 120)
  key('keyup', 'ArrowRight')
  expect(text('.play-goal')).toBe(say('goal.done'))
  expect(root.querySelector('.play-goal')?.classList.contains('play-done')).toBe(true)
})

test('the problem screen is the same paper, with each problem on its own panel', async () => {
  root.style.width = '390px'
  await begin({
    files: {
      [LEVEL]: '{ "format": 1,',
      'content/characters/crate.json': undefined,
    },
  })
  const screen = root.querySelector<HTMLElement>('.play-problem')
  if (screen === null) throw new Error('no problem screen')
  expect(getComputedStyle(screen).backgroundColor).toBe(PAPER)
  expect(getComputedStyle(screen).color).toBe(CHALK)
  const items = [...screen.querySelectorAll('li')]
  expect(items).toHaveLength(2)
  for (const item of items) {
    expect(getComputedStyle(item).backgroundColor).toBe(HATCH)
    expect(getComputedStyle(item).borderTopWidth).toBe('1px')
  }
})

test('a long file name does not push the problem screen wider than the screen', async () => {
  root.style.width = '390px'
  const longName = `content/levels/${'a'.repeat(120)}.json`
  await begin({ read: () => Promise.reject(new Error(longName)) })
  const screen = root.querySelector<HTMLElement>('.play-problem')
  if (screen === null) throw new Error('no problem screen')
  expect(screen.scrollWidth).toBeLessThanOrEqual(screen.clientWidth)
})

test('a problem says where and what, both in the one font and both 18 pixels or more', async () => {
  await begin({
    files: { [LEVEL]: '{ "format": 1,', 'content/characters/crate.json': undefined },
  })
  await labelFontReady()
  const items = [...root.querySelectorAll('.play-problem li')]
  expect(items).toHaveLength(2)
  for (const item of items) {
    const where = item.querySelector('.play-where')
    const what = item.querySelector('.play-what')
    if (where === null || what === null) throw new Error(`no two parts in "${item.textContent}"`)
    expect(firstFamily(where)).toBe('Fredoka')
    expect(getComputedStyle(where).color).toBe(PENCIL)
    expect(getComputedStyle(where).fontSize).toBe('18px')
    expect(firstFamily(what)).toBe('Fredoka')
    expect(getComputedStyle(what).color).toBe(CHALK)
    expect(getComputedStyle(what).fontSize).toBe('18px')
    expect(getComputedStyle(where).display).toBe('inline')
    expect(getComputedStyle(what).display).toBe('inline')
  }
  // The words of a line are exactly what `formatDiagnostic` gives, so everything that reads them is unchanged.
  expect(items.map((item) => item.textContent)).toEqual([
    'content/levels/level-1.json: This file is not valid JSON. Check for a missing comma, quote or bracket.',
    'content/characters/crate.json: This file is listed in automata.toml but is missing.',
  ])
  expect(fontLoaded('Fredoka', '600')).toBe(true)
})

test('a game that cannot start has one plain line and no place', async () => {
  await begin({ start: () => Promise.reject(new Error('No WebGL')) })
  const items = [...root.querySelectorAll('.play-problem li')]
  expect(items).toHaveLength(1)
  expect(items[0]?.querySelector('.play-where')).toBeNull()
  expect(items[0]?.textContent).toBe('No WebGL')
  expect(items[0]?.querySelector('.play-what')?.textContent).toBe('No WebGL')
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
