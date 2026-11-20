// The colours of the game's own art are the editors' to change (the Owner, 2026-11-14): a change that
// only touches content must pass CI, and an editor's recolour is one. So nothing here pins a colour on the real files.
// What it holds is the rule that matters, that the hero, the crate and the ground each stand clear of the sky behind
// them, and that the words never name a colour, so no recolour can make a word untrue. The journeys' own level, which an
// editor cannot reach, holds the sky and ground it wears (`pinned-level.test.ts`).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { artFiles, artProblems, formatDiagnostic } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { WORDS } from '#src/features/play/words.ts'
import { loadTheGame } from '../fixtures/game-files.ts'
import { messagesOf } from '../fixtures/words.ts'

const colourOf = (character: string): string => {
  const file = readFileSync(
    join(import.meta.dirname, '..', '..', 'content', 'characters', `${character}.json`),
    'utf8',
  )
  return (JSON.parse(file) as { color: string }).color
}

/** A colour's name in English; the words of the other five languages are checked for what a translator may leave in. */
const COLOUR_WORD = /\b(?:pink|green|yellow|red|blue|black|white|grey|gray|orange|purple|brown|colou?r)\b/i

test('the words, in every language, never name a colour', () => {
  for (const language of ['en', 'es', 'ko', 'ja', 'zh', 'pt'])
    for (const [key, words] of Object.entries(messagesOf(language)))
      expect(words, `${language} ${key}`).not.toMatch(COLOUR_WORD)
  for (const words of Object.values(WORDS)) expect(words, words).not.toMatch(COLOUR_WORD)
})

/** What the framework paints a level that sets no sky or ground (its own defaults), so an unset colour is still read. */
const DEFAULT_SKY = '#9fd3f0'
const DEFAULT_GROUND = '#3b4a5a'

const levelColours = (): { sky: string; ground: string } => {
  const file = readFileSync(
    join(import.meta.dirname, '..', '..', 'content', 'levels', 'level-1.json'),
    'utf8',
  )
  const { sky, ground } = JSON.parse(file) as { sky?: string; ground?: string }
  return { sky: sky ?? DEFAULT_SKY, ground: ground ?? DEFAULT_GROUND }
}

/** The WCAG relative luminance of `#rrggbb`. */
const luminance = (hex: string): number => {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const channel = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
/** The WCAG contrast ratio of two colours: 1 (the same) to 21 (black on white). */
const contrast = (a: string, b: string): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (light + 0.05) / (dark + 0.05)
}

test('the hero, the crate and the ground each stand clear of the sky: 3 to 1 at least', () => {
  const { sky, ground } = levelColours()
  for (const [name, colour] of [
    ['the hero', colourOf('hero')],
    ['the crate', colourOf('crate')],
    ['the ground', ground],
  ] as const)
    expect(contrast(colour, sky), `${name} on the sky`).toBeGreaterThanOrEqual(3)
})

/** The hero's figure, read from its file: the paints and the variants (player 2 wears the first). */
const heroFigure = (): {
  paints: { id: string; color: string }[]
  variants?: { id: string; paints: { id: string; color: string }[] }[]
} => {
  const hero = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', 'content', 'characters', 'hero.json'), 'utf8'),
  ) as { figure?: string }
  expect(hero.figure, 'the hero is drawn from a figure').toBeDefined()
  return JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', 'content', 'figures', `${hero.figure}.json`), 'utf8'),
  )
}

test('two heroes can be told apart: player 2 is lighter or darker than player 1, not only another hue, and clear of the sky', () => {
  const { sky } = levelColours()
  const figure = heroFigure()
  const one = figure.paints.find((paint) => paint.id === 'body')?.color ?? ''
  const two = figure.variants?.[0]?.paints.find((paint) => paint.id === 'body')?.color ?? ''
  expect(one, "player 1's hero is the hero's own colour").toBe(colourOf('hero'))
  expect(contrast(one, two), "player 1's hero beside player 2's").toBeGreaterThanOrEqual(1.5)
  expect(contrast(two, sky), "player 2's hero on the sky").toBeGreaterThanOrEqual(3)
})

test('the pictures the figures paint are in the game, as `automata art` paints them now', async () => {
  const content = await loadTheGame()
  expect(artFiles(content).length, 'the hero has a picture').toBeGreaterThan(0)
  const problems = await artProblems(content, async (path) => {
    try {
      return new Uint8Array(readFileSync(join(import.meta.dirname, '..', '..', path)))
    } catch {
      return undefined
    }
  })
  expect(problems.map(formatDiagnostic)).toEqual([])
})
