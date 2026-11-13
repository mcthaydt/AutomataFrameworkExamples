// Compares what each engine saw in the recorded play: `pnpm same-hash node webkit` reads `.hashes/node.json` and
// `.hashes/webkit.json` (each replay test writes its own) and says whether the engines agree. Exit 0 when they do.
import { readFile } from 'node:fs/promises'
import { describeDifference, type EngineHashes } from '#src/lib/same-hash.ts'

const engines = process.argv.slice(2)
const runs: EngineHashes[] = []
for (const engine of engines) {
  const text = await readFile(new URL(`../.hashes/${engine}.json`, import.meta.url), 'utf8').catch(
    () => undefined,
  )
  if (text === undefined) {
    console.error(`${engine} did not report its hashes. Did its replay test run?`)
    process.exit(1)
  }
  runs.push(JSON.parse(text) as EngineHashes)
}

const difference = describeDifference(runs)
if (difference !== undefined) {
  console.error(difference)
  process.exit(1)
}
console.log(`${engines.join(' and ')} both ended on ${runs[0]?.finalHash}.`)
