# AutomataFramework Examples

The demo game, made with [AutomataFramework](https://github.com/mcthaydt/AutomataFramework) the way an outside game
would be: only the published package, nothing from inside it. Later this repo also holds the website's small examples.

The game is a small physics platformer. Right now it is one level: you are the pink box, and you push the green box.

## Start here

**1. Install what it needs.** You need [Node](https://nodejs.org) 24.21.0 or later, `git`, and pnpm. pnpm is switched
on by a small helper called Corepack. Node 25 and later no longer include it, so add it first (on Node 24 this does no
harm), then switch pnpm on once:

```sh
npm install --global corepack@latest
corepack enable
```

**2. Install the game and play it.**

```sh
pnpm install
pnpm dev
```

The first `pnpm install` takes about a minute and says little. It is downloading the framework from GitHub and
building it. That is normal; it is not stuck. `pnpm dev` prints an address. Open it. Hold the left or right arrow key
to move and press Space to jump; on a phone, touch the screen and use the buttons.

**3. Make your first change.** Open `content/levels/level-1.json`. Find `crate-1` and change its `x` to `12.5`. Then
run:

```sh
pnpm content:write
```

and reload the page. The green box starts further along. That is the whole loop: edit a content file, write it the
standard way, look. An editor makes the same change, and so can an agent.

**4. Share it.** Open a pull request. The checks run the game in Chromium, WebKit and Firefox and say in plain words
what is wrong if something is.

## Where things are

| Where | What |
| --- | --- |
| `automata.toml` | The project file: the game's name, its first level, its hero, and the content files it lists. |
| `content/` | The game's content, JSON: the level and the characters. Only `pnpm content:write` writes these. |
| `replays/level-1.json` | A recorded play. CI plays it back in four engines and checks they all end the same. |
| `src/features/hero/` | The hero's rules: run, and jump once for each press. |
| `src/features/plugins/` | The list of everything the game's rules are made of. |
| `src/features/play/` | The page: loads the files, starts the game, and says what to do. |
| `src/features/play/blueprint.css` | The look's colours, fonts and icons, in one place. `play.css` takes every colour from here. |
| `tests/` | The checks. They mirror `src/`. |

## The look

The game's own screens (the words at the top, the touch buttons and the screen that says a file is broken) use the
project's Blueprint look: grey words on black paper (palette No. 340 of *A Dictionary of Color Combinations*), with sea green only on a touch button while a thumb holds it. The
game's art (the level, the hero and the crate) does not: it always shows as it is. The five colours and the two fonts
are in one file, `src/features/play/blueprint.css`; change a colour there and every screen follows.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Plays the game in your browser, and reloads when you change the code. A content file needs a reload by hand. |
| `pnpm build` | Makes `dist/`, a folder of plain files that plays the game from any address. |
| `pnpm content:write` | Puts every content file in the standard form. Run it after you edit one by hand. |
| `pnpm lint` | Checks the style of the code. `pnpm format` fixes what it can. |
| `pnpm typecheck` | Checks the types. |

## What the checks say when they fail

- A content file that is not in the standard form: `content/levels/level-1.json is not in the standard form. Run: pnpm content:write`
- A content file that is not valid, for example a missing comma: `content/levels/level-1.json: This file is not valid JSON. Check for a missing comma, quote or bracket.` The page shows the same sentence instead of a blank screen.
- The engines disagree: `node and webkit disagree from tick 120: ...`. The same play must come out the same in every
  engine, so this is a bug to find, never to ignore.

## The recording

`replays/level-1.json` is the recorded play of the level. It is the repo's golden file: once it holds hashes it changes
only when the Owner has seen the hashes before and after. It is recorded in CI and never typed. To take a new one,
delete the file, push, and commit what the Node job prints.

Moving the crate (or anything else in the content) is allowed and passes CI: the check says "the content changed" and
still compares the four engines with each other. `replays/test-game.json` is the strict check: a play of a game built
inside the tests, which no content edit can change, so a change to the game's code that alters the play fails in
every engine.

## Tests run on GitHub

Tests run only in GitHub Actions, never on your own machine. Push a branch, open a pull request, and read the checks
there. `pnpm lint`, `pnpm typecheck` and `pnpm build` are safe to run locally.

## Licence

MIT. See `LICENSE`.
