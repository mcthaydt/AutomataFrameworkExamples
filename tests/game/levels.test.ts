// The game's three levels, as files: how many there are and in what order, that each has one door, a place for each of
// the four players and a camera limit, and that nothing starts inside a wall. The levels are the editors' to change, so
// these say what the game needs of any level, not where anything is.
import { type Level, levelOrder } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { loadTheGame } from '../fixtures/game-files.ts'

/** The three levels in the order they are played, with their files. */
async function levels(): Promise<{ id: string; level: Level }[]> {
  const game = await loadTheGame()
  return levelOrder(game.project).map((id) => ({ id, level: game.levels[id] as Level }))
}

test('the game has three levels, played in the order the project file lists', async () => {
  const game = await loadTheGame()
  expect(levelOrder(game.project)).toEqual(['level-1', 'level-2', 'level-3'])
  expect(game.project.start).toBe('level-1')
})

test('the project file says what ends a level and how many may play', async () => {
  const { project } = await loadTheGame()
  expect(project.done).toBe('game.level-done')
  expect(project.players).toBe(4)
})

test('every level has exactly one door, whose character is the sensed door', async () => {
  const game = await loadTheGame()
  for (const { id, level } of await levels()) {
    const doors = level.things.filter((thing) => game.characters[thing.character]?.kind === 'door')
    expect(doors.length, `${id} has one door`).toBe(1)
  }
  expect(game.characters.door?.touch).toBe('sense')
  expect(game.characters.spark?.touch).toBe('take')
})

test('every level has a start for each of the four players, and a camera that may pull back', async () => {
  for (const { id, level } of await levels()) {
    const players = level.starts.map((start) => start.player)
    expect(players, id).toEqual([1, 2, 3, 4])
    expect(level.view?.most, `${id} has a limit to how far the camera pulls back`).toBeDefined()
  }
})

test('the camera never shows more than the level has', async () => {
  for (const { id, level } of await levels()) {
    const tiles = level.tiles ?? []
    const rows = tiles.length
    const columns = tiles[0]?.length ?? 0
    expect(level.view?.most?.w ?? 0, `${id} width`).toBeLessThanOrEqual(columns)
    expect(level.view?.most?.h ?? 0, `${id} height`).toBeLessThanOrEqual(rows)
  }
})

test('nothing and nobody starts inside a wall', async () => {
  const game = await loadTheGame()
  /** The solid tile a box with its middle at (x, y) overlaps, as "row,col", or undefined. */
  const inside = (level: Level, x: number, y: number, w: number, h: number): string | undefined => {
    for (let row = Math.floor(y - h / 2 + 0.001); row <= Math.floor(y + h / 2 - 0.001); row++) {
      for (let col = Math.floor(x - w / 2 + 0.001); col <= Math.floor(x + w / 2 - 0.001); col++) {
        if (level.tiles?.[row]?.[col] === '#') return `${row},${col}`
      }
    }
    return undefined
  }
  const hero = game.characters[game.project.hero]
  for (const { id, level } of await levels()) {
    for (const thing of level.things) {
      const size = game.characters[thing.character]?.size
      expect(inside(level, thing.x, thing.y, size?.w ?? 1, size?.h ?? 1), `${id} ${thing.id}`).toBeUndefined()
    }
    for (const start of level.starts) {
      const where = inside(level, start.x, start.y, hero?.size.w ?? 1, hero?.size.h ?? 1)
      expect(where, `${id} start for player ${start.player}`).toBeUndefined()
    }
  }
})
