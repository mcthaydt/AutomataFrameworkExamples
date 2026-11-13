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

/** Writes `.hashes/<engine>.json` at the repo's root as an `EngineHashes`, for `scripts/same-hash.ts` to compare. */
export async function saveHashes(played: Played): Promise<void> {
  const engine = await engineName()
  const hashes: EngineHashes = { engine, finalHash: played.finalHash, checks: played.checks }
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
