# Plan audit: plan D, the showcase demo

Written 2026-11-15. Stage 3 (Plan audit) of cycle 4, for
[`plans/2026-11-15-demo-game.md`](../plans/2026-11-15-demo-game.md) as it stood at `cda2c63` on pull request 35
(Part 9 already rewritten for the Owner's answer on who makes the art). Read against the M2 spec
([`2026-11-14-m2-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-14-m2-design.md),
"The demo game as showcase", "Testing", "Done means") and its addenda (the built-in hero, no default language, watch
mode), the first-layer spec's visual direction, this repo's `CLAUDE.md` and [`progress.md`](../progress.md), and the
code: AutomataFramework `main` at `504c278`, plan H's build branch (AutomataFramework pull request 101, head
`8bd015e`), plan T's (pull request 64, head `cbbd6cf`), and this repo's `main` at `af39d5a`.

The audit prompt, as the project gives it: "Audit all of your work for completeness, consistency, cohesion, and
harmony, both within itself and relative to the spec and relative to the codebase. Assume nothing. Verify everything.
Investigate any incomplete implementations or incomplete integrations. Do your best work."

## The answer first

The plan is sound and true to the spec. All twelve rows of the showcase table, the eight journeys the spec names,
"What's inside", the first-time player and the goldens each have a part, a task and a test. Every framework name it
consumes from a merged plan exists on `main` with the shape it expects, and the names it takes from plans still in
build (H, T) match their branches. The gates are right: Parts 6, 8.1 to 8.3 and 9 are outcomes and proofs only, each
waits for a merged framework plan or builder, and each is to get a short audit addendum when its gate opens.

There is nothing critical. There are **seven important findings** (I1 to I7) and **six minor ones** (M1 to M6). I1
to I5 and I7 are written into the plan by this pull request, marked `audit I<n>`, so execution reads one document. I6
was an Owner question (Q1); the Owner answered A (the palette stays a rule), and the plan says so.

**Ready to execute:** Parts 1 and 2 now. Part 3 when pull request 101 merges, Part 4 after it, Part 5 after Part 4,
Part 7 when pull request 64 merges. Parts 6, 8 (8.1 to 8.3) and 9 when their gates open and their addenda are written.


## Owner decisions checked

| Decision | Where the plan holds it | Verdict |
|---|---|---|
| The demo's art comes from the 2D figure and environment builders, which are as powerful as the old 3D builders | Part 9's gate, art list and Task 9.3 | Holds. The plan never scopes the builders: the gate is "can make what the list needs". |
| Who makes the art (2026-11-15, answer C): an agent drafts every figure and scene as builder files, the Owner finishes them in the builders | Tasks 9.2 (draft, painted by `ci-art`) and 9.3 (the Owner's saves) | Holds. See I6 and I7 for what 9.3 still needs. |
| The hero's move switches are character components (Characters editor) | Task 3.1: `"moves": { "tuning", "double-jump", "wall-jump", "dash" }` in `content/characters/hero.json`; the numbers and controls in a tuning file (Feel, with Tuner inside it) | Holds. Checked against pull request 101's `content/character.ts`: the switches are a character's `moves`, so the Characters editor owns them. Inside the sim, plan H keeps one `Moves` component that reads the three switches from the character each tick; one component per move would be a change to plan H, not to this plan. |
| Mobile first, AAA touch; input priority touch, gamepad, keyboard | Global Constraints; Part 3 uses plan H's two-thumb scheme, not buttons; every journey starts at `phone-390x844` | Holds. |
| Fredoka, never under 18 px, with its rounded partners | Task 1.3 (M PLUS Rounded 1c, Jua, ZCOOL KuaiLe) | Holds: the first-layer spec's visual direction names all four packages, so they are not new dependencies needing a fresh yes. |
| Art palette B No. 276; touch controls chalk at rest, Peach Red while held | Global Constraints, Task 3.2, Task 9.1 | Holds, except Task 9.3's palette sentence (I6). |
| One move taught per level | Task 4.5: walk and jump, then the double jump, then the wall jump and the dash | Holds as the hero spec settled it: it paired the wall jump and the dash on level three ("each of its three levels teaching one move"; walk and jump are level one's). |
| End-to-end tests in every plan | Every part has its journeys | Holds; see M1 for Part 2's wording. |
| Nothing runs locally | Global Constraints; every loop is push and read CI | Holds. Task 4.3's "six pushes, then stop" is a good cap. |

## Important

### I1. Gameplay tests play the real levels, which an editor's save may change

Tasks 4.3 (the scripted plays must reach the door), 4.5 (a step finishes when `crate-1` moves), 4.6 (the journeys
finish all three levels), 7.1, 8.4 and Part 10's play-through all play `content/levels/*.json`. This repo's `CLAUDE.md`
says why that cannot be: the levels are the editors' to change, an Edit save lands on `main` before CI runs, and "the
journeys that check gameplay play a level of their own (`tests/fixtures/pinned-level.ts`), so a content save,
wherever it puts the crate, cannot turn them red". The plan keeps `pinned-level.ts` (Task 4.3 gives it a door) but no
longer uses it for the levels it adds. After Part 4, the Owner moving a platform in the World editor would turn
`main` red and hide every later game from the Site.

**Written into the plan:** a Global Constraint: every test that plays a level to a result plays a copy the tests own,
`tests/fixtures/pinned-levels.ts`, served in place of the real files as `pinned-level.ts` is today; the real files
keep only what a player would also meet as the problem screen (`loadGame`, `levelProblems`) and the recordings, which
follow `level-1.parity.test.ts` (strict until a save, then "the content changed", engines still compared). Task 4.3
Step 3 writes the pinned copies, Task 4.5's `push` step looks for the level's first crate and is left out when there
is none, and Task 4.6 says its journeys play the pinned copies.

### I2. `test-game.json` stops guarding the game's code

`CLAUDE.md` gives `replays/test-game.json` one job: a change to the game's code that alters the play fails in every
engine. Today that code is the `hero` plugin. Part 3 deletes it (`gamePlugins` becomes `[]`), and Part 4 adds the
rules but never touches `tests/fixtures/test-game.ts`, whose level has no door, no spark, no view and no things. So
after Part 4 the golden would hash only the framework, and a broken door rule or keep-up would pass it.

**Written into the plan:** Task 4.2 also changes `test-game.ts` and `test-game-play.ts`: a door, a spark and a view
with `most`, and a two-hero play that takes the spark, spreads past `most.w` and reaches the door. Part 4 already
records `test-game.json` again, so no extra golden move.

### I3. The rules cannot call `playersIn(sim)`

Task 4.2's interface and rules use `playersIn(sim)`. In the framework it takes a whole `Sim`
(`level/join.ts:36`), and a system's `run` gets a `SimContext`. The framework's own `join` system reads players with
`ctx.query(Player)`. Keep-up also said only "the way the pinned package gives": the way is to write the hero's
`Transform` (in metres) and zero `Body`'s `vx` and `vy`; the physics step's sync-in moves the Rapier body when
`Transform` changed (`physics/rapier.ts:194`).

**Written into the plan:** the interface names `Player`, `Transform` and `Body`, and the two rules read
`ctx.query(Player)`.

### I4. Part 1 leaves "Loading the game…" without a home, and misses the tests that read English

Task 1.2's test says `WORDS` keeps exactly the three developer sentences, so `loading` goes, but nothing says what
the page shows while it loads. The template answers it (`template/src/features/page/page.ts`): a turning mark with
no letters, because no language is known yet. And eight test files read English sentences from `WORDS` today
(`play` and `watch` browser tests; the `open`, `play`, `watch`, `look`, `files` and `pictures` journeys); the task's
file list named one.

**Written into the plan:** Task 1.2 says the loading words become the template's turning mark, and lists every test
that reads a sentence.

### I5. Level one's walk and jump steps have no sentence of their own

Task 4.5 teaches walk, then jump, "with the framework's hint". But `teachHint` covers only the three new moves, and
`playHint` says walking and jumping in one sentence, and the empty text on touch (pull request 101,
`locale/hints.ts`). So the plan's one-at-a-time teaching had no words for the jump step, and the spec's first-time
player, who is on touch, would see a blank strip.

**Written into the plan:** at a keyboard or gamepad `walk` says the framework's `automata.hint.move` and `jump` its
`automata.hint.jump`, each with `inputName`, the parts `playHint` is built from. On touch the thumb scheme's own hints
are the teaching (plan H Task 12 fades them after three uses), and the strip shows the goal and each step's tick.
No new words.

### I6. Task 9.3 loosens the Owner's palette, so it waits on the Owner (Q1)

Task 9.3 Step 1 (and Task 9.1 Step 1 as the plan thread rewrote it) turns the palette No. 276 check into a note in
the log once the Owner starts finishing the art, so any colour the Owner picks in a builder passes. That changes an
Owner decision (the example games' art is palette B No. 276) and was not asked. This audit does not decide it either.
The plan's sentence is marked as waiting on the answer.

**Answered (the Owner, 2026-11-15): A.** The palette stays a rule: CI fails any colour outside No. 276, and a new
colour means changing the palette in one place. Tasks 9.1 and 9.3 now say so.

**Q1 for the Owner.** When you finish the demo's art in the builders, may it use colours outside palette No. 276?

- **A. No, the palette is a rule (recommended).** CI fails a colour outside No. 276, as it does for the draft. If you
  want a new colour, you say so and the palette changes in one place. Simplest, and the builders can offer only the
  game's colours.
- **B. Yes, freely.** The check becomes a note in the log after the draft (the plan's text as written).
- **C. Yes, through a list.** A colour you add in a builder is written to a palette list in the game's files, and CI
  holds every picture to that list. Agent-visible, but a new format for the builders' specs to take in.

### I7. Task 9.3 needs the editors' saving to be live for this repo, which nothing gates

The Owner's finishing reaches the game as saves from the builders. This repo's `CLAUDE.md` says an Owner-level save
is committed by the editors' GitHub App straight to `main`, which needs the App on `main`'s bypass list ("a settings
step when the editors are deployed"), and the levels come from `automata.access.toml`. Neither the bypass entry nor
the file exists today (checked: no `automata.access.toml` at this repo's root).

**Written into the plan:** a gate for Task 9.3: the App installed and on the bypass list, and an
`automata.access.toml` naming the Owner at Owner level, checked with `gh` by the session that opens it.

## Minor

- **M1.** The Global Constraint "every part has an end-to-end journey in three engines" does not fit Part 2, whose
  proof is a Node room test because the pages stay offline. Written into the plan as the one exception.
- **M2.** The hero spec names the tuning file `content/tuning/hero-moves.json`; the plan says `content/tunings/`.
  Pull request 101 has not written the template's yet. The plan's rule for a waiting part covers it: Part 3 takes
  plan H's folder and reports the difference.
- **M3.** Task 9.1 said a picture "older than its file" fails; `artProblems` fails a picture that is missing or not
  what `artFiles` makes from its file. Fixed in the plan.
- **M4.** Task 8.4's schema uses `z.strictObject`. A game imports nothing but the package, so `z` comes from
  `@automataframework/framework/headless`, which re-exports it. Worth one word in the task when 8.4 starts.
- **M5.** After any save that changes a real level, watch mode plays `replays/level-1.json` on content it was not
  recorded on, so the self-playing hero may walk into a wall. Not this plan's to fix (it is true of every editor save
  today), but Task 9.3 Step 2 should record `level-1.json` again after the Owner's art is done, not only when a
  scripted play stops reaching its door. Left for 9.3's addendum.
- **M6.** The spec tells co-op heroes apart "by a colour from palette No. 276 and a number over its head". The number
  is Task 8.3's; until Part 9's variants the heroes are boxes, and nothing says whether the boxes differ by player.
  Part 4's co-op pictures should show it; left for the Part 4 report.

## Checked and found right

- **Names from merged plans,** on framework `main` `504c278`: `createLocale` (with `watching`), `openSettings`,
  `testHost`, `languagePicker`, `followLanguage`, `translationProblems`, `startGame` throwing until `locale.asked()`,
  `touchEvent(kind, 'touched' | 'left' | 'taken')` with `{ thing, by, byKind, player }`, `touch: 'sense' | 'take'`,
  joints (`pin` with `turn`, `rope` with `from`, `to`, `holder`, `slack`), `view` with `most`, `joinCommand`,
  `startGame({ level, players })`, `game.heroes()`, `createAudio`, `webSpeaker`, `testSpeaker`,
  `SoundSettingsSchema`, `defineSave`, `createSaves` with `check()`, `latestSlot`, `StoreRefusal`, `artFiles`,
  `artProblems`, `ReadPicture`, `ArtError`, `z`, and the `server` export.
- **Plan H** (pull request 101): `moves` on the character, `MOVE_NUMBERS`' eighteen ids, the eight `hero.*` events
  with `player`, `playHint`, `teachHint`, the thumb scheme, `buzz`. Its "Plan D" handoff matches Parts 3, 4.5 and 5.
- **Plan T** (pull request 64): `storyProgress`, `StoryProgressSchema`, `startCutscene`, `boxWords`, the seven
  `--automata-story-*` properties, and its "Plan D's step for story", including handing `storyProgress` from level to
  level (its audit M10), which Task 7.1 does.
- **Plan N's** handoff is Part 2 to the letter; **plan A's** is Task 9.1 (the `ci-art` branch, the pictures
  committed, `game-files.test.ts` widened); **plan W's** is Task 1.3.
- **This repo:** every file the plan modifies exists; `saveHashes` is `tests/fixtures/save-hashes.ts`; the five sizes
  are `tests/journeys/open.ts`'s; the check names stay.
- **The gates.** Part 6 waits for plan F and stops if feel moves a hash; Part 8.1 to 8.3 for plan U, with 8.4 (plan V,
  built) written in full; Part 9 for both builders and Part 7; each says to read the merged plan's handoff first and
  report any difference, and to stop where a difference changes what a player sees.
- **Goldens.** Each part that moves one names it, says why, and gives the Owner before and after; no two such parts
  are in CI at once.
- **Privacy and attribution.** Nothing in the plan is strategy; the attribution rules are in the Global Constraints.
