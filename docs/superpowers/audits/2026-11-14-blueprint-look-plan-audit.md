# Plan audit: the Blueprint look for the demo game's screens

Written 2026-11-14. Stage 3 (Plan audit) of cycle 2, for
[`plans/2026-11-14-blueprint-look-examples.md`](../plans/2026-11-14-blueprint-look-examples.md). It was read against
the spec's section "Visual direction"
([AutomataFramework, pull request 20](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)),
this repo's `CLAUDE.md` and [`progress.md`](../progress.md), this repo's `main` at `f39ff0f`, AutomataFramework's
`main` at `c5e28fa`, and AutomataFrameworkSite's `public/_headers` on its `main`.

## The answer first

The plan is sound and true to the spec. It keeps the game's art and both goldens out of reach, keeps the strict-policy
journey as it is and widens it to the Site's whole policy, gives the framework a way to take a look without ever
imposing one, and has real end-to-end journeys in Chromium, WebKit and Firefox at the phone and tablet sizes, upright
and sideways, and the desktop. The three packages exist at the named versions with the licences the plan states, and
every file path and icon name it uses is in them.

It is **ready to execute after small edits**: one blocking finding (B1), five should-fix findings (S1 to S5), seven
notes (N1 to N7) and one Owner question (Q1), sent to the coordinator and not decided here. The font packages' yes
(the plan's own stop before Task 3) is still open and is not a finding.

**How the findings are applied** (the workflow): stage 4 (Execution) reads this audit with the plan and applies B1
and S1 to S5 in the tasks they name. Where the two differ, this audit wins. Q1 waits for the Owner; only Task 6's
picture review depends on it, and nothing before that does.

## Method

- Every name the plan touches was read at the source: the framework's `src/features/input/touch.ts`, `input.ts` and
  `src/index.ts` (what reaches the API report), its `knip.json`, `ci.yml` and `tests/features/input/input.browser.test.ts`;
  this repo's `play.ts`, `play.css`, `words.ts`, `controls.ts`, `index.html`, `vite.config.ts`, `knip.json`,
  `package.json`, `vitest.config.ts`, `ci.yml`, `tests/pin.test.ts`, every file in `tests/journeys/` and
  `tests/features/play/play.browser.test.ts`; the game's content (`content/characters/*.json`) for the colours on the
  canvas.
- The three packages were fetched from npm at the named versions and opened: their `exports`, licences,
  `latin-600.css` and `latin-400.css`, and the five icons the plan names (`arrow-left`, `arrow-right`,
  `arrow-fat-up`, `check-circle`, `warning`). All exist.
- The contrast pairs the plan tests were worked by hand with the WCAG formula; the threshold of the layout journey's
  red finder was worked against the marker colour.
- No tests were run (project rule). Nothing here is measured in a browser.

## Blocking (fix before execution)

**B1. Opaque buttons blind the journey that keeps the buttons off the hero.** `tests/journeys/layout.journey.test.ts`
("at `<size>`, no button sits on the hero") finds the hero as the box around every red pixel in a screenshot, then
checks no button's box overlaps it. Its own comment says it relies on seeing "the hero seen through a button": today
the buttons are see-through (`rgba(20,20,30,0.55)`). Task 4 makes them solid paper. From then on, a button over the
bottom half of the hero hides that half, the red box shrinks to the half that shows, its bottom edge meets the
button's top edge, and `overlaps` says no: the journey passes on exactly the failure it exists to catch. A button over
the whole hero fails it only as "the hero is on screen", which names the wrong problem. The plan's Step 4 ("the older
tests pass without a change to what they expect") would be true and the guard gone.

*Fix:* in Task 4, Step 3, change the layout journey so the screenshot it reads does not show the buttons: before
`page.screenshot()`, add `page.addStyleTag({ content: '.automata-touch { visibility: hidden !important }' })`
(`visibility` keeps their boxes, so `boundingBox()` still measures where they are; the overlay sets no `visibility`
inline). Update its comment ("the hero and the hero seen through a button" becomes "the hero, with the buttons hidden
from the picture but still measured"). This also removes a second, smaller risk: the finder's rule (red at least 50
above green and blue) passes the marker at 43, so any colour fringe on yellow words would be counted as hero. Add to
Task 4's tests one that proves the fix bites: in the layout journey, with a style that moves the Jump button onto the
hero's start (`.automata-touch-button[data-action='jump'] { position: fixed; left: <hero x>px; top: <hero y>px }`),
the check reports an overlap. Then remove it. If that is more than a few lines, write it as a `.browser.test.ts`
against `redBox`'s logic instead and say so in the report.

## Should fix

**S1. Task 4's button tests start the buttons the wrong way.** `play.browser.test.ts` mocks `matchMedia` to say "no
touch screen" for every test, and `coarse: true` only changes the words: the framework decides to show its buttons
from `matchMedia` itself (`touch.ts`, `show(win.matchMedia?.('(pointer: coarse)').matches === true)`). So
"`a touch button is a navy chip…`" as written ("on a coarse start") finds the buttons hidden: the colours still
compute, but "at least 64 by 64" fails on a `display: none` button, for the wrong reason. *Fix:* in Task 4, Step 1, the
three button tests begin as `'the words never sit under a touch button'` does today: `begin()`, then
`pointer('pointerdown', 'touch')` on the root.

**S2. Task 3's font journey cannot pass for Plex in Task 3.** A browser fetches a font only when something on the page
is set in it. Task 3 declares the faces and the tokens but, by design, "no rule that paints anything", so nothing uses
IBM Plex Sans Condensed until Task 4 sets `font: var(--label)`. Task 3, Step 4 ("the font journey passes only for
Plex") will be red. Also, `test.todo` marks a whole test, not one expectation inside a test. *Fix:* write
`'the fonts and the icons are files beside the page'` as three tests (Plex on the playing page, JetBrains Mono on the
broken-file page, the arrow icon on the playing page) and mark all three `test.todo` in Task 3, named for Task 4;
Task 4 makes them real. Task 3's red-then-green proof is the Node and pin tests alone.

**S3. `document.fonts.check` proves less than the plan reads into it.** By the CSS Font Loading rules, `check()` is
`true` when no declared face matches the family at all, as well as when the matching face has loaded. So if the
`@import` were lost in the build, `check("600 18px 'IBM Plex Sans Condensed'")` would still be `true`, and five places
(Task 4's first test, Task 5's look journey, both of Task 6's policy tests) would pass with the system font on screen.
*Fix:* add one helper to `tests/journeys/open.ts` (and its twin in the browser test file), `fontLoaded(page, family,
weight)`, true only when `[...document.fonts]` holds a face whose family (quotes stripped) and weight match and whose
`status` is `'loaded'`. Use it in all five places in place of `check`.

**S4. "The only errors logged are the blocked font requests" cannot be told from the error text.** In Chromium a
failed font request logs `Failed to load resource: net::ERR_FAILED`, with the address only in the message's location,
not its text; `open.ts` keeps only the text. Matching on the text would either let any resource failure through or
fail on every font. *Fix:* in Task 5, `open.ts` records, beside `errors`, each console error's `location().url`, and
the fonts-blocked journey accepts an error only when that URL matches `block`; every other error fails it. Say which
engines logged what in the task's report line.

**S5. Q1 must be in Task 6's picture questions.** The crate is yellow on the canvas (`content/characters/crate.json`,
`#f2c14e`) and the words say "Push the yellow box." Task 4 puts the marker yellow (`#FFD447`, nearly the same colour)
on the touch buttons' icons and words, and a held button becomes a solid yellow box. A first-time player asked to push
"the yellow box" now sees four yellow things. *Fix:* in Task 6, Step 3, add a fourth question for every picture with
the buttons showing: "Is it plain which yellow thing is the box to push?", and report the answer with the pictures,
whatever the Owner has said about Q1 by then.

## Notes

**N1. Each font import adds two files, not one.** `latin-600.css` and `latin-400.css` each list a `.woff2` and a
`.woff`, so Vite copies both into `dist/` (about 19 KB each for Plex). The browser fetches only the `.woff2`. Correct
the sentence in Task 3's "Interfaces"; nothing else changes.

**N2. The jump journey should look for a `controls` command.** Task 5's "the page's replay then holds a `jump`
command" means, in the framework's terms, a `controls` command whose payload holds `jump`, as the existing touch
journey checks for `right` (`play.journey.test.ts`). Copy that check.

**N3. The buttons' words get smaller.** Today they are 18 px bold; the plan sets 15 px semibold condensed capitals,
with a 28 px icon above. Still large on a 64 px button, but it is a drunk-grandma call: Task 6's pictures should be
looked at for it on the phone upright, and 16 px is the fallback if the word reads small.

**N4. Pictures of the problem screen miss the tablet held sideways.** The journeys check the broken-file screen at
every size (Task 5); the pictures add `problem-844x390` and `problem-820x1180` to the existing `problem-390x844`. Add
`problem-1180x820` so a person looks at all four phone and tablet shapes.

**N5. The colour test misses colour names.** `blueprint.test.ts` forbids `#…`, `rgb(` and `hsl(` in `play.css`, but
`white` or `grey` would pass. Add a check that every `color`, `background` and `border` value in `play.css` uses
`var(` (or is `none`, `transparent`, `currentColor`, `inherit`).

**N6. The whole policy is copied by hand.** `SITE_WHOLE_POLICY` is the Site's `public/_headers` line today (checked:
it matches exactly). Put the Site's commit beside it in a comment, so a later change on the Site is noticed when this
journey is next read.

**N7. Stage 4 has no per-task weights.** Cycle 1 gave each task a share of stage 4. Give this one the same: Tasks 1 to
6 at 16% each and the close at 4%, so the tracker moves as each task lands.

## Against the spec

| Spec ("Visual direction") | Plan | Verdict |
|---|---|---|
| The five tokens, exact values | Global Constraints, Task 3, Task 4's tests | Covered |
| Marker means "you can touch this" | Only the touch buttons use it | Covered; Q1 and S5 on the crate |
| Square corners 2 to 3 px, 1 px chalk borders, shadow only on floating panels | 2 px, 1 px chalk, no shadows | Covered |
| Plex Sans Condensed for labels, in capitals | Capitals for the button words; the strip's sentences in sentence case | Covered; sentences are not labels, and sentence case reads better |
| JetBrains Mono for numbers and measures | For the problem lines (a file and a place in it) | A fair reading; nothing else in the game is a measure today |
| Korean, Japanese, Chinese use Noto Sans | Left to M2 with the languages | Covered; the `latin` subset also covers Spanish and Portuguese |
| How fonts ship is the plan's choice; a font package needs the Owner's yes | Three packages, a stop before Task 3 | Covered; the yes is open |
| Dark by default; light later | `color-scheme: dark`, no light theme | Covered |
| The game's art is never restyled | No change to `content/` or the renderer; the sky fills the canvas, so the page colour never shows inside the level | Covered |
| Phosphor regular, a word with every icon | Icons above the button words, beside the title and "well done" | Covered |
| Applies to the demo game's own screens; the framework never imposes Blueprint | Seven properties with today's look as fallback; Task 1 tests "with nothing set" | Covered |
| 44 px touch targets, 48 px primary | 64 px kept, tested themed and at 320 px wide | Covered |
| Every word passes the drunk-grandma test | `words.ts` unchanged; pictures in three browsers | Covered after S5 and Q1 |

**The coordinator's checks:**

- **Art and goldens untouched:** yes. No task touches `content/`, the renderer or `replays/`; Task 2 treats a moved
  hash as a stop; Task 6, Step 5 checks `git diff main -- replays/` is empty. The framework change is DOM styling only
  and cannot reach the sim.
- **The strict-policy journey kept:** yes. Task 6 keeps it untouched and adds two tests under the Site's whole policy
  (fonts fall under `default-src 'self'`, masks under `img-src 'self'`, both same origin).
  `vite.config.ts`'s `assetsInlineLimit: 0` is needed: the icons are under 4 KB and would otherwise become `data:`
  addresses.
- **Onboarding:** the player's first minute keeps its three beats (the words say who you are and what to press, the
  buttons carry icons and words, "well done" gains a check mark). A developer gets one README row and three
  sentences, and an agent gets the framework README's table of seven properties. Covered; Q1 is the one risk.
- **The drunk-grandma test:** covered by the unchanged words, the contrast test (chalk on paper 14.6, pencil on paper
  7.3, marker on paper 11.6 either way round, chalk on hatch 12.7, all against 4.5, worked by hand) and the picture review; S5,
  N3 and Q1 sharpen it.
- **e2e in three browsers, phone and tablet, both ways up:** Task 5 runs every look journey at all four phone and
  tablet shapes and the desktop, in each `engines` job; B1 restores the guard on the hero; N4 completes the pictures.

## For the Owner (sent to the coordinator, not decided here)

**Q1. The crate and the buttons are both yellow.** The words say "Push the yellow box"; the crate is drawn yellow; the
spec makes yellow the colour of "you can touch this", so the plan puts it on the touch buttons. Options:

- **(a) Keep the plan, and judge it on the pictures** (recommended): the buttons are labelled, sit in the bottom
  corners and are not boxes in the level; S5 makes the picture review ask the question in three browsers, and if the
  answer is no, it comes back to you.
- **(b) Chalk on the resting buttons, yellow only while held.** No confusion at rest, but a resting button no longer
  says "touch me" in the spec's colour.
- **(c) Change the words to name the crate another way**, such as "Push the crate." The art stays; the words file
  changes (it is the only change to `words.ts` in this cycle).

## Also in this pull request

- `docs/superpowers/progress.md`: cycle 2's stage 3 marked done, overall progress moved from 12% to 18%, and a log
  line.
