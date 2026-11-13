# Plan audit: the Examples repo's M1 thin-thread plan

Written 2026-11-13. Stage 3 (Plan audit) of cycle 1, for
[`plans/2026-11-13-m1-thin-thread-examples.md`](../plans/2026-11-13-m1-thin-thread-examples.md). It was read against
the [spec](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
this repo's `CLAUDE.md`, [`progress.md`](../progress.md), and AutomataFramework at the pin
`ec4fddd96d0f1e39365ff807306faf9b42ac3190`: its API report (`docs/api/framework.api.md`), its `ci.yml`,
`vitest.config.ts`, `tests/architecture/rules.ts` and `architecture.test.ts`, `tests/fixtures/game/`, and the source
of `verifyReplay`, the recorder, the physics phases and the touch buttons. The framework's
[plan audit](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/audits/2026-11-13-m1-framework-plan-audit.md)
set the format and the bar.

Two Owner decisions arrived while this audit was written, and it checks the plan against both:

- **Editor Save goes to a side branch and opens a pull request** for review; it never commits to `main`. Sign-in is a
  GitHub App. Access levels like Google Docs' are coming: in M1 an editor can **Look** and **Suggest**, and approving
  happens on GitHub through a "See it on GitHub" link. The rest comes in M3.
- **Onboarding is one of the most important parts of any product.** This audit reads the plan for a first-time
  player's first minute and for a developer's first steps in the repo.

## The answer first

The plan is sound and true to the spec. It covers the M1 Examples line and the CI line, it has real end-to-end tests
(Task 6's journeys against the built `dist/` in three browsers), it serves the principles it names, and every
framework export it consumes exists at the pin with the signature it assumes. The framework's own plan audit had five
blocking findings; this plan has already absorbed the lessons behind them (B5's entry-file trick, S1/S2's check
rules, S5's dispose rule).

It is **ready to execute after small edits**. There are two blocking findings (B1, B2), both from today's Owner
decisions rather than from mistakes in the plan, then seven should-fix findings (S1 to S7), six notes (N1 to N6),
and one Owner question (Q1), which has been sent to the coordinator and is not decided here.

**How the findings are applied** (the workflow, as the Owner set it): stage 4 (Execution) reads this audit with the
plan and applies B1, B2 and S1 to S7 in the tasks they name. Where the two differ, this audit wins. Q1 waits for the
Owner; nothing in the plan's tasks blocks on it.

## Method

- Every name in each task's "Consumes" line was looked up in the API report at the pin, and the signatures the plan's
  code assumes (`createRecorder`'s options, `Verdict`'s reasons, `Played`, `Game`, `GameOptions`, `Host`, `Frames`,
  `Controls`, `parseContent`, `writeContent`, `FieldType`) were compared with it.
- The workflow the plan copies (`ci.yml`), the Vitest projects, the architecture rules and the fixtures it copies were
  read at the pin.
- The hero's numbers were worked by hand against the framework's phase order (`input`, `prePhysics`, `physics`,
  `postPhysics`, `gameplay`, `cleanup`) and its 60 Hz tick.
- No tests were run (project rule). Nothing here is measured.

## Blocking (fix before execution)

**B1. The plan says editors commit to this repo's `main`. They now open a pull request.** Three places say "commit":
"What the other repos rely on" ("CI fails a commit whose content file…", "What a moved crate does to CI"), Review
Focus 2 ("A commit that moves the crate"), and this repo's `CLAUDE.md` ("Editors commit here. The browser editors save
by committing content files to this repo"). The mechanism the plan builds still works under the new decision, which
is good news: `ci.yml` runs on `pull_request`, so an editor's branch in this repo gets every check, and the replay
check's "content changed" pass is exactly what such a pull request needs. What changes is the contract's wording and
two things the plan doesn't yet rely on:
- A pull request opened with a GitHub App's installation token does start workflows (only `GITHUB_TOKEN` events are
  held back), so no workflow change is needed. If the Editors plan instead opens a **Suggest** from a fork (a person
  with no write access), that pull request runs with a read-only token, the `screens` job skips it (correctly), and
  GitHub asks a maintainer to approve the run for a first-time contributor. That belongs in the Editors plan; this
  contract should say which one it supports.
- Approving now happens on GitHub, by a person. So the checks must be **required** on `main` before the first editor
  pull request, or a red one can be merged by a tap. The plan leaves marking them required to the Owner at the very
  end (Task 7 Step 6). It has to move up.

*Fix:* in "What the other repos rely on", replace "an editor may change any file … CI fails a commit" with: an editor
saves by pushing a branch in this repo and opening a pull request into `main`; CI runs on that pull request; it fails
when a content file is not what `writeContent` writes or `loadGame` reports a problem; a person merges it on GitHub.
Do the same in Review Focus 2 and in `CLAUDE.md`'s "This repo" (and its Owner's-decisions line "Save makes a
commit"). Add to the end of Task 4 (the first run where every check is real) a report line to the coordinator: "the
Owner can now mark `check` and `engines (chromium|webkit|firefox)` required on `main`", and keep Task 7's reminder.
Add "Automatically delete head branches" to the same Owner line, since every Save now makes a branch.

**B2. A first-time player is told what to do but never told they did it.** The Owner's onboarding rule makes this
blocking. The page's words are good: "You are the red box. Push the yellow box." passes the drunk-grandma test, and
the keys line and the touch line name exactly what to press. But nothing happens when the player succeeds. The crate
slides to the wall, the words still say "Push the yellow box", and a drunk grandma can't tell whether she has done
it or is still meant to be doing something. That is the first minute of the product's first game, and of the site's
home page in M1.

*Fix:* in Task 5, add one word to `WORDS`, `done: 'You pushed the yellow box. Well done!'`. When the crate (the thing
`crate-1`) is more than one tile from where the level file puts it, `.play-goal` changes to `WORDS.done` and stays.
The page reads this from the sim's `Thing` and `Transform` after a frame, so presentation only observes, as the laws
say. It is the same test Task 4 already makes in Node ("more than 1 tile right of the x in the level file"). Tests:
a browser test (hold right until the crate has moved: the goal line is `WORDS.done`; before that it is `WORDS.goal`),
and in Task 6's keyboard journey, after `untilTick(180)`, `WORDS.done` is visible. Task 6's pictures gain one,
`done-390x844.png`.

## Should fix

**S1. After the first edit, the replay check stops catching a code change. A second golden closes this today.** The
plan says this plainly and leaves it to M2. At the pin, `verifyReplay` checks the setup, then compares
`contentHash` and returns `content-changed` **before playing a tick**. `contentHash` covers every content file and the
project's name. So from the first editor pull request that changes anything (the crate, the hero's colour, the
game's name), the only replay check left is "the engines agree with each other". An agent could then change the hero's
jump in `src/` and CI would pass, as long as it broke the same way in all four engines. Claim 3 ("your agent can't
quietly break your game") would be false for the demo game from its first edit, which is the anti-goal "a claim true
only on a branch" from the other side.

The plan already has the piece that closes it: `tests/fixtures/test-game.ts` (Task 3), a game whose files an editor
can't reach. *Fix:* in Task 4, add a second recorded play, `replays/test-game.json`, over the test game with
`gamePlugins` (a short script: run right, jump, run left; 240 ticks is enough), checked with `verifyReplay` and
**only `ok` passes**. It is recorded from CI the same way as `level-1.json` (the same `REPLAY NOT RECORDED` path) and
is a golden under the same rule. Then a content edit to the real game passes (the level-1 check accepts
`content-changed`, and the engines still agree), and a code change that alters the play fails on the test-game golden
in every engine, whatever the content has become. Moving that golden is then only ever a code change, which is when
the Owner should see it. The plan's paragraph "What this leaves open, on purpose" shrinks to: the real level's own
ending is checked strictly only until its content first changes. This needs no new dependency and no Owner decision.

**S2. `level1Play` should send a command only when the keys change.** The framework's commands keep a player's held
actions until the next `controls` command (the plan's own test "send held [], step once" relies on this). If
`level1Play` sends one command every tick, the replay holds about 350 commands, and Task 4 Step 3 asks the executor to
copy that JSON out of a CI log, where every line carries a timestamp prefix. That is a transcription risk on the one
file that is "recorded in CI, never typed". *Fix:* say `level1Play(tick)` returns a command at ticks 10, 200, 260, 300
and 340 only, and `[]` otherwise. The recording is then about twenty lines. Say also: copy it from the raw log with
the timestamp column cut (`gh run view <id> --log` and `cut -f3-`, or the GitHub MCP job log), then check
`writeReplay(parseReplay(text)) === text`, which the plan's third test already does.

**S3. Developer onboarding: the README has to get a stranger from clone to a changed game.** Task 7 lists what the
README covers but not the first steps in order, and its test checks script names only. What a first-time developer
needs that the plan doesn't name:
- **What to install first:** Node 24.21.0 or later, and pnpm 10.34.6 through `corepack enable` (the `packageManager`
  field). Without that, `pnpm install` picks up whatever pnpm is on the machine.
- **What the first install does:** it downloads the framework from GitHub at the pinned commit and builds it, which
  takes a minute and needs `git`. A stranger who sees a long, silent install will think it hung.
- **A first change, end to end:** open `content/levels/level-1.json`, change `crate-1`'s `x` from `9.5` to `12.5`,
  run `pnpm content:write`, reload `pnpm dev`'s page, and see the crate move. That is the M1 promise in one minute, and
  the same change the editor makes.
- **What CI says when it fails, and what to do:** the replay sentences (Task 4) and the content sentences (Task 2)
  are already written to be acted on; the README should quote one of each.

*Fix:* in Task 7 Step 3, put these in a "Start here" section at the top, in this order: install, play, make your
first change, open a pull request. In Step 1's test, also require `corepack enable`, `pnpm dev`, the words "first
change", and the path `content/levels/level-1.json`. An agent's first steps are covered by `CLAUDE.md`'s "This repo"
section, which already says where everything lives.

**S4. Player onboarding: the words cover the sky for the whole game, and say nothing about the page needing a key
press focus.** Two small things, under the same rule:
- The words sit at the top for ever. On a phone held sideways (390 px tall) they take a fair share of the screen.
  That is acceptable in M1, since the level is short, but say why in the plan so stage 5 doesn't call it a defect:
  they stay because a player who looks away and back still needs them, and M2's title screen and pause screen take
  over the job.
- The keyboard words assume the page has focus. On this repo's own page it does. When the Site embeds the game (M1's
  site page, and later the home page), keys go to the page only after a click if it is in a frame. *Fix:* in
  "What the other repos rely on", under **The page**, add: the page listens for keys on its own `window`; a page
  that embeds it in a frame must give it focus (or say "Click the game, then…"). This hands the question to the Site
  plan, where it belongs, instead of leaving it to be found on the live site.

**S5. `vite` must be a direct dependency from Task 1.** Task 1 sets `tsconfig.json`'s `types` to
`["node", "vite/client"]` and says each dev dependency arrives with the task that first uses it, but lists `vite` only
implicitly. Under pnpm, `vite` is not reachable from the repo root unless it is a direct dependency, even though
Vitest depends on it, so `tsc -p .` fails on `vite/client` in Task 1. *Fix:* Task 1 adds `vite` 8.3.3 with
`typescript`, `vitest` and `@types/node`. `vite.config.ts` still arrives in Task 6.

**S6. `play` must pass `gamePlugins` to `startGame`, and say so.** Task 5's "Consumes" lists `gamePlugins`, but
`PlayOptions` and the description of `play` never say it goes into `startGame({ plugins: gamePlugins, … })`. Without
it the page's hero doesn't move (the framework's game sim has no hero system of its own; `tests/fixtures/game/hero.ts`
at the pin is only the framework's stand-in), and Task 6's journeys would catch it late. Task 6's journeys also build
their Node sims with `gamePlugins`, players `[1]` and the default seed, which must match the page's. *Fix:* say both
in Task 5's description of `play`: `startGame({ content, plugins: gamePlugins, mount, controls: CONTROLS, host,
frames })`, players and seed left at their defaults; and in `open.ts`, a `nodeSim(files?)` helper that builds the
Node sim the same way, so every journey compares like with like.

**S7. The `screens` job will run on every editor pull request.** It copies pictures for each in-repo pull request to
`ci-screens` under `pr-<number>/`. With B1, every Save is a pull request, so `ci-screens` grows one folder per save,
and the job's one-writer concurrency group queues them. That is harmless in M1 (a handful of saves), but say it in
the plan's Task 6, so the merge session isn't surprised by the branch's growth, and so M3's plan can decide whether
editor pull requests skip the job.

## Notes

**N1. The jump guard is right, and the numbers check out.** Gravity 30 and a jump of 12 lose 0.5 a tick, so `vy`
reaches 0 at exactly the 24th tick. Rapier keeps `f32`, and 12, 0.5 and their multiples are exact in `f32`, so the
apex really is one still tick, as the plan says. The hero system runs in `gameplay`, after `postPhysics` writes
Rapier's velocity back into `Body`, so `still` reads this tick's real `vy`, and the `vx` it writes is applied by the
next tick's `prePhysics` sync-in. "Letting go stops the hero on the next tick" reads `Body.vx` straight after the
step, which is the value the system just wrote: right. The `Hero` component's `'u32'` is one of the framework's field
types.

**N2. The crate ends against the right wall in the recorded play.** The hero meets the crate at about tick 71 and
pushes it at 6 tiles a second, so it reaches the wall (x 14.5, the inside of column 15) well before tick 200. Task 4's
"less than 15" holds; "more than 1 tile right" holds by 5 tiles. Nothing to change. With S1's test-game recording,
the exact crate position stops mattering to the strict check anyway.

**N3. `readFrom`'s "no such file" test runs against Vitest's own server, not Vite's preview.** The 404 that
`appType: 'mpa'` guarantees is in `vite.config.ts`, which Vitest doesn't read (it reads `vitest.config.ts`). If
Vitest's browser server answers a missing `.json` with a page and 200, the test fails for a reason that isn't
`readFrom`'s. *If that happens:* point the test at a `data:` or blob URL base, or move that one case into Task 6's
`files.journey.test.ts`, where Vite's preview answers. Say so in the report; it's not a deviation in substance.

**N4. A problem screen is a developer's screen, and players shouldn't meet it.** "Fix the file named above, then load
this page again" is right for the person who broke the file, and the site deploys only from `main`, where B1's
required checks keep a broken file out. So a player won't see it, once the checks are required. That is one more
reason for B1's Owner line to come early.

**N5. Moving the pin can move the strict check.** A pin-move pull request that changes the framework's physics or
hashing fails the strict replay checks (and, after S1, always the test-game one). That's correct, and it means a pin
move may need a new recording, which the Owner sees. One sentence in Global Constraints' pin rule covers it.

**N6. The plan's progress maths add up.** Seven tasks at 14% and the close at 2% make 100%, and the tracker's stage
weights (12, 6, 50, 14, 12, 6) make 100.

## Against the spec

| Spec | Plan | Verdict |
|---|---|---|
| M1 Examples: one level with the hero and one crate | Tasks 2, 3 | Covered |
| M1 Examples: from the framework pinned to a commit on its `main` | Task 1, `tests/pin.test.ts` | Covered |
| M1 CI: the replay hash the same in Node, Chromium, WebKit and Firefox | Task 4 | Covered; S1 keeps it strict after edits |
| M1 done means: a save lands, CI checks it in four engines | Tasks 4 (Step 5), 6 | Covered, as a pull request after B1 |
| End-to-end tests (the Owner, every plan) | Task 6: three journey files against `dist/` in three browsers | Covered |
| Tests only in CI | "How every task is verified" | Covered |
| Drunk-grandma test, with how screens are checked | Task 5's pinned words, Task 6's pictures | Covered; B2 adds the missing "you did it" |
| Onboarding (the Owner, 2026-11-13) | Task 5's words, Task 7's README | Covered after B2, S3, S4 |
| The game uses only the published package | `only-the-framework`, `sim-side-is-headless` | Covered |
| Nothing assumes one player; four starts | Tasks 2, 3 | Covered |
| JSON content, TOML project file | Task 2 | Covered |
| No new dependency | Tech Stack line (with S5, `vite`, already in it) | Covered |
| A `CLAUDE.md` from the repo's first pull request | Arrived with the plan | Covered; B1 changes one line, and the onboarding rule should be added to its Rules |

Principles: 1 (the game is documented files, and the same `content:write` an agent runs), 3, 4, 6 and 7 are served
as the plan claims. The plan leaves out Svelte, Paraglide, Effect, Tauri, changesets and the API report with a reason
each, as principle 6 asks.

**The new Save decision, checked:** compatible after B1. Nothing in the Examples plan writes `main` on an editor's
behalf, CI already runs on in-repo pull requests, and "an editor never writes `replays/`" still holds. Look and
Suggest need nothing from this repo in M1. A Suggest from a fork would need the approval step B1 describes; that is
the Editors plan's choice to make.

## For the Owner (sent to the coordinator, not decided here)

**Q1. Do editor save branches count toward the five-branch cap?** `CLAUDE.md` says "`main` plus branches with CI
running, five at most", and the spec says five across the project. Every Save now makes a branch in this repo, and
`ci-screens` is already one. Options:
- **(a) They don't count** (recommended): the cap is for stage sessions' work; editor saves are the product working,
  and GitHub deletes each branch when its pull request merges or closes (with "Automatically delete head branches"
  on).
- **(b) They count:** the editor refuses to save while five branches exist, and says why.
- **(c) They count, but only open ones older than a day:** a stale save is reported to the Owner.

## Also in this pull request

- `docs/superpowers/progress.md`: stage 3 marked done, overall progress moved to 18%, and the Owner's line about
  required checks moved up, per B1.
- `CLAUDE.md`: the Owner's onboarding rule added under Rules. AutomataFramework's `CLAUDE.md` is the model the other
  repos copy, so the coordinator is told it needs the same line there.
