// The game's own words, read from its messages files as a test needs them, so no test types a sentence the game says
// twice: a sentence changed in `content/messages/en.json` changes the tests' word for it, and a key that does not
// exist is a mistake the test names.
import { frameworkWords, playHint } from '@automataframework/framework/headless'
import { gameFiles } from './game-files.ts'

/** The messages of one of the game's languages, by key. Throws, naming the file, when it is not there. */
export function messagesOf(language: string): Readonly<Record<string, string>> {
  const path = `content/messages/${language}.json`
  const text = gameFiles[path]
  if (text === undefined) throw new Error(`${path} is not one of the game's files.`)
  return (JSON.parse(text) as { messages: Readonly<Record<string, string>> }).messages
}

/** One word of the game in `language` (English unless said). Throws for a key the language does not have. */
export function say(key: string, language = 'en'): string {
  const text = messagesOf(language)[key]
  if (text === undefined) throw new Error(`content/messages/${language}.json has no "${key}".`)
  return text
}

/** The first key of each action in the real game's tuning file, which is what a keyboard player sees named. */
const FIRST_KEYS: Readonly<Record<string, string>> = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  jump: 'Space',
  dash: 'ShiftLeft',
}

/**
 * The words a player at a keyboard reads about moving, jumping and dashing, as the page builds them with the
 * framework's `playHint` from the framework's own sentences.
 */
export const KEYBOARD_WORDS: string = playHint({
  device: 'keyboard',
  first: (action) => FIRST_KEYS[action],
  dash: true,
  words: frameworkWords('en'),
})

/** What a screen reader (and a test) calls the two halves of the screen and the one button, in English. */
export const THUMB_WORDS: { readonly walk: string; readonly jump: string; readonly dash: string } = {
  walk: frameworkWords('en')('automata.thumbs.walk'),
  jump: frameworkWords('en')('automata.thumbs.jump'),
  dash: say('controls.dash'),
}

/** One player's own inputs, as a test writes them down: the device and the first input of each action. */
export interface PlayerInputs {
  readonly device: 'keyboard' | 'gamepad'
  readonly first: Readonly<Record<string, string>>
  /** On a shared keyboard each half has its own Shift, and the words say which: the game's `keys.shift-<side>`. */
  readonly shift?: 'left' | 'right'
}

/**
 * The second line of the strip once two play: each player's number with the words about their own keys or gamepad,
 * from the game's `players.hint` sentence and the framework's `playHint`.
 */
export function twoPlayerWords(players: readonly PlayerInputs[]): string {
  return players
    .map((inputs, i) =>
      say('players.hint')
        .replace('{player}', String(i + 1))
        .replace(
          '{hint}',
          playHint({
            device: inputs.device,
            first: (action) => inputs.first[action],
            dash: true,
            words: sideOfShift(inputs.shift),
          }),
        ),
    )
    .join(' ')
}

/** The framework's words, with its one word for Shift said as the game's left or right Shift when `side` is given. */
function sideOfShift(side: 'left' | 'right' | undefined): ReturnType<typeof frameworkWords> {
  const words = frameworkWords('en')
  if (side === undefined) return words
  return ((key: string, values?: Record<string, unknown>) =>
    key === 'automata.key.shift' ? say(`keys.shift-${side}`) : words(key, values as never)) as ReturnType<
    typeof frameworkWords
  >
}
