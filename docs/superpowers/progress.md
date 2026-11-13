# Progress

The tracker every stage reads first and updates last. One section per cycle; newest first. The spec and the
framework's own tracker are in AutomataFramework
([spec](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
[tracker](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/progress.md)).

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
