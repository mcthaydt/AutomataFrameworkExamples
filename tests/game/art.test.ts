// The colours of the game's own art: palette No. 276 of *A Dictionary of Color Combinations* (the Owner, 2026-11-14),
// and the words that name them. A box the page calls "green" must be green, so the colours and the words are checked
// together. (The sky and the ground are the framework's own colours until it lets a level set them.)
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
