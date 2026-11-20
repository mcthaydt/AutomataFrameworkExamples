// The game's three levels and how they join: a door between levels 1 and 2 (and back), and an edge between 2 and 3. The
// rules here hold for any editor's change too: nothing stands on a start or on another thing, and each door leads to a
// thing that is there. What an editor may move (a crate, a plate) is never a number in this file.
import {
  boxesOverlap,
  type Character,
  type GameContent,
  type Level,
} from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { loadTheGame } from '../fixtures/game-files.ts'

interface Box {
  readonly name: string
  readonly x: number
  readonly y: number
  readonly hw: number
  readonly hh: number
}

const turned = (b: Box) => ({ x: b.x, y: b.y, hw: b.hw, hh: b.hh, rotation: 0 })
const around = (name: string, x: number, y: number, size: Character['size']): Box => ({
  name,
  x,
  y,
  hw: size.w / 2,
  hh: size.h / 2,
})

/** Every standing place of a level: where each thing is (a thing with a path also at each place of it), and each start. */
function boxesOf(content: GameContent, level: Level): { things: Box[]; starts: Box[] } {
  const hero = content.characters[content.project.hero]?.size ?? { w: 0.8, h: 1 }
  const things: Box[] = []
  for (const thing of level.things) {
    const size = content.characters[thing.character]?.size ?? { w: 1, h: 1 }
    things.push(around(`${level.id}.${thing.id}`, thing.x, thing.y, size))
    for (const [id, value] of Object.entries(thing.values ?? {})) {
      if (!Array.isArray(value)) continue
      value.forEach((place, i) => {
        if (typeof place === 'object' && place !== null && 'x' in place && 'y' in place)
          things.push(around(`${level.id}.${thing.id}.${id}[${i}]`, Number(place.x), Number(place.y), size))
      })
    }
  }
  const starts = level.starts.map((s) => around(`${level.id} start of player ${s.player}`, s.x, s.y, hero))
  return { things, starts }
}

test('the game has three levels, played in order', async () => {
  const game = await loadTheGame()
  expect(Object.keys(game.levels).sort()).toEqual(['level-1', 'level-2', 'level-3'])
  expect(game.project.levels).toEqual(['level-1', 'level-2', 'level-3'])
  expect(game.project.start).toBe('level-1')
})

test('every level has a start for each of four players', async () => {
  const game = await loadTheGame()
  for (const level of Object.values(game.levels))
    expect(
      level.starts.map((start) => start.player),
      level.id,
    ).toEqual([1, 2, 3, 4])
})

test('the game is for one or two players, and every one of its controls can be shared on one keyboard', async () => {
  const game = await loadTheGame()
  expect(game.project.players).toBe(2)
  const controls = Object.values(game.tunings ?? {}).flatMap((tuning) => tuning.controls ?? [])
  expect(controls.length).toBeGreaterThan(0)
  for (const control of controls) expect(control.shared, control.action).toHaveLength(2)
})

test('level 1 keeps its crate first, where it was', async () => {
  const game = await loadTheGame()
  const first = game.levels['level-1']?.things[0]
  expect(first).toMatchObject({ id: 'crate-1', character: 'crate', x: 9.5, y: 7.5 })
})

test('two doors lead between level 1 and level 2, each to a thing that is there', async () => {
  const game = await loadTheGame()
  const doors = Object.values(game.levels).flatMap((level) =>
    level.things.flatMap((thing) => {
      const to = thing.values?.to
      return typeof to === 'object' && to !== null && !Array.isArray(to) && 'level' in to
        ? [{ from: level.id, id: thing.id, to }]
        : []
    }),
  )
  expect(doors.map((d) => `${d.from} ${d.id} -> ${d.to.level} ${d.to.thing}`).sort()).toEqual([
    'level-1 exit -> level-2 door-in',
    'level-2 door-in -> level-1 exit',
  ])
})

test('level 2 and level 3 join along an edge into one place, and level 1 joins nothing', async () => {
  const game = await loadTheGame()
  const places = Object.values(game.places ?? {}).map((levels) => levels.map((l) => l.level).sort())
  const together = places.find((levels) => levels.includes('level-2'))
  expect(together).toEqual(['level-2', 'level-3'])
  // `places` holds only the places of two levels or more: a level that joins nothing is in none.
  expect(places.find((levels) => levels.includes('level-1'))).toBeUndefined()
  expect(game.worlds?.world?.levels).toEqual([
    { level: 'level-1', at: { x: 0, y: 0 } },
    { level: 'level-2', at: { x: 20, y: 0 } },
    { level: 'level-3', at: { x: 36, y: 0 } },
  ])
})

test('no thing stands on a start or on another thing, in any level, a walker at both ends of its path included', async () => {
  const game = await loadTheGame()
  for (const level of Object.values(game.levels)) {
    const { things, starts } = boxesOf(game, level)
    for (const thing of things) {
      for (const start of starts)
        expect(boxesOverlap(turned(thing), turned(start)), `${thing.name} on ${start.name}`).toBe(false)
    }
    // A thing and the places of its own path are one thing: only different things are compared.
    for (const a of things) {
      for (const b of things) {
        if (a.name >= b.name) continue
        const same = a.name.replace(/\.[a-z-]+\[\d+\]$/, '') === b.name.replace(/\.[a-z-]+\[\d+\]$/, '')
        if (same) continue
        expect(boxesOverlap(turned(a), turned(b)), `${a.name} on ${b.name}`).toBe(false)
      }
    }
  }
})
