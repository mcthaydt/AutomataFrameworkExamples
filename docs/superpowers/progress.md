# Progress

The tracker every stage reads first and updates last. One section per cycle; newest first. The spec and the
framework's own tracker are in AutomataFramework
([spec](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
[tracker](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/progress.md)).

## Cycle 2: the Blueprint look for the game's own screens

Spec: the section "Visual direction" of the spec linked above (the Owner, 2026-11-14).
Plan: [`plans/2026-11-14-blueprint-look-examples.md`](plans/2026-11-14-blueprint-look-examples.md)

Overall: **82%** (the same weights as cycle 1: stage 2 is worth 12 points, stage 3 is 6, stage 4 is 50, stage 5 is 14,
stage 6 is 12 and the Owner's review is the last 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Done (in AutomataFramework, pull request 20) | the spec's "Visual direction" |
| 2. Plan | Done, 100% (in review) | `plans/2026-11-14-blueprint-look-examples.md` |
| 3. Plan audit | Done, 100% (in review) | `audits/2026-11-14-blueprint-look-examples-plan-audit.md` |
| 4. Execution | Done, 100% (in review; each of six tasks is 16% of the stage, the close 4%) | three pull requests: AutomataFramework 21 (the button properties), Examples 13 (the pin move), Examples 14 (the look, in palette No. 340) |
| 5. Implementation audit | Done, 100% (in review) | `audits/2026-11-14-blueprint-look-examples-implementation-audit.md` |
| 6. Fixes | Not started | |
| 7. Owner review | Not started | |

### Log

- 2026-11-14: The Owner approved new words for the goal: "You are the box on the left. Push the other box to the
  flag." Two things are open before F2 can start, both sent to the coordinator: the game has no flag, and the "done"
  sentence (which names "the green box") has no new words yet.
- 2026-11-14: The Owner answered the audit's Q2: (c), an editor may change the demo's colours and the words stop
  naming colours. The new words are the Owner's and not yet given; F2 waits only for them.
- 2026-11-14: The Owner answered the audit's Q1: (a), the words stay as they are until M2 gives the boxes real
  characters. Q2 (may an editor change the demo's colours) is still open, so F2 still waits.
- 2026-11-14: Stage 5. The implementation audit is written, for `main` at `1aca8cf` (CI run 43552571486 green in
  `check` and all three `engines` jobs). It is a design audit: the code, the 33 pictures of pull request 20 and the 33
  of `main` were read against the spec's "Visual direction" and the Owner's decisions. Nothing blocks. Four things for
  stage 6: F1, the tests' own level (`pinned-level.ts`) never got the new sky and ground, which is why the "well done"
  picture shows the old light blue (the game itself is right); F2, `art.test.ts` fails if an editor changes a colour,
  against this repo's rule that a content-only change passes CI (waits for Q2); F3, the game ships Fredoka and five
  Phosphor icons without their licence notices; F4, the spec's table, the plan's boxes, this tracker's stage 4 row
  (eight pull requests, not three) and a few comments are behind what was built. Ten small notes. Two questions for
  the Owner, sent to the coordinator and not decided: Q1, the words tell the boxes apart by colour alone, which is
  hard for red-green colour-blind players; Q2, whether an editor may change the demo's colours. Every pair a person
  reads passes the contrast test (the closest is 5.05 to 1) and the colours are exact in all three browsers. No tests
  were run here; both goldens are untouched.
- 2026-11-14: Stage 4, a second deviation the coordinator asked for: the fonts (the Owner: 2A, one font). The screens'
  one font is Fredoka (`@fontsource/fredoka` 5.3.0, the `latin-600` file); IBM Plex Sans Condensed and JetBrains Mono
  and the "measuring font" for a problem's file path are gone, so a path is told apart by its quieter colour. Nothing
  is set below 18 pixels any more (the touch labels and the path line were 15), and `font-synthesis: none` stops a
  browser faking a weight. The Korean and Chinese partner fonts (M PLUS Rounded 1c, Jua, ZCOOL KuaiLe) join with the
  first translation, since the words exist in English only so far. Goldens untouched.
- 2026-11-14: Stage 4, the last part of palette No. 276 for the art (Examples pull request 19): `level-1.json` sets
  `sky` Black `#111314` and `ground` Seashell Pink `#fdd4bd`. Chosen from the four colours of the palette so both boxes
  stand clear of the sky behind them: the pink hero is 7.3 to 1 and the green crate 11.1 to 1 against Black (against
  Seashell they would be 1.9 and 1.2 to 1), and the ground is 13.7 to 1; a test holds each to 3 to 1 at least. Only
  the level file changes. The tiles' colour is part of the sim's state, so the `level-1` replay hash moves with the
  content (the check accepts "the content changed" and compares the engines); `test-game.json` and both golden files
  are untouched.
- 2026-11-14: The framework pin moves from `984c4e4` to `874f7d5` (AutomataFramework pull request 25: a level file may
  set `sky` and `ground` colours, both optional and the old light blue and slate when left out). The change is the
  dependency, its `onlyBuiltDependencies` line and the lockfile; nothing else, so the game and both goldens must look
  and play as before. The next pull request puts the colours of palette No. 276 into `level-1.json`.
- 2026-11-14: Stage 4, a deviation the coordinator asked for: one more pull request in the execution stage (Examples
  pull request 17), the example game's art in palette No. 276 (the Owner: B for the example games). The hero is
  Eosine Pink `#f37f94` and the crate Yellow Green `#afd472`; the words say "You are the pink box. Push the green box."
  (the Owner chose "green box" for the crate; "pink box" follows from the hero's new colour and is for him to
  overrule). Only two content files and the words change, so both goldens stay as they are. The sky and the ground
  are the framework's constants (`SKY_COLOR`, `TILE_COLOR`) and no level can set them, so they keep their old colours
  until the framework gains a way to set them. The page's words exist in English only so far, so there are no other
  languages to change. The Owner then chose Peach Red (palette No. 340) for a held touch button, in place of Sea Green,
  so a held button cannot be taken for the green crate; "pink box" is his too.
- 2026-11-14: Stage 4 done (Tasks 3 to 6, Examples pull request 14). The game's own screens take the Blueprint look in
  palette No. 340 of *A Dictionary of Color Combinations* (the Owner: D for the demo's screens): black paper
  `#111314`, Neutral Gray words `#b6bfc1`, Sea Green `#00b49b` on a touch button only while it is held (later changed to Peach Red `#f15a30`, see the next entry), and a panel and
  quiet-words shade mixed from the first two. Peach Red is not used. The Owner's answer to Q1 was (a): buttons are quiet
  at rest, coloured only when held; sea green rather than yellow keeps a held button from being taken for the yellow
  crate. All checks are green in Chromium, Firefox and WebKit. The pictures (`ci-screens`, `pr-14/`) show: the words
  and the three buttons read at once on a phone upright and sideways, a held Jump is plainly sea green and not like the
  crate, "well done" has a tick, a broken file says on black paper which file and what to do, and the level, hero and
  crate are exactly as before. Both goldens are unchanged. Still to do, as its own pull request: the example games' own
  art takes palette No. 276 and the words say "green box" (the Owner, 2026-11-14).
- 2026-11-14: Stage 4, Task 2 (the plan's Part B). The framework pin moves from `9109fa3` to `984c4e4` (AutomataFramework
  pull request 21: the touch buttons read their look from seven `--automata-touch-*` CSS properties and carry the
  classes `automata-touch` and `automata-touch-button` and `data-action`). The change is the dependency, its
  `onlyBuiltDependencies` line and the lockfile; nothing else, so the game and both goldens must look and play as before.
- 2026-11-14: Stage 3. The plan audit is written, and its findings are already in the plan. The plan is true to the
  spec's "Visual direction" on colour, dark, fonts, icons, the art and the end-to-end tests. One blocking finding: the
  game says "Push the yellow box" and the plan made the buttons yellow, so a held button was a bigger yellow box than
  the crate. How the buttons look during play is now a question for the Owner (Q1, three choices), and execution
  waits for it. Also changed in the plan: a problem's sentence is no longer set in the measuring font (only where it
  is), a chalk ring shows where the keyboard is, "well done" has a journey, and the font packages are recorded as
  approved. Checked by unpacking the three packages and building one page with Vite; no tests were run.
- 2026-11-14: Stage 2. The plan is written. What it found: the touch buttons are drawn by the framework with their look
  set inline, so the look needs a small framework change first (the buttons read seven CSS properties, with today's
  look as the default), then a pin move, then the look here. The game's art, its words and both goldens do not change.
  One thing waited for the Owner: a yes to the exact font packages the plan names (given 2026-11-14).

## Cycle 1: the 2D first layer, this repo's share of M1

Plan: [`plans/2026-11-13-m1-thin-thread-examples.md`](plans/2026-11-13-m1-thin-thread-examples.md)

Overall: **90%** (stage 2 is worth 12 points, stage 3 is 6, stage 4 is 50, stage 5 is 14, stage 6 is 12 and the
Owner's review is the last 6; stage 1, the spec, was done in AutomataFramework)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Done (in AutomataFramework) | the spec linked above |
| 2. Plan (M1, Examples) | Done, 100% (in review) | `plans/2026-11-13-m1-thin-thread-examples.md` |
| 3. Plan audit | Done, 100% (in review) | `audits/2026-11-13-m1-examples-plan-audit.md` |
| 4. Execution | Done, 100% (in review) | the plan, ticked as it goes (each task is 14% of the stage, the close 2%) |
| 5. Implementation audit | Done, 100% (in review) | `audits/2026-11-13-m1-examples-implementation-audit.md` |
| 6. Fixes | Done, 100% (in review) | F1 to F4 of the implementation audit, in pull request 7 |
| 7. Owner review | Not started | |

Milestones, for this repo:

| Milestone | State |
|---|---|
| M1 The thin thread: one level, the hero, one crate, checked in four engines | In progress |
| M2 The demo game's full content and every built-in | Not started |

### Log

- 2026-11-13: The pin moved from `2a8b09f` to `9109fa357193f57e2d12271c6e6b58dbd783b427` (AutomataFramework pull
  request 19, "stop zod's eval probe before anything else loads"). Under the Site's strict CSP
  (`script-src 'self' 'wasm-unsafe-eval'`) Firefox logged a blocked eval from `/play/assets/headless-*.js`: zod probes
  `new Function` the first time a schema needs it, and the headless modules built schemas before the switch that stops
  the probe ran. Both entries now import a module that sets it first. No game code changed; the framework's own tests
  load each entry with `Function` throwing and count the attempts in all three browsers.

- 2026-11-13: The words now sit in a strip of their own above the game, not over its top (the Owner's sideways-layout
  rule: held sideways on a phone the level fills the height, and the words hid its upper wall). The cause was this
  repo's page, not the framework: `.play-words` was laid over the stage. `.play-root` is now a flex column (the
  words, then the stage), the canvas is taken out of the flow so its own size cannot decide the stage's, and
  `index.html`'s `#game` rule no longer sets `display` (an id rule beat the class and kept the root from being flex;
  found by looking at the first build, where the level was cut off). Tests first: a browser test and
  `tests/journeys/words.journey.test.ts` (at every size the words end where the canvas begins and the canvas runs to
  the bottom of the window), red on the old page in all three engines, and the two older journey checks that
  expected a window-sized canvas now expect the strip. A framework note, not a patch: a mount whose height comes from
  its own canvas can grow past its container; a canvas that is not in the flow avoids it.
- 2026-11-13: The pin moved from `ec4fddd` to `2a8b09f` (AutomataFramework pull request 14, "keep the touch buttons off
  the play area": the level is now fitted above the touch buttons). `tests/journeys/layout.journey.test.ts` looks at a
  picture of the page after a first touch, finds the hero (the one red thing) and checks that Left, Right and Jump sit
  on none of it, at phone and tablet sizes held both ways. Red first on the old pin, in all three engines: only
  `phone-844x390` failed, "Right sits on the hero" (this closes the deferred minor about the sideways buttons).
  Green on the new pin in all four jobs. New pictures: `ci-screens` under `pr-5/`; looked at: the sideways phone now
  shows the hero and the crate above the buttons. One thing to know: the words box still covers the top of the level on
  a sideways phone (the upper wall, nothing to play with), which M2's title and pause screens take over.
- 2026-11-13: Stage 6. The four audit findings are fixed, in pull request 7 (built on pull request 4, which holds the
  audit). F1: the push journey, the done picture and the moved-crate check play `tests/fixtures/pinned-level.ts`
  (the real level's tiles and starts, `crate-1` at 9.5, written with `writeContent`), so a crate an editor puts
  against the right wall, left of the hero, or deletes can no longer turn CI red; the journeys that only open, play
  and replay stay on the real files. F2: the README's step 1 installs Corepack first (`npm install --global
  corepack@latest`, then `corepack enable`), since Node 25 and later do not ship it, and the commands table says
  `pnpm dev` reloads on a change to the code only; `tests/docs/readme.test.ts` checks the order. F3: `CLAUDE.md` and
  the plan's contract say an Edit or Owner save is committed straight to `main` and a Suggest or Approve save is a
  pull request approved in the editor; that an Edit save lands before CI runs, so CI's push run is its check and the
  Site shows only the newest passing commit; both `replays/level-1.json` and `replays/test-game.json` are goldens;
  and the Structure block lists `replays/test-game.json`, `tests/pin.test.ts`, `tests/framework.test.ts` and
  `tests/architecture/`. F4: `readFrom` answers "no such file" for a page, as for a 404 (a `content-type` of
  `text/html`), with a browser test. Plan audit Q1 is answered (the Owner, 2026-11-13): the editors' save branches
  (`automata/<login>`) do not count toward the five-branch cap, because this repo is our test game and the editors
  are a product for other teams' repos; `CLAUDE.md` says so. The Site plan should still ship a top-level `404.html`.
  The seven minors (M1 to M7) stay for later milestones.
  Proof, as Task 4 Step 5 did it: the F4 test alone was red in all three engines (run 43524032769), the fix made
  every job pass (run 43524196965); then `crate-1` moved to 14.5, against the right wall, passed every job (run
  43524540782, no journey fails) and was reverted in the next commit.
- 2026-11-13: Stage 5. The implementation audit is written, for pull request 3 at `bc922f8` (CI run 43522330339
  green: `check` 57 tests, each engine 20 browser, 5 replay and 14 journey tests; level 1 ends on
  `77be68a6e1859241` in all four engines). Nothing blocks the merge. Four should-fix findings for stage 6: F1, the
  journeys check the push against the real level's crate, so a crate an editor puts near the right wall or left of
  the hero fails CI (they should play a level the tests own); F2, `corepack enable` fails on Node 25 and later; F3,
  `CLAUDE.md` and the contract are behind the spec's Edit-saves-go-straight-in and don't name `test-game.json` as a
  golden; F4, `readFrom` takes a host's web page for a game file. Seven minors noted. The four deferred minors and every
  ruling were judged; all stand, and deferred minor 2 is raised to F4. Stage 6 applies F1 to F4.
- 2026-11-13: Stage 4, Task 7 and the close. The README gets a stranger from clone to a changed game (install, play,
  change `crate-1`'s `x`, `pnpm content:write`, reload) and `tests/docs/readme.test.ts` reads it for the scripts and
  files it names. Audit B1, S4 and N5 are applied to the plan and `CLAUDE.md` (editors open pull requests). The
  whole-branch review was a self-review by the author (no subagents, project rule), so it is weaker than a fresh
  reviewer's; the stage 5 audit is the fresh one. It found nothing Critical or Important. Deferred minors:
  (1) `stop()` called while the files are still loading lets the game start afterwards; (2) `readFrom` on a host that
  answers a missing file with the page itself (200) gives "not valid" words, not "no such file"; (3) a finger that
  touches the screen while the page is still loading does not switch the words to the buttons' words; (4) sideways on
  a phone the buttons sit over the hero's start place, a framework layout matter (touch buttons overlay the mount,
  `fitWorld` fits the whole mount): the framework landscape fix is in another thread, then a pin move and a journey.
- 2026-11-13: Stage 4, Task 6. The page (`index.html`, `src/main.ts`), the build (`pnpm build` makes `dist/`, which plays
  from any path) and the journeys (the built page, served by `vite preview`, played in a real browser in each engine:
  the goal words, the first touch switching them to the buttons' words, the done words after a push, the same
  sentence on a broken file). The first full run failed in all three engines on one test: Task 5's `readFrom` check
  asked the dev server for a missing file and, now that `index.html` exists, it answers with the page (200), as a
  single-page host would. The check now makes its own 404. `ci-screens` now exists: seven pictures per engine under
  `pr-3/` (phone, sideways phone, tablet both ways, desktop, done and problem). Looked at: the words and buttons read
  well upright; sideways on a phone the Left and Right buttons sit over the hero's starting place (the level fills the
  height). Not fixed here; it is for the implementation audit and the Owner to judge.
- 2026-11-13: Stage 4, Task 5. The page's pieces are in `src/features/play/`: the words (`words.ts`, one place for every
  sentence a player reads), the controls (`controls.ts`), the problem reader (`read.ts`) and `play.ts`, which loads the
  game, starts it and changes the goal line to "done" once the crate has been pushed more than a tile. Red first
  (`play.ts` missing: the `check` job failed on that import), then green in all four jobs.
- 2026-11-13: Stage 4, Tasks 3 and 4. The hero is in (run, jump once a press, any player). The recorded plays are in:
  `replays/level-1.json` (final hash `77be68a6e1859241`, taken from the Node job's log; node, chromium, webkit and
  firefox all ended on it) and, from audit S1, `replays/test-game.json` (final hash `44468dddbdc870ec`), a play of a
  game built inside the tests that no content edit can reach, checked strictly in every engine, so a code change that
  alters the play is caught even after the first editor change. Task 4 Step 5, the editor's case: with the crate moved
  to 11.5 every job passed, the engines agreed on `149c9f2b710aa975` (not the recording's hash) and the Node log said
  "The level changed since the recording" (CI run 43520494574); the revert followed. The recordings were written
  through the framework's own `writeReplay` from the values CI printed, so the form is the standard one.
- 2026-11-13: Stage 4, Tasks 1 and 2. The skeleton, the pinned framework, CI and the architecture rules are in
  (every job green on the pull request), and the game's files are in: `automata.toml`, one level, the hero and the
  crate, written by `pnpm content:write`. GitHub-hosted runners accept jobs for this repo ("Before starting" item 2).
  Rulings: `tests/framework.test.ts` (a one-line check that the pinned framework is installed and built) is added
  because knip fails on a dependency nothing imports yet; `pnpm-workspace.yaml` (`saveExact`) is copied from the
  framework; one more test in `game-files.test.ts` uses `loadTheGame`, which knip would otherwise call unused until
  Task 4.
- 2026-11-13: Stage 3. The plan audit is written: two blocking findings (B1: editors now save by pull request, so
  the contract says so and the checks must be required early; B2: the player is never told they pushed the crate),
  seven should-fix (S1, a second golden over the test game keeps the replay check strict after edits), six notes and
  one Owner question (Q1, the branch cap and editor save branches). Execution applies B1, B2 and S1 to S7. The Owner's
  onboarding rule was added to `CLAUDE.md`.
- 2026-11-13: Stage 2. The plan for this repo's share of M1 is written: seven tasks, from the skeleton and CI to the
  built page and its journeys in three browsers. With it came this tracker and `CLAUDE.md` (the spec asks for
  `CLAUDE.md` in a repo's first pull request).
- 2026-11-13: Found while planning: a git install of the framework had no `dist/`, because the framework had no
  `prepare` script. AutomataFramework PR 13 added it; its merge commit `ec4fddd96d0f1e39365ff807306faf9b42ac3190` is
  the pin the plan uses. pnpm builds a git dependency only when the consuming repo lists the pinned source in
  `pnpm.onlyBuiltDependencies`; the plan's Task 1 has the exact line. Tried in a scratch folder (an install, not a
  test): the install builds the package and the headless entry imports in Node.

### What the plan decided that other repos meet

In the plan's "What the other repos rely on": the game is at this repo's root; an editor may change any listed
content file, written with `writeContent`; a moved crate passes CI; `pnpm build` leaves a static `dist/` with
relative URLs; the check-run names are `check` and `engines (chromium | webkit | firefox)`. The Editors and Site plan
sessions were told the same on 2026-11-13.

### For the Owner

- Answered: editor save branches do not count toward the five-branch cap (plan audit Q1).
- Done (read through the API on 2026-11-13): `check` and the three `engines` checks are required on `main`, and
  "Automatically delete head branches" is on.
- Look at the pictures CI copies to the `ci-screens` branch, for the drunk-grandma test.
