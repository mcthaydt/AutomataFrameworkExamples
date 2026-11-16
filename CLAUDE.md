# AutomataFrameworkExamples

The test game of a framework for making games, where agents do the authoring and every piece of authorable
content can be edited on an iPad (working name "Crate Game"), made only with `@automataframework/framework`,
the way an outside game would be. The site builds and hosts it.

This codebase is yours to keep building on. How it is built is your call, inside the rules below. What it is for, and
anything new, is the owner's call.

## Stack and checks

- Stack: TypeScript, strict; pnpm; Node 24. The framework as a git dependency pinned to a commit (it brings PixiJS, Koota and Rapier; the game imports only the framework). Vite, Vitest 5 (Node, Chromium, WebKit, Firefox browser modes), Playwright 1.63 journeys, Biome, knip; Fredoka and its three partner fonts and Phosphor icons at build time. GitHub-hosted CI.
- Install: `pnpm install --frozen-lockfile`
- Lint: `pnpm lint && pnpm knip`
- Typecheck: `pnpm typecheck`
- Tests: `pnpm test:node` (browsers and the recorded plays: `pnpm test:engine <chromium|webkit|firefox>`; the journeys, `pnpm test:journeys`, run in CI)
- Build: `pnpm build`
- The first session in a repo runs the setup check in `release` first, before it builds anything.
- Skills, saved in `.claude/skills/`: `review` for audits and fixes, `release` for pull requests and merging,
  `visual-check` for screens. Load the one that fits before starting that kind of work. Where work runs and where
  tests run are in `release`.

## How work goes

- **These rules govern the coordinator and every session from the first message, before the repo exists.** They say
  how to run the work, not only what to commit.
- **Risk, uncertainty and dependencies decide the process,** never the number of tasks or files.
- **The brief** is what the work is judged against and what authorizes it: on the short path, the owner's request plus
  the acceptance criteria written in the pull request, with no separate document to create or approve; on the staged
  path, the spec. Its boundaries, budgets and expected duration live there.
- **The short path is the default.** Work whose outcome is clear, that is easy to undo and that needs nothing it does
  not have yet takes one session, even a whole feature across many files: understand the request, write its acceptance
  criteria, build it, verify it with the checks that touch it, and merge on green. No planning document: the brief is
  the request and the pull request. Keep working until there is something to approve; ask only when a decision that is
  the owner's blocks you. A small app with no users or real data takes the short path, its first-time setup
  included.
- **The path and the reviews are separate decisions.** The path follows how uncertain the work is; the reviews follow
  its lane (Settings). When the lane calls for a review, a fresh session reviews the change and the original implementer
  fixes the reviewer's findings, whichever path the work is on.
- **Uncertain, dependent or hard-to-undo work takes the staged path** below: when the outcome or the approach is
  unclear, when it waits on an open decision or on other work, or when it is lane 3.
- **Acceptance criteria come first.** Before building, write what done looks like in the brief, as criteria a program or
  a person can observe, covering at least the quality bar below. A gap against a criterion is a blocking defect; an idea
  that would make it better is a note, kept apart.
- **A check is a test that fails by itself.** Write the check first, so a program can judge it: the suite exits 0, every
  claim has a source line, the diff touches only files in the plan. The loop lives inside one piece of work: produce,
  check, correct, repeat until green.
- **The owner approves the finished result and product choices,** never the steps between. Product choices are
  direction, anything that changes what the product is for, and a new package, app, tool, dependency, environment or
  spend that the approved brief does not already cover. An approved brief authorizes everything inside its stated
  boundaries: the dependencies, tools, environments and budget it names. Ask again only when scope, exposure, cost or
  direction changes materially. Ask each choice as a decision card: the options, and a recommendation. Everything else,
  decide and go.
- **Three different yeses.** **Product approval** settles a choice, such as a direction or a dependency. **Merge
  permission** follows the lane: green and its required reviews, plus the owner's approval or a recorded standing
  permission for lane 3. **Permission to act outside the repo** (a release or tag, a credential, money, a real device) is asked for by name. Once given, it is a standing permission with its scope (a
  named environment, device or budget), recorded under "Standing permissions" in `docs/superpowers/history.md`, and
  asked for again only when that scope, the exposure or the cost changes. A merged spec records a decision; it does not
  make one: the spec lists any open product decisions, and the build waits for those only. Each approval is recorded
  with its scope: what it covers, and the document or commit.

## Owner visibility and early steering

The owner stays informed throughout the work. Updates do not require acknowledgement: continue within the approved
brief and permissions. Silence never creates a new approval. When a coordinator is active, it consolidates worker
reports into one owner-facing update. Otherwise the implementer handles these duties; no extra session is needed.

- **At the start:** state the outcome being built, the important assumptions, the first step and the first point at
  which the owner will see working output.
- **During the work:** send a concise update at meaningful milestones and at the owner update interval in Settings.
  Report material changes, risks, setbacks and consequential decisions promptly. Routine debugging stays internal
  unless it changes the expected outcome, timing or confidence. If waiting on CI or another dependency, say what is
  waiting, what can proceed and what will unblock it; do not imply progress that has not happened.
- **Each update covers:** what is happening now; what changed since the last update; what remains and comes next;
  material decisions made; the latest preview and verification status; and anything the owner needs to decide. Omit
  unchanged details. Say "No action needed" when work can continue. Prefer completed outcomes and remaining work over
  an unsupported percentage. Label timing estimates and revise them when the evidence changes.
- **Show work early:** share the first working screen or playable core loop before extending it across the product.
  Show meaningful visual and interaction changes as they become available, using an available live preview, screenshot
  or short recording. Label mockups, incomplete work and known defects clearly. Identify the version shown. Reuse
  current previews until the output changes. Creating a public preview still requires the appropriate permission.
- **Expose decisions:** disclose material choices that affect user experience, appearance, architecture, dependencies,
  compatibility, cost, delivery order or accepted tradeoffs. State the choice, why it was made, its consequence and how
  easily it can be changed. Announce consequential choices within the approved scope before substantial dependent work
  accumulates, and continue. Choices outside that scope require approval before dependent work proceeds. Routine naming
  and implementation details need no separate notification.
- **Keep a visible record:** maintain `docs/superpowers/progress.md` with a last-updated time, current work, completed
  outcomes within the active milestone, remaining work, blockers, preview links and material decisions. Share its
  accessible link or location at the start and keep it current with each substantive update. Distinguish owner
  instructions, agent-selected choices and unresolved assumptions. A reported choice is not automatically
  owner-approved. Archive completed milestones and their decision records in `history.md`.
- **Accept steering immediately:** check for available owner feedback before starting dependent work or merging. When
  the owner redirects or says "hold" on an item, acknowledge it, pause the affected work at the next safe boundary,
  update the brief and inform affected workers. Continue unrelated authorized work. State rework or consequences
  plainly. Keep choices reversible where practical; an update alone does not guarantee the owner has reviewed it.
- **At completion:** show the finished result, verification evidence, remaining limitations and material decisions made
  during the work. Do not defer significant surprises until this report. Final acceptance remains one finished-result
  review; progress updates and interim previews do not introduce approval gates.
- **If live updates are unavailable:** say so before long-running work, provide the timestamped progress record and use
  the runtime's available communication channel. Do not claim that the owner has received an update that could not be
  delivered.

## Rules that never bend

- **Identity.** Every commit is authored by McThayDT <107786093+mcthaydt@users.noreply.github.com> (author and committer). No Claude co-author, no "Claude-Session" trailer and no
  "Generated with Claude Code" line in commits, pull request bodies or docs. Pull requests end with "Requested by
  **McThayDT**": check the body's last line after every create or edit, since tools such as `gh pr create` can add
  a footer. Never force-push. Merge with a merge commit, never a squash.
- **The drunk-grandma test.** All copy and UX must be something a drunk grandma could understand and use: plain words,
  one main action per screen, big obvious buttons, no jargon, and nothing that needs explaining.
- **CLI first.** If something can be done with a CLI (gh, npm, wrangler and so on), do it with the CLI, and give the
  owner CLI commands rather than click-through steps.
- **Keep to the request.** Build nothing ahead of its user; "it would be useful later" is not a reason. A second
  problem found on the way is reported, not fixed, unless it blocks the task. A decision the owner has made is not
  reopened; if new facts make it look wrong, say so once, with the facts.
- **Report honestly.** Say what ran, what did not run and why, and what is still open. "Done" means merged to `main` and
  green there; otherwise say where it is: "on a branch", "in CI", "not started". Never round up. Hashes, sizes, timings
  and timestamps are measured, never written by hand (timestamps come from `date`), and a tool or asset is checked to
  exist before anything is built on it. Speak plainly: the conclusion first, short.
- **Findings carry evidence.** Every finding says what is wrong, the evidence, the expected result and a bounded fix,
  and a fix is checked by a program or a second session, never by the fixer's own say-so. A check proves one property;
  a review (model or human) finds what no check encodes: missing requirements, confusing screens, wrong assumptions.
  Both count as evidence. Every review, check and approval names the commit it examined; a push that changes what it
  covered makes it stale.
- **Tests.** Write the failing test first and confirm it fails for the right reason. Quick targeted tests run locally
  whenever they help; CI is the merge gate. A failing test blocks only the change that touches it: report an unrelated
  failure, and give a failure on `main` its own thread. A merge still needs every required check green, unless the owner
  authorizes an exception named in the pull request. A test that fails once and passes on retry is a defect: report it
  with its text. Never loosen, skip or re-record a test to hide a defect. No `--pass-with-no-tests` or similar flag that
  lets an empty suite pass in CI. Updating a golden for an approved behavior change is fine, with its before and after
  shown. A docs change or a purely visual change is verified by what fits (a link or build check, the approved look),
  not by an invented unit test.
- **Lessons become tests first.** A confirmed failure gets a regression test. It becomes a rule only when no test can
  catch it, as one line under "Lessons" in `docs/superpowers/history.md`.
- **Limits.** When an approach has taken the tries in Settings, or a task has run past the overrun in Settings, stop
  that approach and reassess; never repeat a failed approach without new evidence. Keep on with independent work
  meanwhile. Report material setbacks under "Owner visibility and early steering". Pause and request an owner decision
  only when their decision, access or a change to an agreed budget is needed. Never bypass an access restriction or
  weaken an acceptance criterion to get past a problem. No subagents unless the owner says so. Sessions the coordinator
  starts are threads, not subagents. If this repo is indexed in Graphify, use its tools to find code and check what a
  change affects before changing it. Its answers name the commit the graph was built from; read the files changed since
  that commit.

## Risk

Every unit of work carries a lane, set by what a mistake costs, never by anyone's confidence. Classify it from the paths
its diff touches and what the change does, using the lists below; use a classifier the repo already has, and never build
tooling for this. The plan names any other lane 2 or 3 unit up front. The highest lane wins.

- **Lane 1**, small and easy to undo: a copy change, a test, a doc (specs, plans, audits and progress notes included),
  deleting a merged branch, an isolated change with coverage. Merges on green.
- **Lane 2**, wide: `automata.toml`, `content/`, `src/lib/`, `tests/fixtures/`, `tests/architecture/`, `package.json` (the framework pin), `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `*.config.ts`, `tsconfig*.json`, `biome.json`, `knip.json`, shared code many callers use, a schema, or config. Merges after `release`'s extra
  checks.
- **Lane 3**, hard to undo: `tests/golden/` moves that no approved change explains, a move of `replays/level-1.json`, `replays/level-2.json` or `replays/test-game.json` that no asked-for change explains (one that a change explains merges on green under the standing yes below), credentials,
  money, device actions with consequential side effects, release approvals and tags, CI workflow files, deleting
  anything git cannot restore, any migration, any write of real data, and a change to the rules that decide what needs
  the owner (CLAUDE.md and the skills, even though they are `.md` files). Requires its lane's checks and reviews plus
  the owner's approval or a recorded standing permission covering the exact action.
- **First-time setup.** Bootstrap from the owner's own rules text is lane 2: creating the repo, its CI and the rules
  files as the owner gave them. The owner's request is the standing permission for the setup check. Later changes to
  the rules or CI are lane 3 as usual.
- **Permission and risk are separate.** Standing permission removes a repeated approval request; it never lowers the
  lane or removes required checks and reviews. A routine, non-destructive validation on an authorized device does not
  itself raise the change's lane. A migration, real-data write or other consequential action retains its inherent lane
  even when authorized. An external action outside recorded permissions waits for authorization.

## Quality bar

The least every brief's acceptance criteria cover, where they apply:

- Every core journey works end to end, with its loading, empty, error and recovery states.
- Everything works with the keyboard alone, and focus is always visible.
- Where there are users, users cannot access data outside their permissions.
- The supported browsers named in the brief pass.
- The performance budgets in the brief (load time, delay after a tap or a key) hold, measured.
- Browser device profiles emulate a screen size, a user agent and touch: that is emulation evidence, not proof of how a
  physical phone performs. A budget for a device is measured on that device.

## How code is written

- Comments say why. They do not say which plan asked for the code.
- Use injected clocks and fixed seeds. Browser tests wait on readiness, never on a sleep.
- Look at the real expected, actual and diff images before accepting a visual change, and explain each change.
- Code is grouped by feature, not by kind: no top-level `components/`, `services/` or `utils/`. A feature owns its
  code and data and imports only from features below it. Tests never sit beside the source; `tests/` mirrors `src/`.
  The layer order is written in `tests/architecture.test.ts`, one list with the lowest feature first, and the test
  fails on an upward import or a cycle.

  ```
  src/
    index.ts                 the public surface; anything it does not export is internal
    lib/                     shared helpers with no feature logic (maths, IO, random)
    features/<feature>/      one folder per feature: <feature>.ts is its entry, one job per file, library/ its data
  scripts/                   thin command-line wrappers over src/
  tests/                     mirrors src/; architecture.test.ts holds the layer rule (imports go down, no cycles)
    golden/                  pixel or snapshot goldens
  docs/superpowers/          specs/, audits/, progress.md and history.md
  ```

## The staged path

- **When.** Stage the work when the outcome or the approach is uncertain, when it waits on an open decision or on other
  work, or when it is lane 3. A new feature or many files alone does not stage it. Risk decides the audits, never the
  number of tasks; the audits for each lane are in Settings.
- **Can this runtime start sessions?** Before the first stage, the coordinator checks each capability on its own:
  starting a session, sending it a message, choosing its model and archiving it. A missing one changes only what needs
  it: without archiving, finished sessions are listed for the owner to close; without a model choice, sessions run on
  the default; without messaging, sessions report through committed files. Reviews run in fresh, isolated sessions
  wherever the runtime can start one (a new session, or an isolated reviewer it supports). The coordinator asks the
  owner to start a reviewer only when no isolated reviewer session can start, and then runs the stages one after another
  itself, each starting from the committed documents.
- **Superpowers.** Its skills run the steps named below (brainstorming, writing-plans, executing-plans), at the version
  the setup check records; where they differ from these rules, these rules win. A final review its skills ask for is the
  implementation audit when the lane calls for one, run once by a fresh session (`review`), not a second review; on lane
  1 it is the implementer's own check. Any deferring minor findings it suggests does not apply: the fix round fixes
  every in-scope finding.
- **Splitting.** Split by what a mistake costs, not by folder: one unit, one input, one output, one lane. Two steps wait
  on each other only if the second reads the first one's output; if you cannot name what passes between them, run them
  side by side. A step with one right answer (merge, rank, dedupe, compare) is plain code, not a model. Build the gate
  first: before a repeated job, write the one check that can fail it.
- **One working brief, one implementation pull request.** On the staged path the brief is the spec: the outcome, the
  acceptance criteria, the boundaries the owner approves (dependencies, tools, environments, budget, expected duration) and
  the plan, in one document. The spec and its plan audit are docs: the spec merges on green without the owner, with its
  plan audit when it has one, and the build starts from `main`. Execution, the implementation audit and the fixes share
  one branch and one pull request: the audit reviews that branch before it merges, and the fixes land on it.

| # | Stage | Who | Writes |
|---|---|---|---|
| 1 | Spec | The coordinator, with the owner (superpowers brainstorming); a plan session adds the plan when the approach is uncertain (superpowers writing-plans) | `docs/superpowers/specs/<date>-<topic>-design.md` |
| 2 | Plan audit | An audit session, `review` skill (lane 3 only), on the spec's pull request | `docs/superpowers/audits/<date>-<cycle>-plan-audit.md` |
| 3 | Execution | The implementer: one work session (superpowers executing-plans) | the code |
| 4 | Implementation audit | A fresh audit session, `review` skill (lane 2 and 3) | `docs/superpowers/audits/<date>-<cycle>-implementation-audit.md` |
| 5 | Fixes | The implementer, in the same session | the code |
| 6 | Review | The owner approves the finished result | notes for the next spec |

- **Writing.** One writer per branch at a time: the implementer writes, then hands the branch to the reviewer by naming
  a commit; the reviewer commits only its audit file and hands the branch back by naming its own commit. The audit reads
  a named commit, never a moving branch. Independent writers use their own branches or worktrees. The coordinator is the
  only writer of `progress.md` and `history.md` while active, including for delegated short-path work. If the
  coordinator cannot write to the repo, the implementer writes them for it and says so in the commit. Otherwise the
  implementer owns those records. The tracking document in the implementation prompt is the plan's own checklist,
  written by the implementer on its branch. Worker reports do not create additional writers of the shared progress
  record.
- **The coordinator** is one long-lived session. It talks with the owner, writes the spec, creates `progress.md` and
  `history.md` if missing, starts each stage's session, tracks them in `progress.md`, names each unit's lane in the
  spec, and archives each session when its stage is done. The coordinator never counts toward the session limit.
- **Specialist sessions start on demand:** a plan session, an audit session or the advisor starts when its work is ready
  and is archived when it is done. Nothing waits idle.
- **The advisor** gives a short second opinion on a big call: the risks, what is missing, a recommendation. It never
  writes code or changes files. The coordinator starts it only for big calls: specs, plans, roadmap changes, and
  approving designs or mockups. It does not reopen the owner's decisions.
- Sessions the coordinator starts are threads, not subagents. No session starts subagents of its own unless the owner
  says so.
- **Slices.** Do not move to the next slice without a design review loop on the screens completed during that slice (see
  `visual-check`), then a slice retro (see `review`).
- **Handoff.** Every stage reads the files its prompt names, normally the spec, the audits so far and `progress.md`; the
  plan also reads Lessons in `history.md`. It reports its progress to the coordinator, which keeps `progress.md`, and
  its last step is to commit and push. `progress.md` holds the active milestone, including completed outcomes needed
  to understand what remains. When a milestone closes, its work and decision records move to `history.md`; screen
  approvals are recorded there with their scope. The execution session starts with this prompt, and uses it again
  for the fixes:

```
Use superpowers:executing-plans to carry out the plan, and develop by these instructions.

Now implement precisely as planned, in full.

Implementation Requirements:

- Write elegant, minimal, modular code.
- Adhere strictly to existing code patterns, conventions, and best practices.
- Keep comments brief, and only where the code doesn't explain itself: say why, not what.
- As you implement each step:
  - Update the markdown tracking document and overall progress percentage dynamically.
```

- **Reporting.** Workers report to the coordinator through `send_message`, or committed files when messaging is
  unavailable: the task as understood at the start; meaningful milestones and their evidence; material decisions and
  assumptions; deviations and their reasons; previews; blockers; and completion. Separate facts from estimates and
  owner instructions from agent-selected choices. Ordinary debugging stays internal unless it changes outcome, timing
  or confidence. A missing tool replaced by an authorized alternative that meets the same acceptance criteria is a
  deviation, not a stop; an access refusal is never worked around.
- The session that merges reports each merge and each stop listed in `release`. Coordinators of related workstreams
  report decisions, changes that affect this work, blockers and what they push. The coordinator keeps the owner
  informed under "Owner visibility and early steering", including decisions that need no approval. Pause and request
  an owner decision only when the brief, permissions or an unresolved choice requires it; keep independent work moving.
- Each session's prompt names the files to read; sessions wait for CI results instead of repeatedly watching logs.
  Waiting does not suspend the owner update interval.

## Settings

Change a number or a model here and nowhere else.

- Owner update interval: 5 minutes during active work. Meaningful milestones and material changes are reported sooner.
  Short tasks normally need only a start update and completion. Updates do not require acknowledgement.

- Tries per problem: 3. After that, stop that approach and reassess: try another with a reason, or move to independent
  work. Include material setbacks in the owner update, with what was tried and what it showed. Pause for an owner
  decision only when their decision, access or a change to an agreed budget is needed.
- Overrun: a task that has taken twice the duration its brief estimated. Reassess the estimate and the approach, and
  report the changed outlook. Request a decision only if the authorized budget or scope must change.
- Pull requests open: 3. Checks run at once, as many as the CI capacity takes without queueing (measured, not guessed);
  only the integration with `main` before a merge runs one pull request at a time. Branches: `main` plus branches with
  an open pull request, 5 at most; a branch merges or closes within 2 days.
- Work sessions at once: 5, all on the current slice (a milestone), and at most 3 writing code (implementers). The rest
  only read and report. It is a limit, not a goal: a session starts only when its work is ready.
- Session refresh: when the context degrades (it repeats itself, loses earlier decisions or nears full) or at a natural
  boundary (a merge, a finished stage), with a handoff: the last commit, where to resume, what is left. The coordinator
  writes where things stand to `progress.md` first.
- Browser test pieces in CI: 6. Device matrix: small phone, tablet, computer, as browser profiles (emulation evidence);
  a brief may change it. Progress: the coordinator keeps each stage's row in `progress.md` up to date, with a percentage
  from the plan's ticked steps, as supporting information. Rule edits: batched; each slice retro's rule edits are one
  batch, and a rule change the Owner asks for runs on its own.
- Audits by lane: lane 1 none; lane 2 one fresh review of the change, after the build; lane 3 a plan audit and an
  implementation audit.
- Models and effort: a session whose model and effort are not named runs on Opus, medium. Nothing runs above high
  effort. Plan: Fable 5.2, medium. Plan audit: Opus, medium. Execution (and its fixes): Sonnet, high. Implementation
  audit: Opus, medium. Advisor: Fable 5.2, medium. Slice retro: Opus, medium.

## This repo

What is particular to this repo, kept from its earlier notes and the 2026-11-16 handoff.

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
- **`replays/level-1.json`, `replays/level-2.json` and `replays/test-game.json` are the goldens.** All three are recorded
  in CI, never typed. This is the test game, so a golden that holds hashes moves on green under the Owner's
  standing yes (2026-11-16), only for a change someone asked for, with the commit naming it and its before and after;
  never re-recorded to turn a red check green. An editor never writes any. The first two are the real levels' plays (level 1; levels 2 and 3, which are one place), which a content
  edit may change without breaking CI (the check says "the content changed"); the third is a play of a game built inside
  the tests, which no edit can reach, so a change to the game's code that alters the play fails in every engine. The
  merge session holds a golden moved without a commit naming it, and these are the three files it watches.
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
replays/                      recorded plays; level-1.json, level-2.json and test-game.json are the goldens
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
tests/replay/                 the recorded plays (level-1.json, level-2.json, test-game.json), in Node and three browsers
tests/journeys/               the built page driven in a real browser, end to end
tests/fixtures/               shared test helpers, the test game and the pinned level the journeys play
tests/workflows/, tests/docs/ checks that read a workflow or the README
docs/superpowers/             specs/, audits/, progress.md and history.md
```

Features import only from features below them (`plugins`, then `play`). No top-level `components/`,
`services/` or `utils/`.
