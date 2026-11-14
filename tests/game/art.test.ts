// The colours of the game's own art are the editors' to change (the Owner, 2026-11-14): `CLAUDE.md` says a change that
// only touches content must pass CI, and an editor's recolour is one. So nothing here pins a colour on the real files.
// What it holds is the rule that matters, that the hero, the crate and the ground each stand clear of the sky behind
// them, and that the words never name a colour, so no recolour can make a word untrue. The journeys' own level, which an
// editor cannot reach, holds the sky and ground it wears (`pinned-level.test.ts`).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { WORDS } from '#src/features/play/words.ts'

const colourOf = (character: string): string => {
  const file = readFileSync(
    join(import.meta.dirname, '..', '..', 'content', 'characters', `${character}.json`),
    'utf8',
  )
  return (JSON.parse(file) as { color: string }).color
}

test("the words are the Owner's, and none of them names a colour", () => {
  expect(WORDS.goal).toBe('You are the box on the left. Push the other box.')
  expect(WORDS.done).toBe('You pushed the box. Well done!')
  for (const words of Object.values(WORDS))
    expect(words, words).not.toMatch(
      /\b(?:pink|green|yellow|red|blue|black|white|grey|gray|orange|purple|brown|colou?r)\b/i,
    )
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
