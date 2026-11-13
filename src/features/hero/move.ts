// The hero's rules: run left and right, jump once per press. The system reads what each player holds (the framework's
// `Player` component) and writes the body's velocity; Rapier does the rest. It runs in the `gameplay` phase, after
// physics, so `vy` is this tick's real vertical speed.
import {
  Body,
  type ComponentDef,
  defineComponent,
  defineSystem,
  isHeld,
  Player,
  type SystemDef,
  wasPressed,
} from '@automataframework/framework/headless'

/** Tiles a second the hero runs at. */
export const RUN_SPEED = 6
/** Tiles a second the hero leaves the ground at. Gravity is the framework's default for a game, 30 down. */
export const JUMP_SPEED = 12

/** Ticks standing still that count as "standing on something". */
const STANDING = 2

/**
 * How many ticks in a row the hero has not been moving up or down, counted up to `STANDING`. Two means "standing on
 * something". One is not enough: at the very top of a jump the hero's vertical speed is zero for exactly one tick
 * (12 minus half a tile a second each tick reaches 0), and that tick must not count as ground.
 */
export const Hero: ComponentDef<{ still: 'u32' }> = defineComponent(
  'hero',
  { still: 'u32' },
  { render: false },
)

/** Run and jump, for every player. Each player's keys move only their own hero. */
export const moveHero: SystemDef = defineSystem('hero.move', 'gameplay', (ctx) => {
  for (const entity of ctx.query(Player, Body)) {
    if (!entity.has(Hero)) entity.add(Hero)
    const left = isHeld(entity, 'left')
    const right = isHeld(entity, 'right')
    const { vy } = entity.get(Body)
    const standing = entity.get(Hero).still >= STANDING
    // Counted before this tick's jump, so a press the tick the hero lands still waits for the ground to be felt.
    const still = Math.abs(vy) < 0.01 ? Math.min(entity.get(Hero).still + 1, STANDING) : 0
    const jump = wasPressed(entity, 'jump') && standing
    entity.set(Body, {
      vx: left === right ? 0 : left ? -RUN_SPEED : RUN_SPEED,
      ...(jump ? { vy: -JUMP_SPEED } : {}),
    })
    entity.set(Hero, { still: jump ? 0 : still })
  }
})
