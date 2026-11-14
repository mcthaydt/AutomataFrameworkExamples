// The colours of the game's own art: palette No. 276 of *A Dictionary of Color Combinations* (the Owner, 2026-11-14),
// and the words that name them. A box the page calls "green" must be green, so the colours and the words are checked
// together. The level's sky and ground are palette No. 276's Black and Seashell Pink, chosen so that both boxes stand
// clear of the sky behind them (the Owner asked that nothing in the art be hard to make out).
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

test('the hero is Eosine Pink and the crate is Yellow Green, from palette No. 276', () => {
  expect(colourOf('hero')).toBe('#f37f94')
  expect(colourOf('crate')).toBe('#afd472')
})

test('the words call the boxes by the colours they are', () => {
  expect(WORDS.goal).toBe('You are the pink box. Push the green box.')
  expect(WORDS.done).toBe('You pushed the green box. Well done!')
})

const levelColours = (): { sky: string; ground: string } => {
  const file = readFileSync(
    join(import.meta.dirname, '..', '..', 'content', 'levels', 'level-1.json'),
    'utf8',
  )
  return JSON.parse(file) as { sky: string; ground: string }
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

test('the level is drawn on a Black sky with a Seashell Pink ground, from palette No. 276', () => {
  expect(levelColours()).toEqual({ sky: '#111314', ground: '#fdd4bd' })
})

test('the hero, the crate and the ground each stand clear of the sky: 3 to 1 at least', () => {
  const { sky, ground } = levelColours()
  for (const [name, colour] of [
    ['the hero', colourOf('hero')],
    ['the crate', colourOf('crate')],
    ['the ground', ground],
  ] as const)
    expect(contrast(colour, sky), `${name} on the sky`).toBeGreaterThanOrEqual(3)
})
