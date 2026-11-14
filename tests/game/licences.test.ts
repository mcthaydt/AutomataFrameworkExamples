// The font and the icons the game's screens use ask that their licence notice travel with every copy. `public/licences.txt`
// is served beside the page (Vite copies `public/` into `dist/`), so a game folder taken to itch.io or any other site still
// carries them. This holds the file to the two packages, at the versions `package.json` installs, with each package's own
// LICENSE copied in whole: move a version, and the test fails until the file is copied again.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

const ROOT = join(import.meta.dirname, '..', '..')
const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8')
/** One line, no line-end differences: a licence copied by hand may wrap or end its lines differently. */
const flat = (text: string): string => text.replace(/\s+/g, ' ').trim()

const licences = flat(read('public/licences.txt'))
const { devDependencies } = JSON.parse(read('package.json')) as { devDependencies: Record<string, string> }

for (const name of ['@fontsource/fredoka', '@phosphor-icons/core']) {
  test(`${name} is named at its installed version, with its own licence copied in`, () => {
    expect(licences).toContain(`${name} ${devDependencies[name]}`)
    expect(licences).toContain(flat(read(`node_modules/${name}/LICENSE`)))
  })
}

test('it says in plain words what the file is for', () => {
  expect(licences).toContain('Fredoka')
  expect(licences).toContain('Phosphor Icons')
})
