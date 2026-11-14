# Implementation audit: the Examples repo's M1 thin thread

Written 2026-11-13. Stage 5 (Implementation audit) of cycle 1, for pull request 3 at `bc922f8` (not yet merged), read
against the [spec](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)
as it is on AutomataFramework's `main` today (PR 16 included), the
[plan](../plans/2026-11-13-m1-thin-thread-examples.md), the [plan audit](2026-11-13-m1-examples-plan-audit.md),
`CLAUDE.md` and [`progress.md`](../progress.md) (the stage 4 log, rulings and deferred minors). The framework's
[implementation audit](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/audits/2026-11-13-m1-framework-implementation-audit.md)
set the format and the bar.

## The answer first

The build is what the plan asked for, with every plan-audit finding applied (B1, B2, S1 to S7), and it holds
together. CI on `bc922f8` (run 43522330339) is green in all five jobs: `check` ran 57 Node tests in 11 files; each
engine job ran 20 browser tests in 3 files, 5 Node replay tests in 2 files and 14 journeys in 3 files. The recorded
play of level 1 ends on `77be68a6e1859241` in Node, Chromium, WebKit and Firefox (each engine job's log says so), and
the strict test-game recording passes in all four. All 20 commits are by McThayDT, none carries AI attribution,
and no strategy text is in the tree. The pictures on `ci-screens` under `pr-3/` were looked at, all 21 of them.

Nothing here blocks merging pull request 3. There are **four should-fix findings** for Stage 6 (Fixes), F1 to F4.
The one that matters most is F1: the journeys check that the hero pushes the crate **wherever the real level file
puts it**, so an editor moving the crate near the right wall, or to the hero's left, turns CI red in every engine.
That is the M1 "done means" move. F2 is onboarding: the README's first command fails on the Node a stranger downloads
today. Seven minor items are noted for later (M1 to M7).

Two things are open and are **not code findings**:

- **The sideways phone.** The Left and Right buttons sit over the hero's start (pictured, all three engines). It is
  being fixed in the framework (AutomataFramework PR 14), then a pin-move pull request here. What that pull request
  must carry is under "The rulings, reviewed".
- **The spec moved after the plan audit.** PR 16 says an Edit-level save goes straight into the default branch and
  an Approve-level person approves in the editor. This repo's contract still says every save is a pull request a
  person merges on GitHub. F3 brings the words up to date; F1 is what makes the new flow safe.

## Method

- Read every file the pull request adds: `src/` in full, `scripts/`, every test and fixture, `ci.yml`, the configs,
  the README, `CLAUDE.md`, and both recordings.
- Read the run's job logs for test counts and the three `same-hash` lines. Read the repository settings through the
  API: `main` requires `check` and the three `engines` checks, and "Automatically delete head branches" is on.
- Read the framework at the pin `ec4fddd` where the game relies on it: the touch buttons (shown at once on a touch
  screen, else on the first finger), the outlined boxes, and the sky colour.
- Looked at all seven pictures in each engine (phone and tablet both ways, desktop, done, problem).
- Worked the crate's room by hand: the right wall is column 15, so the crate's centre can go no further than 14.5.
- `git log` for authors and attribution; a search of the tree for strategy words.
- No tests were run (project rule).

## Against the spec and the plan

| Spec or plan line | Where | Verdict |
|---|---|---|
| M1 Examples: one level with the hero and one crate | `automata.toml`, `content/` | Done |
| From the framework pinned to a commit on its `main` | `package.json`, `tests/pin.test.ts` | Done, `ec4fddd` |
| M1 CI: the replay hash the same in four engines | `level-1.parity.test.ts`, `same-hash` | Done, `77be68a6e1859241` |
| A content edit passes, and a code change is still caught | `test-game.parity.test.ts` (audit S1) | Done, `44468dddbdc870ec`, only `ok` passes |
| Done means: the moved crate lands, CI checks it in four engines | Task 4 Step 5 (run 43520494574) | Done for x 11.5; **not for every place an editor can put it (F1)** |
| End-to-end tests | three journey files, against `dist/`, in three browsers | Done |
| A first-time player learns what, how, and that they did it | `words.ts`, the done line (audit B2) | Done; colours are named in code (M3) |
| A first-time developer gets from clone to a changed game | README "Start here" (audit S3) | Done, but step 1 fails on Node 25 and later (F2) |
| Only the published package; sim side headless only | `tests/architecture/rules.ts` | Done |
| Nothing assumes one player | four starts; `hero.test.ts` player 2 | Done |
| No new dependency | `package.json` matches the Tech Stack line | Done |

The interfaces match the plan, name for name, with two deviations, both right: the `Hero.still` count stops at 2
(the plan says "goes up by one"), so it never runs on for the whole game; and `knip.json` does not list `src/main.ts`
and `tests/journeys/serve.ts` as entries, since knip's Vite and Vitest plugins find them (knip passes).

## Should fix (Stage 6)

**F1. CI fails a crate moved near the right wall, or to the hero's left.** Two journeys assert on the real level
file's crate: `play.journey.test.ts` ("holding the right arrow key pushes the crate") expects crate-1 more than one
tile right of where the file puts it after 180 ticks, and expects the done line; `pictures.journey.test.ts` ("how it
looks when the crate has been pushed") expects the done line. Neither holds for every place an editor can drop it:

- At x 13.5 or 14.5 the wall stops the crate within a tile, so "more than 1 tile" fails, and the done line never
  comes (the page's own rule is the same, so that level can't be won either).
- Left of the hero (x 1.5) or in a row the hero never reaches, the hero walks away from it.
- With crate-1 deleted, the first journey reads `undefined`, and `files.journey.test.ts`'s moved-crate check writes the
  same file it read, so `verifyReplay` says `ok` where the test wants `content-changed`.

Each of these fails in all three engine jobs, on a content-only change, which the contract says "breaks nothing".
Under the spec as it now stands, an Edit-level save goes straight into `main`, so the first red run would be on
`main`. *Fix:* the journeys that check gameplay play a level the tests own. Add `tests/fixtures/pinned-level.ts`: the
real level's tiles and starts with crate-1 at 9.5, written with `writeContent`, the way `test-game.ts` is. The push
journey and the done picture open the game with `files: { 'content/levels/level-1.json': pinnedLevel }`, and their
Node sims use the same files (`nodeSim(files)` already takes them). `levelWithCrateAt` starts from the pinned level,
not the disk. Journeys that only open, play and replay in Node stay on the real files. Then prove it once by hand on
the branch, as Task 4 Step 5 did: push the crate at 14.5, every job passes, push the revert, and put both run numbers
in the report.

**F2. The README's first command fails on the Node a stranger downloads now.** Step 1 says "pnpm comes with Node;
switch it on once: `corepack enable`". Node stopped shipping Corepack from version 25, and Node 26 is the LTS on
nodejs.org's front page in November 2026. On it, `corepack enable` is "command not found", which is the first thing a
new developer types. *Fix:* in step 1, `npm install --global corepack@latest`, then `corepack enable`, with one line
saying why ("Node 25 and later no longer include it"). Keep `tests/docs/readme.test.ts`'s order check and make it also
require `npm install --global corepack`. While in the README: the commands table says `pnpm dev` "reloads when you
change a file", which is true only for code; a content file needs a reload by hand (step 3 says so). Say "reloads when
you change the code". The framework's README should be checked for the same Corepack line (reported to the
coordinator; not this repo's change).

**F3. The contract and `CLAUDE.md` are behind the spec and the second golden.** Two things:

- *Saves.* `CLAUDE.md` ("Editors open pull requests here … a person merges it on GitHub") and the plan's "What the
  other repos rely on" say every save is a pull request merged on GitHub. The spec (PR 16, lines 241 to 244) now says
  an Edit or Owner save is committed by the App to the default branch, and a Suggest or Approve save is a pull request
  on `automata/<login>` that a person approves **in the editor** (the App merges it once the checks pass). Write that
  in `CLAUDE.md` and the plan's contract section, and add: an Edit save lands before CI runs on it, so CI's push run on
  `main` is its check, and the Site shows only the newest passing commit (its own rule) until it is green.
- *Goldens.* `CLAUDE.md` ("`replays/level-1.json` is the golden") and its Structure block name only level 1. The
  strict one, the one that catches a code change after the first edit, is `replays/test-game.json`. The merge session
  stops on "a golden moved without a commit naming it", and it reads `CLAUDE.md` to know which files those are. Name
  both files as goldens, and add `replays/test-game.json`, `tests/pin.test.ts`, `tests/framework.test.ts` and
  `tests/architecture/` to the Structure block.

**F4. A file a host answers with a web page is called "not valid", not "missing"** (deferred minor 2, raised here).
`readFrom` accepts any 200. A host that answers every unknown path with its home page (a single-page host) turns a
missing `content/characters/crate.json` into "This file is not valid JSON. Check for a missing comma…", which sends a
person looking for a comma that isn't there. The Site will host the game on Cloudflare Pages, which treats a project
with no top-level `404.html` as a single-page app and does exactly this; the Site's `main` has no `404.html` today.
*Fix:* `readFrom` also rejects an answer whose `content-type` starts with `text/html` (the game reads only TOML and
JSON), with the same `no such file` error; a browser test stubs `fetch` with an HTML 200 and expects the missing-file
sentence. Tell the Site plan to ship a top-level `404.html` all the same.

## Minor (noted, not fixed now)

**M1. `stop()` during loading lets the game start afterwards** (deferred by Stage 4). Confirmed: `play` does not look
at `stopped` after its two `await`s. Nothing calls `stop()` before `play` resolves: `main.ts` never stops, and the
tests stop after it. *Ruling:* acceptable for M1. M2's screens (a title screen that leaves before the game loads) are
its first user and should check `stopped` after each `await`.

**M2. A finger during loading does not switch the words** (deferred by Stage 4). Confirmed, and harmless: on a touch
screen the words start as the button words and the framework shows the buttons at once; on a mouse-first screen the
framework's own first-touch listener also starts only with the game, so the words and the buttons still agree.
*Ruling:* acceptable.

**M3. The page names colours that are content.** "You are the red box. Push the yellow box." is right for today's
`hero.json` and `crate.json`, but an agent, or a later editor, that recolours either makes the words wrong, and CI
passes. M2's languages plan moves every sentence into translatable text anyway; it should take the colour (or the
goal itself) from the content then.

**M4. Nothing after "Well done!".** The done picture shows the line, and then there is nothing more to do or press.
Fine for one level in M1; M2's screens and second level take it.

**M5. No test reaches a real 404.** The browser test stubs `fetch`, and the journey's missing file is a 404 made by
Playwright's router. `appType: 'mpa'` in `vite.config.ts` is never exercised. The Site is the real host, so its
journeys should load a missing path and expect a 404.

**M6. `content:write --check` has no user.** CI checks the standard form through `game-files.test.ts`, and the README
doesn't mention the flag. Keep it if the editors or the Site's build will run it; otherwise drop it with the next
change to the script.

**M7. `tests/framework.test.ts` has done its job.** It was added so knip would pass before `src/` imported the
framework (Stage 4's ruling). Six files in `src/` now import it; the test can go with the next pin move.

## The rulings, reviewed

Each ruling in `progress.md` was checked against the code.

- **Task 1.** `tests/framework.test.ts` for knip: right at the time (M7). `pnpm-workspace.yaml` with `saveExact`
  copied from the framework: right; it keeps the exact versions the Tech Stack line names. The extra
  `loadTheGame` test: right, and every later test now uses it.
- **Task 4.** The recordings written through `writeReplay` from the values CI printed: right, the form test proves it.
  Step 5 (crate at 11.5, run 43520494574, the engines agreeing on `149c9f2b710aa975`) and its revert are in the
  history as two commits; with a merge commit they stay visible, which is the record the plan wanted.
- **Task 6.** `readFrom`'s refusal checked with a stubbed 404, since Vitest's server answers unknown paths with a page:
  right, and it is the case plan audit N3 foresaw. Seven pictures per engine, not six: right, B2 added the done one.
- **Task 7.** The whole-branch review was a self-review: right under the no-subagents rule, and this audit is the
  fresh read. It found F1 to F4, none of which a self-review that shares the author's assumptions would be expected
  to catch.
- **The sideways buttons, fixed in the framework then pinned.** Right: the buttons and the fit are the framework's,
  and every game made with it meets the same overlap. The pin-move pull request should carry: a journey at 844 by 390
  that taps once and checks that no button's box overlaps the hero's box or the floor under the hero's start; new
  pictures on `ci-screens`; and both goldens unchanged. PR 14 changes layout, not the sim, so if either hash moves,
  stop and report (plan audit N5).

## Drunk-grandma check, from the pictures

Seen on `ci-screens` under `pr-3/`, in Chromium, WebKit and Firefox (the three agree):

- **Upright phone (390 by 844):** a white card at the top, "You are the red box. Push the yellow box. Hold Left or
  Right to move. Tap Jump to jump." The level sits in the middle, the red box and the yellow box each outlined, and
  three plain buttons at the bottom, clear of the level. Passes. Half the screen is empty sky; M2's layouts.
- **Sideways phone (844 by 390):** the same card fits on two lines. The Right button covers the red box, and Left
  covers the wall beside it. Fails, being fixed (see above).
- **Tablet, both ways (820 by 1180, 1180 by 820):** like the upright phone, larger, with the buttons below the floor.
  Passes.
- **Desktop (1280 by 720):** the level fills the window, the card names the arrow keys and Space. Passes.
- **Done (390 by 844):** "You pushed the yellow box. Well done!", the yellow box against the right wall with the red
  one beside it. Passes; a grandma knows she did it.
- **Problem (390 by 844):** "This game has a problem and cannot start.", the file and what is wrong with it, then
  "Fix the file named above, then load this page again." Plain, readable, no blank canvas. It is a developer's screen;
  with the checks required on `main`, a player shouldn't meet it.

## For the Owner

Nothing needs an answer from this audit. Two things to know:

1. **Done since the tracker was written:** `check` and the three `engines` checks are required on `main`, and
   "Automatically delete head branches" is on (read through the API, 2026-11-13). This pull request updates the
   tracker.
2. **When the editor's GitHub App exists**, an Edit-level save is a direct commit to `main`, which is protected with
   required checks. The App has to be on `main`'s bypass list here for that save to land, as the Owner set for a team's
   game repo. That is a settings step for the Editors' deploy, not a decision; F1 is what keeps such a save
   from turning `main` red.

## Also in this pull request

- `docs/superpowers/progress.md`: stage 5 marked done, overall progress moved to 78%, the Owner's two settings marked
  done, and a log line for this audit.
