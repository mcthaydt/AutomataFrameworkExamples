// The built game reads its files when it opens, so a changed or broken file is what the page shows. These are the
// editor's whole job in one place: change a file, and the game plays the change.
import { parseContent, verifyReplay, writeContent } from '@automataframework/framework/headless'
import { afterAll, afterEach, expect, test } from 'vitest'
import { WORDS } from '#src/features/play/words.ts'
import { gameFiles } from '../fixtures/game-files.ts'
import { closeBrowser, nodeSim, type Opened, openGame, replayOf, untilTick } from './open.ts'

const LEVEL = 'content/levels/level-1.json'

let opened: Opened | undefined
afterEach(async () => {
  await opened?.close()
  opened = undefined
})
afterAll(closeBrowser)

/** The level file with the crate moved to `x`, written the standard way. */
function levelWithCrateAt(x: number): string {
  const parsed = parseContent('level', gameFiles[LEVEL] ?? '', LEVEL)
  if (!parsed.ok) throw new Error('the real level did not parse')
  return writeContent('level', {
    ...parsed.value,
    things: parsed.value.things.map((thing) => (thing.id === 'crate-1' ? { ...thing, x } : thing)),
  })
}

test('the game plays the level file it is given: a moved crate is where the file says', async () => {
  const moved = { [LEVEL]: levelWithCrateAt(12.5) }
  opened = await openGame({ files: moved })
  await untilTick(opened.page, 30)
  const replay = await replayOf(opened.page)

  // The page read the moved file: a Node sim over the same moved file verifies the page's replay.
  const same = await nodeSim(moved)
  expect(verifyReplay(same, replay)).toEqual({ ok: true })
  same.dispose()

  // And the file on disk is not what the page played.
  const disk = await nodeSim()
  const verdict = verifyReplay(disk, replay)
  disk.dispose()
  expect(verdict.ok).toBe(false)
  if (!verdict.ok) expect(verdict.reason).toBe('content-changed')
})

test('a broken level file is shown in plain words, with no game behind it', async () => {
  opened = await openGame({ files: { [LEVEL]: '{ "format": 1,' } })
  const { page } = opened
  expect(await page.locator('#game').getAttribute('data-state')).toBe('problem')
  const alert = page.getByRole('alert')
  const shown = await alert.innerText()
  for (const words of [
    WORDS.problemTitle,
    'content/levels/level-1.json: This file is not valid JSON. Check for a missing comma, quote or bracket.',
    WORDS.problemFix,
  ]) {
    expect(shown).toContain(words)
  }
  expect(await page.locator('canvas').count()).toBe(0)
  expect(await page.evaluate(() => window.automataGame)).toBeUndefined()
})

test('a missing file is named', async () => {
  opened = await openGame({ files: { 'content/characters/crate.json': undefined } })
  const shown = await opened.page.getByRole('alert').innerText()
  expect(shown).toContain(
    'content/characters/crate.json: This file is listed in automata.toml but is missing.',
  )
})
