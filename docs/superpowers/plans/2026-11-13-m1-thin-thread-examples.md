# M1 Thin Thread: the Examples Repo's Demo Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, in
> one session, with no subagents (project rule). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the smallest true demo game in this repo: one level with the hero and one crate, made only with
`@automataframework/framework` pinned to a commit, playable as a static web page, and checked on every commit by a
recorded play that ends on the same hash in Node, Chromium, WebKit and Firefox.

**Architecture:** The game sits at the repo's root, as an outside game would: `automata.toml`, `content/`, a little
code in `src/`, and one recorded play in `replays/`. The code is three small features in a fixed order: `hero` (the
sim-side rules), `plugins` (the list of everything the sim side is made of) and `play` (the page). CI plays the
recording in four engines and compares the engines with each other, so a commit that only moves the crate passes and
a commit that makes the engines disagree does not.

**Tech Stack:** `@automataframework/framework` from git at commit `ec4fddd96d0f1e39365ff807306faf9b42ac3190`,
TypeScript 7.0.2 strict, Vite 8.3.3, Vitest 5.0.3 (browser mode with `@vitest/browser-playwright` 5.0.3), Playwright
1.63.0, Biome 2.5.15, knip 6.39.0, `@types/node` 24.19.1, pnpm 10.34.6, Node 24.21.0. Nothing else.

**Spec:** [`AutomataFramework: docs/superpowers/specs/2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
milestone M1, the Examples line and the CI line. Principles served: 1 (the game is documented files an agent and an
editor change the same way, and one command set checks them), 3 (2D only), 4 (its own repo, its own CI), 6 (the old
stack, with a reason beside each thing left out), 7 (nothing here that M1 does not use).

Read with it, in AutomataFramework: `CLAUDE.md`, `docs/superpowers/progress.md`,
`docs/superpowers/plans/2026-11-13-m1-thin-thread-framework.md` (its section "What the other repos rely on" is the
contract this plan builds on), both M1 audits under `docs/superpowers/audits/`, and `docs/api/framework.api.md` (every
export, with its signature).

## What this plan covers, and what it does not

This is the Examples share of M1: "one level with the hero and one crate" and "the replay hash the same in Node,
Chromium, WebKit and Firefox". The Editors and Site shares have their own plans in their own repos.

Not in this plan, because M1 does not use it: the second level, the seesaw, the swinging platform, sparks, the door,
art, sound, saves, screens, languages, gamepad, remapping, the site's one-file examples, anything 3D.

Left out of the stack, with the reason: **changesets and the API report** (this repo publishes no package);
**Svelte, Paraglide, Zod, PixiJS, Koota and Rapier as direct dependencies** (a game uses only the framework, which
brings them; the screens that need Svelte and Paraglide are M2); **Effect and Tauri** (no Node tooling and no desktop
build here in M1); **`@playwright/test`** (the journeys run in Vitest with the `playwright` library already in the
stack, so no dependency is added).

## Before starting

Stop and report to the coordinator if any of these is not true. Do not work around one.

1. `main` is protected in this repo (true on 2026-11-13).
2. GitHub-hosted runners accept jobs for this repo. Task 1's first push shows it: a run that is refused or never
   starts is a stop.
3. The framework commit `ec4fddd96d0f1e39365ff807306faf9b42ac3190` is on AutomataFramework's `main` and its
   `package.json` has `"prepare": "pnpm build"` (true on 2026-11-13; it is PR 13's merge commit). Without that script
   a git install has no `dist/`.

Checked while this plan was written (an install in a scratch folder, not a test): with the dependency and the
`pnpm.onlyBuiltDependencies` line of Task 1, `pnpm install` builds the framework and
`import '@automataframework/framework/headless'` works in Node.

## Global Constraints

- **The game uses only the published package.** Code under `src/` imports `@automataframework/framework` and
  `@automataframework/framework/headless` and no other package, and never a path inside the package.
- **The pin is a commit, never a branch:** `github:mcthaydt/AutomataFramework#<40 hex digits>`. Moving it is its own
  pull request and changes two lines of `package.json` (the dependency and `pnpm.onlyBuiltDependencies`) and the
  lockfile. A move that changes the framework's physics or hashing fails the strict replay checks, and so always the
  test-game one: that is right, and it means a pin move may need a new recording, which the Owner sees (audit N5).
- **Tests run only in GitHub-hosted CI, never locally.** `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`,
  `pnpm build` and the scripts in `scripts/` are not tests and are run locally before every push.
- The sim side (`hero`, `plugins`, `src/lib/`) has no I/O, no wall clock and no `Math.random`. Only the sim changes
  gameplay state; the page observes.
- Nothing may assume one player. Player numbers are 1 to 4; the level has a start for each.
- Game content is JSON, written only by `writeContent`; the project file is TOML.
- World units are tiles, the origin is the level's top-left corner, **y points down**, and a thing's `x, y` is its
  centre. Tick rate is 60 Hz.
- A source file has at most 600 lines. Touch targets are at least 44 px; primary actions 48 px.
- Structure: `src/index.ts` and `src/headless.ts` (entries, re-exports only), `src/main.ts` (the page's script),
  `src/lib/`, `src/features/<feature>/<feature>.ts` with one job per file beside it, `scripts/` (thin wrappers),
  `tests/` mirroring `src/`. A feature imports only itself, `src/lib/` and features below it, and another feature
  only through its entry file.
- Every test disposes every sim it creates (Koota allows 16 live worlds), and stops every game it starts.
- A hash that differs between engines is investigated, never re-recorded per engine. `replays/level-1.json` is this
  repo's golden: once it holds hashes it changes only with the Owner seeing before and after.
- **The drunk-grandma test.** Every word a player can read is pinned in this plan (Task 5). The pictures Task 6
  uploads, at phone, tablet and desktop sizes, upright and sideways, are what the implementation audit reads; a
  screen that fails is a defect. The words stay at the top for the whole game, which on a phone held sideways costs a
  share of a short screen: that is deliberate in M1 (a player who looks away and back still needs them), and M2's
  title and pause screens take over the job (audit S4).
- Comments say why. Conventional Commits. The author is Dawson McThay
  (`git config --global user.name "Dawson McThay" && git config --global user.email "107786093+mcthaydt@users.noreply.github.com"`).
  No AI attribution in commits, pull request bodies or docs. The pull request body is edited only with the GitHub MCP
  tool and its credit line reads "Requested by **McThayDT**".
- No dependency beyond the Tech Stack line. A task that needs one stops and asks.
- No strategy, market, competitor or pricing words anywhere in this repo.

## How every task is verified

There is no local test run, so each task proves itself in the pull request's CI (Task 1 creates it).

- **Every task pushes twice.** First the tests alone: the `check` job (or the engine jobs, where the step says so)
  must fail, and the log must show the reason the step names. Then the code: every job must pass. Do not write the
  code before reading the red run.
- **The recording is taken from CI, never typed** (Task 4).
- After each task: tick its boxes here, update `docs/superpowers/progress.md` (each finished task is 14% of the stage;
  the final review and summary are the last 2%), and send the coordinator one line: commit, test count, surprises.
- Stop rules (project): a failing check you cannot explain, a third fix for the same failure, an access refusal or a
  missing tool. Stop that task and report at once. An Owner-only question goes to the coordinator with options, and
  the task waits; never default on one. Hand off at 90 minutes.

## What the other repos rely on

Change any of this only with a note to the coordinator.

- **Where the game is.** At this repo's root: `automata.toml`, and the files it lists under `content/`. The working
  name is "Crate Game" until the Owner names the game.
- **What an editor may change.** Any file `automata.toml` lists, written with `writeContent`. An editor saves by
  pushing a branch (`automata/<login>`) in this repo and opening a pull request into `main`; CI runs on that pull
  request and fails when a content file is not byte for byte what `writeContent` writes, or when `loadGame` reports a
  problem; a person merges it on GitHub. A Suggest from a fork is not supported by this repo's CI in M1. The crate is
  the thing `crate-1` in `content/levels/level-1.json`.
- **What a moved crate does to CI.** Nothing breaks: the replay check accepts "the content changed" and still
  compares the four engines with each other. An editor never writes `replays/`.
- **The build.** `pnpm install --frozen-lockfile && pnpm build` leaves `dist/`: `index.html`, `assets/`, and the
  game's files beside them (`dist/automata.toml`, `dist/content/...`). Every URL is relative, so the folder works
  from any path of any site. The page fetches the game's files at run time, relative to itself.
- **The page.** `<main id="game" data-state="loading | playing | problem">` fills the window. `window.automataGame`
  is the running `Game` (`undefined` on a problem), for journeys and agents. The page listens for keys on its own
  `window`: a page that embeds it in a frame must give the frame focus (or say "Click the game, then...").
- **Keys.** ArrowLeft or KeyA, ArrowRight or KeyD, Space or ArrowUp. Touch buttons: Left, Right, Jump.
- **Check-run names.** `check`, `engines (chromium)`, `engines (webkit)`, `engines (firefox)`; `screens` only copies
  pictures and is not a verdict on the game.

## File structure

```
automata.toml                     the project file
content/levels/level-1.json       content/characters/hero.json  crate.json
replays/level-1.json              the recorded play: this repo's golden
index.html                        the page
package.json  pnpm-lock.yaml  tsconfig.json  vite.config.ts  vitest.config.ts  biome.json  knip.json  .gitignore
.github/workflows/ci.yml
src/index.ts                      browser entry: re-exports headless.ts and play
src/headless.ts                   re-exports hero and plugins: everything that needs no page
src/main.ts                       the page's script: starts play in #game
src/lib/same-hash.ts              says whether engines agree, in words
src/features/hero/                hero.ts (entry, the plugin)  move.ts (the Hero component and the system)
src/features/plugins/             plugins.ts (entry: gamePlugins)
src/features/play/                play.ts (entry)  controls.ts  words.ts  read.ts  play.css
scripts/                          write-content.ts  copy-game.ts  same-hash.ts
tests/architecture.test.ts  tests/architecture/rules.ts  tests/architecture/rules.test.ts
tests/pin.test.ts                 the framework pin is a commit, in both places
tests/lib/same-hash.test.ts
tests/game/game-files.test.ts     the game at the root loads and is written the standard way
tests/features/hero/hero.test.ts
tests/features/play/play.browser.test.ts
tests/replay/level-1.parity.test.ts
tests/journeys/                   serve.ts  open.ts  play.journey.test.ts  files.journey.test.ts
                                  pictures.journey.test.ts
tests/workflows/ci.test.ts  tests/docs/readme.test.ts
tests/fixtures/                   game-files.ts  test-game.ts  level-1-play.ts  save-hashes.ts  frames.ts
CLAUDE.md  docs/superpowers/      plans/  audits/  progress.md   (CLAUDE.md and the tracker arrived with this plan)
```

Test file suffixes decide where a test runs: `*.test.ts` in Node; `*.parity.test.ts` in Node and in all three
browsers; `*.browser.test.ts` in the three browsers only; `*.journey.test.ts` in Node, driving one real browser
(named by the `ENGINE` environment variable) against the built `dist/`.

## Review Focus

Inputs the spec does not name but a person will meet. Each has a test in the task that owns the code.

1. **A commit that breaks a game file** (an agent's hand edit that is not valid JSON, a missing file, a file not in
   the standard form): CI says which file and what to do in a plain sentence, and the page shows the same sentence,
   never a blank canvas. Tasks 2, 5, 6.
2. **A pull request that moves the crate** (the editor's whole job in M1): CI must pass and still prove the four engines
   agree. Tasks 4, 6.
3. **Pressing jump in the air**, at the very top of a jump included, and holding jump on landing: one press is one
   jump. Task 3.
4. **A second player in the level:** their keys move only their hero. Task 3.
5. **A phone, held either way, touched for the first time:** the words stay on screen, switch to the buttons' words,
   and never sit under a button. Tasks 5, 6.

---

### Task 1: The repo's skeleton, the pinned framework, CI and the architecture test

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `biome.json`, `knip.json`, `vitest.config.ts`,
  `.gitignore`, `.github/workflows/ci.yml`, `src/index.ts`, `src/headless.ts`, `tests/architecture.test.ts`,
  `tests/architecture/rules.ts`, `tests/architecture/rules.test.ts`, `tests/pin.test.ts`,
  `tests/workflows/ci.test.ts`

**Interfaces:**
- Produces: `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm knip`, `pnpm test:node`,
  `pnpm test:engine <engine>`; CI jobs `check` and `engines (chromium|webkit|firefox)`; and in
  `tests/architecture/rules.ts`:

```ts
export const LAYERS = ['hero', 'plugins', 'play'] as const
export type SourceFiles = Readonly<Record<string, string>> // path from the repo root -> file text
export interface Violation { readonly file: string; readonly rule: string; readonly detail: string }
export function checkArchitecture(files: SourceFiles): Violation[]
```

- [x] **Step 1: Write the config.** Copy `tsconfig.json`, `biome.json`, `knip.json`, `.gitignore` and
  `vitest.config.ts` from AutomataFramework at the pin and change only what follows. `package.json`:

```json
{
  "name": "automataframework-examples",
  "version": "0.0.0",
  "private": true,
  "description": "The demo game made with AutomataFramework.",
  "license": "MIT",
  "type": "module",
  "packageManager": "pnpm@10.34.6",
  "engines": { "node": ">=24.21.0" },
  "imports": { "#src/*": "./src/*" },
  "scripts": {
    "lint": "biome check .",
    "format": "biome check --write .",
    "typecheck": "tsc -p .",
    "knip": "knip",
    "test:node": "vitest run --project node",
    "test:engine": "vitest run --passWithNoTests --project"
  },
  "dependencies": {
    "@automataframework/framework": "github:mcthaydt/AutomataFramework#ec4fddd96d0f1e39365ff807306faf9b42ac3190"
  },
  "pnpm": {
    "onlyBuiltDependencies": [
      "@automataframework/framework@https://codeload.github.com/mcthaydt/AutomataFramework/tar.gz/ec4fddd96d0f1e39365ff807306faf9b42ac3190"
    ]
  }
}
```

  plus the dev dependencies of the Tech Stack line at those exact versions (`@biomejs/biome`, `@types/node`,
  `@vitest/browser-playwright`, `knip`, `playwright`, `typescript`, `vite`, `vitest`), each added by the task that
  first uses it, since knip fails on an unused one. `biome.json`: add `!content` and `!replays` to `files.includes`
  (those files have one writer each, `writeContent` and `writeReplay`, and Task 2 and Task 4 test their form).
  `.gitignore`: add `.hashes/`. `tsconfig.json`: `types` is `["node", "vite/client"]` (for `import.meta.glob` and
  `?raw`), and `include` gains nothing. `knip.json`: `entry` also lists `src/index.ts`, `src/headless.ts`,
  `src/main.ts` and `tests/journeys/serve.ts`; drop the `tests/install/**` ignore. `vitest.config.ts`: the Node
  project also excludes `**/*.journey.test.ts`. `src/index.ts` and `src/headless.ts` start as a comment each.
  Run `pnpm install`; `node_modules/@automataframework/framework/dist/index.js` must exist. If pnpm stops with
  `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`, the string it prints is the one `onlyBuiltDependencies` needs.
- [x] **Step 2: Write `.github/workflows/ci.yml`:** the framework's `ci.yml` at the pin, with the same triggers,
  permissions, concurrency, runner, Node version and pinned action SHAs, cut down to the `check` job (install, lint,
  typecheck, knip, `pnpm test:node`) and the `engines` matrix job (install, `playwright install --with-deps`,
  `pnpm test:engine`). No `package` job (nothing is packed here). The `screens` job and the upload step arrive in
  Task 6, with the first pictures.
- [x] **Step 3: Write the failing tests.** `tests/architecture/rules.test.ts` feeds `checkArchitecture` made-up file
  maps and expects one violation each, by `rule`. Each map names the feature's entry file as the offender, so
  `feature-has-entry` does not also fire:

```ts
const one = (files: SourceFiles) => checkArchitecture(files).map((v) => v.rule)
test('a feature may not import a feature above it', () =>
  expect(one({ 'src/features/hero/hero.ts': "import '../play/play.ts'" })).toEqual(['imports-go-down']))
test('another feature is imported through its entry file', () =>
  expect(one({ 'src/features/plugins/plugins.ts': "import '../hero/move.ts'" })).toEqual(['through-the-entry']))
test('lib imports no feature', () =>
  expect(one({ 'src/lib/a.ts': "import '../features/hero/hero.ts'" })).toEqual(['lib-is-below-features']))
test('no cycles', () =>
  expect(one({ 'src/lib/a.ts': "import './b.ts'", 'src/lib/b.ts': "import './a.ts'" })).toEqual(['no-cycles']))
test('no tests in src', () => expect(one({ 'src/lib/a.test.ts': '' })).toEqual(['no-tests-in-src']))
test('the sim side has no clock, randomness or I/O', () =>
  expect(one({ 'src/features/hero/hero.ts': 'const t = Date.now()' })).toEqual(['sim-is-pure']))
test('the game uses only the framework, by its two entries', () => {
  expect(one({ 'src/features/play/play.ts': "import { Application } from 'pixi.js'" })).toEqual(['only-the-framework'])
  expect(one({ 'src/features/play/play.ts': "import '@automataframework/framework/dist/index.js'" })).toEqual(['only-the-framework'])
  expect(one({ 'src/features/play/play.ts': "import '@automataframework/framework'" })).toEqual([])
})
test('the sim side imports only the headless entry', () =>
  expect(one({ 'src/features/hero/hero.ts': "import '@automataframework/framework'" })).toEqual(['sim-side-is-headless']))
test('a file has at most 600 lines', () =>
  expect(one({ 'src/lib/a.ts': 'x\n'.repeat(601) })).toEqual(['at-most-600-lines']))
test('a feature folder has its entry file', () =>
  expect(one({ 'src/features/hero/move.ts': '' })).toEqual(['feature-has-entry']))
test('headless reaches nothing that needs a page', () =>
  expect(one({ 'src/headless.ts': "export * from './features/play/play.ts'" })).toEqual(['headless-is-headless']))
```

  `tests/architecture.test.ts` is the framework's, unchanged: every `.ts` file under `src/` gives `[]`.
  `tests/pin.test.ts` reads `package.json`:

```ts
test('the framework is pinned to a commit, never a branch', () =>
  expect(dependency).toMatch(/^github:mcthaydt\/AutomataFramework#[0-9a-f]{40}$/))
test('the commit allowed to build is the commit that is pinned', () =>
  expect(onlyBuilt).toEqual([`@automataframework/framework@https://codeload.github.com/mcthaydt/AutomataFramework/tar.gz/${sha}`]))
test('the game depends on nothing but the framework', () => expect(Object.keys(dependencies)).toEqual(['@automataframework/framework']))
```

  `tests/workflows/ci.test.ts` reads `ci.yml`'s text: `permissions:\n  contents: read` at the top; every `uses:` line
  ends in `@` and 40 hex digits; the matrix is `engine: [chromium, webkit, firefox]` with `fail-fast: false`.
- [x] **Step 4: Push; the `check` job fails** because `checkArchitecture` is not defined. This run also answers
  "Before starting" item 2. Open the stage's pull request as a draft now, with a few lines saying what M1 builds here.
- [x] **Step 5: Write `tests/architecture/rules.ts`:** the framework's file at the pin, with first line
  `// Adapted from AutomataFramework@ec4fddd: tests/architecture/rules.ts`, and these changes only. `LAYERS` as above.
  Pure features: `hero`, `plugins` (and `src/lib/`). Page features: `play`. The `package-confined` rule is replaced by
  `only-the-framework` (under `src/`, a specifier that is not relative and not `#src/` must be exactly
  `@automataframework/framework` or `@automataframework/framework/headless`) and `sim-side-is-headless` (in a pure
  feature or `src/lib/`, only the second). `src/main.ts` is checked like a `play` file.
- [x] **Step 6: Push; all jobs pass** (the engine jobs have no tests yet and say so).
- [x] **Step 7: Commit** (`chore: repo skeleton, the pinned framework, CI and the architecture test`).

### Task 2: The game's files

**Files:**
- Create: `automata.toml`, `content/levels/level-1.json`, `content/characters/hero.json`,
  `content/characters/crate.json`, `scripts/write-content.ts`, `tests/fixtures/game-files.ts`,
  `tests/game/game-files.test.ts`

**Interfaces:**
- Consumes: `loadGame`, `parseProject`, `parseContent`, `writeContent`, `formatDiagnostic`, `PROJECT_FILE`,
  `GameContent` from `@automataframework/framework/headless`.
- Produces: `pnpm content:write`; and in `tests/fixtures/game-files.ts`:

```ts
/** Every file of the game at the repo's root, by its path from the root: 'automata.toml', 'content/...'. */
export const gameFiles: Readonly<Record<string, string>>
/** A `read` over them, as `loadGame` takes it. An override replaces a file; `undefined` makes it missing. */
export function readGame(overrides?: Readonly<Record<string, string | undefined>>): (path: string) => Promise<string>
/** The game, loaded. Throws, naming every problem with `formatDiagnostic`, if it does not load. */
export function loadTheGame(overrides?: Readonly<Record<string, string | undefined>>): Promise<GameContent>
```

  `gameFiles` comes from `import.meta.glob(['/automata.toml', '/content/**/*.json'], { query: '?raw', import: 'default', eager: true })`
  with the leading `/` removed from each key, so the same fixture works in Node and in a browser.

  The game:

```toml
# automata.toml
format = 1
name = "Crate Game"
start = "level-1"   # the level a new game opens
hero = "hero"       # the character each player controls

[[content]]
type = "level"
path = "content/levels/level-1.json"

[[content]]
type = "character"
path = "content/characters/hero.json"

[[content]]
type = "character"
path = "content/characters/crate.json"
```

  Level `level-1` is 16 tiles wide and 9 tall: rows 0 to 7 are `#..............#` (a wall at each side, so nothing
  can leave the level) and row 8 is `################`. One thing: `crate-1`, character `crate`, at `(9.5, 7.5)`.
  Starts for players 1, 2, 3 and 4 at `(2.5, 7.5)`, `(4, 7.5)`, `(5.5, 7.5)` and `(7, 7.5)`. Character `hero`:
  dynamic, `0.8` by `1`, `#d7263d`, upright. Character `crate`: dynamic, `1` by `1`, `#f2c14e`, not upright. The red
  and the yellow are what the page's words call them (Task 5). Each JSON file is committed as the text
  `writeContent` gives for it: write the values in `scripts/write-content.ts`'s terms, not by hand (Step 3).

- [x] **Step 1: Write the failing tests** in `tests/game/game-files.test.ts`. They read the real files with
  `node:fs` (so a file the glob would miss is still found) from the repo's root:

```ts
test('the game loads with no problems', ...)
  // loadGame(read from disk) -> ok; on failure the test's message is the formatDiagnostic lines, one per line
test('every content file is written the one standard way', ...)
  // for each [[content]] entry: writeContent(type, parsed value) === the file's text; on failure the message is
  // '<path> is not in the standard form. Run: pnpm content:write'
test('every listed file is under content/, and every file under content/ is listed', ...)
  // so the tests' glob and the build's copy see exactly what the game has
test('the level has a start for each of four players', ...)   // starts' player numbers are [1, 2, 3, 4]
test('the fixture reads the same files the disk has', ...)    // gameFiles toEqual the disk's files
test('a broken file is named in words', async () => {
  const loaded = await loadGame(readGame({ 'content/levels/level-1.json': '{ "format": 1,' }))
  expect(loaded.ok ? [] : loaded.diagnostics.map(formatDiagnostic)).toEqual([
    'content/levels/level-1.json: This file is not valid JSON. Check for a missing comma, quote or bracket.'])
})
```

- [x] **Step 2: Push; `check` fails** because `automata.toml` is missing.
- [x] **Step 3: Write `scripts/write-content.ts`** (`"content:write": "node scripts/write-content.ts"`): read
  `automata.toml` with `parseProject`; for each listed file, `parseContent` it and write back `writeContent`'s text
  when it differs, printing `Rewrote <path>.`; print `Every content file was already in the standard form.` when none
  did. A problem prints its `formatDiagnostic` line and exits 1 without writing that file. With `--check` it writes
  nothing and exits 1 if any file would change. Then write the game's files with any layout and run
  `pnpm content:write` to put them in the standard form.
- [x] **Step 4: Push; all jobs pass.**
- [x] **Step 5: Commit** (`feat(game): one level, the hero and one crate`).

### Task 3: The hero

**Files:**
- Create: `src/features/hero/hero.ts`, `src/features/hero/move.ts`, `src/features/plugins/plugins.ts`; modify
  `src/headless.ts`
- Create: `tests/fixtures/test-game.ts`
- Test: `tests/features/hero/hero.test.ts`

**Interfaces:**
- Consumes: `definePlugin`, `defineSystem`, `defineComponent`, `Player`, `isHeld`, `wasPressed`, `Body`,
  `controlsCommand`, `createGameSim`, `loadGame`, `Transform` from the headless entry.
- Produces:

```ts
// src/features/hero/move.ts
/** Tiles a second the hero runs at. */
export const RUN_SPEED = 6
/** Tiles a second the hero leaves the ground at. Gravity is the framework's default for a game, 30 down. */
export const JUMP_SPEED = 12
/** How many ticks in a row the hero has not been moving up or down. Two or more means "standing on something". */
export const Hero: ComponentDef<{ still: 'u32' }>   // id 'hero', render: false
// src/features/hero/hero.ts
export const heroPlugin: PluginDef   // name 'hero', dependsOn ['physics', 'commands'], components [Hero], one system 'hero.move' in phase 'gameplay'
// src/features/plugins/plugins.ts
/** Everything the sim side of this game is made of. Pass it to createGameSim and startGame as `plugins`. */
export const gamePlugins: readonly PluginDef[]   // [heroPlugin]
// tests/fixtures/test-game.ts
/** A test game the real game's files cannot change. Its files have the real game's paths: automata.toml,
 *  content/levels/level-1.json (32 by 9, floor only, starts for players 1 and 2 at (10.5, 7.5) and (20.5, 7.5),
 *  no things), content/characters/hero.json (0.8 by 1, upright) and content/characters/crate.json (1 by 1). */
export const testGameFiles: Readonly<Record<string, string>>
/** A `read` over them; an override replaces a file and `undefined` makes it missing. */
export function readTestGame(overrides?: Readonly<Record<string, string | undefined>>): (path: string) => Promise<string>
export function loadTestGame(): Promise<GameContent>
```

  The system, for each entity with `Player` and `Body`: add `Hero` if it has none. `vx` is `-RUN_SPEED`, `0` or
  `RUN_SPEED` from `left` and `right` (both or neither is `0`). `still` goes up by one when `|vy| < 0.01` and back to
  `0` otherwise. A jump (`vy = -JUMP_SPEED`, `still = 0`) happens only when `wasPressed(hero, 'jump')` and `still`
  was already 2 or more before this tick. The count is what stops a jump at the very top of a jump: there `vy`
  is 0 for exactly one tick (12 minus 0.5 a tick reaches 0), which the framework's stand-in hero would accept.
  `tests/fixtures/test-game.ts` builds its content files as strings with `writeContent` and loads them with
  `loadGame`, so unit tests never break when an editor moves the crate.

- [x] **Step 1: Write the failing tests.** Each makes `createGameSim({ content: await loadTestGame(), plugins: gamePlugins, players })`,
  steps 10 idle ticks first so the hero is standing, and disposes its sims in `afterEach`:

```ts
test('holding right runs right at RUN_SPEED', ...)        // 60 ticks: Body.vx === 6, x > 10.5 + 4
test('holding left runs left', ...)                       // 60 ticks: Body.vx === -6, x < 10.5 - 4
test('left and right together stand still', ...)          // 60 ticks: vx === 0, |x - 10.5| < 0.01
test('letting go stops the hero on the next tick', ...)   // hold right 30 ticks, send held [], step once: vx === 0
test('a jump leaves the ground and comes back to it', ...)
  // press jump: within 60 ticks the smallest y is below 7.5 - 1.5; 90 ticks after the press |y - 7.5| < 0.05
test('one press is one jump, however long it is held', ...)
  // hold jump for 240 ticks: from tick 100 on, |y - 7.5| < 0.05 at every tick
test('pressing jump in the air does nothing, at the very top too', ...)
  // sim A: one press. sim B: the same press, then let go and press again on alternate ticks for 60 ticks.
  // the smallest y each reaches is the same number (toBe)
test('each player moves only their own hero', ...)
  // players [1, 2]; controlsCommand from source 2 holds right for 60 ticks: hero 1's |x - 10.5| < 0.01, hero 2's x > 20.5 + 4
test('the same inputs end on the same hash twice', ...)   // two sims, the same 120 ticks of commands: equal sim.hash()
test('gamePlugins is the hero', () => expect(gamePlugins.map((p) => p.name)).toEqual(['hero']))
```

- [x] **Step 2: Push; `check` fails** because `hero.ts` does not exist.
- [x] **Step 3: Implement,** and re-export both features from `src/headless.ts`.
- [x] **Step 4: Push; all jobs pass.**
- [x] **Step 5: Commit** (`feat(hero): run and jump, one jump a press, for any player`).

### Task 4: The recorded play, the same in four engines

**Files:**
- Create: `src/lib/same-hash.ts`, `scripts/same-hash.ts`, `replays/level-1.json`,
  `tests/fixtures/level-1-play.ts`, `tests/fixtures/save-hashes.ts`
- Modify: `.github/workflows/ci.yml`, `tests/workflows/ci.test.ts`
- Test: `tests/lib/same-hash.test.ts`, `tests/replay/level-1.parity.test.ts`

**Interfaces:**
- Consumes: `gamePlugins`, `loadTheGame`, `gameFiles`, `createGameSim`, `createRecorder`, `writeReplay`,
  `parseReplay`, `verifyReplay`, `playReplay`, `Played`, `Thing`, `Transform`.
- Produces:

```ts
// src/lib/same-hash.ts
export interface EngineHashes { readonly engine: string; readonly finalHash: string; readonly checks: readonly { readonly tick: number; readonly hash: string }[] }
/** `undefined` when every engine agrees. Otherwise one sentence a person can act on. */
export function describeDifference(runs: readonly EngineHashes[]): string | undefined
// tests/fixtures/level-1-play.ts
export const LEVEL_1_TICKS = 360
/** Player 1's commands for `tick`: hold right from tick 10, add jump at 200, let go at 260, hold left from 300, let go at 340. */
export function level1Play(tick: number): Command[]
// tests/fixtures/save-hashes.ts
/** 'node', 'chromium', 'webkit' or 'firefox': where this test is running. */
export function engineName(): Promise<string>
/** Writes `.hashes/<engine>.json` at the repo's root as an EngineHashes, for scripts/same-hash.ts to compare. */
export function saveHashes(played: Played): Promise<void>
```

  `save-hashes.ts` uses `node:fs/promises` in Node and, in a browser, `server.browser` and `commands.writeFile` from
  `vitest/browser`, each loaded with a dynamic `import()` behind `typeof document === 'undefined'` so neither side
  loads the other's module. In Vitest 5 `commands.writeFile` resolves a path from the project root; if the file lands
  elsewhere in CI, fix the path here, not the script.

  `scripts/same-hash.ts <engine> <engine>...` (`"same-hash": "node scripts/same-hash.ts"`) reads
  `.hashes/<engine>.json` for each name, prints `describeDifference`'s sentence and exits 1, or prints
  `node and webkit both ended on <hash>.` and exits 0. A missing file is
  `webkit did not report its hashes. Did its replay test run?` and exit 1.

  **How the check works, and why.** `verifyReplay` is the strict check: the play ends where it was recorded. It can
  only hold while the game's content is what it was at the recording, and M1's whole point is an editor changing the
  content. So the test accepts two verdicts, `ok` and `content-changed`, and fails on the others; then, whatever the
  verdict, it plays the recording on a fresh sim with `playReplay` and saves the hashes, and CI compares each
  browser's hashes with Node's. Three browsers each equal to Node is all four the same.

  What this leaves open, on purpose: once the content has changed, a change to the game's *code* that alters the
  play is no longer caught by the strict check, only a disagreement between engines is. Taking a fresh recording
  closes it again (delete `replays/level-1.json`, push, and commit what the Node job prints), and since that file is
  the golden it is the Owner who sees before and after. The framework's audit already asks M2 for a replay that
  tells "code changed" from "content changed" (its M4); that plan should settle who re-records and when.

- [x] **Step 1: Write the failing tests.** `tests/lib/same-hash.test.ts`:

```ts
const run = (engine: string, finalHash: string, hashes: string[]) =>
  ({ engine, finalHash, checks: hashes.map((hash, i) => ({ tick: (i + 1) * 60, hash })) })
test('engines that agree', () => expect(describeDifference([run('node', 'f', ['a', 'b']), run('webkit', 'f', ['a', 'b'])])).toBeUndefined())
test('the first tick where two engines part is named', () =>
  expect(describeDifference([run('node', 'f', ['a', 'b']), run('webkit', 'g', ['a', 'c'])])).toBe(
    'node and webkit disagree from tick 120: node has b, webkit has c. The same play must come out the same in every engine.'))
test('only the end differs', () =>
  expect(describeDifference([run('node', 'f', ['a']), run('firefox', 'g', ['a'])])).toBe(
    'node and firefox agree at every check but end differently: node on f, firefox on g. The same play must come out the same in every engine.'))
test('a different number of checks is a difference', () =>
  expect(describeDifference([run('node', 'f', ['a', 'b']), run('chromium', 'f', ['a'])])).toBe(
    'node took 2 check hashes and chromium took 1. They did not play the same recording.'))
test('one engine is not a comparison', () =>
  expect(describeDifference([run('node', 'f', [])])).toBe('Only node reported its hashes. The check needs at least two engines.'))
test('none is not a comparison', () => expect(describeDifference([])).toBe('No engine reported its hashes.'))
test('with three engines the first pair that differs is named', ...)   // node, chromium agree; webkit differs -> 'node and webkit ...'
```

  `tests/replay/level-1.parity.test.ts`, with the recording read through
  `import.meta.glob('/replays/level-1.json', { query: '?raw', import: 'default', eager: true })` so a missing file is
  an empty object, not a failed import:

```ts
test('the recorded play of level 1 still plays, and this engine reports where it ends', async () => {
  // No recording yet: play level1Play for LEVEL_1_TICKS through createRecorder on the game with gamePlugins and throw
  //   'REPLAY NOT RECORDED. Commit this as replays/level-1.json:\n' + writeReplay(recorder.replay())
  // Otherwise: verdict = verifyReplay(fresh game sim, parseReplay(text)).
  //   ok or reason 'content-changed' -> pass. Anything else fails with:
  //   'The game no longer plays the way it was recorded: <reason>, <detail or tick>. If the game's code was meant to
  //    change the play, take a new recording: delete replays/level-1.json, push, and commit what the Node job prints.'
  // Then: saveHashes(playReplay(another fresh game sim, replay)).
})
test('in the recorded play the hero pushes the crate, while the level is as it was recorded', async () => {
  // Only when the verdict above is ok: after playReplay, crate-1's Transform.x is more than 1 tile right of the x
  // in the level file, and less than 15 (still inside the walls). When the content changed, the test passes and
  // logs 'The level changed since the recording, so where the crate ends is not checked.'
})
test('the recording is written the one standard way', ...)   // writeReplay(parseReplay(text)) === text
```

  `tests/workflows/ci.test.ts` gains: the `engines` job runs, in this order, `pnpm test:engine ${{ matrix.engine }}`,
  `pnpm vitest run --project node tests/replay` and `pnpm same-hash node ${{ matrix.engine }}`.
- [x] **Step 2: Add those two steps to the `engines` job** after `pnpm test:engine`. Push; `check` fails because
  `same-hash.ts` does not exist.
- [x] **Step 3: Implement** `same-hash.ts`, the script and the fixtures, with no `replays/level-1.json` yet. Push;
  the Node tests now fail with `REPLAY NOT RECORDED` and nothing else. Copy the recording from the Node job's log
  into `replays/level-1.json` exactly as printed.
- [x] **Step 4: Push; all jobs pass,** and each engine job's log has the line
  `node and <engine> both ended on <hash>.` with one hash across the three jobs, equal to the recording's `finalHash`.
  If a browser differs from Node, stop and report: that is a determinism defect, not a flake.
- [x] **Step 5: Prove the editor's case once, by hand, on the branch.** Push a commit that only changes `crate-1`'s
  `x` to `11.5` in `level-1.json`. Every job must pass, the three `same-hash` lines must agree on one hash that is
  *not* the recording's `finalHash`, and the Node log must carry the "level changed" line. Then push the revert. Put
  both run numbers in the coordinator's line. (Task 6's journey keeps this proven; this step shows it in CI's own
  terms before the page exists.)
- [x] **Step 6: Commit** (`feat(replay): the recorded play of level 1, compared across four engines`).

### Task 5: The page's pieces

**Files:**
- Create: `src/features/play/play.ts`, `controls.ts`, `words.ts`, `read.ts`, `play.css`; modify `src/index.ts`
- Create: `tests/fixtures/frames.ts` (the framework's `tests/fixtures/game/frames.ts` at the pin, importing `Frames`
  from the package; first line `// Copied from AutomataFramework@ec4fddd: tests/fixtures/game/frames.ts`)
- Test: `tests/features/play/play.browser.test.ts`

**Interfaces:**
- Consumes: `loadGame`, `formatDiagnostic`, `startGame`, `webHost`, `Game`, `Host`, `Frames`, `Controls` from
  `@automataframework/framework`; `gamePlugins`.
- Produces:

```ts
// controls.ts
export const CONTROLS: Controls
  // left:  { label: 'Left',  keys: ['ArrowLeft', 'KeyA'],  side: 'left' }
  // right: { label: 'Right', keys: ['ArrowRight', 'KeyD'], side: 'left' }
  // jump:  { label: 'Jump',  keys: ['Space', 'ArrowUp'],   side: 'right' }
// words.ts: every word the page can show
export const WORDS = {
  loading: 'Loading the game…',
  goal: 'You are the red box. Push the yellow box.',
  keys: 'Hold the left or right arrow key to move. Press Space to jump.',
  touch: 'Hold Left or Right to move. Tap Jump to jump.',
  problemTitle: 'This game has a problem and cannot start.',
  problemFix: 'Fix the file named above, then load this page again.',
  cannotStart: 'This game could not start in this browser. Try another browser.',
} as const
// read.ts
/** A `read` for loadGame that fetches `path` relative to `base`. Rejects unless the server answers 200 to 299. */
export function readFrom(base: string | URL): (path: string) => Promise<string>
// play.ts
export type PlayState = 'loading' | 'playing' | 'problem'
export interface PlayOptions {
  readonly root: HTMLElement
  readonly read: (path: string) => Promise<string>
  readonly host?: Host                       // default webHost()
  readonly frames?: Frames                   // default: the page's animation frames
  readonly coarse?: boolean                  // default: matchMedia('(pointer: coarse)').matches
  readonly start?: typeof startGame          // default startGame; a test passes one that throws
}
export interface Play {
  readonly state: 'playing' | 'problem'
  readonly game: Game | undefined            // undefined on a problem
  stop(): void                               // stops the game and empties the root. Safe to call twice.
}
/** Loads the game through `read` and starts it in `root`. Never rejects: anything that goes wrong is a screen of words. */
export function play(options: PlayOptions): Promise<Play>
```

  `play` sets `root.dataset.state` and builds, inside `root`:

```html
<div class="play-stage"></div>                         <!-- startGame's mount: fills the root -->
<div class="play-words">                               <!-- over the sky, at the top -->
  <p class="play-goal">…WORDS.goal…</p>
  <p class="play-how">…WORDS.keys or WORDS.touch…</p>
</div>
<div class="play-problem" role="alert">                <!-- only in state 'problem'; then there is no stage -->
  <h1>…WORDS.problemTitle or WORDS.cannotStart…</h1>
  <ul><li>…one formatDiagnostic line per problem, in order…</li></ul>
  <p>…WORDS.problemFix…</p>                            <!-- not shown for cannotStart -->
</div>
```

  While loading, `.play-words` holds one `<p>` with `WORDS.loading`. `.play-how` starts as `touch` when `coarse`,
  otherwise `keys`, and switches to `touch` for good on the first `pointerdown` in the root with
  `pointerType === 'touch'` (the same moment the framework shows its buttons). For `cannotStart` the list holds the
  thrown error's message. `play.css` (imported by `play.ts`): the root is `position: relative; overflow: hidden`
  and takes its size from its parent; the stage fills it; the words are centred at the top inside the safe-area
  insets, at most the root's width less 16 px, `#1b1b24` on `rgba(255, 255, 255, 0.85)`, at least 18 px, and
  `pointer-events: none` so they never take a touch meant for the game; the problem screen is `#1b1b24` on `#ffffff`,
  scrolls if it is long, and its text is at least 18 px. Font: `system-ui, sans-serif`.

- [x] **Step 1: Write the failing tests** (each engine; a 390 by 844 root unless said; `manualFrames()`;
  `read: readTestGame(overrides)`; `stop()` in `afterEach`):

```ts
test('play fills the root, starts the game and says so', ...)
  // state 'playing', root.dataset.state 'playing', a canvas the size of the root, game.sim.tick === 0
test('the words say who you are and how to move with keys', ...)       // coarse false: goal and keys, exactly
test('on a touch screen the words name the buttons', ...)              // coarse true: goal and touch
test('the first touch switches the words to the buttons, for good', ...)  // touch pointerdown, then a mouse one: still touch
test('holding the right arrow key moves the hero', ...)                // keydown ArrowRight, 60 frames: tick 60, hero x > start + 4
test('the words stay inside a small phone and are big enough to read', ...)
  // roots 320x568, 390x844, 844x390: .play-words' box is inside the root; font-size >= 18 px
test('the words never sit under a touch button', ...)                  // same three roots, after a touch: no overlap with any button's box
test('a game that does not load shows every problem in order, and no canvas', ...)
  // level file '{ "format": 1,' and crate.json missing -> state 'problem', game undefined, no canvas, an element with role alert holding,
  // in order: WORDS.problemTitle, 'content/levels/level-1.json: This file is not valid JSON. Check for a missing comma, quote or bracket.',
  // 'content/characters/crate.json: This file is listed in automata.toml but is missing.', WORDS.problemFix
test('a read that throws something odd is still a problem screen, not a rejection', ...)   // read rejects with 'x' and with undefined
test('a game that cannot start says so, with the reason', ...)         // start: () => Promise.reject(new Error('No WebGL')) -> cannotStart, 'No WebGL', no problemFix
test('stop empties the root and can be called twice', ...)
test('readFrom fetches beside its base and rejects when the file is not there', ...)
  // against Vitest's own server: readFrom(new URL('/', location.href))('automata.toml') resolves with text starting 'format = 1';
  // ('no-such-file.json') rejects
test('both entries of the framework share one Player', async () => {
  // A bundler that copied the shared code into each entry would make two of everything, and a hero made with one
  // would be invisible to the other.
  const [browser, headless] = await Promise.all([import('@automataframework/framework'), import('@automataframework/framework/headless')])
  expect(browser.Player).toBe(headless.Player)
})
```

- [x] **Step 2: Push; the three engine jobs fail** because `play.ts` does not exist.
- [x] **Step 3: Implement,** and re-export `play` (the feature's entry, which re-exports `CONTROLS`, `WORDS` and
  `readFrom`) from `src/index.ts`.
- [x] **Step 4: Push; all jobs pass.**
- [x] **Step 5: Commit** (`feat(play): the game on a page, with words for what to do and for what went wrong`).

### Task 6: The page, the build and the journeys

**Files:**
- Create: `index.html`, `src/main.ts`, `vite.config.ts`, `scripts/copy-game.ts`, `tests/journeys/serve.ts`,
  `tests/journeys/open.ts`, `tests/journeys/play.journey.test.ts`, `tests/journeys/files.journey.test.ts`,
  `tests/journeys/pictures.journey.test.ts`
- Modify: `package.json`, `vitest.config.ts`, `.github/workflows/ci.yml`, `tests/workflows/ci.test.ts`

**Interfaces:**
- Consumes: `play`, `readFrom`, `gamePlugins`, `loadTheGame`, `readGame`, `createGameSim`, `verifyReplay`,
  `playReplay`, `parseReplay`, `writeContent`, `parseContent`, `Thing`, `Transform`.
- Produces: `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm test:journeys`; `window.automataGame`; and in
  `tests/journeys/open.ts`:

```ts
export const ENGINE: 'chromium' | 'webkit' | 'firefox'     // process.env.ENGINE, default 'chromium'; anything else throws
export const SIZES = {
  'phone-390x844': { width: 390, height: 844, touch: true },   'phone-844x390': { width: 844, height: 390, touch: true },
  'tablet-820x1180': { width: 820, height: 1180, touch: true }, 'tablet-1180x820': { width: 1180, height: 820, touch: true },
  'desktop-1280x720': { width: 1280, height: 720, touch: false },
} as const
export interface Opened { readonly page: Page; /** Console errors and uncaught errors seen so far. */ readonly errors: string[]; close(): Promise<void> }
/** Opens the built game in ENGINE and waits until #game is no longer 'loading'. `files` replaces a file the page
 *  fetches (by its path from the game's root); `undefined` answers 404. */
export function openGame(options?: { size?: keyof typeof SIZES; files?: Readonly<Record<string, string | undefined>> }): Promise<Opened>
/** The play so far, from the page. */
export function replayOf(page: Page): Promise<Replay>
/** Waits until the game's sim has reached `tick`. Journeys wait on the game, never on a sleep. */
export function untilTick(page: Page, tick: number): Promise<void>
```

  `index.html`: `<html lang="en">`, `<title>Crate Game</title>`, a viewport meta of
  `width=device-width, initial-scale=1, viewport-fit=cover`, a style block that makes `html`, `body` and `#game` fill
  the window with no margin (`height: 100dvh` on `#game`), `<main id="game"></main>` and nothing else in the body
  but the module script `/src/main.ts`. `src/main.ts` calls `play({ root, read: readFrom(new URL('./', location.href)) })`
  and sets `window.automataGame` to the result's `game` (declared on `Window` in that file). `vite.config.ts`: `base: './'`, `appType: 'mpa'` (so a
  missing file is a 404, not the index page), `build.target: 'es2023'`. `"build": "vite build && node scripts/copy-game.ts"`.
  `scripts/copy-game.ts` reads `automata.toml` with `parseProject` and copies it and every file it lists into
  `dist/` at the same paths; a problem prints its `formatDiagnostic` line and exits 1.

  `vitest.config.ts` gains a fifth project, `journeys`: Node environment, `tests/**/*.journey.test.ts`,
  `globalSetup: tests/journeys/serve.ts`, `testTimeout` 60 s, files run one after another.
  `"test:journeys": "vitest run --project journeys"`. `serve.ts` fails at once with
  `There is no dist/ folder. Build the game first: pnpm build` when `dist/index.html` is missing; otherwise it starts
  Vite's `preview()` on a free port, provides the address as `siteUrl` (declare it on Vitest's `ProvidedContext`),
  and closes the server at the end. Each journey file launches `playwright[ENGINE]` once, opens a fresh context per
  test (viewport and `hasTouch` from `SIZES`), and closes everything it opened.

- [x] **Step 1: Write the failing journeys.** `play.journey.test.ts`:

```ts
test('the game opens, says what to do, and nothing goes wrong', ...)
  // #game[data-state="playing"]; WORDS.goal and WORDS.keys visible; one canvas, visible, the size of the window; errors toEqual []
test('holding the right arrow key pushes the crate, and what was played replays to the same hash in Node', ...)
  // keyboard.down('ArrowRight'); untilTick(180); keyboard.up; replay = replayOf(page)
  // verifyReplay(a Node sim of the game on disk with gamePlugins, replay) toEqual { ok: true }
  // playReplay on another Node sim: crate-1's x is more than 1 tile right of the level file's x
test('on a phone, a touch brings up Left, Right and Jump, and holding Right runs the hero', ...)
  // phone-390x844: touchscreen.tap(195, 300) -> buttons named Left, Right and Jump visible, each at least 48 by 48,
  // WORDS.touch visible; dispatch pointerdown { pointerType: 'touch', pointerId: 1 } on Right; untilTick(+60); pointerup;
  // the replay has a controls command whose held includes 'right', and verifies in Node
test('turning the phone keeps the game on screen and playing', ...)
  // phone-390x844, then setViewportSize(844, 390): still 'playing', the canvas is the size of the window, the tick keeps rising,
  // the words are inside the window
```

  `files.journey.test.ts`:

```ts
test('the game plays the level file it is given: a moved crate is where the file says', ...)
  // files: level-1.json rewritten (parseContent, x 12.5, writeContent); untilTick(30); replay = replayOf(page)
  // verifyReplay(Node sim over the same moved file, replay) toEqual { ok: true }   -> the page read the moved file
  // verifyReplay(Node sim over the disk's files, replay) has reason 'content-changed'
test('a broken level file is shown in plain words, with no game behind it', ...)
  // files: level-1.json '{ "format": 1,' -> data-state 'problem'; the alert holds WORDS.problemTitle,
  // 'content/levels/level-1.json: This file is not valid JSON. Check for a missing comma, quote or bracket.' and WORDS.problemFix;
  // no canvas; window.automataGame is undefined
test('a missing file is named', ...)
  // files: crate.json undefined -> 'content/characters/crate.json: This file is listed in automata.toml but is missing.'
```

  `pictures.journey.test.ts`: for each name in `SIZES`, open, tap once where `touch` is true, `untilTick(30)`, check
  that the words are inside the window and overlap no touch button, and save
  `tests/journeys/__screenshots__/<name>.png`; then one more, `problem-390x844.png`, of the broken-file screen. They
  are compared with nothing: they are what the implementation audit and the Owner look at for the drunk-grandma test.

  A tap must reach the page as a touch. If one engine's `touchscreen.tap` does not make a `pointerdown` with
  `pointerType` `touch`, dispatch that event on the stage in `open.ts` for that engine and say so in the report; do
  not drop the engine. (A hidden page pausing the game is the framework's own test, with a host it can hide; a
  headless browser cannot hide a page for real, so there is no journey for it.)

  `tests/workflows/ci.test.ts` gains the framework's four `screens`
  checks (only that job may write; never for a fork; one push, to `ci-screens`; one writer at a time), and: the
  `engines` job runs `pnpm build` and then `pnpm test:journeys` with `ENGINE: ${{ matrix.engine }}` after `same-hash`.
- [x] **Step 2: Extend `ci.yml`.** In `engines`, after `same-hash`: `pnpm build`, `pnpm test:journeys` with
  `ENGINE` set, and the framework's upload step (`screens-${{ matrix.engine }}`, `tests/**/__screenshots__/**`,
  `if: always()`). Add the framework's `screens` job, unchanged. Push; the three engine jobs fail on the build
  (`index.html` does not exist).
- [x] **Step 3: Implement** the page, the config, `copy-game.ts`, `serve.ts` and `open.ts`. Run `pnpm build` locally
  and check `dist/` holds `index.html`, `assets/`, `automata.toml` and the three content files.
- [x] **Step 4: Push; all jobs pass,** each engine's journeys included, and the `ci-screens` branch holds six
  pictures per engine under `pr-<number>/`. Note in the tracker that the branch now exists (it is the repo's one
  long-lived branch beside `main`).
- [x] **Step 5: Commit** (`feat: the game as a static page, with journeys in three browsers`).

### Task 7: The README, the tracker and the close

**Files:**
- Modify: `README.md`, `CLAUDE.md` (its Structure block, if a file ended up somewhere this plan did not say),
  `docs/superpowers/progress.md`
- Test: `tests/docs/readme.test.ts`

- [ ] **Step 1: Write the failing test** `tests/docs/readme.test.ts`: the README names every script in
  `package.json`'s `scripts` that a person runs (`dev`, `build`, `content:write`, `lint`, `typecheck`); it names
  `automata.toml`, `content/` and `replays/level-1.json`; it does not contain `npm install @automataframework`
  (the package is not on npm before Release 1).
- [ ] **Step 2: Push; `check` fails** on the README.
- [ ] **Step 3: Write `README.md`,** in plain words: what this repo is (the demo game made with AutomataFramework,
  and later the site's examples); how to play it (`pnpm install`, `pnpm dev`); where things are (the project file,
  the content files, the hero's code, the recording); how to change the game (edit a content file, run
  `pnpm content:write`, open a pull request; CI checks it in four engines); what the recording is and how a new one
  is taken (Task 4's words, and that the Owner sees before and after); that tests run only in GitHub Actions; the
  licence. No strategy, market, competitor or pricing words.
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: The whole-branch review** (`superpowers:executing-plans`, "Final Review"; a self-review, since the
  project allows no subagents). Fix what it finds, test first.
- [ ] **Step 6: Close the stage.** Mark the pull request ready, set the tracker's stage to 100%, and send the
  coordinator the end summary: commits, test counts per job, the recording's `finalHash`, the two run numbers of
  Task 4 Step 5, every deviation, the deferred minors, and what is the Owner's: marking `check` and the three
  `engines` checks as required on `main` (repo settings, which no session can change), and looking at the pictures
  on `ci-screens`.
- [ ] **Step 7: Commit** (`docs: the README and the tracker for M1`).
