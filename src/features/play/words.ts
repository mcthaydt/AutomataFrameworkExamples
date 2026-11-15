// The only sentences written in code: what the page says before any of the game's files has loaded, for the developer,
// who reads English. Every other word a player reads is in `content/messages/`, in six languages, and is said in the
// player's own (`locale.words`). The same three are also in the messages (`page.problem-title`, `page.problem-fix`
// and `page.cannot-start`), and are said in the player's language once there is one. No sentence names a colour (the
// Owner, 2026-11-14), so an editor may recolour the boxes without making a word untrue.

export const WORDS = {
  problemTitle: 'This game has a problem and cannot start.',
  problemFix: 'Fix the file named above, then load this page again.',
  cannotStart: 'This game could not start in this browser. Try another browser.',
} as const

/** The id the game's settings (its language, for now) are kept under on the player's device. */
export const GAME_ID = 'crate-game'
