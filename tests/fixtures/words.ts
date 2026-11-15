// The game's own words, read from its messages files as a test needs them, so no test types a sentence the game says
// twice: a sentence changed in `content/messages/en.json` changes the tests' word for it, and a key that does not
// exist is a mistake the test names.
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

const move = say('hint.move').replace('{keys}', say('hint.arrows'))
const jump = say('hint.jump').replace('{key}', say('key.space'))

/** The words a player at a keyboard reads about moving and jumping, as the page builds them from `hint.*` and `key.*`. */
export const KEYBOARD_WORDS: string = `${move} ${jump}`
