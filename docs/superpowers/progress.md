# Progress

The tracker every stage reads first and updates last. One section per cycle; newest first. The spec and the
framework's own tracker are in AutomataFramework
([spec](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
[tracker](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/progress.md)).

## Cycle 1: the 2D first layer, this repo's share of M1

Plan: [`plans/2026-11-13-m1-thin-thread-examples.md`](plans/2026-11-13-m1-thin-thread-examples.md)

Overall: **39%** (stage 2 is worth 12 points, stage 3 is 6, stage 4 is 50, stage 5 is 14, stage 6 is 12 and the
Owner's review is the last 6; stage 1, the spec, was done in AutomataFramework)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Done (in AutomataFramework) | the spec linked above |
| 2. Plan (M1, Examples) | Done, 100% (in review) | `plans/2026-11-13-m1-thin-thread-examples.md` |
| 3. Plan audit | Done, 100% (in review) | `audits/2026-11-13-m1-examples-plan-audit.md` |
| 4. Execution | In progress, 42% (Tasks 1 to 3 done) | the plan, ticked as it goes (each task is 14% of the stage, the close 2%) |
| 5. Implementation audit | Not started | `audits/2026-11-13-m1-examples-implementation-audit.md` |
| 6. Fixes | Not started | |
| 7. Owner review | Not started | |

Milestones, for this repo:

| Milestone | State |
|---|---|
| M1 The thin thread: one level, the hero, one crate, checked in four engines | In progress |
| M2 The demo game's full content and every built-in | Not started |

### Log

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

- As soon as Task 4's checks are green (before any editor pull request; plan audit B1): mark `check` and the three `engines` checks as required on `main`, and turn on "Automatically delete head branches" (repo settings; no session can change them).
- Look at the pictures CI copies to the `ci-screens` branch, for the drunk-grandma test.
