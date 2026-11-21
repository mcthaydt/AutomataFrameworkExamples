# CI speed-ups: implementation audit, cycle 3 (lane 3), Framework #228 and Examples #86

Re-check by the cycle 1 auditor, 2026-11-21 (UTC, from `date`). Commits examined: Framework #228 `f04bb09` (merge of
`main` with #229 into `30e52e7`), Examples #86 `8da542a`. Editors #147 is re-checked when its turn comes.

## Cycle 1 reds, each re-checked

| Red | Framework `f04bb09` | Examples `8da542a` |
|---|---|---|
| After numbers | PASS: full run 44922527505, `browsers` (18) setup p50 46 s, max 55 s, image p50 24 s; "median same, tail gone"; the 24.7 min wall time named as runner queue under the account's 20-job limit. Matches my cycle 1 measurement (p50 46 s, max 53 s). | PASS: run 44914743494 (image only) and 44918089027 (head), setup p50 43 to 46 s, max 49 to 70 s; same wording; queue wait named. Matches cycle 1 (p50 45 s, max 55 s). |
| Live-state file | PASS: removed (`c41abfe...f04bb09`). | PASS: removed (`2da8eb8...8da542a`). |
| Green | PASS: 33 success, 1 by-design docs-only skip; run 44922527505 `ci` attempt 1. | PASS: 26 success, 1 by-design skip; run 44918089027 `ci` attempt 1. |
| Check gap (Framework only) | PASS: #229 merged (`7dd3a85`) with `tests/workflows/browsers-image.test.ts`: `browsers`, `online`, `create-play`, when in a container, must use the lockfile's image pinned by `@sha256:[0-9a-f]{64}`, `--user 1001`, the version step, and no `playwright install|install-deps` line. `main` never checks less. | n/a |

## Also checked

- The PR diffs now hold only `ci.yml` and the two cycle 1 audit files.
- Every commit authored and committed by McThayDT; both bodies end "Requested by **McThayDT**".
- The merge into Framework was clean; it brought only the files #229 changed, read above.

## Notes

- Site `main`'s first run after #68 (44923947631, `8e0186e`) failed two WebKit journeys once and passed on the re-run.
  The CI thread found the same local wrangler connection-drop warning on `main` before the image (44921709194), and is
  recording it under Flaky tests (Site #72). I did not re-derive the cause. It stays a flaky defect to fix, not a pass.
- Editors #147 still needs a clean first-time-green full run and #146 merged first (cycle 1 red 3).

## Verdict

Framework `f04bb09` PASS. Examples `8da542a` PASS. The owner's approval (2026-11-21 14:39 UTC, "merge after audits")
covers both merges.
