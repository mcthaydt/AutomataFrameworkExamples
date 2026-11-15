// The hero is the framework's: its character file says `moves`, and a tuning file holds the numbers and the controls.
// The game has no hero code, so these tests read the files and play a sim with no plugins at all.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  Body,
  controlsCommand,
  createGameSim,
  MOVE_NUMBERS,
  Player,
  type Sim,
  Transform,
} from '@automataframework/framework/headless'
import { afterEach, expect, test } from 'vitest'
import { loadTheGame } from '../fixtures/game-files.ts'
import { loadTestGame } from '../fixtures/test-game.ts'

const ROOT = join(import.meta.dirname, '..', '..')

const made: Sim[] = []
afterEach(() => {
  for (const sim of made.splice(0)) sim.dispose()
})

/** Every file under `dir` below the repo root, by its path with `/`. */
function filesUnder(dir: string): string[] {
  if (!existsSync(join(ROOT, dir))) return []
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`],
  )
}

test('the hero has all three moves, from the tuning file hero-moves', async () => {
  const game = await loadTheGame()
  expect(game.characters[game.project.hero]?.moves).toEqual({
    tuning: 'hero-moves',
    'double-jump': true,
    'wall-jump': true,
    dash: true,
  })
})

test('the tuning file lists the eighteen numbers, each inside the framework’s limits', async () => {
  const tuning = (await loadTheGame()).tunings?.['hero-moves']
  expect(tuning?.numbers.map((n) => n.id)).toEqual(MOVE_NUMBERS.map((n) => n.id))
  for (const own of tuning?.numbers ?? []) {
    const known = MOVE_NUMBERS.find((n) => n.id === own.id)
    expect(known, own.id).toBeDefined()
    if (known === undefined) continue
    expect(own.min, `${own.id} min`).toBeGreaterThanOrEqual(known.min)
    expect(own.max, `${own.id} max`).toBeLessThanOrEqual(known.max)
    expect(own.value, `${own.id} value`).toBeGreaterThanOrEqual(own.min)
    expect(own.value, `${own.id} value`).toBeLessThanOrEqual(own.max)
  }
})

test('the numbers are the framework’s own, so the hero feels as the spec says', async () => {
  const tuning = (await loadTheGame()).tunings?.['hero-moves']
  expect(Object.fromEntries((tuning?.numbers ?? []).map((n) => [n.id, n.value]))).toEqual(
    Object.fromEntries(MOVE_NUMBERS.map((n) => [n.id, n.value])),
  )
})

test('the tuning file names the four controls: left, right, jump and dash', async () => {
  const tuning = (await loadTheGame()).tunings?.['hero-moves']
  expect(tuning?.controls?.map((c) => c.action)).toEqual(['left', 'right', 'jump', 'dash'])
})

test('a sim with no plugins at all walks the hero right when player 1 holds right', async () => {
  const sim = await createGameSim({ content: await loadTestGame(), players: [1] })
  made.push(sim)
  for (let i = 0; i < 10; i++) sim.step([])
  const hero = (): { x: number; vx: number } => {
    const found = sim.query(Player, Body, Transform).find((entity) => entity.get(Player).number === 1)
    if (found === undefined) throw new Error('no hero 1')
    return { x: found.get(Transform).x, vx: found.get(Body).vx }
  }
  const before = hero().x
  sim.step([controlsCommand(sim.tick, 1, 0, ['right'])])
  for (let i = 1; i < 30; i++) sim.step([])
  expect(hero().x).toBeGreaterThan(before + 3)
  expect(hero().vx).toBeGreaterThan(0)
})

test('the game keeps no hero code of its own', () => {
  expect(filesUnder('src/features/hero')).toEqual([])
  expect(filesUnder('tests/features/hero')).toEqual([])
  const sources = filesUnder('src').filter((path) => path.endsWith('.ts'))
  for (const path of sources) expect(readFileSync(join(ROOT, path), 'utf8'), path).not.toMatch(/\bCONTROLS\b/)
})
