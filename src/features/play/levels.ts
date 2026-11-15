// What a level must have to be finished by anyone. The sim never checks it: a level with no door simply never ends. An
// editor can make that mistake with one save, so the page asks before it starts a level and, when the door is missing,
// says which file and what to add, never opening a level nobody can finish. (A level with no start for a player the game
// lets play is already refused by the framework's own loader, in a sentence of its own, so it is not checked again here.)
// The order of the levels is the framework's (`levels` in `automata.toml`, `levelOrder`), so it is not written again.
import { type GameContent, levelOrder } from '@automataframework/framework/headless'

/** One thing wrong with a level: the file to open and a sentence a person can act on. */
export interface LevelProblem {
  readonly file: string
  readonly message: string
}

/** The kind of character the level's rules count as the door (see `rules/progress.ts`). */
const DOOR_KIND = 'door'

/**
 * Every problem of every level of the game, in the order the levels are played: today, a level with no door. Empty when
 * each level can be finished. A level the game does not have is not named here: `loadGame` says that.
 */
export function levelProblems(content: GameContent): readonly LevelProblem[] {
  const problems: LevelProblem[] = []
  for (const id of levelOrder(content.project)) {
    const level = content.levels[id]
    if (level === undefined) continue
    if (!level.things.some((thing) => content.characters[thing.character]?.kind === DOOR_KIND)) {
      problems.push({
        file: `content/levels/${id}.json`,
        message: `This level has no door, so nobody can finish it. Add a thing whose character is "${DOOR_KIND}".`,
      })
    }
  }
  return problems
}
