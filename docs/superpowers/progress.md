# Progress

Last updated: 2026-11-16 17:27 UTC (from `date`).

## Active milestone: the World slice (roadmap slice 3)

### Current work

- Installing the new workflow and its CI gate (this repo's setup pull request).

### Completed outcomes

- E1, the framework pin moves to `19aaa73` (#58). E2 and E3, three levels, a door and an edge, the page follows doors,
  the plays recorded (#59). CI: 18 browser shards (#60), the engines gate retries (#61).

### Remaining

- **E4, the crate has "How heavy"** (after the framework's F4 and F5): in `content/characters/crate.json` a number
  value `heavy` ("How heavy", least 0.5, step 0.5, default 1, "How hard the crate is to push.") and
  `weight: "heavy"`. It moves the pin to a commit with F4, F5 and Plan Q (framework #189 to #191), and the crate's
  play, so `replays/level-1.json` moves: merges on green under the standing yes, with a before-and-after note. Tell
  the Site its crate numbers changed.
- The website demo uses World: E2 and E3 built the levels and the door; the world map part and the Site picking it up
  are left (the earlier attempt was #41, closed).

### Blockers

- E4 waits for the framework's F4 and F5.

### Previews

- CI's pictures: the `ci-screens` branch. The game as people see it: https://automataframework.pages.dev.

### Material decisions

- The Owner's, 2026-11-16: this is the test game, so a golden that moves for an asked-for change merges on green with a
  before-and-after note.
- The Owner's: "How heavy" is the thing's Rapier mass (the framework's F4), which E4 depends on.
