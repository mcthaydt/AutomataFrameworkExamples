// The address decides whether the page watches or plays, and where the recording it watches is kept.
import { expect, test } from 'vitest'
import { modeOf, recordingPath } from '#src/features/play/mode.ts'

test('no watch in the address means play', () => {
  expect(modeOf('')).toBe('play')
  expect(modeOf('?x=1')).toBe('play')
  expect(modeOf('?watching=1')).toBe('play')
})

test('a watch key means watch, whatever its value', () => {
  expect(modeOf('?watch')).toBe('watch')
  expect(modeOf('?watch=1')).toBe('watch')
  expect(modeOf('?a=b&watch')).toBe('watch')
})

test('the recording is replays/<the first level>.json', () => {
  expect(recordingPath('level-1')).toBe('replays/level-1.json')
})
