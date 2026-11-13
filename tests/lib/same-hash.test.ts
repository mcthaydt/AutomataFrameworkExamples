import { expect, test } from 'vitest'
import { describeDifference } from '#src/lib/same-hash.ts'

const run = (engine: string, finalHash: string, hashes: string[]) => ({
  engine,
  finalHash,
  checks: hashes.map((hash, i) => ({ tick: (i + 1) * 60, hash })),
})

test('engines that agree', () =>
  expect(describeDifference([run('node', 'f', ['a', 'b']), run('webkit', 'f', ['a', 'b'])])).toBeUndefined())

test('the first tick where two engines part is named', () =>
  expect(describeDifference([run('node', 'f', ['a', 'b']), run('webkit', 'g', ['a', 'c'])])).toBe(
    'node and webkit disagree from tick 120: node has b, webkit has c. The same play must come out the same in every engine.',
  ))

test('only the end differs', () =>
  expect(describeDifference([run('node', 'f', ['a']), run('firefox', 'g', ['a'])])).toBe(
    'node and firefox agree at every check but end differently: node on f, firefox on g. The same play must come out the same in every engine.',
  ))

test('a different number of checks is a difference', () =>
  expect(describeDifference([run('node', 'f', ['a', 'b']), run('chromium', 'f', ['a'])])).toBe(
    'node took 2 check hashes and chromium took 1. They did not play the same recording.',
  ))

test('one engine is not a comparison', () =>
  expect(describeDifference([run('node', 'f', [])])).toBe(
    'Only node reported its hashes. The check needs at least two engines.',
  ))

test('none is not a comparison', () => expect(describeDifference([])).toBe('No engine reported its hashes.'))

test('with three engines the first pair that differs is named', () =>
  expect(
    describeDifference([run('node', 'f', ['a']), run('chromium', 'f', ['a']), run('webkit', 'g', ['b'])]),
  ).toBe(
    'node and webkit disagree from tick 60: node has a, webkit has b. The same play must come out the same in every engine.',
  ))
