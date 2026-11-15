// What to tell a player at a keyboard: which keys to press, in the player's language ("Arrow keys to move. Space to
// jump."). Made from the keys in use now and from the words `hint.*` and `key.*` in `content/messages/`.
import type { Words } from '@automataframework/framework'

/**
 * A key's name as a person says it, in the player's language: `ArrowLeft` is "Left arrow", `KeyA` is "A", `Space` is
 * "Space". Only the keys with words of their own are in the messages; a letter or a digit says itself.
 */
export function keyName(code: string, words: Words): string {
  const arrow = /^Arrow(Left|Right|Up|Down)$/.exec(code)
  if (arrow !== null) return words(`key.arrow-${(arrow[1] ?? '').toLowerCase()}`)
  if (code === 'Space') return words('key.space')
  const letter = /^(?:Key|Digit)(.)$/.exec(code)
  return letter?.[1] ?? code
}

/**
 * What to tell a player at a keyboard, from the first key of each action (`first` gives it, or `undefined` for an
 * action with none), in the player's language.
 */
export function hintFor(first: (action: string) => string | undefined, words: Words): string {
  const left = first('left')
  const right = first('right')
  const jump = first('jump')
  const keys =
    left === 'ArrowLeft' && right === 'ArrowRight'
      ? [words('hint.arrows')]
      : [left, right].flatMap((code) => (code === undefined ? [] : [keyName(code, words)]))
  const parts = [
    ...(keys.length === 0 ? [] : [words('hint.move', { keys })]),
    ...(jump === undefined ? [] : [words('hint.jump', { key: keyName(jump, words) })]),
  ]
  return parts.join(' ')
}
