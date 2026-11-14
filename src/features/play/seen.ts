// A watching game plays only while a person could see it. The framework's host already says "not while the tab is
// hidden"; this adds "not while the game is scrolled out of the window", which matters when the game is a frame far
// down someone's page. An `IntersectionObserver` with no root measures against the top window, through every frame
// around the game, which is the part that has to be true on the Site.
import type { Host } from '@automataframework/framework'

/**
 * `host`, but also not visible while none of `root` is in the window. It starts out not seen, and the observer says
 * within a frame whether it is, so a game made off screen never plays a tick there. `destroy` lets go of both.
 */
export function whileSeen(host: Host, root: HTMLElement): Host & { destroy(): void } {
  let inView = false
  const listeners = new Set<(visible: boolean) => void>()
  const now = (): boolean => host.visible() && inView
  let last = now()
  const tell = (): void => {
    const visible = now()
    if (visible === last) return
    last = visible
    for (const listener of listeners) listener(visible)
  }
  const observer = new IntersectionObserver((entries) => {
    // The newest entry is the current truth.
    inView = entries.at(-1)?.isIntersecting ?? inView
    tell()
  })
  observer.observe(root)
  const unlisten = host.onVisibility(tell)
  return {
    target: host.target,
    visible: now,
    onVisibility(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    destroy() {
      observer.disconnect()
      unlisten()
      listeners.clear()
    },
  }
}
