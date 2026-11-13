// Puts every content file the project file lists into the one standard form, the text the framework's `writeContent`
// gives for it. After a hand edit, run `pnpm content:write`. With `--check` nothing is written and the exit code says
// whether any file would change: that is what CI's tests check too, so an editor and an agent write the same bytes.
import { readFile, writeFile } from 'node:fs/promises'
import {
  type ContentType,
  formatDiagnostic,
  PROJECT_FILE,
  parseContent,
  parseProject,
  writeContent,
} from '@automataframework/framework/headless'

const check = process.argv.includes('--check')
const root = new URL('../', import.meta.url)

const project = parseProject(await readFile(new URL(PROJECT_FILE, root), 'utf8'))
if (!project.ok) {
  for (const problem of project.diagnostics) console.error(formatDiagnostic(problem))
  process.exit(1)
}

let failed = false
let changed = 0
for (const { type, path } of project.value.content) {
  const text = await readFile(new URL(path, root), 'utf8').catch(() => undefined)
  if (text === undefined) {
    console.error(`${path}: This file is listed in ${PROJECT_FILE} but is missing.`)
    failed = true
    continue
  }
  const parsed = parseContent(type, text, path)
  if (!parsed.ok) {
    for (const problem of parsed.diagnostics) console.error(formatDiagnostic(problem))
    failed = true
    continue
  }
  // The type of what `writeContent` takes depends on the content type, which is only known here at run time.
  const standard = (writeContent as (type: ContentType, value: unknown) => string)(type, parsed.value)
  if (standard === text) continue
  changed++
  if (check) {
    console.error(`${path} is not in the standard form. Run: pnpm content:write`)
    failed = true
  } else {
    await writeFile(new URL(path, root), standard)
    console.log(`Rewrote ${path}.`)
  }
}

if (failed) process.exit(1)
if (changed === 0) console.log('Every content file was already in the standard form.')
