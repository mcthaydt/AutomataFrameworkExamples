// The look's files, read as text: the five colours live in one file and nowhere else, and nothing is fetched from
// another site. (How the look draws is checked in the browser, in `play.browser.test.ts`.)
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8')
const blueprint = read('../../../src/features/play/blueprint.css')
const rules = read('../../../src/features/play/play.css')
const page = read('../../../index.html')

test("the five colours are the spec's", () => {
  for (const token of [
    '--paper: #0a1f3c',
    '--hatch: #0e2a50',
    '--chalk: #eaf2fa',
    '--pencil: #8fb0d3',
    '--marker: #ffd447',
  ])
    expect(blueprint.toLowerCase()).toContain(token)
})

test('no colour is written anywhere but the token file', () => {
  expect(rules).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  expect(rules).not.toMatch(/\b(?:rgba?|hsla?)\(/i)
  // The page itself needs one colour before any stylesheet loads: the paper (as the background and as the browser's bar).
  expect(page.match(/#[0-9a-f]{3,8}\b/gi)).toEqual(['#0A1F3C', '#0A1F3C'])
  // A colour's name (`white`) would slip past the two checks above, so every colour-bearing value must be a token.
  const colourProperty =
    /^\s*(color|background(?:-color)?|border(?:-(?:top|bottom|left|right))?(?:-color)?|outline(?:-color)?)\s*:\s*([^;]+);/gm
  const values = [...rules.matchAll(colourProperty)].map((m) => `${m[1]}: ${m[2]}`)
  expect(values.length).toBeGreaterThan(0)
  for (const value of values) expect(value).toMatch(/var\(|:\s*(none|transparent|currentColor|inherit)\s*$/)
})

test('nothing is fetched from another site or carried as data', () => {
  for (const text of [blueprint, rules]) expect(text).not.toMatch(/https?:|data:/)
  expect(page.replace('href="data:,"', '')).not.toMatch(/https?:|data:/)
})
