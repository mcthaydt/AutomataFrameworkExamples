This codebase is yours: what it's for and how it's built are your call, and you'll keep building on it.

# AutomataFrameworkExamples

AutomataFramework is a framework and set of editors for making games, where agents do the authoring and every piece
of authorable content can be edited on an iPad. This repo is its demo game (working name "Crate Game"), made only
with `@automataframework/framework`, the way an outside game would be. Later it also holds the site's one-file
examples and the 3D game. The first layer's design is in the framework's repo:
[`docs/superpowers/specs/2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md);
where this page is short, the spec has the detail.

**The shared rules are in [AutomataFramework's `docs/rules.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/rules.md)** (principles, the Owner's decisions, the
workflow, the visual review, sessions, the rules and Fast CI). Read it first. This page holds only what is particular to
this repo; a shared rule is changed there, never here.

## This repo

- **The game is at the root:** `automata.toml` (the project file), the content files it lists under `content/`, the
  game's code under `src/`, and one recorded play in `replays/`.
- **Only the published package.** Code under `src/` imports `@automataframework/framework` and
  `@automataframework/framework/headless` and nothing else, never a path inside the package and never the framework's
  own dependencies. `tests/architecture.test.ts` fails on it.
- **The framework is pinned to a commit** on its `main` until Release 1, never a branch:
  `github:mcthaydt/AutomataFramework#<commit>`. Moving the pin is its own pull request and changes the dependency,
  the matching line in `pnpm.onlyBuiltDependencies` (pnpm builds a git dependency only when that line allows it) and
  the lockfile. At Release 1 it switches to the npm version.
- **Content has one writer.** A content file is committed exactly as the framework's `writeContent` writes it;
  after a hand edit, run `pnpm content:write`. CI fails a file that is not in that form or that does not load.
- **Editors save here by the person's level** (the spec's "Saving"; levels are in `automata.access.toml`). An Edit or
  Owner save is committed by the editors' GitHub App straight to `main`; a Suggest or Approve save is a pull request
  from `automata/<login>` into `main`, which a person who may approve approves in the editor (the App merges it once
  the checks pass). Either way the change is content files only, written as `writeContent` writes them, so a change
  that only touches content must pass CI: the replay check accepts "the content changed" and compares the four
  engines with each other. An Edit save lands before CI has run on it, so CI's push run on `main` is its check, and
  the Site shows only the newest commit whose checks all passed (its own rule), so a red save is never shown. For the
  App to commit to `main`, which requires `check` and the three `engines` checks, it must be on `main`'s bypass list
  here; that is a settings step when the editors are deployed. The journeys that check gameplay play a level of
  their own (`tests/fixtures/pinned-level.ts`), so a content save, wherever it puts the crate, cannot turn them red.
- **`replays/level-1.json` and `replays/test-game.json` are the goldens.** Both are recorded in CI, never typed. Once
  one holds hashes it changes only with the Owner seeing before and after. An editor never writes either. The first
  is the real level's play, which a content edit may change without breaking CI (the check says "the content
  changed"); the second is a play of a game built inside the tests, which no edit can reach, so a change to the
  game's code that alters the play fails in every engine. The merge session stops on a golden moved without a commit
  naming it, and these are the two files it watches.
- **Five build-time packages, named only in CSS.** `@fontsource/fredoka`, the rounded partners for the three languages Fredoka
  has no letters for (`@fontsource/m-plus-rounded-1c` for Japanese, `@fontsource/jua` for Korean, `@fontsource/zcool-kuaile`
  for Chinese; one weight each) and `@phosphor-icons/core` (exact versions, in `devDependencies`) give the game's own screens
  the Blueprint look; the Owner approved the icons and Fredoka as the one font, never smaller than 18 pixels (2026-11-14), and
  the first spec's visual direction names the partners (plan D, Part 1). Only `src/features/play/*.css` names them, never a
  `.ts` file, so knip, which does not read CSS, would call them unused: they are under `ignoreDependencies` in `knip.json`
  for that reason alone. A language's page names its own partner first after Fredoka and no other, so a Korean page never
  fetches the Japanese font.
- **The game's words.** Every sentence a player reads is in `content/messages/{en,es,ko,ja,zh,pt}.json`, in the player's own
  language; English is `source`, so it says what each word is for, and `automata.translations.toml` marks the words a native
  speaker has read (none yet). The only sentences in code are the three the page says before any file has loaded
  (`words.ts`), for the developer. `index.html` has no `lang`: no language is the default, and the page sets it once the
  player has chosen one. A first-time player is shown the framework's language picker, with the device's language already
  chosen, before anything is said.
- **The look.** The game's own screens (the words strip, the two thumbs and the dash button, the problem screen, the loading and "well
  done" messages) use the project's Blueprint look, dark only, in palette No. 340 (Black, Neutral Gray, Peach Red; the Owner, 2026-11-14); the game's art never does. The five colours and the one
  font family are in `src/features/play/blueprint.css` and nowhere else (a test fails on any other colour), and the
  framework's touch buttons are dressed through its `--automata-touch-*` CSS properties, never by reaching into the
  framework.
- **Licence notices.** `public/licences.txt` (Vite copies it into `dist/`, beside the page) carries the notices of
  Fredoka and its three partners, the icons and Rapier (the physics, Apache-2.0, built into the framework's files), copied from each
  package's own `LICENSE`; Rapier's is the framework's `dist/rapier.LICENSE`. Move a package's version (or the
  framework pin, which moves Rapier's), and copy its `LICENSE` there again; `tests/game/licences.test.ts` fails until
  you do.
- **Watch mode.** With `?watch` in its address the game plays `replays/<first level>.json` by itself (the framework's `watchReplay`), says so, and hands over to a player on a tap, a click, Enter, Space or a control key, or when the page that frames it posts `{ automata: 'play' }`. It tells that page `{ automata: 'state', state }`. The build copies the recording into `dist/`. A missing or broken recording is never a problem screen: the game opens ready to play (the Owner's answers, 2026-11-14: it plays for everyone, again and again, with a one-second rest).
- **Nothing is published from here.** No changesets, no API report, no release workflow. `pnpm build` makes `dist/`,
  a static folder that plays the game from any path; the Site repo builds and hosts it.
- **`ci-screens`** is a long-lived branch CI writes pictures to (phone, tablet and desktop, upright and sideways),
  so a cloud session can look at them. It shares no history with `main`.
- **Onboarding here:** a first-time developer must get from clone to a changed game by following the README.
- **Branches:** the editors' save branches (`automata/<login>`) do not count toward the five (the Owner, 2026-11-13):
  this repo is our test game, and the editors are a product for other teams' repos. The editors' notes branch,
  `automata/notes` (holding `automata.notes.toml`), is allowed too, and does not count either.
- **Fast CI here.** A draft runs Chromium only (the Owner, 2026-11-16): WebKit and Firefox, and so the recorded plays
  in every engine (the proof that every engine plays the same), run in the full run that gates merge. A draft runs the
  Node tests the change reaches, the recorded plays in Chromium, and the journeys, only when what the page is made of
  changed (`src/`, `content/`, `replays/`, the page, `public/`, the journeys), stopping at the first failure; the
  pictures journey only when something seen changed (a `.css` file, the words, the page, the art) or the pull request
  has the `screenshots` label (`pictures` still works). The game is one screen, so there is no narrower set of
  pictures. `pnpm-workspace.yaml` also counts as build setup. The docs-only path never covers the README. The full
  run's 18 shards are `browsers (<engine> <n>/6)`, with `engines (<engine>)` checks (the gate counts six each).

## Structure

```
automata.toml                 the project file: the game's name, its first level, its hero, its content files
content/                      the game's content, JSON, written only by writeContent
replays/                      recorded plays; level-1.json and test-game.json are the goldens
index.html                    the page
src/index.ts                  the public surface: everything, for a page
src/headless.ts               everything that needs no page: the sim side of the game
src/main.ts                   the page's script
src/lib/                      shared helpers, no feature logic
src/features/<feature>/       <feature>.ts entry, <part>.ts one job per file
public/                       files served as they are: licences.txt
scripts/                      thin CLI wrappers
tests/architecture.test.ts    imports go down, no cycles, no tests in src, only the framework is imported
tests/architecture/           the rules that test reads (rules.ts) and a test of the rules
tests/pin.test.ts             the framework pin is a commit, in both places
tests/framework.test.ts       the pinned framework is installed and built
tests/features/<feature>/     mirrors src/features
tests/lib/                    tests of src/lib
tests/game/                   checks of the game's own files at the root
tests/replay/                 the recorded plays (level-1.json, test-game.json), in Node and three browsers
tests/journeys/               the built page driven in a real browser, end to end
tests/fixtures/               shared test helpers, the test game and the pinned level the journeys play
tests/workflows/, tests/docs/ checks that read a workflow or the README
docs/superpowers/             plans/, audits/, progress.md (open work), history.md (specs live in AutomataFramework)
```

Features import only from features below them (`plugins`, then `play`). No top-level `components/`,
`services/` or `utils/`.
