// The game's own files at the repo's root. They are read with `node:fs` (not the glob the other tests use), so a file
// the glob would miss is still found.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  type ContentType,
  formatDiagnostic,
  loadGame,
  PROJECT_FILE,
  parseContent,
  parseProject,
  writeContent,
} from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { gameFiles, loadTheGame, readGame } from '../fixtures/game-files.ts'

const ROOT = join(import.meta.dirname, '..', '..')
const readDisk = async (path: string): Promise<string> => readFileSync(join(ROOT, path), 'utf8')

/** The files the project file lists, in its order. */
function listed(): { type: ContentType; path: string }[] {
  const project = parseProject(readFileSync(join(ROOT, PROJECT_FILE), 'utf8'))
  if (!project.ok) throw new Error(project.diagnostics.map(formatDiagnostic).join('\n'))
  return project.value.content.map(({ type, path }) => ({ type, path }))
}

/** Every file under `dir`, by its path from the repo root with `/`. */
function filesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`],
  )
}

test('the game loads with no problems', async () => {
  const loaded = await loadGame(readDisk)
  expect(loaded.ok ? [] : loaded.diagnostics.map(formatDiagnostic)).toEqual([])
})

test('the fixture loads the same game, so the other tests can start from it', async () => {
  const game = await loadTheGame()
  expect(game.levels[game.project.start]).toBeDefined()
  expect(game.characters[game.project.hero]).toBeDefined()
})

test('every content file is written the one standard way', async () => {
  for (const { type, path } of listed()) {
    const text = readFileSync(join(ROOT, path), 'utf8')
    const parsed = parseContent(type, text, path)
    if (!parsed.ok) throw new Error(parsed.diagnostics.map(formatDiagnostic).join('\n'))
    // `writeContent`'s type is per content type; the file's own type is only known at run time.
    const standard = (writeContent as (type: ContentType, value: unknown) => string)(type, parsed.value)
    if (standard !== text) throw new Error(`${path} is not in the standard form. Run: pnpm content:write`)
  }
})

test('every listed file is under content/, and every file under content/ is listed', () => {
  const paths = listed().map((entry) => entry.path)
  expect(paths.every((path) => path.startsWith('content/'))).toBe(true)
  expect(filesUnder('content').sort()).toEqual([...paths].sort())
})

test('the level has a start for each of four players', async () => {
  const loaded = await loadGame(readDisk)
  if (!loaded.ok) throw new Error(loaded.diagnostics.map(formatDiagnostic).join('\n'))
  const level = loaded.value.levels[loaded.value.project.start]
  expect(level?.starts.map((start) => start.player)).toEqual([1, 2, 3, 4])
})

test('the fixture reads the same files the disk has', () => {
  const onDisk = Object.fromEntries(
    [PROJECT_FILE, ...filesUnder('content')].map((path) => [path, readFileSync(join(ROOT, path), 'utf8')]),
  )
  expect(gameFiles).toEqual(onDisk)
})

test('a broken file is named in words', async () => {
  const loaded = await loadGame(readGame({ 'content/levels/level-1.json': '{ "format": 1,' }))
  expect(loaded.ok ? [] : loaded.diagnostics.map(formatDiagnostic)).toEqual([
    'content/levels/level-1.json: This file is not valid JSON. Check for a missing comma, quote or bracket.',
  ])
})
