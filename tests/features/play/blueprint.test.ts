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

test('nothing is fetched from another site or carried as data', () => {
  for (const text of [blueprint, rules]) expect(text).not.toMatch(/https?:|data:/)
  expect(page.replace('href="data:,"', '')).not.toMatch(/https?:|data:/)
})
