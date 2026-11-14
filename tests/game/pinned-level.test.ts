// The level the journeys play (`tests/fixtures/pinned-level.ts`) wears palette No. 276's Black sky and Seashell Pink
// ground, so the "well done" picture shows what a player sees and not the framework's default light blue and slate.
// The colours are written out here, not read from `content/levels/level-1.json`: an editor may recolour the real
// level, and this level is the one that must not change under a journey.
import { formatDiagnostic, parseContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { pinnedLevel } from '../fixtures/pinned-level.ts'

test("the journeys' own level has the Black sky and the Seashell Pink ground", () => {
  const parsed = parseContent('level', pinnedLevel, 'pinned-level')
  if (!parsed.ok) throw new Error(parsed.diagnostics.map(formatDiagnostic).join('\n'))
  expect(parsed.value).toMatchObject({ sky: '#111314', ground: '#fdd4bd' })
})
