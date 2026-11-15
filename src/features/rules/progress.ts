// The game's rules for finishing a level, as sim code: the sparks taken, who stands in the door, and the moment every
// player is in it. The page only reads this (it shows the count and moves on to the next level); it never decides it.
// Pure: only the sim's own events and components are read, so the same play ends the same way in every engine.
import {
  defineEvent,
  defineResource,
  defineSystem,
  type EventDef,
  Player,
  type ResourceDef,
  type SystemDef,
  touchEvent,
  z,
} from '@automataframework/framework/headless'

const progressShape: z.ZodObject<{
  sparks: z.ZodNumber
  inDoor: z.ZodArray<z.ZodNumber>
  done: z.ZodBoolean
  doneTick: z.ZodNumber
}> = z.object({
  sparks: z.number().int(),
  inDoor: z.array(z.number().int()),
  done: z.boolean(),
  doneTick: z.number().int(),
})

/**
 * What the level's rules know. `inDoor` is the numbers of the players standing in the door, lowest first; `done` turns
 * true on the first tick every player who is playing is in the door, and stays true; `doneTick` is that tick, 0 before.
 */
export const Progress: ResourceDef<typeof progressShape> = defineResource(
  'game.progress',
  progressShape,
  () => ({ sparks: 0, inDoor: [], done: false, doneTick: 0 }),
)

const doneShape: z.ZodObject<{ sparks: z.ZodNumber }> = z.object({ sparks: z.number().int() })

/** Raised once, on the tick the level is done, with how many sparks were taken. The project's `done` names it. */
export const LevelDone: EventDef<typeof doneShape> = defineEvent('game.level-done', doneShape)

/** Cuts a list of player numbers down to the players who are in the game, lowest first, each once. */
function among(numbers: Iterable<number>, playing: ReadonlySet<number>): number[] {
  return [...new Set(numbers)].filter((n) => playing.has(n)).sort((a, b) => a - b)
}

/**
 * Each tick, after the touches are known: counts the sparks taken, puts a hero who touched the door in `inDoor` and
 * takes one who left it out, forgets a player who has left the game (so the others are not kept waiting for them, and
 * a game nobody is in is never done), and ends the level the first tick that list is not empty and holds every player.
 */
export const progressSystem: SystemDef = defineSystem('game.progress', 'gameplay', (ctx) => {
  const progress = ctx.resource(Progress)
  progress.sparks += ctx.events.of(touchEvent('spark', 'taken')).filter((e) => e.player > 0).length

  const playing = new Set(ctx.query(Player).map((entity) => entity.get(Player).number))
  const inside = new Set(progress.inDoor)
  for (const e of ctx.events.of(touchEvent('door', 'left'))) {
    if (e.player > 0) inside.delete(e.player)
  }
  for (const e of ctx.events.of(touchEvent('door', 'touched'))) {
    if (e.player > 0) inside.add(e.player)
  }
  progress.inDoor = among(inside, playing)

  if (progress.done || progress.inDoor.length === 0 || progress.inDoor.length !== playing.size) return
  progress.done = true
  progress.doneTick = ctx.tick
  ctx.emit(LevelDone, { sparks: progress.sparks })
})
