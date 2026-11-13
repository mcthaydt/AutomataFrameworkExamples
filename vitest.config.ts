// Five Vitest projects. Test file suffixes decide where a test runs:
//   *.test.ts          Node
//   *.parity.test.ts   Node and all three browsers: the same hash must come out of every engine
//   *.browser.test.ts  the three browsers only (layout, DOM, canvas)
//   *.journey.test.ts  Node, driving one real browser (named by ENGINE) against the built page in dist/
// Node is the fourth engine of the determinism proof; the browsers are real Chromium, WebKit and Firefox.
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, type ViteUserConfig } from 'vitest/config'

const ENGINES = ['chromium', 'webkit', 'firefox'] as const

const node = {
  extends: true,
  test: {
    name: 'node',
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Browser tests need a page; journeys need the built game and have their own project.
    exclude: ['**/*.browser.test.ts', '**/*.journey.test.ts', '**/node_modules/**'],
  },
}

// The built game, driven from outside by one real browser. `serve.ts` serves `dist/` once for all of them.
const journeys = {
  extends: true,
  test: {
    name: 'journeys',
    environment: 'node',
    include: ['tests/**/*.journey.test.ts'],
    globalSetup: ['tests/journeys/serve.ts'],
    testTimeout: 60_000,
    hookTimeout: 90_000,
    // One browser at a time: the journeys are about the page, not about how many pages a runner can hold.
    fileParallelism: false,
  },
}

// One project per engine, so CI can run them as parallel jobs and a failing engine is named by the job.
const inBrowser = (engine: (typeof ENGINES)[number]) => ({
  extends: true,
  test: {
    name: engine,
    include: ['tests/**/*.parity.test.ts', 'tests/**/*.browser.test.ts'],
    // A shared runner can be slow to start a page; a hang is still caught.
    testTimeout: 60_000,
    hookTimeout: 90_000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: engine }],
    },
  },
})

// Annotated because the repo's tsconfig demands explicit types on everything exported.
const config: ViteUserConfig = defineConfig({
  test: { projects: [node, ...ENGINES.map(inBrowser), journeys] },
})

export default config
