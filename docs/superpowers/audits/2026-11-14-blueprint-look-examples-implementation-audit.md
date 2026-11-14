# Implementation audit: the demo game's new look

Written 2026-11-14. Stage 5 (Implementation audit) of cycle 2. It is a design audit of what is on `main` at `1aca8cf`:
the game's own screens in palette No. 340 (pull request 14), the hero and the crate in palette No. 276 (17), the
level's sky and ground (19) and Fredoka as the one font (20), with the two pin moves (13, 18) and the framework's two
changes behind them (AutomataFramework pull requests 21 and 25, now at `874f7d5`).

Read against: the section "Visual direction" of the
[spec](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)
at `7705bf7`, the [plan](../plans/2026-11-14-blueprint-look-examples.md), its
[audit](2026-11-14-blueprint-look-examples-plan-audit.md), [`progress.md`](../progress.md), this repo's `CLAUDE.md`,
and the Owner's decisions since the plan (No. 340 for the screens with Peach Red on a held button, No. 276 for the art,
"You are the pink box. Push the green box.", Fredoka only at 18 px or larger with no faked bold, the other languages'
fonts later).

## The answer first

**Nothing blocks.** The look is what the Owner chose, it is the same in Chromium, Firefox and WebKit to the exact
colour, it holds on a phone and a tablet both ways up and on a desktop, every pair of words and ground passes the
contrast test with room to spare, and a first-time player can still tell who they are, what to press and that they did
it. Both goldens are byte for byte what they were, and `main` is green (CI run 43552571486).

There are **four things to fix in stage 6** (F1 to F4), **two questions for the Owner** (Q1, Q2), and ten small notes
(N1 to N10). The open item handed to this audit is settled: the light-blue sky in the "well done" picture is real, and
it comes from the tests' own level, not from the game (F1).

## Method

- Every bullet of "Visual direction" was matched to the code on `main` (`src/features/play/`, `index.html`,
  `content/`) and to the test that holds it.
- All 33 pictures of pull request 20 on `ci-screens` (11 per browser) were opened or measured, and compared pixel for
  pixel with the 33 under `main/` for `1aca8cf`. The colours in each picture were counted, so "the right colour" below
  means the exact value was found in the picture, in every browser.
- Contrast figures are WCAG ratios worked from the colours. The colour-blind figures use the Machado, Oliveira and
  Fernandes (2009) matrices at full strength; they are a model, not a measurement of any person.
- The framework's two changes were read as diffs (`7705bf7..874f7d5`, and `touch.ts` as it stands).
- No tests were run here (project rule). CI's runs are the evidence for anything a test proves.

## What was built, against the spec and the Owner's decisions

| Asked for | On `main` | Verdict |
|---|---|---|
| The demo's own screens in No. 340: Black ground, Neutral Gray words | `--paper #111314`, `--chalk #b6bfc1`; found exactly in every picture | Met |
| Two extra shades mixed from the ground and the words, named by the plan | `--hatch #222425` (10% of the way from paper to chalk) and `--pencil #8d9496` (75%) | Met, but the mix is written down nowhere (F4) |
| A held touch button is Peach Red `#f15a30` (the Owner, after Q1's answer (a)) | `--marker #f15a30`, only as the held fill; resting buttons are black chips with a grey edge | Met; the spec's table still says Sea Green (F4) |
| The game's art in No. 276 | hero Eosine Pink `#f37f94`, crate Yellow Green `#afd472`, sky Black `#111314`, ground Seashell Pink `#fdd4bd` | Met in the game; not in the tests' own level (F1) |
| "You are the pink box. Push the green box." | `words.ts`, and "You pushed the green box. Well done!" | Met; see Q1 |
| Fredoka only, 18 px or larger, no faked bold | one face (`latin-600`), every size 18 or 24 px, `font-synthesis: none` on every element; a Node test and a browser test hold each | Met |
| The other languages' fonts later | not installed; the words are English only | Right for now (N10) |
| Square corners, 1 px borders in the words colour, no shadow | 2 px corners, 1 px grey edges, no shadow | Met |
| Dark by default | `color-scheme: dark`, one theme, the page black from its first paint | Met |
| The game's art is never restyled | the CSS touches nothing on the canvas; the art's colours are in the content files | Met |
| Phosphor regular, a word with every picture | five icons, each beside or above its word | Met |
| Touch targets of 44 px, primary 48 px | 64 px at least; in the pictures the buttons are about 77 by 70 | Met |
| Every pair a person reads is held to a contrast test | see "Contrast" below | Met, with one pair untested (N1) |
| Fonts and icons are files from the page's own origin | checked under the Site's whole policy, which still matches the Site's `_headers` on its `main` | Met; their licence notices are missing (F3) |
| End-to-end tests | journeys at five sizes in three browsers: the look, a held button, a broken file, "well done", the keyboard ring, fonts blocked, 320 px wide | Met |
| The framework never imposes a look | with nothing set, its buttons, sky and ground are as they always were; both changes are tested that way | Met |

## Contrast

| Text or thing | On | Ratio | Needs |
|---|---|---|---|
| Words (chalk) | the page (paper) | 9.95 | 4.5 |
| Quiet words (pencil) | the page | 6.04 | 4.5 |
| Words | a problem's panel (hatch) | 8.32 | 4.5 |
| Quiet words (the file's name) | a problem's panel | 5.05 | 4.5 |
| A held button's word (paper) | Peach Red | 5.54 | 4.5 |
| The hero (pink) | the sky | 7.34 | 3 |
| The crate (green) | the sky | 11.08 | 3 |
| The ground (seashell) | the sky | 13.6 | 3 |
| The hero | the crate, when they touch | 1.51 | see Q1 |
| The hero, the crate | the ground they stand on | 1.85, 1.23 | the framework's dark edge (12.5 to 1 on seashell) is what parts them |

Everything a person must read or find passes. The two low figures at the bottom are things that touch each other; the
framework draws a dark edge round every box, and in the pictures that edge does its job.

## The pictures

Looked at for the drunk-grandma test, at phone 390 by 844 and 844 by 390, tablet 820 by 1180 and 1180 by 820, and
desktop 1280 by 720, in all three browsers.

- **Who am I, what do I press?** The two lines of words are the first thing on every screen and read at once. The pink
  and green boxes are the only two coloured things on a black sky, so "the pink box" and "the green box" are found
  straight away with ordinary sight (see Q1 for the rest of us). The three buttons carry an arrow and a word each.
- **Did I do it?** The words change to "You pushed the green box. Well done!" with a tick.
- **Could a button be taken for a box?** No. At rest a button is black with a thin grey edge. Held, it is orange-red,
  much bigger than either box, and has a word on it.
- **Is any of the old look left?** Not in the game. The old light blue and slate show only in `done-390x844.png` (F1).
- **The three browsers** differ only in how letters and thin edges are smoothed. The page, the strip, the words, the
  boxes, the ground and the held button are the same exact colours in all three.
- **Sideways on a phone** the level fills the height between the words and the buttons, and no button sits on it.
- **A broken file** is said in plain words on the same black page at all four sizes, and nothing scrolls sideways.
- **`main` against pull request 20:** 30 of the 33 pictures are identical to the pixel. The three "Jump held" pictures
  differ only in how high the hero is (N5).

## Should fix (stage 6)

**F1. The "well done" picture shows a light-blue sky because the tests' own level never got the new colours.**
Verified: `tests/fixtures/pinned-level.ts` builds its level with no `sky` and no `ground`, so the framework draws its
own light blue (`#9fd3f0`) and slate (`#3b4a5a`); both exact colours are in `done-390x844.png` in all three browsers.
The game itself is right. But three things play that level: the "well done" picture, the "well done" journey and the
push journey. So the one picture of the moment a player learns they did it is not what a player sees, and on that sky
the green crate is 1.05 to 1, the worst pair anywhere. The file's own comment says it is "the real level's tiles and
starts", which stopped being the whole truth when the real level gained colours.

*Fix:* give the pinned level `sky: '#111314'` and `ground: '#fdd4bd'`, say so in its comment, and add one Node test
that the pinned level's two colours are those (written out, not read from the real file, which an editor may change).
Then look at the new `done-390x844.png`. The ground's colour is part of the sim's state, so the hashes of plays on the
pinned level move; nothing records them (each journey compares the page with a Node sim of the same level), and
`replays/test-game.json` plays a different fixture, so neither golden may move. If CI asks for a new recording, stop.

**F2. A test now fails if an editor changes a colour, which the repo's own rule says must pass.** `tests/game/art.test.ts`
reads the real `content/` files and fails unless the hero, the crate, the sky and the ground are exactly the four
values of No. 276. `CLAUDE.md` says "a change that only touches content must pass CI", and an Edit-level save goes
straight to `main`. So the first person who recolours the crate in an editor turns `main` red, and the Site stays on
the old commit. Cycle 1's audit found the same shape with the crate's place (its F1) and fixed it with the pinned
level. The words do name the colours, so a recolour also makes "the green box" untrue; that is why it is a question
and not only a fix. See Q2; the fix follows the answer.

**F3. The game ships a font and five icons without their licences.** `dist/assets/` holds Fredoka (SIL Open Font
License 1.1) and five Phosphor icons (MIT). Both licences ask that their notice travels with the files. The Owner
already settled this for the Site (`public/licences.txt`, 2026-11-14), but that file names IBM Plex and Phosphor, not
Fredoka, and the game's folder is meant to play "from any path of any site", itch.io included.

*Fix:* `public/licences.txt` here with both notices, copied from the installed packages' own `LICENSE` files, so it
lands in `dist/` beside the page; a Node test that it names both packages at the versions in `package.json`; and one
line in `CLAUDE.md` (move a package's version, copy its licence again), as the Site's page has.

**F4. The written record is behind what was built.** None of it changes the game; all of it will mislead the next
session, which reads these files first.

- *The spec* (AutomataFramework, the table in "Visual direction"): for the demo's screens it still names Sea Green as
  the touchable colour and Peach Red as the fourth. On `main` Peach Red is the held button and Sea Green is not used,
  by the Owner's later choice. One sentence there, written by the coordinator's stage, not here.
- *The plan:* none of its 27 boxes is ticked though stage 4 is done, and its values are the first Blueprint's (blue
  tokens, IBM Plex and JetBrains Mono, 15 px labels, three packages). Tick the boxes and put a short block at its top,
  "What changed after this plan was written", listing the four deviations. Do not rewrite the plan.
- *The tracker:* stage 4's row names three pull requests. There were eight: AutomataFramework 21 and 25, and here 13,
  14, 17, 18, 19 and 20.
- *Comments:* `play.ts` still says a problem's place is "set in the measuring font"; `blueprint.test.ts` calls all
  five colours "the spec's" though two are mixes; `look.journey.test.ts` and `play.browser.test.ts` say "the label
  font" for what is now the only font. `blueprint.css` should say how the two mixes are made (10% and 75% of the way
  from paper to chalk), since no other file does.
- *The framework:* `touch.ts` says its buttons are dark enough "over the lightest thing they can sit on, the sky",
  written when the sky was one fixed colour. Its README names the schema files but never says in words that a level
  may set `sky` and `ground`; one sentence there would let an agent find it without opening the schema.

## Notes

**N1. One readable pair has no test.** The file's name on a problem's panel (pencil on hatch) is 5.05 to 1 and passes,
but `'every word can be read'` checks five pairs and not that one. Add it. It is the closest pair to the line.

**N2. The check that finds the hero in a picture has little room.** `layout.journey.test.ts` calls a pixel pink when
red is at least 50 above green and blue. The hero scores 95. The new Seashell ground scores 41, nine short of being
taken for the hero, and Peach Red scores 151 (harmless today: the buttons are hidden from that picture). It passes in
all three browsers. Matching the hero's own colour within a small distance would be safer than "more red than not".

**N3. The walls read as ladders.** The framework draws each wall tile as its own box with a dark edge, and the floor
as one long box. On slate the edges hardly showed; on Seashell Pink they are plain, and the browsers smooth them
differently, so some lines look thicker than others. It is the framework's drawing, not this repo's, and M2's real art
replaces the boxes. Noted so nobody is surprised in the pictures.

**N4. On a phone held upright the game is small.** The level takes about 220 of the 844 pixels of height and the hero is
about 20 by 24 pixels. It can be found and played, and the layout is cycle 1's, not this cycle's. Worth a look when M2 gives
the game a camera.

**N5. The "Jump held" picture is not the same twice.** The hero is caught at a different height each run. Nothing
compares pictures today, so it harms nothing; it would if they were ever compared.

**N6. The sky and the page are the same Black.** No. 340 and No. 276 share it, so the level sits in the page with no
seam and the bars beside the level cannot be seen. This reads as one calm screen and is counted as a strength. It also
means nothing marks where the level's open top is, which matters only once a level lets the hero leave it.

**N7. Peach Red and the "pink box".** The Owner chose Peach Red so a held button is not taken for the green crate.
For the record, once: with ordinary sight orange-red and pink are plainly apart (the held picture shows it), but they
are 1.32 to 1 in lightness and closer still for red-green colour-blind eyes. The button is lit only under a thumb, is
far bigger and has a word, so no change is proposed.

**N8. The title on the problem screen asks for a bold that is not loaded.** A browser's own style makes an `h1` weight
700; only 600 is loaded, and `font-synthesis: none` stops a fake. It draws correctly in all three browsers. Writing
`font-weight: 600` on it would make that deliberate.

**N9. The names of the five colours still tell the first Blueprint's story** (paper, hatch, chalk, pencil, marker;
"marker" is now orange-red). The Site uses the same five names, so they should be renamed together or not at all, by
whichever plan next touches both. No change here.

**N10. The other languages' fonts.** The spec names M PLUS Rounded 1c, Jua and ZCOOL KuaiLe; none is installed, the
font list names only Fredoka, and `index.html` says `lang="en"`. That is right while the words are English only, and
the spec leaves which files ship to each plan. The first translation must bring them, with their own licence notices
(F3) and the pin test's package list.

## For the Owner

Both are sent to the coordinator. Neither is decided here, and stage 6 does not pick one by default.

**Q1. The words tell the two boxes apart by colour alone. Is that enough?** "You are the pink box. Push the green box."
For about one man in twelve, pink and yellow-green are hard to tell apart: in the usual model of the commonest kind of
colour-blindness the two boxes come out as two close shades of tan (1.35 to 1). The boxes do differ in other ways: the
hero is a little narrower, starts on the left, and is the one that moves when a key is pressed.

- **(a) Leave it until M2.** The demo's boxes become real characters from the figure builder in M2, and shape then
  tells them apart. Nothing changes now. Recommended, if M2 is next.
- **(b) Add a second clue to the words now**, for example "You are the pink box on the left. Push the green box." The
  words are the Owner's to give.
- **(c) Add a second clue to the art now**, such as a different shape or size for the hero. This changes content and,
  if the size changes, the play, so the `level-1` recording moves with the content.

**Q2. May an editor change the demo game's colours?** (F2.) Today a test fails unless the four colours are exactly
palette No. 276.

- **(a) Yes: the colours are content like any other.** The test stops naming exact values on the real files and
  instead holds the rule that matters (each box stands clear of the sky, 3 to 1 at least); the exact palette is checked
  on the tests' own level. If someone makes the crate blue, the words "green box" are then wrong until someone changes
  them. Recommended: it is what `CLAUDE.md` already promises.
- **(b) No: the demo's colours are fixed while its words name them.** The test stays, and `CLAUDE.md` gains one line
  saying a colour change fails CI on purpose. An Edit-level recolour then turns `main` red until it is put back.
- **(c) Yes, and the words stop naming colours**, so no recolour can make them untrue. The words are the Owner's to
  give; this also bears on Q1.

## For stage 6

Apply F1, F3 and F4 (the spec's sentence goes to the coordinator). Apply N1 and N8 with them, since each is one line.
F2 waits for Q2. N2 is worth doing if F1 is being touched anyway. Nothing here needs a framework change or a pin move,
and no golden may move.
