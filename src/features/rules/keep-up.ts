// A player who is left behind is brought back to the others. The camera pulls back as the players spread, but only as
// far as the level's `view.most`; past that a hero would be off the screen, so the game puts the one who is farthest
// from the rest beside the one nearest it. It is a rule of the sim, so it is in every replay and every engine does it
// the same way. Sim math only: `+ - * /`, comparisons, `Math.min`, `Math.max` and `Math.abs`.
import {
  Body,
  defineSystem,
  type EntityRef,
  type GameContent,
  Player,
  type SystemDef,
  Transform,
} from '@automataframework/framework/headless'

/** How much nearer than `most` the heroes may spread, in tiles: the hero is a tile wide and the camera needs a margin. */
const MARGIN = 2

/** How far behind the hero it is put beside, in tiles. */
const BESIDE = 0.5

/** One hero's place on one axis, and the hero. */
interface Placed {
  readonly at: number
  readonly player: number
  readonly entity: EntityRef
}

/** The middle of the places, or the place itself for one. */
const middle = (places: readonly Placed[]): number => {
  let low = Number.POSITIVE_INFINITY
  let high = Number.NEGATIVE_INFINITY
  for (const place of places) {
    low = Math.min(low, place.at)
    high = Math.max(high, place.at)
  }
  return (low + high) / 2
}

/**
 * Puts the hero farthest from the middle of the others (the higher player number on a tie) beside the hero nearest it
 * (the lower player number on a tie), half a tile behind it on the side it was on, at that hero's height, with no speed.
 * Does nothing when the heroes are not spread past `limit` tiles on this axis.
 */
function pull(heroes: readonly EntityRef[], axis: 'x' | 'y', limit: number): void {
  const places: Placed[] = heroes.map((entity) => ({
    at: entity.get(Transform)[axis],
    player: entity.get(Player).number,
    entity,
  }))
  const spread = Math.max(...places.map((p) => p.at)) - Math.min(...places.map((p) => p.at))
  if (spread <= limit) return
  let far: Placed | undefined
  let farBy = -1
  for (const place of places) {
    const away = Math.abs(place.at - middle(places.filter((other) => other !== place)))
    if (away > farBy || (away === farBy && far !== undefined && place.player > far.player)) {
      far = place
      farBy = away
    }
  }
  if (far === undefined) return
  let near: Placed | undefined
  let nearBy = Number.POSITIVE_INFINITY
  for (const place of places) {
    if (place === far) continue
    const gap = Math.abs(place.at - far.at)
    if (gap < nearBy || (gap === nearBy && near !== undefined && place.player < near.player)) {
      near = place
      nearBy = gap
    }
  }
  if (near === undefined) return
  const beside = far.at < near.at ? near.at - BESIDE : near.at + BESIDE
  const there = near.entity.get(Transform)
  far.entity.set(Transform, axis === 'x' ? { x: beside, y: there.y } : { x: there.x, y: beside })
  far.entity.set(Body, { vx: 0, vy: 0 })
}

/**
 * The system for `level`: each tick, with two or more heroes and a `view.most` on the level, brings the straggler up
 * sideways and then up or down. A level with no `view`, or a game of one hero, is never touched.
 */
export function keepUpSystem(level: string): SystemDef {
  return defineSystem('game.keep-up', 'gameplay', (ctx) => {
    const most = (ctx.content as GameContent).levels[level]?.view?.most
    if (most === undefined) return
    const heroes = ctx.query(Player, Transform, Body)
    if (heroes.length < 2) return
    pull(heroes, 'x', most.w - MARGIN)
    pull(heroes, 'y', most.h - MARGIN)
  })
}
