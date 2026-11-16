// Compares what each engine saw in the recorded plays: `pnpm same-hash node webkit` reads `.hashes/node.json` and
// `.hashes/webkit.json` (each replay test writes its own), then the same for level 2's, and says whether the engines agree.
// Exit 0 when they do.
import { readFile } from 'node:fs/promises'
import { describeDifference, type EngineHashes } from '#src/lib/same-hash.ts'

const engines = process.argv.slice(2)
/** The recorded plays: level 1's hashes are in `<engine>.json`, and each later one in `<engine>.<name>.json`. */
const plays = ['', 'level-2', 'heavy']

for (const play of plays) {
  const runs: EngineHashes[] = []
  for (const engine of engines) {
    const name = `${engine}${play === '' ? '' : `.${play}`}.json`
    const text = await readFile(new URL(`../.hashes/${name}`, import.meta.url), 'utf8').catch(() => undefined)
    if (text === undefined) {
      console.error(`${engine} did not report its hashes (${name}). Did its replay test run?`)
      process.exit(1)
    }
    runs.push(JSON.parse(text) as EngineHashes)
  }

  const difference = describeDifference(runs)
  if (difference !== undefined) {
    console.error(difference)
    process.exit(1)
  }
  console.log(
    `${engines.join(' and ')} both ended on ${runs[0]?.finalHash}${play === '' ? '' : ` (${play})`}.`,
  )
}
