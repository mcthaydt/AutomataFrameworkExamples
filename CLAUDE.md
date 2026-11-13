This codebase is yours: what it's for and how it's built are your call, and you'll keep building on it.

# AutomataFrameworkExamples

AutomataFramework is a framework and set of editors for making games, where agents do the authoring and every piece
of authorable content can be edited on an iPad. This repo is its demo game (working name "Crate Game"), made only
with `@automataframework/framework`, the way an outside game would be. Later it also holds the site's one-file
examples and the 3D game. The first layer's design is in the framework's repo:
[`docs/superpowers/specs/2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md);
where this page is short, the spec has the detail. This page is a copy of AutomataFramework's `CLAUDE.md` with what is
particular to this repo added under "This repo".

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
- **Editors commit here.** The browser editors save by committing content files to this repo. A commit that only
  changes content must pass CI, so the replay check accepts "the content changed" and compares the four engines with
  each other.
- **`replays/level-1.json` is the golden.** It is recorded in CI, never typed. Once it holds hashes it changes only
  with the Owner seeing before and after. An editor never writes it.
- **Nothing is published from here.** No changesets, no API report, no release workflow. `pnpm build` makes `dist/`,
  a static folder that plays the game from any path; the Site repo builds and hosts it.
- **`ci-screens`** is a long-lived branch CI writes pictures to (phone, tablet and desktop, upright and sideways),
  so a cloud session can look at them. It shares no history with `main`.

## Principles

1. **Agent-first.** Anything a person can author, an agent can create, read and change through the same documented
   formats and commands. No hidden state, nothing mouse-only.
2. **iPad-first editors.** Touch first; desktop is a bonus.
3. **Layers in order.** 2D built in full (runtime, editors, publishing) before any 3D. 3D is a layer on top, never
   mixed in.
4. **Separate repos per layer or tool**, each with its own release. No monorepo.
5. **Characters and scenes come from the environment builder and figure builder**, carried over from the first attempt.
6. **The stack carries over whole** (PixiJS, Pixi3D, Colyseus, Effect, strict TypeScript, a deterministic sim with
   cross-browser parity tests, API reports, GitHub-hosted CI). Anything left out has a written reason. New dependencies
   need the Owner's yes.
7. **Port in layer order** from AutomataFrameworkFailed, reviewed as it lands, never ahead of the layer using it. That
   repo is a reference, not a template.

Every spec names the principle it serves; a spec serving none, or breaking one, doesn't start.

**Left out:** Ruken as a target (web, itch and desktop stay); a monorepo layout; anything mixing 2D and 3D in one
package.

## The Owner's decisions (2026-11-13)

- **Strategy and research stay private.** Positioning, competitors, pricing and market research never go in these
  public repos; the Owner keeps them in the project's private files.
- **The first layer** is a thin slice through the whole offering: the framework, a demo game, the editors, the site and
  deployment, built as a thin thread through all four repos first and then widened (milestones M1 to M4).
- **Repos:** AutomataFramework, AutomataFrameworkExamples (this one: the demo game, later the 3D game, the site's
  examples), AutomataFrameworkEditors, AutomataFrameworkSite. PixiJS is the biggest inspiration.
- **Determinism means physics.** Rapier's deterministic 2D build. Physics and networking (Colyseus) are in the core,
  like the ECS (Koota).
- **Multiplayer:** every game is built as if it were multiplayer; turning it on is a per-game choice. Networking is
  built and proven in CI, not deployed. Fly.io hosts the room server once the 3D game uses it.
- **The demo game** is a small original physics platformer, single-player, with every built-in: saves; title, pause and
  settings screens; keyboard, touch and gamepad with remapping; music and sound with volume; phone, tablet and desktop
  layouts; languages.
- **Editors:** all nine old 2D editors plus the figure and environment builders, which make 2D art only. In the
  browser, and as a Tauri app for iPad, Android and desktop.
- **Edits live in the game's GitHub repo.** Save makes a commit; edits that collide merge the way GitHub does.
  Sign-in runs through a Cloudflare Pages Function; the site is on Cloudflare Pages.
- **Formats:** game content is JSON; everything else is TOML.
- **Order inside the editors:** Levels, then Feel and Tuner (the first editor slice), then every other 2D editor.
- **Releases are big and few** (the Owner, 2026-11-13). Release 1 is when 2D is finished (the framework in full and
  the demo game), Release 2 the 2D editors, Release 3 the website, Release 4 distribution (shipping games and the
  editor app), Release 5 3D, and the loop repeats for 3D. Milestones are not releases: nothing is published per
  milestone, and `release.yml` runs only when the Owner starts it by hand. Small releases come back only once the
  product is officially feature complete.
- **Publish targets:** web, itch.io, Wavedash (if its rules fit the host port) and desktop.
- **Languages:** games ship English, Spanish, Korean, Japanese, Chinese and Portuguese. Editors add French, Russian and
  German. The list follows the most popular languages for Godot.
- **`main` is protected** in every repo: pull requests only, no force pushes or deletion, checks required once CI exists,
  no required approving review. Every new repo gets the same protection, and its own copy of this page, when it is
  created.

## Workflow

Each stage is a fresh session on its own branch; the handoff is committed docs.

1. **Spec**: coordinator and Owner, superpowers brainstorming, written to `docs/superpowers/specs/<date>-<topic>-design.md`.
2. **Plan**: Fable 5.2, medium effort, writing-plans, written to `docs/superpowers/plans/<date>-<topic>.md`.
3. **Plan audit**: Opus, medium effort, the audit prompt, written to `docs/superpowers/audits/<date>-<cycle>-plan-audit.md`.
4. **Execution**: Sonnet, high effort, executing-plans, the implementation prompt.
5. **Implementation audit**: Opus, medium effort, written to `docs/superpowers/audits/<date>-<cycle>-implementation-audit.md`.
6. **Fixes**: Sonnet, high effort.
7. **Owner review.**

Every stage reads the spec, the plan, the audits and [`docs/superpowers/progress.md`](docs/superpowers/progress.md),
updates the tracker with a progress percentage, and ends by committing and pushing.

**Implementation prompt:** "Now implement precisely as planned, in full. Implementation Requirements: - Write elegant,
minimal, modular code. - Adhere strictly to existing code patterns, conventions, and best practices. - Include
thorough, clear comments/documentation within the code. - As you implement each step: - Update the markdown tracking
document and overall progress percentage dynamically."

**Audit prompt:** "Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and
relative to the spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete
implementations or incomplete integrations. Do your best work."

## Sessions and reporting

- One long-lived coordinator. One long-lived merge session merges each finished stage branch to `main` by pull request
  once checks pass, then deletes the branch; it never leaves a passing pull request open. Stage sessions are archived
  when done.
- **Stage sessions report to the coordinator:**
  - one line per task: the commit, the test count, any surprises;
  - immediately at any stop (a stop rule, a cap, a failing test, an access refusal, a missing tool), and that task
    stops;
  - each deviation from the plan, with the reason;
  - Owner-only questions, with options, before defaulting;
  - a handoff at 90 minutes;
  - a summary at the end.
- **The merge session reports:**
  - each merge;
  - immediately, then waits for an answer, on any of these: a failing check, a conflict, a golden moved without a
    commit naming it, more than five branches, an unrequested branch, or any judgement call.

## Rules

- **The drunk-grandma test.** All copy and UX (every editor, the site, the game's screens) must let a drunk grandma
  tell what is happening and what to press. A screen that fails it is a defect.
- No subagents unless the Owner says so.
- **No AI attribution anywhere.** No `Co-Authored-By: Claude`, no session-link trailer and no "Generated with Claude Code" in
  commits, pull request bodies or docs (the Owner, 2026-11-13). Before any commit, set the author with
  `git config --global user.name "Dawson McThay" && git config --global user.email "107786093+mcthaydt@users.noreply.github.com"`.
- Refresh sessions after 90 minutes.
- Branches: `main` plus branches with CI running, five at most.
- **Tests run only in GitHub-hosted CI, never locally.** Verify through the pull request's CI runs.

## Structure

```
automata.toml                 the project file: the game's name, its first level, its hero, its content files
content/                      the game's content, JSON, written only by writeContent
replays/                      recorded plays; level-1.json is the golden
index.html                    the page
src/index.ts                  the public surface: everything, for a page
src/headless.ts               everything that needs no page: the sim side of the game
src/main.ts                   the page's script
src/lib/                      shared helpers, no feature logic
src/features/<feature>/       <feature>.ts entry, <part>.ts one job per file
scripts/                      thin CLI wrappers
tests/architecture.test.ts    imports go down, no cycles, no tests in src, only the framework is imported
tests/features/<feature>/     mirrors src/features
tests/lib/                    tests of src/lib
tests/game/                   checks of the game's own files at the root
tests/replay/                 the recorded play, in Node and three browsers
tests/journeys/               the built page driven in a real browser, end to end
tests/fixtures/               shared test helpers
tests/workflows/, tests/docs/ checks that read a workflow or the README
docs/superpowers/             plans/, audits/, progress.md (specs live in AutomataFramework)
```

Features import only from features below them (`hero`, then `plugins`, then `play`). No top-level `components/`,
`services/` or `utils/`.
