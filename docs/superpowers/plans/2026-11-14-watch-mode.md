# Watch Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, in
> one session per part, with no subagents (project rule). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Before a visitor presses Play, the home page shows the demo game playing its recorded play by itself; Play
hands the same game over, from the start of the level, with no reload.

**Architecture:** The framework gains one function, `watchReplay`, that draws a loaded game playing a `Replay` with no
input. The demo game opens watching when its address has `?watch`, tells the page that frames it which state it is in,
and starts an ordinary game when told to play. The site frames `/play/?watch` on arrival behind the game's picture and
swaps the picture for the game once it says it is watching. Four pull requests, in order: the framework's function,
the pin move here, the game's watch mode here, the site's embed.

**Tech Stack:** what the three repos already have. No new dependency.

**Spec:** [`2026-11-14-watch-mode-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-14-watch-mode-design.md)
in AutomataFramework (an addendum to the first layer's spec), with the site's design audit
([`2026-11-14-home-design-audit.md`](https://github.com/mcthaydt/AutomataFrameworkSite/blob/main/docs/superpowers/audits/2026-11-14-home-design-audit.md),
"The Owner's answers", Q3). Principles served: 1 (agent-first), 6 (the stack carries over), and the onboarding rule.

## What this plan covers, and what it does not

- **Covers:** `watchReplay` in AutomataFramework (Part A); the pin move (Part B) and the game's `?watch` mode (Part C)
  in this repo; the home page's embed in AutomataFrameworkSite (Part D). Each part is one pull request in its repo and
  updates that repo's tracker; Part D adds a "Cycle 4: the game plays itself" section to the Site's `progress.md`
  that links here.
- **Does not cover:** sound (the game has none; a watching game is silent when it does, M2); choosing which recording
  is watched (it is the first level's); the editors; any change to the site's words outside the game's sheet.

## Open for the Owner (the tasks marked "waits for" do not start without the answer)

The questions and their options are in the spec's "Open for the Owner". Nothing here picks one. The plan is written
so each answer changes only the lines marked with it:

| Question | Recommended | Tasks that wait |
|---|---|---|
| Q1, the game's words while it plays itself | (a) "The game is playing by itself. Tap it to play." | Task 4 (the words), Task 6 (word-for-word journeys) |
| Q2, a tap on the moving game starts it | (a) yes | Task 4 (the tap), Task 8 (the tap on the site) |
| Q3, less motion or saving data | (a) the still picture stays | Task 8 |
| Q4, how long it plays | (a) again and again, one second's rest | Task 4 (`rounds`) |

Tasks 1, 2, 3, 5 and 7 depend on no answer and may start at once.

## Before starting

Stop and report to the coordinator if any of these is not true. Do not work around one.

1. For a task that waits, the coordinator has passed on the Owner's answer.
2. `replays/level-1.json` and `replays/test-game.json` are the same as on `main` at the start and the end of every
   task. No commit in this plan touches `replays/`.
3. Each part starts from its repo's `main` after the part before it has merged: B after A, C after B, D after C's
   commit is the newest on this repo's `main` with every check green (the Site shows only such a commit).

## Global Constraints

- **Nothing is drawn over the game** by the site, watching or playing; the game's art is never restyled.
- **The goldens do not move.** A check that asks for a new recording is a stop.
- **Watching never shows a problem.** Anything wrong with the recording, or with watching, ends in the ordinary game
  (in the game) or the still picture (on the site), with one `console.info` sentence saying why.
- **Watching listens to nothing a player presses** in the sim: no key, finger or gamepad reaches it. The recorded
  commands are the only commands.
- **A watching game starts no sound and takes no keyboard focus.**
- **Messages:** exactly the two in the spec's table. The game posts only to `location.origin` and accepts `play` only
  when `event.source === window.parent && event.origin === location.origin`; the site accepts `state` only when
  `event.source === frame.contentWindow && event.origin === location.origin`.
- **The Site's header (`public/_headers`) does not change.** No inline script, no other origin.
- **A game imports only the framework** (`tests/architecture.test.ts`); the site does not import it at all.
- **Words** live in `src/features/play/words.ts` (the game) and `index.html` (the site), and pass the drunk-grandma
  test. No sentence names a colour.
- **Touch targets** stay at least 48 px. A finger dragged across the watching game scrolls the page.
- **Every source file stays under 600 lines;** one job per file; features import only from features below them.
- **Tests run only in GitHub-hosted CI.** Each "push" step means: push, then `gh pr checks <number> --watch` and, for
  a failure, `gh run view <run> --log-failed`. Journeys wait on the game's state, never on a sleep.
- **No AI attribution.** Before every commit:
  `git config --global user.name "McThayDT" && git config --global user.email "107786093+mcthaydt@users.noreply.github.com"`,
  with the local hook that refuses any other author installed before the first.
- **Reporting:** one line to the coordinator per task (commit, test count, surprises); at once on any stop; every
  deviation with its reason; a handoff at 90 minutes.

## Review Focus

1. **The level was edited after the recording** (an editor moved the crate or a wall). The recording still plays, to
   wherever its commands now lead, and nothing says "problem". (Task 1 "content that changed"; Task 6 with a moved
   crate.)
2. **Play is pressed while the watching game is still loading.** One game starts, playing, and the note says
   "Loading the game…" meanwhile; no second frame, no frame left watching. (Task 8.)
3. **The recording is missing, broken or empty** (`ticks: 0`). The game opens playing; on the site the picture stays
   until then. (Task 4, Task 6.)
4. **The tab is hidden, or the game is scrolled off the screen,** for a long time. The game is still meanwhile and
   does not fast-forward when it comes back. (Task 1 for the tab; Task 4 for off the screen.)
5. **Someone else's page frames the game with `?watch`** (itch.io) and posts `{ "automata": "play" }` or junk. The
   game ignores it and never throws. (Task 4.)

---

## Part A: AutomataFramework (one pull request)

### Task 1: `watchReplay` draws a replay with no input

**Files:**
- Create: `src/features/game/watch.ts`
- Modify: `src/features/game/game.ts` (re-export, as it does `loop.ts`'s), `docs/api/framework.api.md`
  (`pnpm build && pnpm api-report --update`), `README.md` (a short "Watch a recorded play" beside the replay section),
  `docs/superpowers/progress.md`
- Test: `tests/features/game/watch.browser.test.ts`

**Interfaces:**
- Consumes: `createGameSim`, `GameSimOptions`, `createRenderer`, `createLoop`, `Frames`, `Host`, `Replay`, `Sim`.
- Produces:

```ts
export interface WatchOptions extends GameSimOptions {
  /** The element the game fills: a canvas and nothing else. */
  readonly mount: HTMLElement
  readonly host: Host
  readonly replay: Replay
  /** Default: the page's animation frames. */
  readonly frames?: Frames
  /** How many times the replay is played before its last picture is held. Default: without end. */
  readonly rounds?: number
  /** How many ticks the last picture is held before the next round. Default: one second (`tickHz`). */
  readonly restTicks?: number
}
export interface Watch {
  readonly sim: Sim
  /** How many rounds have finished. */
  readonly rounds: number
  /** Stops the loop, removes the canvas and disposes the sim. Safe to call twice. */
  stop(): void
}
/** Thrown before anything is put on the page; the message says what does not match, in words. */
export class WatchSetupError extends Error {}
export function watchReplay(options: WatchOptions): Promise<Watch>
```

How it works, where the signature leaves a choice: the sim is made with `seed: options.seed ?? replay.seed`; a
`replay.tickHz` or seed that is not the sim's is a `WatchSetupError` (the words of `verifyReplay`'s `wrong-setup`),
and a changed `contentHash` is not an error. A snapshot is taken at tick 0. Each step sends the replay's commands for
`sim.tick` (as `playReplay` does) until `replay.ticks`; then `restTicks` steps do nothing; then, if rounds remain,
`sim.restore(snapshot)` and the next step's delta resyncs the renderer. When no round remains the loop stops and the
last picture stays. Still while `host.visible()` is false, as `startGame` is. No `createInput`, no recorder,
`setInset` never called.

- [ ] **Step 1: Write the failing tests** with the fixture game, `heroPlugin`, `manualFrames` and a replay recorded in
  the test (`createRecorder`, hold `right` from tick 5 for 60 ticks, 90 ticks in all):

```ts
test('the replay plays by itself and ends on its recorded hash')
//   after 90 frames: watch.sim.tick === 90, watch.sim.hash() === replay.finalHash, watch.rounds === 1
test('nothing a player does reaches it')
//   keydown ArrowRight and a touch pointerdown on the mount throughout: the same finalHash;
//   mount.querySelector('.automata-touch') === null; mount.children.length === 1 (the canvas)
test('after the rest it starts again from the first picture')
//   restTicks: 10 → after 90 + 10 + 1 frames sim.tick === 1; the hero's pixel is where it was after frame 1;
//   after 90 + 10 + 90 frames the hash is finalHash again and rounds === 2
test('rounds: 1 holds the last picture and asks for no more frames')
test('it is still while the host is hidden, and does not fast-forward after')
test('content that changed since the recording still plays')            // resolves; ticks advance
test('a replay for another tick rate or seed is refused in words')      // rejects WatchSetupError; mount is empty
test('a replay of no ticks holds the first picture')                    // resolves; sim.tick stays 0
test('stop removes the canvas, and may be called twice')
```

- [ ] **Step 2: Push; the three `engines` jobs fail** on "watchReplay is not exported".
- [ ] **Step 3: Implement `watchReplay`** in `watch.ts`, re-export it, regenerate the API report, write the README
  section (what it is for, the options, that it plays whatever the content is now).
- [ ] **Step 4: Push; every check passes,** `api-report` included. The existing goldens and `game.browser.test.ts`
  are untouched.
- [ ] **Step 5: Commit** as `feat: watchReplay draws a recorded play with no input`, open the pull request, report.
  Its merge commit on `main` is `<watch>` below.

---

## Part B: the pin move (this repo, its own pull request)

### Task 2: Move the framework pin to `<watch>`

**Files:** `package.json` (the dependency and the matching `pnpm.onlyBuiltDependencies` line), `pnpm-lock.yaml`,
`docs/superpowers/progress.md` (from which commit, to which, and why).

- [ ] **Step 1:** `pnpm add @automataframework/framework@github:mcthaydt/AutomataFramework#<watch>`, set the
  `onlyBuiltDependencies` line to the same hash, `pnpm install`.
- [ ] **Step 2: Push.** Every check passes with no other change; both goldens in four engines (a moved hash is a
  stop); the pictures under `pr-<number>/` on `ci-screens` are as on `main`.
- [ ] **Step 3: Commit** as `chore: move the framework pin to <watch, 7 letters>, for watchReplay`, open the pull
  request, report. Wait for its merge.

---

## Part C: the game's watch mode (this repo, one pull request)

### Task 3: The recording ships with the game, and the address says watch or play

**Files:**
- Create: `src/features/play/mode.ts`
- Modify: `scripts/copy-game.ts`
- Test: `tests/features/play/mode.test.ts`, `tests/journeys/files.journey.test.ts`

**Interfaces:**
- Produces:

```ts
export type Mode = 'play' | 'watch'
/** `watch` when the address's query has a `watch` key, whatever its value; `play` otherwise. */
export function modeOf(search: string): Mode
/** Where the recording a game watches lives, from the game's root: `replays/<start>.json`. */
export function recordingPath(start: string): string
```

- [ ] **Step 1: Failing tests.** `modeOf('')`, `modeOf('?x=1')` → `'play'`; `modeOf('?watch')`, `'?watch=1'`,
  `'?a=b&watch'` → `'watch'`; `recordingPath('level-1') === 'replays/level-1.json'`. In `files.journey.test.ts`:
  `'the recording is a file beside the page'`: `GET replays/level-1.json` on the built game answers 200 and its bytes
  equal the repo's `replays/level-1.json`.
- [ ] **Step 2: Push; they fail.**
- [ ] **Step 3: Implement.** `copy-game.ts` also copies `recordingPath(project.value.start)` when the file exists
  (a game with no recording still builds) and says so in its last line.
- [ ] **Step 4: Push; they pass. Commit** as `feat: the game's address says watch or play, and the recording ships`.

### Task 4: The page watches, and hands over

Waits for Q1, Q2 and Q4.

**Files:**
- Create: `src/features/play/handover.ts` (the two messages), `src/features/play/seen.ts` (on the screen or not)
- Modify: `src/features/play/play.ts`, `src/features/play/words.ts`, `src/features/play/play.css`, `src/main.ts`
- Test: `tests/features/play/play.browser.test.ts`, `tests/features/play/handover.browser.test.ts`,
  `tests/features/play/seen.browser.test.ts`

**Interfaces:**
- Consumes: `watchReplay`, `Watch`, `parseReplay` (the framework); `modeOf`, `recordingPath` (Task 3).
- Produces:

```ts
// play.ts
export type PlayState = 'loading' | 'watching' | 'playing' | 'problem'
export interface PlayOptions {            // added to today's
  /** Default `'play'`. */
  readonly mode?: Mode
  /** Default `watchReplay`; a test passes one that throws. */
  readonly watch?: typeof watchReplay
  /** Called each time the state changes, `loading` excluded. */
  readonly onState?: (state: Exclude<PlayState, 'loading'>) => void
}
export interface Play {
  readonly state: 'watching' | 'playing' | 'problem'   // now a getter: it changes on hand-over
  readonly game: Game | undefined                      // `undefined` while watching
  /** Watching: stops the recording and starts the level with the controls live. Otherwise does nothing. */
  takeOver(): Promise<void>
  stop(): void
}

// handover.ts
export type Told = { readonly automata: 'state'; readonly state: 'watching' | 'playing' | 'problem' }
export const PLAY_MESSAGE = { automata: 'play' } as const
/** Tells the page that frames this one. Does nothing when no page does. */
export function tellParent(win: Window, state: Told['state']): void
/** Calls `onPlay` for `PLAY_MESSAGE` from the parent at this origin; anything else is ignored. Returns the undo. */
export function listenForPlay(win: Window, onPlay: () => void): () => void

// seen.ts
/** `host`, but also not visible while none of `root` is in the window (a frame scrolled off its page counts). */
export function whileSeen(host: Host, root: HTMLElement): Host & { destroy(): void }
```

Behaviour that the signatures leave open:
- In `watch` mode `play` loads the game as today, then reads `recordingPath(content.project.start)` through `read`
  and parses it. A read or parse that fails, `ticks === 0`, or `watch` rejecting: one `console.info` sentence, then
  the ordinary game (`playing`). A broken content file is still the problem screen, as today.
- Watching: `watchReplay({ content, plugins: gamePlugins, mount: stage, host: whileSeen(host, root), replay, frames,
  rounds })`, where `rounds` is Q4's answer ((a) left out, (b) `3`, (c) `1`). No goal, no "well done", no `observe`.
- **Q1:** the words strip while watching is (a) one line, `WORDS.watching`; (b) not in the page at all, so the stage
  takes the whole root; (c) today's `goal` and `how`. `WORDS.watching` is the Owner's sentence, word for word.
- **Q2 (a):** a `click` on the root, or a `keydown` of Enter, Space or any key in `CONTROLS`, calls `takeOver`. A
  `click` and not a `pointerdown`, so a dragging finger scrolls; while watching the root has `touch-action: auto` and
  `cursor: pointer`. **Q2 (b):** neither listener exists.
- `takeOver` stops the watch, empties the stage, puts back `goal` and `how`, and calls `start` exactly as `play`
  mode does (a fresh sim at tick 0, touch buttons, the recorder). A second call while the first runs returns the
  same promise. If `start` throws, the "could not start" screen, as today.
- `main.ts` passes `mode: modeOf(location.search)`, `onState: (state) => tellParent(window, state)`, wires
  `listenForPlay(window, () => void running.takeOver())`, and makes `window.automataGame` a getter of `running.game`.

- [ ] **Step 1: Failing tests** (the test game, `manualFrames`, a replay recorded in the test from
  `tests/fixtures/test-game-play.ts`, served by `readTestGame` at `replays/level-1.json`):

```ts
test('in watch mode the game plays the recording by itself')
//   root.dataset.state === 'watching'; play.game === undefined; after the replay's ticks in frames the crate has
//   moved more than a tile with no key pressed; no '.automata-touch' in the root; no '.play-goal' saying WORDS.goal
test('held keys and fingers do nothing to a watching game')   // ArrowLeft held throughout: the crate still ends there
test('takeOver starts the level from the beginning with the controls live')
//   state 'playing'; play.game.sim.tick === 0 before a frame; WORDS.goal and WORDS.keys are back; one canvas;
//   ArrowRight held for 60 frames moves the hero; onState saw ['watching', 'playing'] in that order
test('takeOver twice starts one game')                        // the same promise; one canvas; one '.automata-touch'
test('a missing recording opens the ordinary game')           // files: { 'replays/level-1.json': undefined }
test('a recording that is not a replay opens the ordinary game')   // '{'  and  a replay with ticks 0
test('watching that cannot start opens the ordinary game')    // watch: () => Promise.reject(new Error('no'))
test('a broken level is still the problem screen in watch mode')
test('stop while watching empties the root')
// Q1 (a): test('while watching, the words say so') → text('.play-watching') === WORDS.watching, in the strip
// Q2 (a): test('a click, Enter or Space takes over; a drag does not') ; Q2 (b): test('a click does nothing')
// Q4 (b)/(c): test('after its rounds the last picture stays') → frames no longer requested; state still 'watching'

// handover.browser.test.ts, with a real same-origin iframe (srcdoc) as the child
test('the parent is told each state, at this origin only')
test('play from the parent is heard once per message')
test('play from another window, another origin, or with other data is ignored')   // {}, null, 'play', {automata:'stop'}
test('with no parent, telling does nothing and does not throw')

// seen.browser.test.ts
test('a root scrolled out of the window is not visible, and is again when scrolled back')
test('a hidden host stays hidden whatever the root does')
```

- [ ] **Step 2: Push; they fail** for the missing exports.
- [ ] **Step 3: Implement** `handover.ts`, `seen.ts` (an `IntersectionObserver` on the root, threshold 0), the
  changes to `play.ts` (if it passes 300 lines, the watching half moves to `src/features/play/watching.ts`) and
  `main.ts`, the words and the two CSS rules.
- [ ] **Step 4: Push; every check passes.** `blueprint.test.ts` still finds no colour outside `blueprint.css`.
- [ ] **Step 5: Commit** as `feat: the game plays its recording by itself with ?watch, and hands over`.

### Task 5: The docs say how to watch

**Files:** `README.md`, `CLAUDE.md`, `tests/docs/readme.test.ts`, `docs/superpowers/progress.md`

- [ ] **Step 1: Failing test:** the README has a heading "Watch it play itself" and names `?watch`,
  `replays/level-1.json` and both messages exactly as `handover.ts` writes them.
- [ ] **Step 2: Write** the section (open `pnpm dev`'s address with `?watch` on the end; what a page that frames the
  game hears and says; that the recording is the same file CI checks, and how to take a new one, which the README
  already says) and one line under "This repo" in `CLAUDE.md`.
- [ ] **Step 3: Push; passes. Commit** as `docs: how to watch the game play itself`.

### Task 6: Journeys: the built game watches and hands over, in three browsers

Waits for Q1 and Q2 (the word-for-word and tap cases only).

**Files:**
- Create: `tests/journeys/watch.journey.test.ts`
- Modify: `tests/journeys/open.ts` (`openGame` takes `search?: string` and `framed?: boolean`; framed, the game is
  an iframe in a page of the same origin that records every message it hears and can post to the frame),
  `tests/journeys/csp.journey.test.ts`, `tests/journeys/pictures.journey.test.ts`

- [ ] **Step 1: Write the journeys** (they pass once Task 4 is in; each is run red first by asserting before the
  feature's state exists):

```ts
test('with ?watch the game plays itself: the picture moves and nobody pressed anything')
//   #game[data-state="watching"]; two canvas screenshots 500 ms of game time apart differ (poll, no sleep);
//   no errors; no request answered 400 or above
test('it starts again after it ends')                    // Q4 (a)/(b): the first picture's bytes come back
test('a moved crate still plays, with no problem screen')   // files: the level with crate-1 at x 12.5
test('with no recording the game opens ready to play')      // files: { 'replays/level-1.json': undefined }
test('framed: the page hears watching, says play, and hears playing')
//   heard === [{automata:'state',state:'watching'}] then, after posting PLAY_MESSAGE, a second entry 'playing';
//   the frame did not load again (one 'load' event); ArrowRight then pushes the crate, as play.journey's does
test('framed: junk and strangers are ignored')           // post {}, 'play', {automata:'stop'}: still watching
test('on a phone, after hand-over a touch brings up Left, Right and Jump')
test('turning the phone keeps the game watching')
test('without ?watch nothing changed')                   // state 'playing' at once; no request for replays/
// Q1 (a): the strip's words are WORDS.watching, at 18 px or more, at every size
// Q2 (a): a tap on the game takes over; a wheel over the game scrolls an outer page that is taller than the window
```

  `csp.journey.test.ts`: `"under the Site's whole policy the game watches and nothing is blocked"`.
  `pictures.journey.test.ts`: `how it looks watching at <size>` for the five sizes, saved as `watching-<size>.png`.
- [ ] **Step 2: Push; every check passes** in `check` and the three `engines` jobs. Read the fifteen new pictures
  under `pr-<number>/` on `ci-screens` against this list: the game's art fills its place; nothing overlaps; the words
  (Q1) read at phone size; no touch buttons while watching.
- [ ] **Step 3: Commit** as `test: journeys for watching and handing over`, open the pull request, report. Record in
  the tracker the built game's size on the wire (`dist/` gzipped, from the build log), which Part D quotes.

---

## Part D: AutomataFrameworkSite (one pull request)

### Task 7: The stand-in game watches

**Files:** `tests/fixtures/game/game.js`, `tests/fixtures/game/index.html`, `tests/fixtures/game-source/` (nothing,
if `replays/` is already there)

The stand-in follows only what the site relies on. With `?watch` in its address: `data-state="watching"`, the box
moves right by itself, keys and the Right button do nothing, it posts `{ automata: 'state', state: 'watching' }` to
its parent at its own origin, and on `{ automata: 'play' }` from that parent it puts the box back at the start, sets
`data-state="playing"`, posts `playing` and obeys the keys. Without `?watch` it is as today, and also posts `playing`.

- [ ] **Step 1:** Change the two files. **Step 2:** Push; every existing journey still passes (none uses `?watch`
  yet). **Step 3: Commit** as `test: the stand-in game can watch and hand over`.

### Task 8: The page shows the game playing itself, and Play hands over

Waits for Q2 and Q3.

**Files:**
- Create: `src/features/play/watch.ts` (when to load the watching game), `src/features/play/talk.ts` (the two
  messages, the site's side)
- Modify: `src/features/play/play.ts`, `src/styles/hero.css`, `src/features/page/page.ts`, `CLAUDE.md`
  ("Nothing of the game loads until…" is no longer true; say what is), `docs/superpowers/progress.md`
- Test: `tests/features/play/play.test.ts`, `tests/features/play/watch.test.ts`, `tests/features/play/talk.test.ts`
  (new; the feature had only journeys)

**Interfaces:**
- Produces:

```ts
// play.ts
export const WATCH_ADDRESS = '/play/?watch'
export type PlayState = 'ready' | 'watching' | 'loading' | 'playing'

// talk.ts
/** Calls `onState` for a state message from `frame`'s own window at this origin; anything else is ignored. */
export function listenToGame(win: Window, frame: HTMLIFrameElement, onState: (state: string) => void): () => void
export function tellGameToPlay(frame: HTMLIFrameElement, origin: string): void

// watch.ts
/** Whether this visitor gets the watching game at all (Q3). */
export function mayWatch(win: Window): boolean
/** Calls `go` once, when `root` is within one window's height of the window and the page has loaded. */
export function whenNear(root: HTMLElement, go: () => void): () => void
```

What `createPlayer` does now (states on `#game`'s `data-state`, as today):

| State | The page | How it is left |
|---|---|---|
| `ready` | the picture; no frame (or a frame loading `WATCH_ADDRESS`, hidden) | the game says `watching` → `watching`; Play → `loading` |
| `watching` | the frame shows in the picture's own box, `pointer-events: none`; the picture is hidden; the outline stays; the sheet's Play button and the keys line stay | Play (Q2 (a): or a click on `#game`) → `tellGameToPlay`, then `loading` |
| `loading` | as today: the note "Loading the game…", sheet buttons hidden; if the frame was watching it stays visible | the game says `playing` (or, with no message after the frame's `load`, as today) → `playing` |
| `playing` | as today: no outline, the phone sizes, the frame takes the keyboard, `reveal` | |

- Play pressed in `ready` while a watching frame is still loading: that frame's address becomes `GAME_ADDRESS`
  (one frame, never two) and the page goes on as today.
- **Q3 (a):** `mayWatch` is false when `(prefers-reduced-motion: reduce)` matches or `navigator.connection?.saveData`
  is true; then no frame is added before Play and everything is as today. **Q3 (b):** `mayWatch` is always true.
- A frame that says `problem`, or never says anything, leaves the picture in place; Play then loads `GAME_ADDRESS`.
- With no script the picture and the `<noscript>` line are as today.
- `hero.css`: `#game[data-state="watching"] .poster { display: none }`, the frame visible in `watching`, and
  `#game[data-state="watching"] iframe { pointer-events: none }`; Q2 (a) adds `cursor: pointer` on `#game` then.

- [ ] **Step 1: Failing tests.** The site's Node tests have no page (and no page library is added), so they hold the
  parts that are plain functions; what the page does with them is Task 9's, in real browsers.

```ts
// talk.test.ts, with plain objects standing in for the event and the windows
test('a state from the frame\'s own window at this origin is heard')     // 'watching', 'playing', 'problem'
test('a state from another window, another origin, or with other data is ignored')  // {}, null, 'x', {automata:'play'}
test('tellGameToPlay posts exactly { automata: "play" } to this origin')
// watch.test.ts
test('mayWatch follows the device')                                       // Q3: reduced motion, saveData, neither
// play.test.ts
test('WATCH_ADDRESS is GAME_ADDRESS with ?watch')
```

- [ ] **Step 2: Push; they fail. Step 3: Implement. Step 4: Push; they pass.**
- [ ] **Step 5: Commit** as `feat: the game plays itself before Play, and Play hands it over`.

### Task 9: Journeys: arrival to playing, with the stand-in and with the real game

**Files:**
- Create: `tests/journeys/arrive.journey.ts`
- Modify: `tests/journeys/home.ts` (`play` waits for `playing` from either path), `tests/journeys/play.journey.ts`
  (the "before Play" cases now state which state they are in)

- [ ] **Step 1: Write the journeys,** at every size in `SIZES`, in the three engines:

```ts
test('a visitor arrives and the game is playing itself, with nothing of the site over it')
//   #game[data-state="watching"] within 15 s; the frame's canvas changes between two looks with no input;
//   whatIsAt(pointsOnPicture) is only the frame; the frame's box is the picture's box to the pixel; no trouble
test('each Play button hands the same game over')
//   the frame element is the same node and loaded once; state 'playing'; the keys reach the game with no second click
test('a wheel or a dragging finger over the watching game scrolls the page')
test('Play pressed before the game is ready still starts one game')     // the frame's address held back by a route
test('the page is quick without the game: the picture is there before the frame is asked for')
//   the first request for /play/ comes after the page's load event
test('a turned phone keeps the game watching, then playing')
// Q2 (a): test('a tap on the moving game starts it')   Q2 (b): test('a tap on the moving game does nothing')
// Q3 (a): test('asked for less motion, the picture stays and Play works as before')   // emulateMedia reducedMotion
// Q3 (b): test('asked for less motion, the game still plays itself')
```

  The same journeys run twice, as every journey here does: against the stand-in (`ci`) and against the real game
  built from this repo's newest green commit (`site`), which is what holds the three repos together end to end.
  Also here, since no Node test has a page: `'a game that says problem keeps the picture'` and `'a state posted by
  the page itself, not the frame, changes nothing'`.
- [ ] **Step 2: Push; every check passes** with the stand-in (`ci`) and the real game (`site`, `pr-<n>-real`). Read
  the pictures on `ci-screens`: arrival at phone size shows the game's own words at a size that reads (the site
  audit's F5, which this closes).
- [ ] **Step 3: Commit** as `test: journeys from arrival to playing`, open the pull request, report.

---

## When it is done

- The four pull requests are merged by the merge session in order: framework, pin, game, site.
- `replays/level-1.json` and `replays/test-game.json` are byte for byte what they were.
- On the live site a first-time visitor sees the game move before pressing anything, presses Play once, and is
  playing from the start of the level; with the game unavailable they see the picture, as today.
- The Site's tracker records the built game's size, since every visitor who may watch now downloads it.
