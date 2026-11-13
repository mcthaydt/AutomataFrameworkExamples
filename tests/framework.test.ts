import { PROJECT_FILE } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'

// A git install builds the framework while pnpm installs it (the `onlyBuiltDependencies` line in package.json
// allows that). If it did not, this import is the first thing to fail, with a plain "cannot find" instead of a
// confusing failure in the game's own tests.
test('the pinned framework is installed and built', () => expect(PROJECT_FILE).toBe('automata.toml'))
