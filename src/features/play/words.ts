// Every word the page can show, in one place, so the drunk-grandma test reads one file. The page's first minute: who
// you are, what to press, and (once it is done) that you did it.

export const WORDS = {
  loading: 'Loading the game…',
  goal: 'You are the pink box. Push the green box.',
  // Shown in place of `goal` once the crate has been pushed, so a player knows they did what they were asked.
  done: 'You pushed the green box. Well done!',
  keys: 'Hold the left or right arrow key to move. Press Space to jump.',
  touch: 'Hold Left or Right to move. Tap Jump to jump.',
  problemTitle: 'This game has a problem and cannot start.',
  problemFix: 'Fix the file named above, then load this page again.',
  cannotStart: 'This game could not start in this browser. Try another browser.',
} as const
