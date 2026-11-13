// The page's build: `pnpm build` makes `dist/`, a static folder that plays the game from any path of any site.
import { defineConfig, type UserConfig } from 'vite'

const config: UserConfig = defineConfig({
  // Every URL in the built page is relative, so the folder works from wherever it is put.
  base: './',
  // A multi-page app answers a file that is not there with 404, never with the page: a missing game file must be
  // noticed, not hidden behind `index.html`.
  appType: 'mpa',
  build: { target: 'es2023' },
})

export default config
