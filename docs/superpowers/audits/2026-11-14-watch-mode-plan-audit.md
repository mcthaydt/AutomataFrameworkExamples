# Plan audit: watch mode, the game playing itself before Play

Written 2026-11-14. Stage 3 (Plan audit) of cycle 3, for
[`plans/2026-11-14-watch-mode.md`](../plans/2026-11-14-watch-mode.md) as merged in pull request 23. The plan was read
against the spec addendum
[`2026-11-14-watch-mode-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-14-watch-mode-design.md)
(AutomataFramework pull request 28), this repo's `CLAUDE.md` and [`progress.md`](../progress.md), and the code each
task changes, as it is on `main` in all three repos today: AutomataFramework at `13fb0a3`, this repo at `507fa28`, and
AutomataFrameworkSite's `main`.

## The answer first

The plan is sound and true to the spec. Every part of "What a visitor sees" has a task and a journey, in three
browsers, and on the Site against both the stand-in game and the real one, so the three repos are held together end
to end. The two messages, the origin checks, the goldens, the "no new dependency" rule and the Site's header are all
fenced off. `watchReplay` fits the framework's real API: every piece it consumes exists with the shape the plan
expects, and the one behaviour it leans on hardest (a sim restored to tick 0 plays a replay to the same hash) is
already proven by the framework's snapshot tests, though not yet on a level the way watching uses it.

It is **ready to execute for Tasks 1, 2, 3, 5 and 7** now, and for Tasks 4, 6, 8 and 9 once the Owner answers Q1 to
Q4, which this audit does not touch. There is nothing blocking besides those questions. There are seven should-fix
findings (S1 to S7) and seven notes (N1 to N7). All of them are written into the plan by the same pull request as
this audit, so execution reads one document.

## Method

- Each sentence of the addendum's "What a visitor sees", "The three parts" and "How the page and the game talk" was
  matched to a constraint, a task or a test of the plan.
- Every name the plan consumes was looked up in the framework's source: `createGameSim` and `GameSimOptions`
  (`level/game-sim.ts`), `createRenderer` and its `apply` of a `RenderDelta`, `createLoop` and `Frames`
  (`game/loop.ts`), `Host` and `webHost`, `Replay`, `parseReplay`, `playReplay`, `verifyReplay`, `createRecorder`,
  and `Sim`'s `snapshot`, `restore`, `hash` and `dispose` (`sim/create-sim.ts`).
- `watchReplay`'s promises were checked against the determinism and parity tests that exist
  (`physics-snapshot.test.ts`, `snapshot-property.test.ts`, `snapshot.parity.test.ts`, the goldens) and against the
  test helpers the plan names (`manualFrames`, `heroPlugin`, `loadFixtureGame`).
- This repo's page (`play.ts`, `main.ts`, `read.ts`, `words.ts`), `scripts/copy-game.ts`, the architecture rules, the
  journeys' `open.ts`, and the Site's `play.ts`, `motion` feature and workflows were read for each task that changes
  or relies on them.
- AutomataFrameworkFailed was searched for an earlier form of the same idea (principle 7): its
  `packages/sim/src/features/replay/stepper.ts` played a replay one tick at a time.
- No tests were run (project rule).

## How the plan meets the spec

| The spec says | The plan | Verdict |
|---|---|---|
| The picture shows first, the game loads once its place is near, then the picture gives way | Task 8 (`whenNear`, the `ready` → `watching` row), Task 9's first journey | Met |
| Nothing of the site's is drawn over the game | Global constraint; Task 9 checks `whatIsAt` over the picture | Met |
| Play hands the same game over, from the beginning, with no reload | Task 4 `takeOver`, Task 6 "the frame did not load again", Task 9 "the same node and loaded once" | Met |
| Keys on a computer, the game's own buttons under a thumb | Task 6 "on a phone, after hand-over a touch brings up Left, Right and Jump"; Task 9 "the keys reach the game with no second click" | Met |
| A game that cannot be watched keeps the picture, and Play works as today | Task 4's three "opens the ordinary game" tests; Task 6 "with no recording"; Task 9 "a game that says problem keeps the picture" | Met, see S6 |
| `watchReplay`: no keyboard, no touch buttons, no recorder | Task 1 "nothing a player does reaches it" | Met |
| It plays whatever the content is now; another seed or tick rate is refused in words | Task 1's two tests; Task 6 "a moved crate still plays" | Met |
| `?watch` reads `replays/<first level>.json`, copied into `dist/` | Task 3 | Met, see S5 |
| Still while off the screen | Task 4 `whileSeen`; Review Focus 4 | Met in one document only, see S4 |
| Two messages, own origin only, a stranger's page never tells it to play | Global constraint; `handover` and `talk` tests; Task 6 "junk and strangers" | Met |
| `data-state` on the root, so a journey or an agent reads the state | Task 4 | Met, see S3 |
| Q1 to Q4 not decided | The table "Open for the Owner"; each answer changes only its marked lines | Met; nothing here decides one |

## Should fix

**S1. A watch that has finished starts again when the tab comes back.** (Task 1.) The plan says that when no round
remains "the loop stops and the last picture stays", and that the watch is still while `host.visible()` is false,
"as `startGame` is". `startGame` does that with one `sync()` that calls `loop.start()` whenever the host becomes
visible and the game is not paused by hand. Copied as it is, a watch with `rounds: 1` that has ended would start its
loop again on the next `visibilitychange`, step past `replay.ticks` with no commands, and the "held" last picture
would move. Fixed in the plan: `watch.ts` keeps a `finished` flag beside `stopped`, `sync()` leaves the loop stopped
once it is set, and Task 1 gains the test `'a finished watch stays still when the page is hidden and shown again'`.

**S2. Looping rests on a promise no parity test makes yet.** (Task 1.) Each new round restores the snapshot taken at
tick 0 and plays the same commands again, so the second round ends on `finalHash` only if a restore at tick 0 of a
level, with Rapier's world in it, is bit for bit the fresh sim. The framework proves restores at tick 150 and at
random ticks of its physics scene (`physics-snapshot.test.ts`, `snapshot-property.test.ts`) and a mid-run restore in
every engine (`snapshot.parity.test.ts`), but not this case, and the plan's own check of it is a `.browser.test.ts`,
which Vitest runs in the three browsers only, never in Node, the fourth engine. Fixed in the plan: Task 1 adds
`tests/features/game/watch-rounds.parity.test.ts`, with no page: `createGameSim` on the fixture game, a replay recorded
with `createRecorder`, a snapshot at tick 0, `playReplay`, `sim.restore(snapshot)`, `playReplay` again, and both
`finalHash`es equal to the replay's, in Node and the three browsers.

**S3. While watching, nothing tells an agent or a journey how far the play has got.** (Tasks 4 and 6.) `main.ts`
exposes `window.automataGame`, which is `undefined` while watching, so the journeys "the picture moves" and "it starts
again after it ends" are planned as comparisons of canvas screenshots. That is slow, and the second one is fragile:
the picture is drawn at a blend (`alpha`) between two ticks that depends on real frame timing, so "the first
picture's bytes come back" need not hold even when the sim is exactly back at its start. It is also hidden state by
principle 1's measure: a person sees the play advance, an agent cannot read it. Fixed in the plan: `Play` gains
`readonly watch: Watch | undefined`, `main.ts` exposes it as `window.automataWatch` (a getter, like `automataGame`),
and the journeys wait on `automataWatch.sim.tick` rising with no input and on `automataWatch.rounds` reaching 1, never
on pixels. One screenshot pair stays in the first journey, to show the canvas itself is drawn.

**S4. "A frame scrolled off its page" is promised and only tested in one document.** (Tasks 4 and 6.) `seen.ts`'s
doc comment says a frame scrolled off its page counts as not seen, and Review Focus 4 points at Task 4 for it, but
`seen.browser.test.ts` scrolls a root inside its own document. An `IntersectionObserver` with no `root` measures
against the top-level window through every frame around it, which is what the Site needs, and that is exactly the
part not tested. Fixed in the plan: Task 6 adds the framed journey `'framed: scrolled off the outer page, the game is
still, and goes on when scrolled back'` (an outer page taller than the window; `automataWatch.sim.tick` does not
change while the frame is out of the window, and rises again after).

**S5. `copy-game.ts` cannot import `mode.ts` through the play feature's entry.** (Task 3.) The plan has the script
call `recordingPath`, which lives in `src/features/play/mode.ts`. The feature's entry, `play.ts`, imports
`blueprint.css` and `play.css` and the framework's browser entry, none of which Node can load, so the usual
"through the entry" import would break `pnpm build`. The architecture test reads only `src/`, so importing the file
itself from `scripts/` breaks no rule. Fixed in the plan: the script imports `../src/features/play/mode.ts` directly,
with a comment saying why, and `mode.ts` imports nothing.

**S6. The Site's frame says `load` before it says anything else.** (Task 8.) Today `createPlayer` takes the frame's
`load` event to mean "playing". A frame loading `WATCH_ADDRESS` fires `load` as soon as the page has loaded, long
before the game says `watching`, so the old listener, kept, would jump to `playing` with the game still watching. The
table also leaves out what `problem` does in `loading` (the hand-over can fail: `takeOver`'s `start` throwing is the
"could not start" screen, as today). Fixed in the plan: the `load` listener is added only to a frame loading
`GAME_ADDRESS` (including one whose address was switched to it); a watching frame's `load` does nothing; and in
`loading`, `problem` from the game leads to `playing`, so the game's own words show in the frame, as they do today
when a game has a problem.

**S7. `main.ts` hears `play` only after `play()` has returned.** (Task 4.) The plan wires `listenForPlay` after
`const running = await play(...)`, but `play` tells the parent `watching` from inside, through `onState`, before it
returns. It works today only because a posted message is a task and `await` resumes in a microtask first; a later
change that awaits anything between the two would leave a Play press with no listener, or reach `running` before it
is assigned. Fixed in the plan: `main.ts` calls `listenForPlay` before `play`, and the handler takes over at once when
`running` exists and otherwise marks it to take over as soon as `play` returns. `handover.browser.test.ts` gains
`'play heard before the game is ready is not lost'`.

## Notes

- **N1. Counting frames.** The framework's browser tests deliver `frames.at(0)` first, which only sets the clock,
  then `run(frames, n)` for `n` steps. Task 1's numbers ("after 90 frames … `sim.tick === 90`") are true only in that
  form; the plan now says so once, above the tests.
- **N2. Rounds, rest and the restore, step by step.** Written into Task 1: `rounds` counts up on the step that reaches
  `replay.ticks`; with no round left the loop stops at once, with no rest after the last round; otherwise the next
  `restTicks` steps do nothing (no `sim.step`, no `renderer.apply`), and the step after them restores the snapshot and
  then plays tick 0's commands, so it ends at tick 1 with a resync delta (`restore` sets the sim's `fullResync`, and
  the scene clears its entries on a resync, so there is no slide from the old place to the start). That is what the
  plan's "after 90 + 10 + 1 … `sim.tick === 1`" already assumed.
- **N3. Where the checks happen.** `GameSimOptions` has no tick rate (every game sim runs at the default 60), so the
  tick rate can only be compared after `createGameSim`; the plan now says the seed and tick rate are compared before
  `createRenderer`, and the sim is disposed before `WatchSetupError` is thrown, so "mount is empty" holds.
  `WatchSetupError` sets its `name`, as `ReplayFormatError` does; `Watch.rounds` is a getter.
- **N4. One way to pick a tick's commands.** `playReplay` walks the commands with an index; the plan's `watch.ts`
  would write the same walk again. AutomataFrameworkFailed kept one stepper for this (`replay/stepper.ts`). The plan
  now has `watch.ts` keep its own cursor but read commands in exactly `playReplay`'s way (every command whose `tick`
  equals `sim.tick`, in file order), and S2's parity test compares the two. Pulling one shared helper out of
  `playReplay` is left for the implementation audit to judge, since it touches the code the goldens check.
- **N5. The packed package.** `tests/install/consumer.ts` typechecks the tarball's declarations for `startGame`; Task 1
  adds `watchReplay` to it, so `package` proves the new declarations resolve for a game that has only the tarball.
- **N6. Q2 (a), if the Owner picks it.** Only the mechanics, not the choice: the plan said a `keydown` on the root
  takes over, but the root never has the keyboard while watching (a watching game takes no focus, and on the Site the
  frame has `pointer-events: none`), so the listener goes on `window`, as the framework's keyboard does. A `keydown`
  then only reaches it when someone opens `/play/?watch` themselves.
- **N7. The Site's comments.** `src/features/play/play.ts` on the Site opens with "Nothing of the game loads until a
  person presses a button … the game's sound and input never start by themselves"; Task 8 now changes that comment as
  well as `CLAUDE.md`. Q3 (a)'s `mayWatch` reads `(prefers-reduced-motion: reduce)` the way `motion/land.ts` does,
  with the window passed in, so the Node test can hand it a stand-in.

## End-to-end tests

The plan has them in every part that a person can see: Task 6 drives the built game in Chromium, WebKit and Firefox
at all five sizes, framed and not, under the Site's whole policy; Task 9 drives the home page from arrival to playing
at every size, twice, against the stand-in (`ci`) and against the real game built from this repo's newest green commit
(`site`). With S3, S4 and S7 they now wait on the game's state and tick rather than on pixels, and they cover the frame
scrolled off its page. Part A's browser tests and S2's parity test are the framework's end to end: content, sim,
replay, loop and canvas together, in four engines.

## For the Owner

Nothing new. Q1 to Q4 stay as the spec and the plan put them, with their recommendations, and Tasks 4, 6, 8 and 9 wait
for the answers.
