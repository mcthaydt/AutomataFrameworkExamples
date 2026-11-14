# Plan audit: the Blueprint look for the demo game's screens

Written 2026-11-14. Stage 3 (Plan audit) of cycle 2, for
[`plans/2026-11-14-blueprint-look-examples.md`](../plans/2026-11-14-blueprint-look-examples.md) as merged in pull
request 10. It is a design audit: the plan was read against the section "Visual direction" of the
[spec](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
this repo's `CLAUDE.md` and [`progress.md`](../progress.md), the game's page as it is on `main` (`index.html`,
`src/features/play/`, the journeys), AutomataFramework at the pin `9109fa3` (`src/features/input/touch.ts`, its
browser tests, `formatDiagnostic`), and the Site's own Blueprint plan, so the two repos end up looking like one product.

## The answer first

The plan is true to the spec on almost every line: the five colours are the spec's to the digit, dark is the only
theme, the fonts and icons are the approved ones and arrive as files from the page's own origin, every icon has a
word, the touch targets stay at 64 px, the game's art and both goldens are fenced off, the framework keeps today's
look unless a game asks for another, and the journeys run in three browsers at every size, under the Site's whole
policy, with the fonts blocked and in a 320 px frame.

It is **ready to execute once the Owner answers one question (Q1)**. There is one blocking design finding (B1), which
is that question; three should-fix findings (S1 to S3); six notes (N1 to N6); and seven findings about the tests
(T1 to T7) taken from an earlier audit of the same plan after checking each one. All of them but Q1 are already
written into the plan by the same pull request as this audit, so execution reads one document.

## Method

- Each bullet of "Visual direction" was matched to a constraint, a task or a "not covered" line of the plan.
- The plan's look was laid over the pictures of the game as it is today (`ci-screens`, `main/`): the words strip, the
  light blue sky, the red hero, the yellow crate, the three buttons.
- The three packages were unpacked at the plan's versions and their files read. A page with the plan's `@import` and
  `mask: url()` lines was built once with Vite 8.3.3 and `assetsInlineLimit: 0`, to see what lands in `dist/`.
- Every test, helper and file the plan names was looked up in both repos.
- No tests were run (project rule). The contrast figures are worked from the colours, not measured in a browser.

## How the plan meets each point of the spec

| The spec says | The plan | Verdict |
|---|---|---|
| Blueprint: paper, hatch, chalk, pencil, marker; 2 to 3 px corners; 1 px chalk borders | The five values exactly, in one file, with a test that no other colour is written; 2 px corners, 1 px chalk edges | Met |
| Marker means "you can touch this" | Only the touch buttons use it | Met, but see B1 |
| A soft shadow only on floating panels | No shadows; the buttons are chips, not panels | Met |
| IBM Plex Sans Condensed for labels, in capitals; JetBrains Mono for numbers and measures | Plex for every word, capitals only on the button words; mono on the problem lines | See S1 |
| A font package needs the Owner's yes | `@fontsource` 5.3.0 for both, as build inputs | Met: the Owner has said yes (S3) |
| Dark by default | `color-scheme: dark`, one theme | Met |
| Canvas first, tools floating at the edges | The level keeps the whole stage; the buttons float in its bottom corners; the words keep their own strip (the Owner's earlier rule) | Met |
| The game's art is never restyled | No change to `content/`, the renderer or the canvas; the pictures are checked for it | Met |
| The drawing notes sit over the art | Not used: they are the editors' | Right to leave out |
| Chips over art are navy with a thin white edge | The resting button is exactly that | Met |
| Phosphor regular, a word with every icon | Five regular icons, each beside or above its word | Met |
| Applies to the demo game's title, pause and settings screens | Those do not exist until M2; the plan dresses the play screen's words, buttons and problem screen instead | See B1 (the buttons) |
| Reduced motion gets a plain fade | No motion is added at all | Met; now said aloud (N3) |
| 44 px targets, 48 px primary | 64 px, tested with a tiny font | Met |
| Every word passes the drunk-grandma test | The words do not change | See B1 |
| End-to-end tests in CI (the Owner's rule) | Tasks 5 and 6, three browsers, five sizes | Met |

## Blocking

**B1. The game says "Push the yellow box", and the plan turns the buttons yellow.** The first words a new player
reads are "You are the red box. Push the yellow box." The yellow box is the crate (`#f2c14e`), a small square on the
floor. Under the plan each button carries a marker-yellow (`#FFD447`) arrow and word, and a held button becomes a
solid yellow box of at least 64 px, which is bigger than the crate on a phone. A drunk grandma told to push the yellow
box can fairly press a button, see a yellow box light up, and think she has done it. The words were written when the
buttons were grey, and the plan forbids changing them, so nothing in it catches this. The Owner's onboarding rule
makes it blocking.

The spec does not force yellow here. It names two looks for things that sit over art: marker for "what can be
touched", and for the drawing notes "navy chips with a thin white edge so they read over light or dark art". It also
lists where Blueprint applies in the game as the title, pause and settings screens. The buttons are neither: they are
on the play screen, over the game's own art. So how they look is a choice the spec leaves open, and it belongs to the
Owner (Q1). Nothing was decided here.

*Fix, already in the plan:* a section "Open for the Owner" holds Q1 and says what each answer changes. Execution does
not start until the coordinator passes on the answer. Task 4's table and tests name the resting ink as "the answer to
Q1". Task 6's picture questions gain a fourth: could she take a button for the yellow box?

## Should fix

**S1. The problem screen sets whole sentences in the measuring font.** The plan puts each problem line, all of it, in
JetBrains Mono at 15 px. A line is `file: place: message`, and the message is a plain sentence meant for a person:
"This file is not valid JSON. Check for a missing comma, quote or bracket." The spec gives the mono face to "numbers
and measures", and the label face to words. A sentence in small monospace is harder to read on a phone and is not what
the spec asks.

*Fix, in the plan:* a problem line is drawn in two parts. Where it is (the file, and the place in it) is JetBrains
Mono in pencil; what is wrong follows it in the label font, in chalk at 18 px. `play.ts` builds each
line from the diagnostic's own `file`, `path` and `message` in two spans, and the line's text stays exactly what
`formatDiagnostic` gives, so the older tests of the words pass untouched. A line with no file (a game that cannot
start) is all label font.

**S2. Nothing shows which button the keyboard is on.** The buttons are real `<button>`s and Tab reaches them. The plan
leaves the ring to each browser, so it differs in all three and is not the look's. The Site's plan gives every
focusable thing a 3 px chalk ring; the game should match.

*Fix, in the plan:* a constraint and a row in Task 4's table (`:focus-visible`: a 3 px chalk outline, 2 px away), a
browser test, and a line in the look journey.

**S3. "Before starting" still waits for a yes the Owner has given.** The coordinator reports the Owner approved
`@fontsource/ibm-plex-sans-condensed` and `@fontsource/jetbrains-mono` at 5.3.0 (2026-11-14). The plan's first
"stop and report" condition would halt execution for nothing.

*Fix, in the plan:* condition 1 now records the yes and asks only that the versions in `package.json` are those.

## Notes

**N1. `--label` and `--measure` mean different things here and in the Site's plan.** Here they were whole `font`
values (weight, size, family); in the Site they are the family lists only. An agent moving between the repos would
trip. *In the plan:* they are family lists here too, with the Site's fallbacks, and each rule writes its own weight
and size.

**N2. Three small facts, checked by unpacking the packages and building once.**
- Each font face brings two files into `dist/assets/`, a `.woff2` and a `.woff`, not "one `woff2`". Browsers ask only
  for the `.woff2`. The plan's blocked-fonts pattern (`/\.woff2?$/`) already covers both.
- Vite 8.3.3 resolves a package name inside a CSS `@import` and inside `url()`, and with `assetsInlineLimit: 0` writes
  the icon as a file (`arrow-left-<hash>.svg`), not as `data:`. The plan's "if Vite cannot resolve" fallback is not
  needed and is removed. All five icons the plan names exist in `@phosphor-icons/core` 2.1.1 under `assets/regular/`.
- The two font files the plan imports (`latin-600.css`, `latin-400.css`) exist and declare `font-display: swap`,
  which is what Review Focus 1 and 2 rely on.
- knip does not read CSS, so it will report all three packages (the Site's plan found the same). *In the plan:* the
  `ignoreDependencies` line is a step, not an "only if".

**N3. The plan adds no motion and did not say so.** A held button changes colour at once, which needs no
reduced-motion rule. *In the plan:* a constraint, "No motion", so execution does not add a transition without its
reduced-motion twin.

**N4. "Well done" had a unit test but no journey.** The moment a player learns they did it is the end of the first
minute. *In the plan:* the look journey pushes the crate with the arrow key and checks the words, the class and the
tick icon in all three browsers.

**N5. One journey asked for three files that show on two different screens.** JetBrains Mono is asked for only on the
problem screen. *In the plan:* Task 3's file journey is two tests, one per screen.

**N6. Every word here is weight 600; the Site sets sentences in 400.** Kept on purpose: the game's words are short,
sit in a thin strip above moving art, are 600 today, and one weight is one file. No change.

## The tests (from the earlier audit, each checked here)

Pull request 11 holds an earlier audit of this plan
(`audits/2026-11-14-blueprint-look-plan-audit.md` on its branch), which read the tests more closely than the look.
Its findings were checked against the code and are right. They are written into the plan here, so that one plan
carries both audits; which of the two pull requests is merged is the coordinator's call.

- **T1 (its B1, blocking unless Q1 is (c)).** `layout.journey.test.ts` finds the hero by its red in a picture and
  relies on seeing it through today's see-through buttons (its own comment says so). Solid buttons would hide the
  covered part of the hero, and the journey would pass on the overlap it exists to catch. *In the plan, Task 4:* the
  picture is taken with the buttons hidden but still measured, and one journey proves the guard still bites.
- **T2 (its S1).** `play.browser.test.ts` tells every test there is no touch screen, so "on a coarse start" leaves
  the buttons hidden and 0 by 0. *In the plan:* the button tests bring them up with a touch.
- **T3 (its S2).** A browser asks for a font only when something uses it, and nothing does in Task 3. *In the plan:*
  Task 3's file journeys are `test.todo` until Task 4.
- **T4 (its S3).** `document.fonts.check` is also true when no face of that name was declared. *In the plan:* a
  `fontLoaded` helper, used in every place a font is said to be loaded.
- **T5 (its S4).** A failed request's console words do not name the file. *In the plan:* the fonts-blocked journey
  compares addresses.
- **T6 (its N2, N4, N5, N6, N7).** The jump journey looks for a `controls` command; the problem screen gets its
  fourth picture; a colour's name cannot slip past the colour test; the Site's commit is noted beside the copied
  policy; stage 4 has per-task weights. All in the plan.
- **T7 (its N3).** The buttons' words go from 18 px to 15 px. *In the plan:* a picture question, with 16 px as the
  fallback.

Its own Q1 is the same question as this audit's, found separately. Its options differ in one way: it recommends
keeping yellow and judging on the pictures. This audit recommends (a) below, because the spec already has a chip for
things over art and a held button is a yellow box whatever the pictures show. Both are for the Owner.

## For the Owner

**Q1. What should the three touch buttons look like while the game is being played?** (B1.) The game tells the
player to "push the yellow box", which is the crate.

- **(a) White at rest, yellow only while held.** A navy chip with a white edge, a white arrow and a white word; it
  turns yellow under the thumb. This is the spec's chip for things over art, and yellow still means "you are touching
  this". Recommended.
- **(b) As first planned.** A yellow arrow and word at rest, a solid yellow box while held. The words stay, so the
  screen has four yellow boxes when one is held.
- **(c) Leave the buttons as they are today.** They are part of the game, not of its title, pause or settings
  screens. Blueprint goes on the words strip, the loading line and the problem screen only. The framework change and
  the pin move (Tasks 1 and 2) are not needed, so the work is one pull request, not three.

The Owner may instead change the words ("Push the yellow box") and keep (b); the words are then the Owner's to give.

Sent to the coordinator. Not decided here, and the plan picks none by default.
