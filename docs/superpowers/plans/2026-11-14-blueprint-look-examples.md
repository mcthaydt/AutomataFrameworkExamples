# The Blueprint Look for the Demo Game's Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, in
> one session, with no subagents (project rule). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the demo game's own screens (the words strip, the touch buttons, the problem screen and the loading and
"well done" messages) the Blueprint look, dark, with the approved fonts and icons, without touching the game's art or
its play.

**Architecture:** The look is CSS only, in the `play` feature: one file of tokens and fonts, one file of rules. The
touch buttons are drawn by the framework with their look set inline, so the framework first learns to read its
buttons' look from CSS custom properties (today's look stays the default), and the game sets those properties. That is
three pull requests in order: the framework's hooks, the pin move here, then the look here.

**Tech Stack:** what both repos already have, plus three build-time packages in this repo:
`@fontsource/ibm-plex-sans-condensed` 5.3.0 (OFL-1.1), `@fontsource/jetbrains-mono` 5.3.0 (OFL-1.1) and
`@phosphor-icons/core` 2.1.1 (MIT). Vite copies the font and icon files into `dist/`; nothing is fetched from another
site.

**Spec:** [`AutomataFramework: docs/superpowers/specs/2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
the section "Visual direction". Principles served: 2 (touch first: the buttons and words are judged on a phone and a
tablet, both ways up), 1 (the look is plain CSS files and seven documented properties an agent can read and change),
6 (the three packages are the ones the Owner approved; nothing else is added).

Read with it: this repo's `CLAUDE.md` and `docs/superpowers/progress.md`, the plan audit
(`docs/superpowers/audits/2026-11-14-blueprint-look-examples-plan-audit.md`, whose findings are already written into
this plan), and in AutomataFramework `src/features/input/touch.ts` and `tests/features/input/input.browser.test.ts`.

## What this plan covers, and what it does not

Covered: the words strip above the game, the three touch buttons, the screen for a game that cannot start, the
"Loading the game…" and "Well done!" messages, and the page's own background.

Not covered: the level, the hero and the crate (the game's art is never restyled); the title, pause and settings
screens (they do not exist until M2, and take this look when they arrive); a light theme (the spec: later); Korean,
Japanese and Chinese fonts (the game is English only until M2's languages; Noto Sans arrives with them); the editors
and the site (their own plans). The drawing-notes layer, the stamps and the per-editor paper tints are the editors'
and are not used here.

## Open for the Owner (answer before Task 1 starts)

**Q1. What should the three touch buttons look like while the game is being played?** The game tells the player to
"push the yellow box", which is the crate, and the look's yellow means "you can touch this". The audit's B1 has the
reasoning.

- **(a) White at rest, yellow only while held.** A navy chip with a white edge, a white arrow and a white word; it
  turns yellow under the thumb. Below, the **resting ink** is chalk.
- **(b) Yellow at rest, a solid yellow box while held.** Below, the **resting ink** is marker.
- **(c) Leave the buttons as they are today.** Blueprint goes on the words strip, the loading line and the problem
  screen only. Tasks 1 and 2 are not done and there is one pull request (Part C). In Tasks 3 to 6, leave out every
  row, test and picture marked **(buttons)**; the older tests of the buttons stay as they are.

If the Owner instead gives new words for "Push the yellow box", `words.ts` changes to exactly those words in Task 4
(with the tests that quote them), and the buttons follow (b).

Execution does not start until the coordinator passes on the Owner's answer. It never picks one by default.

## Before starting

Stop and report to the coordinator if any of these is not true. Do not work around one.

1. The coordinator has passed on the Owner's answer to Q1. (The three packages need no further yes: the Owner
   approved `@phosphor-icons/core` in the spec and both `@fontsource` packages at 5.3.0 on 2026-11-14. The versions
   in "Tech Stack" are the ones to install, exactly.)
2. AutomataFramework's `main` is at or after `9109fa357193f57e2d12271c6e6b58dbd783b427` and this repo's pin is that
   commit.
3. `replays/level-1.json` and `replays/test-game.json` are the same as on `main` at the start of every task. They
   must be the same at the end of every task too.

## Global Constraints

- **The game's art is never restyled.** No change to `content/`, to the renderer, or to anything drawn on the canvas.
- **The goldens do not move.** No commit in this plan touches `replays/`. If any check asks for a new recording, stop
  and report; a golden moves only by a commit that names it, after the Owner has seen before and after.
- **Tokens, exactly:** paper `#0A1F3C`, hatch `#0E2A50`, chalk `#EAF2FA`, pencil `#8FB0D3`, marker `#FFD447`. No other
  colour appears in the game's CSS or in `index.html`.
- **Marker means "you can touch this"** and nothing else: here, only the touch buttons use it, as Q1's answer says.
- **Type:** IBM Plex Sans Condensed, weight 600, for every word a person reads as a sentence or a label; capitals
  only for labels (the button words), never for a whole sentence. JetBrains Mono, weight 400, only for where a
  problem is (a file's name and the place in it), never for a sentence.
- **Shape:** corners 2 px, borders 1 px chalk, no shadows (nothing here floats over a panel).
- **No motion.** Nothing fades, slides or grows; a held button changes colour at once. (A transition added later
  needs its reduced-motion twin, a plain fade.)
- **The keyboard's place is always shown:** anything that can take focus shows a 3 px chalk outline, 2 px away from
  it, on `:focus-visible` (the Site's ring).
- **Icons:** Phosphor regular only, always with a word beside or under them.
- **Touch targets:** the buttons stay at least 64 px by 64 px (the framework's own minimum; the spec asks 48).
- **Dark only.** The page declares `color-scheme: dark`.
- **Every file comes from the page's own origin** as a file: no `data:` fonts, no other host. The Site's policy
  (`default-src 'self'`) blocks anything else.
- **Words:** `src/features/play/words.ts` does not change (unless the Owner's answer to Q1 gives new words). Every
  word still passes the drunk-grandma test, and no button may be mistaken for the "yellow box" the words name.
- **Dependencies:** the three packages go in `devDependencies` at exact versions (they are build inputs; the test
  "the game depends on nothing but the framework" stays true). Nothing else is added.
- **A game imports only the framework in code.** The packages are named only in CSS (`@import`, `url()`), never in a
  `.ts` file.
- **The framework never imposes Blueprint.** With no property set, the framework's buttons look exactly as today.
- **Private notes stay private.** No reference or competitor name from the research goes into either repo.
- **Tests run only in GitHub-hosted CI.** Each "run" step below means: push, then read the pull request's checks with
  `gh pr checks <number> --watch` and, for a failure, `gh run view <run> --log-failed`.
- **No AI attribution.** Before the first commit:
  `git config --global user.name "Dawson McThay" && git config --global user.email "107786093+mcthaydt@users.noreply.github.com"`.
- **Reporting:** one line to the coordinator per task (commit, test count, surprises); at once on any stop; every
  deviation with its reason; a handoff at 90 minutes.

## Review Focus

1. **The font files are slow or blocked.** The words show at once in the system font, the layout holds and no problem
   screen appears. (Task 5, `look.journey.test.ts`, "with the fonts blocked".)
2. **The fonts arrive after the game has started** and change the strip's height. The game refits: the words still end
   where the canvas begins. (Task 5: the words and layout journeys wait for `document.fonts.ready` first.)
3. **A narrow frame, 320 px wide,** as a site may embed the game. The three buttons fit side by side with no overlap
   and nothing scrolls sideways. (Task 5, "at 320 wide".)
4. **The Site's whole policy, not only its script line.** Fonts and icons load and nothing is blocked. (Task 6.)
5. **A game that sets none of the framework's new properties** looks exactly as before. (Task 1, "with nothing set".)

---

## Part A: AutomataFramework (one pull request)

Branch from `main`. This part follows the framework repo's own rules (its `CLAUDE.md`); its tracker gets a log line.
Parts A and B are not done if the Owner's answer to Q1 is (c).

### Task 1: The touch buttons read their look from CSS custom properties

**Files:**
- Modify: `src/features/input/touch.ts`
- Modify: `src/features/input/controls.ts` (doc comment on `Control` only)
- Modify: `README.md` (a short section, "Make the touch buttons your own")
- Modify: `docs/superpowers/progress.md` (one log line)
- Test: `tests/features/input/input.browser.test.ts`, `tests/docs/readme.test.ts`

**Interfaces:**
- Produces, for Part C (all are names in the DOM and in CSS; no TypeScript export changes, so the API report must not
  change):
  - the overlay has class `automata-touch`; every button has class `automata-touch-button` and `data-action="<action>"`
    (the action's name from the game's `Controls`, e.g. `left`);
  - seven properties, read from the button's own computed style (so they inherit from the mount or any ancestor), each
    with today's value as its fallback:

    | Property | Fallback (today's look) |
    |---|---|
    | `--automata-touch-background` | `rgba(20,20,30,0.55)` |
    | `--automata-touch-color` | `#fff` |
    | `--automata-touch-border` | `2px solid rgba(255,255,255,0.85)` |
    | `--automata-touch-radius` | `16px` |
    | `--automata-touch-font` | `700 18px/1.1 system-ui,sans-serif` |
    | `--automata-touch-pressed-background` | `rgba(255,255,255,0.55)` |
    | `--automata-touch-pressed-color` | `#111` |

  - `TOUCH_PROPERTIES: readonly string[]`, the seven names, exported from `touch.ts` for the tests only (not from
    `src/index.ts`).
- Not themable, on purpose: the minimum size, the gaps, the safe-area padding, `touch-action` and the other
  touch-safety styles.

- [ ] **Step 1: Write the failing tests** in `tests/features/input/input.browser.test.ts`:

  - `'with nothing set, the buttons look as they always have'`: after `firstTouch()`, the computed style of
    `button('Jump')` has `backgroundColor` `rgba(20, 20, 30, 0.55)`, `color` `rgb(255, 255, 255)`,
    `borderTopLeftRadius` `16px`, `borderTopWidth` `2px`, `fontWeight` `700`, `fontSize` `18px`.
  - `'a game sets the buttons' look with seven properties on the mount'`: set on `mount.style`
    `--automata-touch-background: rgb(10, 31, 60)`, `--automata-touch-color: rgb(255, 212, 71)`,
    `--automata-touch-border: 1px solid rgb(234, 242, 250)`, `--automata-touch-radius: 2px`,
    `--automata-touch-font: 600 15px/1.1 monospace`; expect the computed `backgroundColor`, `color`, `borderTopWidth`
    (`1px`), `borderTopColor`, `borderTopLeftRadius`, `fontWeight` (`600`) and `fontSize` (`15px`) to match.
  - `'a held button takes the pressed colours and gives them back'`: with
    `--automata-touch-pressed-background: rgb(255, 212, 71)` and `--automata-touch-pressed-color: rgb(10, 31, 60)` on
    the mount, a finger down on Jump gives those two computed values; lifting it gives the resting ones again.
  - `'each button says which action it is, for a stylesheet'`: the overlay matches `.automata-touch`; the buttons match
    `.automata-touch-button` and their `dataset.action` values are `['left', 'right', 'jump']`.
  - `'a themed button is still big enough for a thumb'`: with `--automata-touch-font: 600 10px/1 monospace` set, each
    button's `offsetWidth` and `offsetHeight` are at least 64.

  And in `tests/docs/readme.test.ts`: `'the README names every property a game can set on the touch buttons'`: the
  README contains each entry of `TOUCH_PROPERTIES`.

- [ ] **Step 2: Push and see them fail** in all three `engines` jobs (the look tests on the computed values, the class
  test on `matches`) and in `check` (the README test). The older test `'the words on a button can be read over the
  sky'` must still pass untouched.

- [ ] **Step 3: Implement.** In `touch.ts`, each of the seven inline values becomes `var(<property>, <fallback>)`
  (`border-radius`, `border`, `background`, `color`, `font` in `BUTTON_STYLE`; the two pressed values and the two
  resting values in `paint()`), the classes and `data-action` are set where the elements are made, and
  `TOUCH_PROPERTIES` lists the names. Nothing else in the file changes. On `Control`'s doc comment, add one sentence:
  the button carries `data-action` with the action's name. In the README, after the sentence about the touch buttons
  showing on first touch, add the section: one paragraph in plain words, the table above, and one four-line CSS
  example that sets two of the properties on the game's element.

- [ ] **Step 4: Push and see every check pass**, `pnpm api-report` included (it fails if the public surface moved; it
  must not have).

- [ ] **Step 5: Commit** as `feat(input): a game can set the touch buttons' look with CSS properties`, open the pull
  request, and report to the coordinator. The merge session merges it; note the merge commit's full hash, called
  `<hooks>` below.

---

## Part B: the pin move (this repo, its own pull request)

### Task 2: Move the framework pin to `<hooks>`

**Files:**
- Modify: `package.json` (the dependency and the matching `pnpm.onlyBuiltDependencies` line), `pnpm-lock.yaml`
- Modify: `docs/superpowers/progress.md` (a log line: from which commit, to which, and why)

**Interfaces:**
- Consumes: `<hooks>` from Task 1.
- Produces: the classes, `data-action` and the seven properties of Task 1, available to Part C.

- [ ] **Step 1:** `pnpm add @automataframework/framework@github:mcthaydt/AutomataFramework#<hooks>`, then edit the
  `onlyBuiltDependencies` line to the same hash and run `pnpm install` so the lockfile agrees.
- [ ] **Step 2: Push.** Every check passes with no other change: `tests/pin.test.ts`, both replay goldens in four
  engines (the framework change is about the buttons' look only, so a moved hash here is a stop), and every journey.
  Look at the pictures under `pr-<number>/` on `ci-screens`: the game must look exactly as on `main`.
- [ ] **Step 3: Commit** as `chore: move the framework pin to <hooks, 7 letters>, for the touch buttons' look
  properties`, open the pull request, report. Wait for its merge before Part C.

---

## Part C: the look (this repo, one pull request)

### Task 3: The tokens, the fonts and the icons arrive as files

**Files:**
- Create: `src/features/play/blueprint.css` (the fonts and the tokens; no rule that paints anything)
- Modify: `src/features/play/play.ts` (import `./blueprint.css` on the line before `./play.css`)
- Modify: `package.json`, `pnpm-lock.yaml` (the three `devDependencies`, exact versions)
- Modify: `vite.config.ts` (`build.assetsInlineLimit: 0`, with a comment: the Site's policy blocks `data:` fonts)
- Modify: `knip.json`: the three packages under `ignoreDependencies`, with a line in `CLAUDE.md` saying why (knip does
  not read CSS, so it reports them as unused)
- Test: `tests/pin.test.ts`, `tests/features/play/blueprint.test.ts` (new, Node), `tests/journeys/files.journey.test.ts`

**Interfaces:**
- Produces, on `.play-root` (so they reach the framework's buttons, which are inside it):
  `--paper: #0A1F3C`, `--hatch: #0E2A50`, `--chalk: #EAF2FA`, `--pencil: #8FB0D3`, `--marker: #FFD447`,
  `--label: 'IBM Plex Sans Condensed', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`,
  `--measure: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace`.
  Both are lists of families, as in the Site's plan; a rule that uses one writes its own weight and size
  (`font: 600 18px/1.3 var(--label)`, `font: 400 15px/1.4 var(--measure)`).
- Font faces loaded: `@import '@fontsource/ibm-plex-sans-condensed/latin-600.css'` and
  `@import '@fontsource/jetbrains-mono/latin-400.css'`. Only these two; each adds a `.woff2` and a `.woff` to
  `dist/assets/` (a browser asks only for the `.woff2`), and each face is `font-display: swap`.

- [ ] **Step 1: Write the failing tests.**
  - `tests/pin.test.ts`, `'the look's three packages are build inputs at exact versions, and there are no others'`:
    `devDependencies` holds `@fontsource/ibm-plex-sans-condensed` `5.3.0`, `@fontsource/jetbrains-mono` `5.3.0` and
    `@phosphor-icons/core` `2.1.1`, and the full list of `devDependencies` names equals the eight there today plus
    these three.
  - `tests/features/play/blueprint.test.ts` (reads the two CSS files and `index.html` as text):
    `'the five colours are the spec's'` (each token line above is in `blueprint.css`);
    `'no colour is written anywhere but the token file'` (no `#` hex colour, `rgb(` or `hsl(` in `play.css`; the only
    hex colour in `index.html` is `#0A1F3C`; and every `color`, `background`, `border` and `outline` value in
    `play.css` holds `var(`, or is `none`, `transparent`, `currentColor` or `inherit`, so a colour's name such as
    `white` cannot slip in);
    `'nothing is fetched from another site or carried as data'` (neither CSS file nor `index.html` contains `http:`,
    `https:` or `data:`, apart from the existing empty icon link `href="data:,"`).
  - `tests/journeys/files.journey.test.ts`, two tests, each collecting every request the page makes and how it ended:
    `'the label font and the icons are files beside the page'`: opening the built game at `phone-390x844` and tapping
    once, a request ended 200 for a URL matching `/ibm-plex-sans-condensed-latin-600-normal.*\.woff2$/` and
    **(buttons)** `/arrow-left.*\.svg$/`; and
    `'the problem screen's fonts are files beside the page'`: with the level file broken, a request ended 200 for
    `/jetbrains-mono-latin-400-normal.*\.woff2$/` and `/warning.*\.svg$/`. In both, no request went to
    another origin and none was for a `data:` URL but the empty icon link.
- [ ] **Step 2: Push and see them fail** (the pin test on the missing packages, the others on the missing file and
  requests).
- [ ] **Step 3: Implement.** `pnpm add --save-dev --save-exact` the three packages; write `blueprint.css` (the two
  imports, then one `.play-root` rule holding the seven properties); the import in `play.ts`; the Vite line; the
  knip line. (Vite 8.3.3 resolves a package's name inside a CSS `@import` and inside `url()`, and with the inline
  limit at 0 writes each icon to `dist/assets/` as its own `.svg`; the audit built it once to see.)
- [ ] **Step 4: Push and see the Node and pin tests pass.** A browser asks for a font or an icon only when
  something on the page uses it, and nothing does until Task 4. So in this task both file journeys are `test.todo`
  lines named for Task 4 (a `todo` is a whole test, not one line of one), and this task's red-then-green proof is the
  Node and pin tests alone.
- [ ] **Step 5: Commit** as `feat(play): the Blueprint tokens, fonts and icons, as files beside the page`.

### Task 4: The screens take the look

**Files:**
- Modify: `src/features/play/play.css`, `index.html`
- Modify: `tests/journeys/layout.journey.test.ts` **(buttons)** (the hero is found with the buttons hidden from the
  picture; Step 3)
- Modify: `src/features/play/play.ts` (two small things and nothing else: the goal line gets the class `play-done`
  when the crate has been pushed; and a problem line is made of two parts, where and what, as below)
- Test: `tests/features/play/play.browser.test.ts`

**Interfaces:**
- Consumes: Task 3's properties; Task 1's classes, `data-action` and seven properties.
- Produces: the class `play-done` on `.play-goal` once pushed (Task 5 and the pictures look for it).
- Produces: a problem line that names a file is
  `<li><span class="play-where">file: place: </span><span class="play-what">message</span></li>` (`file: ` alone
  when the diagnostic's `path` is `''`), built from the diagnostic's own `file`, `path` and `message`. The `li`'s
  `textContent` is exactly what `formatDiagnostic` gives, so every older test of the words passes untouched; a test
  says so. A line with no file (a game that cannot start) is one `play-what` span. `problem()` takes
  `readonly { where?: string; what: string }[]` in place of strings.

What each thing looks like. These are the decisions; the CSS follows from them.

| Thing | Look |
|---|---|
| The page (`html`, `body` in `index.html`) | background paper; `<meta name="color-scheme" content="dark">` and `<meta name="theme-color" content="#0A1F3C">` |
| The words strip (`.play-words`) | background paper, text chalk, `font: var(--label)`, a 1 px chalk line along its bottom edge; sentence case; padding and safe areas as today |
| The second line (`.play-how`) | pencil |
| "Well done" (`.play-goal.play-done`) | chalk, with the `check-circle` icon, 20 px, before the words |
| "Loading the game…" | chalk on paper, as the strip |
| **(buttons)** A touch button, resting | fill paper, 1 px chalk edge, 2 px corners; its icon (28 px) above its word; icon and word in the resting ink (Q1: chalk for (a), marker for (b)); the word in capitals, `600 15px/1.1` Plex, letter-spacing 0.04em |
| **(buttons)** A touch button, held | fill marker; icon and word paper; at once, no transition |
| **(buttons)** The buttons' icons | `left`: `arrow-left`; `right`: `arrow-right`; `jump`: `arrow-fat-up` |
| **(buttons)** A button the keyboard is on (`:focus-visible`) | a 3 px chalk outline, 2 px away |
| The problem screen (`.play-problem`) | background paper, text chalk, `600 18px/1.4` in the label font; the title 24 px with the `warning` icon, 28 px, above it; each problem line a hatch panel with a 1 px chalk edge and 2 px corners; the "fix the file" line chalk, under the list |
| Where a problem is (`.play-where`) | first on the line, inline; pencil, `400 15px/1.4` in the measure font, `font-variant-numeric: tabular-nums`, wrapping anywhere |
| What is wrong (`.play-what`) | after it on the same line, wrapping; chalk, the label font at 18 px: a sentence is never set in the measure font |

How the icons are drawn: a `::before` box with `background: currentColor` and the icon as its mask
(`mask: url('@phosphor-icons/core/assets/regular/<name>.svg') center / contain no-repeat`, with the `-webkit-mask`
twin), so an icon always has its word's colour. The buttons' rules are written against
`.play-root .automata-touch-button` and `[data-action='…']`, and the seven `--automata-touch-*` properties are set on
`.play-root` from the tokens (`background` paper, `color` the resting ink, `border` `1px solid` chalk, `radius`
`2px`, `font` `600 15px/1.1` Plex, pressed background marker, pressed colour paper). A problem line's two spans stay
inline, one after the other on the same wrapping line: a block or a flex box would put a line break into the page's
`innerText`, and the older journeys read the whole line in one piece.

- [ ] **Step 1: Write the failing tests** in `tests/features/play/play.browser.test.ts`. Each first awaits
  `document.fonts.load("600 18px 'IBM Plex Sans Condensed'")`. Two things the tests must get right:
  - **A font is "loaded" only by `fontLoaded(family, weight)`**, a helper added to this file: true when
    `[...document.fonts]` holds a face whose family (quotes taken off) and weight match and whose `status` is
    `'loaded'`. Never `document.fonts.check`: by its rules it is also `true` when no face of that name was declared
    at all, so it would pass with the import lost and the system font on screen.
  - **The buttons are brought up with a touch.** This file makes `matchMedia` say "no touch screen", and
    `coarse: true` changes only the words, so the framework's buttons stay hidden (and measure 0 by 0). Every test of
    the buttons begins as `'the words never sit under a touch button'` does: `begin()`, then
    `pointer('pointerdown', 'touch')`.

  The tests. Colours are compared as computed `rgb()` strings:
  paper `rgb(10, 31, 60)`, hatch `rgb(14, 42, 80)`, chalk `rgb(234, 242, 250)`, pencil `rgb(143, 176, 211)`, marker
  `rgb(255, 212, 71)`.
  - `'the words are chalk on blueprint paper, in the label font'`: `.play-words` background paper, `.play-goal` colour
    chalk, `.play-how` colour pencil, `fontFamily` starts with `"IBM Plex Sans Condensed"`,
    `fontLoaded('IBM Plex Sans Condensed', '600')` is `true`, and the words' `textTransform` is `none`.
  - `'every word can be read: each text and its ground reach 4.5 to 1'`: for (chalk, paper), (pencil, paper),
    (marker, paper), (paper, marker) and (chalk, hatch), the WCAG ratio worked out from the computed colours is at
    least 4.5.
  - **(buttons)** `'a touch button is a navy chip with a chalk edge'`: after a first touch, each button has background
    paper, `borderTopWidth` `1px`, `borderTopColor` chalk, `borderTopLeftRadius` `2px`, colour the resting ink,
    `textTransform` `uppercase`, `transitionDuration` `0s`; its `textContent` is still `Left`, `Right` or `Jump`; it
    is at least 64 by 64.
  - **(buttons)** `'a held button turns yellow with navy words'`: a touch `pointerdown` on Jump gives background
    marker and colour paper; `pointerup` gives the resting pair back.
  - **(buttons)** `'every button has its picture above its word'`: for each button, the computed `::before` has
    `width` `28px`, `display` `block` and a `maskImage` (or `webkitMaskImage`) that is not `none`.
  - **(buttons)** `'the keyboard's place on a button is ringed in chalk'`: after `button.focus({ focusVisible: true })`
    (and, where a browser ignores that option, a `Tab` key press first), the button matches `:focus-visible` and its
    computed `outlineColor` is chalk, `outlineWidth` `3px`, `outlineStyle` `solid`, `outlineOffset` `2px`.
  - `'pushing the crate marks the words as done'`: beside the existing check of the words, `.play-goal` has the class
    `play-done` after the push and not before.
  - `'the problem screen is the same paper, with each problem on its own panel'`: `.play-problem` background paper and
    colour chalk; each `li` background hatch and `borderTopWidth` `1px`; the screen's `scrollWidth` is no more than
    its `clientWidth` at 390 px wide with a 120-letter file path in a line.
  - `'a problem says where in the measuring font and what in plain words'`: with the two broken files of the older
    test, each `li` holds one `.play-where` (`fontFamily` starting with `"JetBrains Mono"`, colour pencil, `fontSize`
    `15px`) and one `.play-what` (`fontFamily` starting with `"IBM Plex Sans Condensed"`, colour chalk, `fontSize`
    `18px`), both `display` `inline`, and each `li`'s `textContent` equals `formatDiagnostic` of its diagnostic. With `start` rejecting `new Error('No WebGL')`, the one `li` has no
    `.play-where` and its `textContent` is `No WebGL`.
- [ ] **Step 2: Push and see them fail** in all three `engines` jobs, each on a colour or a class, not on a missing
  element.
- [ ] **Step 3: Implement** the table above in `play.css` and `index.html`, and the class and the two-part problem
  line in `play.ts`. **(buttons)** Then keep the guard that keeps the buttons off the hero: `layout.journey.test.ts`
  finds the hero by its red in a picture, and today sees it through the see-through buttons. A solid button would
  hide the part of the hero under it, the red box would shrink to what still shows, and the journey would pass on the
  very overlap it is there to catch. So before `page.screenshot()` the journey adds the style
  `.automata-touch { visibility: hidden !important }` (the boxes stay, so `boundingBox()` still measures the buttons),
  and its comment says "the hero, with the buttons hidden from the picture but still measured". Add one journey that
  proves the guard bites: with a style that puts Jump over the hero's start
  (`.automata-touch-button[data-action='jump'] { position: fixed; left: <hero x>px; top: <hero y>px }`), the same
  check reports an overlap. Replace Task 3's `test.todo` lines with their real expectations. Update the two comments that describe the old look
  (`play.css`: "plain words on white"; `tests/journeys/layout.journey.test.ts`: "the grey buttons").
- [ ] **Step 4: Push and see every check pass**, the older tests included without a change to what they expect: the
  words above the game, no button on the hero, the words under no button, the hero moving, both goldens.
- [ ] **Step 5: Commit** as `feat(play): the game's own screens take the Blueprint look`.

### Task 5: Journeys for the look, in three browsers, at every size

**Files:**
- Create: `tests/journeys/look.journey.test.ts`
- Modify: `tests/journeys/open.ts` (`fontsReady(page): Promise<void>`, which awaits `document.fonts.ready`;
  `fontLoaded(page, family, weight): Promise<boolean>`, the twin of Task 4's helper, used wherever a journey says a
  font "is loaded"; `openGame` takes `block?: RegExp`, a pattern of URLs to answer with a failed request; and
  `Opened` gains `errorUrls: string[]`, each console error's `location().url`, beside `errors`)
- Modify: `tests/journeys/words.journey.test.ts`, `tests/journeys/layout.journey.test.ts` (call `fontsReady` before
  measuring)

The journeys run against the built page, once per browser (CI's `engines` jobs set `ENGINE` to Chromium, WebKit and
Firefox), at every size in `SIZES`: the phone and the tablet, each upright and sideways, and the desktop.

- [ ] **Step 1: Write the journeys** (they are new checks of Task 4's work, so they should pass at once; a failure is
  a real defect to fix in `play.css`, then report):
  - For every size, `'at <size>, the game wears the look'`: the page's background and the strip's are paper; the
    label font is loaded (`fontLoaded`); nothing scrolls sideways (`scrollWidth` of the page is no more than
    the window's width); on a touch size, after one tap, the three buttons are each at least 64 by 64, inside the
    window, overlap neither each other nor the words, show their icon (the `::before` is 28 px wide with a mask) and
    are navy with a chalk edge **(buttons: from "the three buttons" on)**.
  - **(buttons)** For every touch size, `'at <size>, holding Jump turns it yellow and the hero jumps'`: a touch `pointerdown`
    dispatched on Jump gives the marker background, and the page's replay then holds a `controls` command whose
    payload has `jump` (the check `play.journey.test.ts` makes for `right`); `pointerup` gives navy back.
  - For every size, `'at <size>, a broken file is said on blueprint paper and fits the screen'`: with the level file
    broken as in the files journey, the alert is paper and chalk, its title and its fix line are visible without
    scrolling sideways, and there is no canvas.
  - `'at desktop-1280x720, pushing the crate says well done, with a tick'`: hold the right arrow key until the words
    are `WORDS.done`; `.play-goal` then has the class `play-done`, its `::before` is 20 px wide with a mask, and its
    colour is chalk. This is the moment a first-time player learns they did it, so it is checked in every browser.
  - **(buttons)** `'at tablet-1180x820, Tab shows where the keyboard is'`: after one tap, press `Tab` (in WebKit,
    `Alt+Tab`) until a button has focus; it matches `:focus-visible` and its outline is 3 px of chalk.
  - `'with the fonts blocked, the game still starts and the words are still above it'` (phone, sideways,
    `block: /\.woff2?$/`): state `playing`, the words end where the canvas begins, the buttons overlap nothing, and
    the only errors logged are the blocked font requests: every entry of `errorUrls` matches `block` (a browser's
    words for a failed request do not name the file, so the address is what is compared).
  - **(buttons)** `'at 320 wide, the three buttons fit side by side'`: open at `phone-390x844`, set the window to 320 by 568, tap;
    no two buttons overlap, each is inside the window, and nothing scrolls sideways.
- [ ] **Step 2: Push and see them pass** in Chromium, WebKit and Firefox.
- [ ] **Step 3: Commit** as `test(journeys): the look holds at every size, with a held button, a broken file and no fonts`.

### Task 6: The Site's whole policy, and the pictures

**Files:**
- Modify: `tests/journeys/csp.journey.test.ts`
- Modify: `tests/journeys/pictures.journey.test.ts`
- Modify: `README.md`, `CLAUDE.md`, `docs/superpowers/progress.md`

- [ ] **Step 1: Widen the policy journey.** Keep the existing test as it is. Add `SITE_WHOLE_POLICY`, the Site's
  policy as its `public/_headers` sends it today:
  `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' data: blob:; worker-src 'self' blob:; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'`
  and two tests under it: `'under the Site's whole policy the look loads and nothing is blocked'` (phone, one tap,
  `fontsReady`, tick 30: no violations, no errors, the label font loaded, **(buttons)** the Jump button's icon mask
  present) and
  `'under the Site's whole policy the problem screen loads its font'` (the broken level: no violations, and
  `fontLoaded(page, 'JetBrains Mono', '400')` is `true`). Beside `SITE_WHOLE_POLICY`, a comment names the Site's
  commit the line was copied from, so a later change there is noticed.
- [ ] **Step 2: The pictures.** In `pictures.journey.test.ts`, call `fontsReady` before every screenshot, and add
  four pictures: **(buttons)** `held-390x844.png` (Jump held), `problem-844x390.png`, `problem-820x1180.png` and
  `problem-1180x820.png`. The existing
  `screens` job copies all of them to the `ci-screens` branch under `pr-<number>/<engine>/`; the workflow does not
  change.
- [ ] **Step 3: Push, then look at every picture** in all three browsers
  (`gh api repos/mcthaydt/AutomataFrameworkExamples/contents/pr-<number>/<engine>?ref=ci-screens`, then each file).
  For each, answer in the tracker's log: can a drunk grandma tell who she is, what to press and that she did it?
  Told to "push the yellow box", could she take a button for it, resting or held? Can she read the word on each
  button on the phone held upright (it is 15 px now, 18 px before; 16 px is the fallback)? Is the level, the hero and the
  crate exactly as before? Is there any white or grey left from the old look (but the buttons, if Q1 is (c))? Copy the
  pictures to the project's shared folder at `screens/examples-pr<number>/` for the Owner. A picture that fails any
  of the five questions is a defect: fix it in `play.css` and push again. If the second question fails and the fix
  would mean other colours or other words than Q1's answer gave, stop and report: that is the Owner's.
- [ ] **Step 4: The docs.** `README.md`: one row for `blueprint.css` in "Where things are", and three plain
  sentences under a heading "The look" (the game's own screens use the project's Blueprint look; the art does not;
  the colours are in one file). `CLAUDE.md`: under "This repo", a bullet saying the same and naming the three
  build-time packages as the only ones allowed beside the framework, in CSS only. `progress.md`: this cycle's stage 4
  state (each of the six tasks is 16% of the stage and the close 4%, moved as each lands) and a log entry with the pull request numbers, the test counts and what the pictures showed.
- [ ] **Step 5: Confirm the goldens.** `git diff main -- replays/` prints nothing, and both parity tests are green in
  four engines on the last run.
- [ ] **Step 6: Commit** as `test(journeys): the Site's whole policy lets the look through; new pictures`, open the
  pull request, and send the coordinator the summary: the three pull requests, the test counts, each deviation, and a
  link to the pictures.

## When it is done

- The framework's pull request, the pin move and the look are each merged by the merge session, in that order (the
  look alone, if Q1 is (c)).
- `main` here is green in `check` and all three `engines` jobs, and `ci-screens` holds the new pictures under `main/`.
- `replays/level-1.json` and `replays/test-game.json` are byte for byte what they were.
- The Site needs no change for the game to keep working inside its frame (Task 6 proves the policy); the Site's own
  restyle is its own plan.
