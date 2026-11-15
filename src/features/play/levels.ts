// What a level must have to be played to its end by everyone who may play it. The sim never checks this: a level with
// no door simply never ends, and a start missing for a player is an error only when that player joins. An editor can
// make either mistake with one save, so the page asks before it starts a level and, when something is missing, says
// which file and what to add, never opening a level nobody can finish. The order of the levels is the framework's own
// (`levels` in `automata.toml`, `levelOrder`), so it is not written again here.
import { type GameContent, levelOrder } from '@automataframework/framework/headless'

/** One thing wrong with a level: the file to open and a sentence a person can act on. */
export interface LevelProblem {
  readonly file: string
  readonly message: string
}

/** The kind of character the level's rules count as the door (see `rules/progress.ts`). */
const DOOR_KIND = 'door'

/**
 * Every problem of every level of the game, in the order the levels are played: a level with no door, then a level with no
 * start for a player the game lets play (`players` in `automata.toml`, 1 when it says nothing). Empty when each level can be
 * finished by each player. A level the game does not have is not named here: `loadGame` says that.
 */
export function levelProblems(content: GameContent): readonly LevelProblem[] {
  const problems: LevelProblem[] = []
  const players = content.project.players ?? 1
  for (const id of levelOrder(content.project)) {
    const level = content.levels[id]
    if (level === undefined) continue
    const file = `content/levels/${id}.json`
    if (!level.things.some((thing) => content.characters[thing.character]?.kind === DOOR_KIND)) {
      problems.push({
        file,
        message: `This level has no door, so nobody can finish it. Add a thing whose character is "${DOOR_KIND}".`,
      })
    }
    for (let player = 1; player <= players; player++) {
      if (!level.starts.some((start) => start.player === player)) {
        problems.push({
          file,
          message: `This level has no start for player ${player}. Add one to "starts" with "player": ${player}.`,
        })
      }
    }
  }
  return problems
}
