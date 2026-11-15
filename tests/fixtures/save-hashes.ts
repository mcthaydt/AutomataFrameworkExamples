// Where a replay test leaves what it saw, so CI can compare engines. Each engine's test saves `.hashes/<engine>.json`
// and `scripts/same-hash.ts` reads them. The test runs in Node and in a browser, and each side has its own way to
// write a file, so each is loaded only on its own side.
import type { Played } from '@automataframework/framework/headless'
import type { EngineHashes } from '#src/lib/same-hash.ts'

/** A page has a `document`; Node does not. */
const inBrowser = (): boolean => typeof document !== 'undefined'

/** 'node', 'chromium', 'webkit' or 'firefox': where this test is running. */
export async function engineName(): Promise<string> {
  if (!inBrowser()) return 'node'
  const { server } = await import('vitest/browser')
  return server.browser
}

/** How far apart each play's ticks are put when several plays are saved as one, so no two checks share a tick. */
const PLAY_SPACING = 100_000

/**
 * Writes `.hashes/<engine>.json` at the repo's root as an `EngineHashes`, for `scripts/same-hash.ts` to compare. The
 * comparison reads one file for each engine, so several plays are joined into it: each play's checks are moved on by
 * a whole `PLAY_SPACING` more than the one before, and the final hashes are written one after the other. Two engines
 * that played the same plays in the same order write the same file.
 */
export async function saveHashes(plays: readonly Played[]): Promise<void> {
  const engine = await engineName()
  const hashes: EngineHashes = {
    engine,
    finalHash: plays.map((played) => played.finalHash).join(' '),
    checks: plays.flatMap((played, i) =>
      played.checks.map((check) => ({ tick: check.tick + i * PLAY_SPACING, hash: check.hash })),
    ),
  }
  const text = `${JSON.stringify(hashes, null, 2)}\n`
  if (inBrowser()) {
    // In Vitest 5 a path is resolved from the project root.
    const { commands } = await import('vitest/browser')
    await commands.writeFile(`.hashes/${engine}.json`, text)
  } else {
    const { mkdir, writeFile } = await import('node:fs/promises')
    const folder = new URL('../../.hashes/', import.meta.url)
    await mkdir(folder, { recursive: true })
    await writeFile(new URL(`${engine}.json`, folder), text)
  }
}
