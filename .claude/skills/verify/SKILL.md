---
name: verify
description: Use when a change alters what the product does, before calling it done and before each commit that changes behavior: starts this repo's app or game from a clean checkout and drives it the way a person would.
---

# Verify

The test game ("Crate Game"): push the crate onto the plate in a browser game built only from the framework; every word is in six languages, and the first screen asks which one.

## Start it

From a clean checkout in a cloud container, in order. First pick the Node version (or other runtime) that `engines` in `package.json` asks for. Then install, build, and start every stand-in for an outside service (a database, payments, mail, sign-in), never the real one.

```sh
export PATH=/opt/node24/bin:$PATH && node -v
WORK="${TMPDIR:-/tmp}/examples-verify"; rm -rf "$WORK"; mkdir -p "$WORK"
git clone -q "$(git rev-parse --show-toplevel)" "$WORK/repo" && cd "$WORK/repo" || exit 1
PIN=$(node -p "require('./package.json').dependencies['@automataframework/framework'].split('#')[1]")
if ! pnpm install --frozen-lockfile; then
  git init -q "$WORK/framework" && git -C "$WORK/framework" remote add origin https://github.com/mcthaydt/AutomataFramework
  git -C "$WORK/framework" fetch -q --depth=1 origin "$PIN" && git -C "$WORK/framework" checkout -q FETCH_HEAD || exit 1
  (cd "$WORK/framework" && pnpm install --frozen-lockfile) || exit 1
  sed -i "s#github:mcthaydt/AutomataFramework\#$PIN#file:$WORK/framework#" package.json
  pnpm install --no-frozen-lockfile || exit 1
  git checkout package.json pnpm-lock.yaml
fi
pnpm build || exit 1
nohup pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort > "$WORK/preview.log" 2>&1 &
for i in $(seq 1 60); do curl -sf -o /dev/null http://127.0.0.1:4173/ && break; sleep 0.5; done
curl -sf -o /dev/null http://127.0.0.1:4173/ && echo "ready: $(git rev-parse --short HEAD)"
```

It works in a fresh clone of the checkout under the scratchpad (`$WORK/repo`), because `git clean -xfd` may be refused in a container, and only the committed files are used, so commit first. The framework is a git dependency pinned to a commit, and its tarball comes from `codeload.github.com`. In a container where that host answers 403 ("GitHub access to this repository is not enabled for this session"), the first `pnpm install` fails and the `if` branch builds the framework from the same commit with `git` instead, installs from that copy, keeps that copy in `$WORK/framework` (about 600 MB), and puts `package.json` and `pnpm-lock.yaml` back in the clone. Your own checkout is never touched. `node server.ts` is the online room's server; the player's first screen does not need it.

It is ready when `curl` gets the page from `http://127.0.0.1:4173/` (the start commands end with that check). Last clean start, timed with `date` before and after: about 14 seconds with the three sizes driven, 13 to 20 seconds in fresh runs (clone, framework build, install, build, the preview answering; measured 02:09:44 to 02:09:58 UTC), on commit 075225a.

## Drive it

Open it in a real browser: the Chromium and Playwright the container already has (`require('playwright')`, then `chromium.launch()`), at each size in the device matrix in Settings. Tap, click, type and press keys the way a person would, and find things by their label or role. Take a screenshot at deviceScaleFactor 1 for your own check, and save it in the scratchpad, never in the repo. The main screen, what it shows and how to use it:

The first screen is the language picker: six flags and a **Go** button under "Play in English" (English is already chosen from the device). Press **Go** and the game opens: a dark page with the words "Push the crate onto the plate" on top (on a computer, also "Arrow keys to move. Space to jump. Shift to dash."), one canvas below with the crate, the plate and the walls, and two thumbs and a dash button on a touch screen. `#game` has `data-state="playing"` once the game runs. Save this as `drive.cjs` in the scratchpad and run it with `NODE_PATH="$WORK/repo/node_modules" node <scratchpad>/drive.cjs <scratchpad>` (Node 24); it shows the picker and the game at a phone, a tablet and a computer size and prints any console error:

```js
const { chromium } = require('playwright')
;(async () => {
  const out = process.argv[2], b = await chromium.launch()
  for (const [n, width, height, hasTouch] of [['phone', 390, 844, true], ['tablet', 820, 1180, true], ['desktop', 1280, 720, false]]) {
    const ctx = await b.newContext({ viewport: { width, height }, hasTouch, deviceScaleFactor: 1 })
    const page = await ctx.newPage(), errs = []
    page.on('pageerror', e => errs.push(String(e))); page.on('console', m => m.type() === 'error' && errs.push(m.text()))
    await page.goto('http://127.0.0.1:4173/')
    await page.getByRole('button', { name: 'Go' }).waitFor({ timeout: 30000 })
    await page.screenshot({ path: `${out}/picker-${n}.png` })
    await page.getByRole('button', { name: 'Go' }).click()
    await page.locator('#game[data-state="playing"]').waitFor({ timeout: 30000 })
    console.log(n, JSON.stringify(await page.locator('.play-words').innerText()), 'errors:', errs.length)
    await page.screenshot({ path: `${out}/main-${n}.png` })
    await ctx.close()
  }
  await b.close()
})()
```

It works when each size prints the words and `errors: 0`. Look at `main-desktop.png`: the crate, the plate and the walls are drawn under the words.

## The journeys

One line each, from a person's side: where it starts, the steps, and what they see at the end.

- **Play:** open the page, press **Go**, hold the right arrow key; the crate is pushed along. (`tests/journeys/play.journey.test.ts` plays it and replays it in Node.)
- **Language:** open the page on a new device, pick a flag, press **Go**; the words are in that language, and the choice is kept on a reload. (`language.journey.test.ts`)
- **Words:** the strip of words says what to do, with keys on a computer and with fingers on a touch screen. (`words.journey.test.ts`)
- **Look:** the Blueprint look: dark page, one font, five colours, buttons never small. (`look.journey.test.ts`)
- **Pictures:** the game's art and the picture screens draw at every size in the device matrix. (`pictures.journey.test.ts`)
- A change to one of these also runs its journey test: `pnpm build`, then `pnpm test:journeys`.

## Stop it

Stop every server it started and clear what it wrote, so the next run starts clean.

```sh
pkill -f "vite preview" || true
rm -rf "${TMPDIR:-/tmp}/examples-verify"
git status --short
```

`git status --short`, run in your own checkout, prints nothing: the run never wrote there. The clone, the framework copy, `node_modules`, `dist` and the server log all lived in `examples-verify`, and are gone.

## When it breaks

A step that breaks or flakes is fixed in this skill first. Each known way a start or a step fails, what it looks like, and the fix:

- `node -v` is not 24: the default `node` is 22 here; the first start line puts `/opt/node24/bin` first.
- `ERR_PNPM_FETCH_403` from `codeload.github.com` on `pnpm install`: the framework tarball is blocked in this container. It happens when the session does not have `mcthaydt/AutomataFramework` attached, and the `if` branch in "Start it" covers it with no extra access; do not change the lockfile or the pin, and do not attach anything with push.
- `vite: not found` on `pnpm build`: the install failed and nothing was installed; read the install's error first.
- Port 4173 already taken (`strictPort`): a server from an earlier run is still up; run the stop commands, then start again.
- The page shows the picker, not the game, and a script waits for `#game[data-state="playing"]`: a new browser has chosen no language, so press **Go** first, as the script does.
- `playwright` not found by `node`: run the script with `NODE_PATH="$WORK/repo/node_modules"`, from any folder, under Node 24.
