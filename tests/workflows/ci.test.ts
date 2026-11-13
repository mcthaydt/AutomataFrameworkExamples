import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

// The workflow only runs on GitHub, so these checks read its text.
const ci = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8')
const jobs = ci.slice(ci.indexOf('\njobs:'))
const screens = jobs.slice(jobs.indexOf('\n  screens:'))

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

test('each engine plays the recording in Node too and is compared with it, in that order', () => {
  const steps = [
    `pnpm test:engine \${{ matrix.engine }}`,
    'pnpm vitest run --project node tests/replay',
    `pnpm same-hash node \${{ matrix.engine }}`,
  ]
  const at = steps.map((step) => ci.indexOf(`- run: ${step}\n`))
  expect(at.every((position) => position > 0)).toBe(true)
  expect(at).toEqual([...at].sort((a, b) => a - b))
})

test('each engine builds the page and runs the journeys in its own browser, after the hashes are compared', () => {
  const steps = ['pnpm same-hash node ', 'pnpm build\n', 'pnpm test:journeys\n']
  const at = steps.map((step) => ci.indexOf(`- run: ${step}`))
  expect(at.every((position) => position > 0)).toBe(true)
  expect(at).toEqual([...at].sort((a, b) => a - b))
  expect(ci).toMatch(/pnpm test:journeys\n\s+env:\n\s+ENGINE: \$\{\{ matrix\.engine \}\}/)
})

// CI's pictures are copied to the `ci-screens` branch so a cloud session, which cannot reach the artifact store, can
// read them through the GitHub API.
test('only the screens job may write, and only after the engines made the pictures', () => {
  expect(jobs.match(/contents: write/g)).toHaveLength(1)
  expect(screens).toMatch(/^ {6}contents: write$/m)
  expect(screens).toContain('needs: engines')
  expect(screens).toContain('if: always() &&')
})

test('pull requests from forks never get to write', () => {
  expect(screens).toContain('github.event.pull_request.head.repo.full_name == github.repository')
})

test('the pictures go only to the ci-screens branch, one writer at a time', () => {
  expect(screens).toContain('git push -q origin ci-screens')
  expect(screens.match(/git push/g)).toHaveLength(1)
  expect(screens).toMatch(/group: ci-screens\n {6}cancel-in-progress: false/)
})
