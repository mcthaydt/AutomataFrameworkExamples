// A player that plays a level by looking at the sim, for the tests and the recordings. A recorded play is only commands,
// so the recording needs no bot; the bot is how a play is made without anyone running the game, and why it still
// reaches the door when a hop lands a little short: it decides each tick from where the hero is and what it touches, never
// from a count of ticks. It is the one place the numbers of the levels (where a hop begins, where the door is) are
// written for the tests; the levels themselves are content.
import {
  Body,
  type Command,
  controlsCommand,
  createRecorder,
  joinCommand,
  Player,
  type Replay,
  type Sim,
  Touching,
  Transform,
} from '@automataframework/framework/headless'
import { Progress } from '#src/features/rules/rules.ts'

/** What a bot sees of its hero on one tick. y points down, so falling is a positive `vy`. */
export interface Look {
  readonly tick: number
  readonly x: number
  readonly y: number
  readonly vx: number
  readonly vy: number
  /** Something solid under the hero (a tick late after a jump, so a bot also looks at `vy`). */
  readonly below: boolean
  readonly left: boolean
  readonly right: boolean
  /** The hero is standing in the door. */
  readonly inDoor: boolean
}

/** What a bot holds this tick: the names of the actions, like `right` and `jump`. */
export type Plan = (look: Look) => readonly string[]

/** A way the hero leaves the ground: a plain jump, a jump with a second jump at the top, or a jump with a dash at the top. */
export type HopKind = 'jump' | 'double' | 'dash'

/** Where a level is crossed, in tiles from its left edge. */
export interface Course {
  /** Where on the ground a hop begins (the hero's middle from `from` up to `to`) and which kind. */
  readonly hops: readonly { readonly from: number; readonly to: number; readonly kind: HopKind }[]
  /** A shaft the hero climbs by wall jumps: the hero is in it while its middle is between `from` and `to`. */
  readonly shaft?: { readonly from: number; readonly to: number }
  /** The middle of the door. */
  readonly door: number
}

/**
 * A bot that walks right through a course. It holds right, hops where the course says, jumps whenever it is held up by
 * something on the ground, climbs a shaft by wall jumps, and stands still once it is in the door and far enough in. `start`
 * is the tick it begins, and `rank` is how far back from the middle of the door (rank times 0.9 tiles) it stops, so a
 * second player has room to stand in the door beside the first.
 */
export function walker(
  course: Course,
  options: { readonly start?: number; readonly rank?: number } = {},
): Plan {
  const { start = 10, rank = 0 } = options
  // The hop under way, and whether its second move (the second jump, the dash) is made.
  let kind: HopKind | undefined
  let second = false
  // Whether jump was held the last tick: a press needs a tick with it let go first.
  let jumped = false
  // Ticks held up on the ground while holding right.
  let held = 0
  // The wall the shaft climb makes for next: 1 right, -1 left.
  let side = 1

  /** Climbing the shaft: on the floor, jump; in the air, go for a wall and jump off it when touching it near the top. */
  const climb = (look: Look, grounded: boolean, shaft: { readonly from: number }): string[] => {
    if (grounded) {
      side = 1
      return look.x > shaft.from + 0.5 ? ['right', 'jump'] : ['right']
    }
    const toward = side === 1 ? 'right' : 'left'
    const touching = side === 1 ? look.right : look.left
    if (touching && look.vy >= -2) {
      if (jumped) return [toward]
      side = -side
      return [toward, 'jump']
    }
    return look.vy < -2 || (look.vy < 0 && !touching) ? [toward, 'jump'] : [toward]
  }

  const decide = (look: Look): string[] => {
    const grounded = look.below && look.vy > -1
    if (look.inDoor && look.x >= course.door - 0.9 * rank) return []
    const shaft = course.shaft
    if (shaft !== undefined && look.x > shaft.from && look.x < shaft.to) return climb(look, grounded, shaft)
    if (grounded) {
      second = false
      kind = undefined
      held = Math.abs(look.vx) < 0.3 ? held + 1 : 0
      const hop = course.hops.find((h) => look.x >= h.from && look.x < h.to)
      if (hop !== undefined) {
        kind = hop.kind
        return ['right', 'jump']
      }
      if (held >= 8) {
        held = 0
        kind = 'jump'
        return ['right', 'jump']
      }
      return ['right']
    }
    if (kind === 'double' && !second && look.vy >= -1) {
      if (jumped) return ['right']
      second = true
      return ['right', 'jump']
    }
    if (kind === 'dash' && !second && look.vy >= -1) {
      second = true
      return ['right', 'dash']
    }
    return look.vy < 0 ? ['right', 'jump'] : ['right']
  }

  return (look) => {
    const now = look.tick < start ? [] : decide(look)
    jumped = now.includes('jump')
    return now
  }
}

/** A bot that holds the same actions from tick `from` up to (not including) tick `to`, and nothing otherwise. */
export function holder(actions: readonly string[], from: number, to: number): Plan {
  return (look) => (look.tick >= from && look.tick < to ? actions : [])
}

/** What `drive` gives back: the recording, the tick the level was done on (if it was) and where each hero was on the way. */
export interface Driven {
  readonly replay: Replay
  /** The tick the sim was at when the level's rules said it was done, or undefined when it never was. */
  readonly doneAt: number | undefined
  /** One line every half second: the tick and where each player's hero was. For a failure message. */
  readonly trail: string
}

/**
 * Plays `sim` (at tick 0) with a bot for each player in `plans`, recording it. `joins` says on which tick each player
 * joins the game with the `join` command; a bot is asked nothing until its hero is in the sim. The play ends `rest`
 * ticks after the level is done (default 60), or at `limit` ticks when it never is.
 */
export function drive(
  sim: Sim,
  options: {
    readonly plans: Readonly<Record<number, Plan>>
    readonly joins?: Readonly<Record<number, number>>
    readonly rest?: number
    readonly limit: number
    readonly meta?: Readonly<Record<string, string>>
  },
): Driven {
  const { plans, joins = {}, rest = 60, limit } = options
  const recorder = createRecorder(sim, options.meta === undefined ? {} : { meta: options.meta })
  const counted = new Map<number, number>()
  const sent = new Map<number, string>()
  const seq = (player: number): number => {
    const n = counted.get(player) ?? 0
    counted.set(player, n + 1)
    return n
  }
  const trail: string[] = []
  let doneAt: number | undefined
  for (let tick = 0; tick < limit; tick++) {
    const commands: Command[] = []
    for (const [key, at] of Object.entries(joins)) {
      if (at === tick) commands.push(joinCommand(tick, Number(key), seq(Number(key))))
    }
    const progress = sim.resource(Progress)
    const places: string[] = []
    for (const [key, plan] of Object.entries(plans)) {
      const player = Number(key)
      const hero = sim.query(Player, Transform, Body).find((e) => e.get(Player).number === player)
      if (hero === undefined) continue
      const at = hero.get(Transform)
      const speed = hero.get(Body)
      const touching = hero.has(Touching) ? hero.get(Touching) : { below: false, left: false, right: false }
      places.push(`${player}:(${at.x.toFixed(1)},${at.y.toFixed(1)})`)
      const look: Look = {
        tick,
        x: at.x,
        y: at.y,
        vx: speed.vx,
        vy: speed.vy,
        below: touching.below,
        left: touching.left,
        right: touching.right,
        inDoor: progress.inDoor.includes(player),
      }
      const actions = [...plan(look)].sort()
      const text = actions.join(',')
      if (text !== (sent.get(player) ?? '')) {
        sent.set(player, text)
        commands.push(controlsCommand(tick, player, seq(player), actions))
      }
    }
    if (tick % 30 === 0) trail.push(`t${tick} ${places.join(' ')}`)
    recorder.step(commands)
    if (doneAt === undefined && progress.done) doneAt = sim.tick
    if (doneAt !== undefined && sim.tick >= doneAt + rest) break
  }
  return { replay: recorder.replay(), doneAt, trail: trail.join('\n') }
}
