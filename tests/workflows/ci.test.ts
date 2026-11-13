import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

// The workflow only runs on GitHub, so these checks read its text.
const ci = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8')

test('the workflow as a whole can only read the repository', () => {
  expect(ci.slice(0, ci.indexOf('\njobs:'))).toMatch(/^permissions:\n {2}contents: read$/m)
})

test('every action is pinned to a commit', () => {
  const uses = ci.split('\n').filter((line) => line.includes('uses:'))
  expect(uses.length).toBeGreaterThan(0)
  for (const line of uses) expect(line, line).toMatch(/uses: \S+@[0-9a-f]{40}(\s|$)/)
})

test('the engines run in three browsers, and one failing does not stop the others', () => {
  expect(ci).toContain('engine: [chromium, webkit, firefox]')
  expect(ci).toContain('fail-fast: false')
})
