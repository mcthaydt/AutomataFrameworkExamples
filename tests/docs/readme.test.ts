import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

// The README is the first thing a developer reads. It has to get a stranger from clone to a changed game, so these
// checks read it for the steps, the scripts and the files it names.
const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')
const manifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
  scripts: Record<string, string>
}

test('it names every script a person runs, and each one exists', () => {
  for (const script of ['dev', 'build', 'content:write', 'lint', 'typecheck']) {
    expect(manifest.scripts, script).toHaveProperty([script])
    expect(readme, script).toContain(`pnpm ${script}`)
  }
})

test('it names the game, its content and the recording', () => {
  for (const path of ['automata.toml', 'content/', 'replays/level-1.json', 'content/levels/level-1.json']) {
    expect(readme, path).toContain(path)
  }
})

test('it starts with what to install, then how to play, then a first change', () => {
  // Node 25 and later no longer ship Corepack, so the first command a stranger types installs it.
  const at = ['npm install --global corepack', 'corepack enable', 'pnpm dev', 'first change'].map((words) =>
    readme.indexOf(words),
  )
  expect(at.every((position) => position >= 0)).toBe(true)
  expect(at).toEqual([...at].sort((a, b) => a - b))
})

test('it does not send anyone to npm for a package that is not there yet', () => {
  expect(readme).not.toContain('npm install @automataframework')
})
