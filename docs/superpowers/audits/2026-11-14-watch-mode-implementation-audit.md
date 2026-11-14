# Implementation audit: watch mode, the game playing itself before Play

Written 2026-11-14. Stage 5 (Implementation audit) of cycle 3, for
[`plans/2026-11-14-watch-mode.md`](../plans/2026-11-14-watch-mode.md) and its
[plan audit](2026-11-14-watch-mode-plan-audit.md), against the spec addendum
[`2026-11-14-watch-mode-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-14-watch-mode-design.md)
with the Owner's answers (Q1 a, Q2 a, Q3 b, Q4 a). What was read:

- Part A: AutomataFramework pull request 29 (merge `cc281c9`, `watchReplay`) and 31 (merge `10dcaa4`, the answers in
  the spec).
- Part B: this repo's pull request 25 (merge `5ad2df0`, the pin to `cc281c9`).
- Part C: this repo's pull request 26 (merge `6b4b65a`, `?watch` and the hand-over).
- Part D: AutomataFrameworkSite pull request 22, branch `claude/project-thread-mvgwsb`, read at `183ac1d` and again
  at its finished head `e40fbeb` (which adds only the tracker's size line).

## The answer first

The build is complete and true to the spec and to the Owner's four answers. Every task in the plan has its code, its
tests and its journeys, in three browsers, and on the Site against both the stand-in and the real game. All seven
should-fix findings of the plan audit (S1 to S7) landed. Every check is green: the framework at `cc281c9`, this repo at
`6b4b65a`, and Site pull request 22 at `183ac1d` and `e40fbeb`, its `journeys-real` jobs included. Neither golden moved
(`replays/` is byte for byte what it was at `507fa28`), the Site's `public/_headers` is unchanged, and no dependency was
added.

Nothing blocks. There is **one should-fix bug** in the framework (F1: `rounds` plays past the end of the recording when
a frame carries more than one tick), **one should-fix cost** (F4: every visitor now downloads about 1.5 MB of game after
the page loads, 1.3 MB of it the physics engine sent as text; about a third of that can be cut), **two gaps in the
record** (F2: this repo's tracker table still says execution has not started; F3: this repo's tracker does not have the
game's size, which the Site's now does), and five notes. Two questions are for the Owner (Q-A, Q-C), and one point in
the coordinator's brief is passed back to the coordinator (Q-B). Site pull request 22 may merge as it is; F1 to F4 are
for stage 6.

## Method

- Every sentence of the addendum's "What a visitor sees", "The three parts", "How the page and the game talk" and
  "The Owner's answers" was matched to code and to a test or journey that proves it.
- Every file of the four merged pull requests and the open one was read in full: `watch.ts`, `game.ts`, `loop.ts`
  (for how `step` and `draw` are called), the README section and the API report in the framework; `play.ts`,
  `watching.ts`, `handover.ts`, `seen.ts`, `mode.ts`, `main.ts`, `words.ts`, `play.css`, `copy-game.ts`, the README,
  `CLAUDE.md` and every new test and journey here; `play.ts`, `talk.ts`, `watch.ts`, `page.ts`, `hero.css`, the stand-in
  game, the journeys, `CLAUDE.md` and the tracker on the Site.
- Each test named in the plan was looked for by name or by what it proves.
- The check runs were read through the GitHub API for each commit above; the pictures were read from `ci-screens`
  (this repo's `main/*/watching-*.png`; the Site's `pr-22-real/*/*-arrival-watching.png`).
- The game's own build log (this repo's `check` job at `6b4b65a`) was read for the sizes, and the npm package
  `@dimforge/rapier2d-deterministic@0.21.0` was unpacked and its `.wasm` compressed, to measure F4's saving. Nothing
  was installed into a repo and nothing was run against the game.
- No tests were run (project rule).

## How the build meets the spec

| The spec says | Where it is | Verdict |
|---|---|---|
| The picture shows first; the game loads once its place is near, then the picture gives way | Site `whenNear` (after `load`, within a window's height); `data-frame="shown"` swaps them; journey "the picture is there before the game is asked for" | Met |
| Nothing of the site's is drawn over the game | Site `hero.css`; journey "with nothing of the site over it" | Met |
| The box walks, pushes the other box, jumps, with nobody pressing anything | `watchReplay` with the first level's recording; journeys in both repos poll `automataWatch.sim.tick`; the Site's pictures show it mid-push | Met |
| Play hands the same game over, from the beginning, with no reload | `takeOver` → `begin` (a fresh sim at tick 0); journeys "with no reload" here and "the same game handed over by each Play button" on the Site | Met |
| Keys on a computer, the game's buttons under a thumb | journeys "the keys reach the game that was handed over, with no second click" (Site) and "a tap on the game takes over … then a touch brings up the buttons" (here) | Met |
| A game that cannot be watched keeps the picture; watching never shows a problem | `loadRecording` and `watchIt` fall back with one `console.info`; Site drops a frame that says `playing` or `problem` before Play; journeys for missing, broken, empty and wrong-setup recordings | Met |
| `watchReplay`: no keyboard, no touch buttons, no recorder; any content; another seed or tick rate refused in words | `watch.ts`; `watch.browser.test.ts`; `WatchSetupError` | Met, but see F1 for `rounds` |
| Still while off the screen | `whileSeen` (an `IntersectionObserver` against the top window) on the framework's host; journey "scrolled off the outer page, the game is still" | Met |
| Two messages, own origin only; a stranger's page can never start it | `handover.ts` and Site `talk.ts`, each checking source and origin; journeys "junk is ignored" and "framed by a stranger's page" | Met |
| `data-state` on the root | both sides; `window.automataWatch` for the tick and rounds (audit S3) | Met |
| Q1 (a): "The game is playing by itself. Tap it to play." | `WORDS.watching`, word for word; journeys at five sizes, 18 px or more | Met (see Q-A, Q-B) |
| Q2 (a): a tap or click starts it; a dragging finger scrolls | `listenToTakeOver` uses `click`; Site frame has `pointer-events: none` while watching, and `onTap` on `#game`; journeys for the wheel and the finger | Met |
| Q3 (b): it plays for everyone, reduced motion included | no gate; `mayWatch` dropped, a recorded deviation; journey "asked for less motion … the game still plays itself" | Met |
| Q4 (a): it loops, with a one-second rest | `rounds` left out; `restTicks` defaults to `tickHz`; journey "it starts again after it ends" | Met |
| Sound: a watching game is silent | the game has no sound yet | Not yet testable (M2) |

## The plan audit's findings

| Finding | Landed |
|---|---|
| S1 a finished watch never restarts on a shown tab | `finished` flag in `watch.ts`; test "a finished watch stays still when the page is hidden and shown again" |
| S2 a level restored to tick 0 plays the same hash, in four engines | `watch-rounds.parity.test.ts` |
| S3 journeys wait on `automataWatch`, not pixels | `main.ts` getters; `watchTickOf` in `open.ts` |
| S4 a frame scrolled off its page | journey "framed: scrolled off the outer page …" |
| S5 `copy-game.ts` imports `mode.ts` itself | yes, with the comment |
| S6 a watching frame's `load` is not "playing"; `problem` after Play shows the game's words | Site `loadGame`'s `onLoad` only on `GAME_ADDRESS`; `onSaid`; two journeys |
| S7 `play` is heard before the game is ready | `listenForPlay` before `play` in `main.ts`; journey "play sent while the game is still loading is not lost" |

The notes N1 to N7 landed too (N5: `watchReplay` is in `tests/install/consumer.ts`; N7: the Site's opening comment and
`CLAUDE.md` now say what loads and when).

## Findings

### Should fix

**F1. `rounds` plays past the end of the recording when a frame carries more than one tick** (framework,
`src/features/game/watch.ts`). The loop's `run` calls `step` up to five times in one frame and does not look at
`running` between them (`loop.ts`). When the step that reaches `replay.ticks` stops the loop because no round is left,
the same frame's next step runs anyway: it steps the sim to `ticks + 1`, counts another round, and stops again. So with
`rounds: 1`, on any frame that is late (a 30 Hz screen in low-power mode does this on every frame, a 60 Hz screen often
enough), the last picture is not the recording's last picture, `sim.hash()` is not `replay.finalHash`, and `rounds`
reads 2 or more. The README promises "`rounds: 1` holds the last picture for good". The tests miss it because
`run(frames, n)` gives one tick per frame. The demo game is not hit (Q4 a leaves `rounds` out), but it is public API.
**Fix:** `if (finished) return` as `step`'s first line (and, for the same reason, nothing after `stop()`), and a test
that delivers the end of the recording in one frame of several ticks (`frames.advance(3 * FRAME)` across
`replay.ticks`) and expects `sim.tick === replay.ticks`, `rounds === 1` and the recorded hash.

**F2. This repo's tracker table says execution has not started** (`docs/superpowers/progress.md`, cycle 3). The log has
Parts B and C, but the table still reads "1. Spec: Written; four questions open for the Owner", "4. Execution: Not
started", and the overall 18%. A stage that reads the tracker first is told the wrong thing. **Fix:** done in this pull
request: the table now says what is true (the answers are in; Parts A to C merged, D in review; this audit), at 76%.

**F3. This repo's tracker does not have the built game's size.** Task 6 Step 3 asked for it here ("which Part D
quotes"). The Site's tracker now has it, at `e40fbeb`: 1,540 kB gzipped over the files Vite lists for `6b4b65a`, plus a
16 kB font and the recording. **Fix:** the same line in this repo's tracker, under cycle 3, with the commit it was
measured at.

**F4. Every visitor now downloads about 1.5 MB of game once the page has loaded, and 1.3 MB of it is the physics
engine sent as text.** The coordinator asked whether this matters and what could cut it.

*What it is.* The game's build log at `6b4b65a` lists `rapier-…js` at 3,450 kB, 1,315 kB gzipped; everything else
(PixiJS, the sim, the game) is about 225 kB gzipped. The framework uses `@dimforge/rapier2d-deterministic-compat`,
which carries Rapier's WebAssembly inside its JavaScript as base64 text. The same version's plain package,
`@dimforge/rapier2d-deterministic`, ships the binary: 2,436 kB, **919 kB gzipped** (measured here with `gzip -9`).
Base64 is a third bigger than the binary and compresses worse, so the text form costs about **400 kB more** on the wire.
It also costs the phone work the binary would not: the 3.4 MB script is parsed, the text decoded, and only then is the
WebAssembly compiled, on the page's main thread, while a streamed binary is compiled as it arrives.

*Does it matter.* Not for the page's first look: the game is asked for only after the page's `load` (journey "the
picture is there before the game is asked for"), so the picture, the words and the Play buttons are as quick as before.
It matters in three smaller ways. (1) Data: a phone visitor who never presses Play now spends 1.5 MB, every first
visit; before this cycle they spent nothing on the game. Returning visitors revalidate and do not download it again
(Cloudflare's default caching, with Vite's hashed names). (2) A slow phone does the parse, decode and compile while the
visitor is starting to scroll, which can make the page's smooth scrolling stutter for a moment. (3) On a slow
connection the picture stays a while before the game moves; nothing is wrong, it is only later. None of the three is a
defect today, which is why this is should-fix and not blocking.

*What could cut it, cheapest first:*

1. **Ask for the game when the browser is idle,** not right at `load` (the Site's `whenNear` waits for
   `requestIdleCallback`, with a short timeout where it is missing). The same bytes, but the decode and compile no longer
   land on the first scroll. Site only, no dependency, no change to what the Owner decided.
2. **Send Rapier as a binary `.wasm`**, about 400 kB less and compiled while it streams. This is the real cut, but it is
   a framework change: the plain package expects a bundler that imports `.wasm` files, which Vite does only with a
   plugin (a new dependency, so the Owner's yes) or with a small loader of our own around the package's
   `rapier_wasm2d_bg.wasm` (no dependency, but code in the framework's one Rapier file, and every engine's parity and
   both goldens must be green again, which they should be, since it is the same WebAssembly). It needs a short
   framework spike before anyone promises the number.
3. **Not for visitors who asked to save data.** This would reopen Q3, which the Owner answered (b), so it is only Q-C
   below, said once with the facts.

What will not cut it: a lighter physics engine (the Owner chose Rapier's deterministic build, and it is the one shown to
match across engines), or waiting until the game's place is in view, since on every screen the page opens at it is in
view at once.

### Notes

**N1. An empty recording "holds the first picture", but nothing is drawn** (framework). With `ticks: 0` the loop never
starts, so no render delta reaches the renderer and the canvas shows only the sky; the test checks only that the tick
stays 0. The demo game never reaches it (`loadRecording` refuses a recording of no ticks). Either draw the level once
or have the doc comment and README say an empty recording shows an empty level.

**N2. A hand-over that never answers leaves the Site saying "Loading the game…"** (Site `play.ts`). The plan's
fall-back for a game that says nothing (the frame's `load`) cannot fire after Play from `watching`, because that frame
loaded long ago. Today's game always answers `playing` or `problem`, so this is only a guard against a future game
that hangs in `start`. Worth one line in the code saying so, or a timeout that reloads the frame at `GAME_ADDRESS`; not
needed now.

**N3. A `playing` heard in the `watching` state is not acted on** (Site `onSaid`). It cannot happen with today's game,
which hands over only when told (the frame takes no pointer and no key while watching). Noted so a later change that
lets a game start by itself while framed knows to handle it.

**N4. Site pull request 22 is a draft.** Its checks are all green; the merge session needs it marked ready for review.
Its body says the new Node tests "were run once locally by mistake"; that is reported, and nothing in the result
depends on it.

**N5. Seen in the pictures, outside this cycle:** on the Site at phone size the game's sheet still says "Arrow keys to
move. Space to jump." above a game that, once it is played, shows touch buttons. That line predates watch mode; it is
reported here, not fixed (it belongs with the Site's copy).

## For the coordinator

**Q-A (the Owner's).** On a computer, the words over the moving game say "Tap it to play.", and a mouse click works as
the tap. Q1 (a) chose those words, and the spec's alternative was only for Q2 (b). Should a computer with a mouse say
something else (for example "Click it to play.", or "Click it or press Play.")? Options: (a) keep the one sentence for
every device, as decided; (b) say "Click" where the screen is not touched with a finger, as the game already does for
`WORDS.keys` and `WORDS.touch`. Nothing here picks one; the build keeps (a), as decided.

**Q-B (the brief).** The brief for this audit gave the watch mode words as "You are the box on the left. Push the other
box." and "You pushed the box. Well done!". Those are the game's `goal` and `done` words, which are unchanged and show
once a player has taken over. The words while it watches are Q1 (a)'s, as the spec records. The build follows the spec;
if the Owner meant the strip to keep the goal while it watches (Q1 c), that is a change of answer for the Owner.

**Q-C (the Owner's, said once).** With Q3 (b), a visitor whose phone asks to save data now downloads about 1.5 MB of
game on every first visit, whether or not they press Play (F4). Options: (a) keep it, as decided; (b) for those
visitors only, keep the picture until Play, as before this cycle (reduced-motion visitors still watch). Nothing here
picks one; the build keeps (a).

## The fixes needed (stage 6)

1. F1 in AutomataFramework: the `finished` guard in `step`, its test, then a pin move here (its own pull request).
2. F3: the game's size line in this repo's tracker.
3. F4, step 1 in AutomataFrameworkSite (ask for the game in idle time); step 2 as a framework spike first, and a pin move
   here after it, if the coordinator starts it; step 3 only on the Owner's word (Q-C).
4. N1 in AutomataFramework, with F1: draw an empty recording's level once, or say in words that it shows nothing.
5. N2, if the Owner or coordinator wants the guard; otherwise one comment.
6. F2 is done by this pull request.
