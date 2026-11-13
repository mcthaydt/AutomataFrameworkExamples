// The hero: the sim-side rules every player's character follows. Pure: no page, no clock, no randomness.
import { definePlugin, type PluginDef } from '@automataframework/framework/headless'
import { Hero, moveHero } from './move.ts'

/** The hero's plugin: after physics and commands, since it reads `Player` and writes `Body`. */
export const heroPlugin: PluginDef = definePlugin({
  name: 'hero',
  dependsOn: ['physics', 'commands'],
  components: [Hero],
  systems: [moveHero],
})

export { Hero, JUMP_SPEED, RUN_SPEED } from './move.ts'
