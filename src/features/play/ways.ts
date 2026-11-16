// What the page hears of a visit while a level is running: a hero went through a door, player 1 crossed into another level
// of the place, a button was held down for good, a hero touched the goal. It only listens. The framework says which door
// (`doorTaken`) and which events these are; what the page does about each is in `play.ts`.
import { doorTaken, type Game, type GameContent, type Way } from '@automataframework/framework'

/** What `followVisit` listens to, and who it tells. */
export interface Visit {
  /** Only `onStep` is used. */
  readonly game: Pick<Game, 'onStep'>
  readonly content: GameContent
  /** The level the sim was opened at: in a place the touched things' ids are read against it. */
  readonly level: string
  /** A hero went through a door. Told once: nothing more is heard after it, so a second hero a tick later starts nothing. */
  onDoor(way: Way): void
  /** Player 1's middle passed into another level of the place. */
  onEntered(level: string): void
  /** A button stayed down: `level-2.button-1.open`. */
  onFact(fact: string): void
  /** A hero touched the goal. */
  onGoal(): void
}

/** Listens to each step of the game. Returns the function that stops the listening. */
export function followVisit(visit: Visit): () => void {
  const stop = visit.game.onStep((step) => {
    const way = doorTaken(visit.content, visit.level, step.events)
    if (way !== undefined) {
      stop()
      visit.onDoor(way)
      return
    }
    for (const event of step.events) {
      const payload = event.payload as Record<string, unknown>
      if (event.type === 'level.entered' && payload.player === 1) visit.onEntered(String(payload.level))
      else if (event.type === 'fact.kept') visit.onFact(String(payload.fact))
      else if (event.type === 'goal.touched' && typeof payload.player === 'number' && payload.player >= 1)
        visit.onGoal()
    }
  })
  return stop
}
