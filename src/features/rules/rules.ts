// The game's rules: what ends a level (every player in the door), what is counted (the sparks) and who is kept in
// view. They are the only code of this game's sim; the hero's moves, the touches and the joints are the framework's.
import { definePlugin, type PluginDef } from '@automataframework/framework/headless'
import { keepUpSystem } from './keep-up.ts'
import { LevelDone, Progress, progressSystem } from './progress.ts'

export { LevelDone, Progress } from './progress.ts'

/**
 * The rules plugin for `level`. It needs the touch plugin, so the game must have a character of kind "door" (sensed)
 * and one of kind "spark" (taken). The level is named because keep-up reads that level's `view.most`.
 */
export function rulesPlugin(level: string): PluginDef {
  return definePlugin({
    name: 'game.rules',
    dependsOn: ['level', 'touch'],
    config: { level },
    resources: [Progress],
    events: [LevelDone],
    systems: [progressSystem, keepUpSystem(level)],
  })
}
