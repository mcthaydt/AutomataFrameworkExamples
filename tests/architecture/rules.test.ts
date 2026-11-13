import { expect, test } from 'vitest'
import { checkArchitecture, type SourceFiles } from './rules.ts'

// Each made-up file map breaks exactly one rule. Each names the feature's entry file as the offender, so
// `feature-has-entry` does not also fire.
const one = (files: SourceFiles): string[] => checkArchitecture(files).map((v) => v.rule)

test('a feature may not import a feature above it', () =>
  expect(one({ 'src/features/hero/hero.ts': "import '../play/play.ts'" })).toEqual(['imports-go-down']))

test('another feature is imported through its entry file', () =>
  expect(one({ 'src/features/plugins/plugins.ts': "import '../hero/move.ts'" })).toEqual([
    'through-the-entry',
  ]))

test('lib imports no feature', () =>
  expect(one({ 'src/lib/a.ts': "import '../features/hero/hero.ts'" })).toEqual(['lib-is-below-features']))

test('no cycles', () =>
  expect(one({ 'src/lib/a.ts': "import './b.ts'", 'src/lib/b.ts': "import './a.ts'" })).toEqual([
    'no-cycles',
  ]))

test('no tests in src', () => expect(one({ 'src/lib/a.test.ts': '' })).toEqual(['no-tests-in-src']))

test('the sim side has no clock, randomness or I/O', () =>
  expect(one({ 'src/features/hero/hero.ts': 'const t = Date.now()' })).toEqual(['sim-is-pure']))

test('the game uses only the framework, by its two entries', () => {
  expect(one({ 'src/features/play/play.ts': "import { Application } from 'pixi.js'" })).toEqual([
    'only-the-framework',
  ])
  expect(one({ 'src/features/play/play.ts': "import '@automataframework/framework/dist/index.js'" })).toEqual(
    ['only-the-framework'],
  )
  expect(one({ 'src/features/play/play.ts': "import '@automataframework/framework'" })).toEqual([])
})

test('the sim side imports only the headless entry', () =>
  expect(one({ 'src/features/hero/hero.ts': "import '@automataframework/framework'" })).toEqual([
    'sim-side-is-headless',
  ]))

test('a file has at most 600 lines', () =>
  expect(one({ 'src/lib/a.ts': 'x\n'.repeat(601) })).toEqual(['at-most-600-lines']))

test('a feature folder has its entry file', () =>
  expect(one({ 'src/features/hero/move.ts': '' })).toEqual(['feature-has-entry']))

test('headless reaches nothing that needs a page', () =>
  expect(one({ 'src/headless.ts': "export * from './features/play/play.ts'" })).toEqual([
    'headless-is-headless',
  ]))
