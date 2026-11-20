// Copies the game's own files into `dist/` beside the built page, at the same paths: `automata.toml`, every file
// it lists, and the picture and atlas each figure or backdrop file is painted into (`automata art`), beside it. The
// page fetches them at run time, so an editor's change to a content file needs no new build of the page's code. Run
// by `pnpm build` after Vite.
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { formatDiagnostic, PROJECT_FILE, parseProject } from '@automataframework/framework/headless'

// The file itself, not the feature's entry: `play.ts` loads CSS and the framework's browser entry, which Node cannot.
import { recordingPath } from '../src/features/play/mode.ts'

const root = new URL('../', import.meta.url)
const out = new URL('dist/', root)

const project = parseProject(await readFile(new URL(PROJECT_FILE, root), 'utf8'))
if (!project.ok) {
  for (const problem of project.diagnostics) console.error(formatDiagnostic(problem))
  process.exit(1)
}

const painted = project.value.content
  .filter((entry) => entry.type === 'figure' || entry.type === 'backdrop')
  .flatMap((entry) => [entry.path.replace(/\.json$/, '.png'), entry.path.replace(/\.json$/, '.atlas.json')])
  .filter((path) => existsSync(new URL(path, root)))
for (const path of [PROJECT_FILE, ...project.value.content.map((entry) => entry.path), ...painted]) {
  const target = new URL(path, out)
  await mkdir(dirname(target.pathname), { recursive: true })
  await copyFile(new URL(path, root), target)
}
// The recording the page watches before Play. A game with none still builds: the page then opens ready to play.
const recording = recordingPath(project.value.start)
const hasRecording = existsSync(new URL(recording, root))
if (hasRecording) {
  const target = new URL(recording, out)
  await mkdir(dirname(target.pathname), { recursive: true })
  await copyFile(new URL(recording, root), target)
}
console.log(
  `Copied ${PROJECT_FILE}, ${project.value.content.length} content files and ${
    hasRecording ? `the recording ${recording}` : 'no recording (there is none to watch)'
  } to dist/.`,
)
