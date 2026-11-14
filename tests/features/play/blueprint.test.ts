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
    '--paper: #111314',
    '--hatch: #222425',
    '--chalk: #b6bfc1',
    '--pencil: #8d9496',
    '--marker: #f15a30',
  ])
    expect(blueprint.toLowerCase()).toContain(token)
})

test('no colour is written anywhere but the token file', () => {
  expect(rules).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  expect(rules).not.toMatch(/\b(?:rgba?|hsla?)\(/i)
  // The page itself needs one colour before any stylesheet loads: the paper (as the background and as the browser's bar).
  expect(page.match(/#[0-9a-f]{3,8}\b/gi)).toEqual(['#111314', '#111314'])
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

// One font, Fredoka (the Owner, 2026-11-14), set at a size a person can read on a phone. Its Korean and Chinese partners
// join with the first translation, so the stack names only Fredoka and the system fonts for now.
test('the one font is Fredoka and nothing is set smaller than 18 pixels', () => {
  expect(blueprint).toContain('@fontsource/fredoka/latin-600.css')
  expect(blueprint).toMatch(/--label:\s*"Fredoka",/)
  expect(blueprint).not.toMatch(/ibm-plex|jetbrains|--measure/i)
  expect(rules).not.toMatch(/--measure/)
  // The browser must not fake a weight Fredoka was not asked for.
  expect(rules).toMatch(/font-synthesis:\s*none/)
  const sizes = [...rules.matchAll(/font(?:-size)?:[^;]*?(\d+)px/g)].map((m) => Number(m[1]))
  expect(sizes.length).toBeGreaterThan(0)
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(18)
})
