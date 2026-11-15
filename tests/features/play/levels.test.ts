// `levelProblems`: what a level must have for anyone to finish it, and the sentence that says what to add when it does
// not. The broken levels are made from the real ones, the door taken out, so the sentence is the one a person editing a
// level would read.
import { parseContent, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { levelProblems } from '#src/features/play/levels.ts'
import { gameFiles, loadTheGame } from '../../fixtures/game-files.ts'

/** The game with `change` applied to the level in `file`. */
async function without(
  file: string,
  change: (level: ReturnType<typeof read>) => ReturnType<typeof read>,
): ReturnType<typeof loadTheGame> {
  return loadTheGame({ [file]: writeContent('level', change(read(file))) })
}

/** A level file of the game, read. */
function read(file: string) {
  const parsed = parseContent('level', gameFiles[file] ?? '', file)
  if (!parsed.ok) throw new Error(`${file} did not parse`)
  return parsed.value
}

test('the real game has no problems', async () => {
  expect(levelProblems(await loadTheGame())).toEqual([])
})

test('a level with no door says so, and where to add one', async () => {
  const file = 'content/levels/level-2.json'
  const game = await without(file, (level) => ({
    ...level,
    things: level.things.filter((thing) => thing.character !== 'door'),
  }))
  expect(levelProblems(game)).toEqual([
    {
      file,
      message: 'This level has no door, so nobody can finish it. Add a thing whose character is "door".',
    },
  ])
})

test('problems come in the order the levels are played', async () => {
  const first = 'content/levels/level-1.json'
  const last = 'content/levels/level-3.json'
  const game = await loadTheGame({
    [last]: writeContent('level', {
      ...read(last),
      things: read(last).things.filter((thing) => thing.character !== 'door'),
    }),
    [first]: writeContent('level', {
      ...read(first),
      things: read(first).things.filter((thing) => thing.character !== 'door'),
    }),
  })
  expect(levelProblems(game).map((problem) => problem.file)).toEqual([first, last])
})
