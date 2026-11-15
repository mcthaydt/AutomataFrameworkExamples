// The game's words: every sentence a player reads is in `content/messages/`, in six languages, and the code holds only
// the three sentences the page says before any file has loaded. A missing translation fails here, in words that say
// which file and what to write; the first-time reading of each language by a native speaker is a mark in
// `automata.translations.toml`, never a failure.
import { formatDiagnostic, LANGUAGES, translationProblems } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { WORDS } from '#src/features/play/words.ts'
import { loadTheGame } from '../fixtures/game-files.ts'
import { messagesOf } from '../fixtures/words.ts'

test('the game has words in all six languages, and none is missing or wrong', async () => {
  const game = await loadTheGame()
  expect(game.project.source).toBe('en')
  expect(Object.keys(game.messages ?? {}).sort()).toEqual([...LANGUAGES].sort())
  expect(translationProblems(game).map(formatDiagnostic)).toEqual([])
})

test('the six files have the same keys, and no word is empty', () => {
  const english = Object.keys(messagesOf('en')).sort()
  for (const language of LANGUAGES) {
    expect(Object.keys(messagesOf(language)).sort(), language).toEqual(english)
    for (const [key, words] of Object.entries(messagesOf(language)))
      expect(words.trim(), `${language} ${key}`).not.toBe('')
  }
})

test('the page says nothing in code but the three sentences for a developer', () => {
  expect(Object.keys(WORDS).sort()).toEqual(['cannotStart', 'problemFix', 'problemTitle'])
})

test('the three developer sentences are also in the messages, word for word in English', () => {
  const english = messagesOf('en')
  expect(english['page.problem-title']).toBe(WORDS.problemTitle)
  expect(english['page.problem-fix']).toBe(WORDS.problemFix)
  expect(english['page.cannot-start']).toBe(WORDS.cannotStart)
})
