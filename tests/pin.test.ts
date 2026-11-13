import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

// The framework is pinned to a commit on its `main` until Release 1. Moving the pin is its own pull request and
// changes the dependency, the matching `onlyBuiltDependencies` line (pnpm builds a git dependency only when that
// line allows it) and the lockfile.
interface Manifest {
  readonly dependencies: Readonly<Record<string, string>>
  readonly pnpm: { readonly onlyBuiltDependencies: readonly string[] }
}
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as Manifest
const dependency = manifest.dependencies['@automataframework/framework'] ?? ''
const sha = /#([0-9a-f]{40})$/.exec(dependency)?.[1] ?? ''

test('the framework is pinned to a commit, never a branch', () =>
  expect(dependency).toMatch(/^github:mcthaydt\/AutomataFramework#[0-9a-f]{40}$/))

test('the commit allowed to build is the commit that is pinned', () =>
  expect(manifest.pnpm.onlyBuiltDependencies).toEqual([
    `@automataframework/framework@https://codeload.github.com/mcthaydt/AutomataFramework/tar.gz/${sha}`,
  ]))

test('the game depends on nothing but the framework', () =>
  expect(Object.keys(manifest.dependencies)).toEqual(['@automataframework/framework']))
