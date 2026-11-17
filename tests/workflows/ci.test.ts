import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

// The workflow only runs on GitHub, so these checks read its text.
const ci = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8')
const jobs = ci.slice(ci.indexOf('\njobs:'))

test('the workflow as a whole can only read the repository', () => {
  expect(ci.slice(0, ci.indexOf('\njobs:'))).toMatch(/^permissions:\n {2}contents: read$/m)
})

test('every action is pinned to a commit', () => {
  const uses = ci.split('\n').filter((line) => line.includes('uses:'))
  expect(uses.length).toBeGreaterThan(0)
  for (const line of uses) expect(line, line).toMatch(/uses: \S+@[0-9a-f]{40}(\s|$)/)
})

test('a full run is three browsers, a draft is Chromium only, and one failing does not stop the others', () => {
  expect(ci).toContain(`engines='["chromium","webkit","firefox"]'`)
  expect(ci).toContain(`full=false engines='["chromium"]'`)
  expect(ci).toContain(`engine: \${{ fromJSON(needs.plan.outputs.engines) }}`)
  expect(ci).toContain('fail-fast: false')
})

test('every browser is six shards, and the `engines` gate counts the same six', () => {
  const browsers = jobs.slice(jobs.indexOf('\n  browsers:'), jobs.indexOf('\n  engines:'))
  expect(browsers).toContain(`name: browsers (\${{ matrix.engine }} \${{ matrix.shard }}/6)`)
  expect(browsers).toContain('shard: [1, 2, 3, 4, 5, 6]')
  expect(browsers).toContain(`--shard=\${{ matrix.shard }}/6`)
  const engines = jobs.slice(jobs.indexOf('\n  engines:'))
  expect(engines).toContain('run: node scripts/engines-gate.ts')
  const gate = readFileSync(new URL('../../scripts/engines-gate.ts', import.meta.url), 'utf8')
  expect(gate).toContain('export const SHARDS = 6')
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
  const steps = ['pnpm same-hash node ', 'pnpm build\n', 'pnpm test:journeys ']
  const at = steps.map((step) => ci.indexOf(`- run: ${step}`))
  expect(at.every((position) => position > 0)).toBe(true)
  expect(at).toEqual([...at].sort((a, b) => a - b))
  expect(ci).toMatch(/pnpm test:journeys .*\n.*\n\s+env:\n\s+ENGINE: \$\{\{ matrix\.engine \}\}/)
})

// CI's pictures are kept only as artifacts of each run (the Owner, 2026-11-15: no ci-screens branch here).
test('no job may write to the repository, and nothing pushes a branch', () => {
  expect(jobs).not.toContain('contents: write')
  expect(jobs).not.toContain('git push')
  expect(jobs).not.toContain('\n  screens:')
})
