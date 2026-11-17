# No empty suite, round 1: implementation audit (Examples #74)

- Examined: `claude/project-thread-p1kv93` at 15b9350, against `main` at 99e9135. Lane 2, one fresh review.
- Verdict: **no red findings.** Two notes, none blocking.

## What was checked, and how

| Criterion | Check | Result |
| --- | --- | --- |
| No script carries `--passWithNoTests` | `tests/workflows/ci.test.ts` "no script lets a run that finds no tests pass", run on 15b9350, then with `main`'s `package.json` swapped in | Passes on 15b9350. Fails on `main`'s scripts: `test:engine: expected 'vitest run --passWithNoTests --project' not to match /pass-?with-?no-?tests/i` |
| Enough journeys that no shard is empty | the new journey-count test, run on 15b9350, then with four journeys moved out of `tests/journeys/` | Passes on 15b9350 (9 journeys besides the pictures one). Fails with five: `there are enough journeys that none of the six shards is empty` |
| The full CI run on the head | check runs on 15b9350 (the `package.json` change forces the full run) | `check`, all 18 `browsers` shards, `engines (chromium/webkit/firefox)`, `gate`, `commit-authors`: success |

## Can any CI call of these scripts come up empty?

Every call in `.github/workflows/ci.yml` on 15b9350:

- Shard 1, `pnpm test:engine <engine>`: the browser project takes `*.parity.test.ts` and `*.browser.test.ts`; `vitest list --project chromium --filesOnly` lists 9 files (4 in `tests/replay/`, 5 in `tests/features/play/`). Not empty; if it were, it now fails.
- Shard 1, `pnpm vitest run --project node tests/replay`: not a script, carries no flag; 4 parity files.
- Every shard, `pnpm test:journeys --shard=k/6 --bail=$BAIL $EXCLUDE`: `test:journeys` had no flag on `main` already. Vitest 5.0.3's `calculateShardRange` spreads files evenly: 9 files (pictures left out) give 2, 2, 2, 1, 1, 1 and 10 give 2, 2, 2, 2, 1, 1, so none of the six is empty. The new test holds the count at 6 or more. No `-t` filter is used, so nothing can pass silently.
- No other workflow calls these scripts (`commit-authors.yml`, `delete-closed-pr-branch.yml`: none).

## Notes (not fixed here)

1. UNIT: `.github/workflows/ci.yml` `check` job, line 113. VERDICT: note. REQUIREMENT: CLAUDE.md, Tests: no `--pass-with-no-tests` or similar flag in CI. REASON: a draft's quick run still passes `--changed=origin/main --bail=1 --passWithNoTests` to `test:node`. EVIDENCE: line 113 on 15b9350. EXPECTED: the rule holds in CI too, or the owner names the exception. FIX: a CI workflow change, lane 3, so the owner's call; the PR reports it. Removing it would fail any draft whose change reaches no Node test, so it needs a decision.
2. UNIT: `tests/workflows/ci.test.ts`, journey-count test. VERDICT: note. REASON: it counts only `tests/journeys/`, while the journeys project takes `tests/**/*.journey.test.ts`. It can only undercount, so it never lets an empty shard through; it could fail needlessly if journeys move elsewhere. No change needed.

Graphify does not index this repo; the files were read directly.
