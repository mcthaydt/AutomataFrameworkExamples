// A game plays only while it can be seen: the host's word, and now whether the game's root is in the window.
import type { Host } from '@automataframework/framework'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { whileSeen } from '#src/features/play/seen.ts'

let root: HTMLDivElement
let spacer: HTMLDivElement
let seen: ReturnType<typeof whileSeen> | undefined

function fakeHost(): Host & { hide(): void; show(): void } {
  let visible = true
  const listeners = new Set<(visible: boolean) => void>()
  const set = (next: boolean): void => {
    visible = next
    for (const l of listeners) l(next)
  }
  return {
    target: 'web',
    visible: () => visible,
    onVisibility(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    hide: () => set(false),
    show: () => set(true),
  }
}

beforeEach(() => {
  // A page much taller than the window, with the root far down it.
  spacer = document.createElement('div')
  spacer.style.cssText = 'position:absolute;top:0;left:0;width:10px;height:6000px'
  root = document.createElement('div')
  root.style.cssText = 'position:absolute;top:4000px;left:0;width:200px;height:200px'
  document.body.append(spacer, root)
  window.scrollTo(0, 0)
})
afterEach(() => {
  seen?.destroy()
  seen = undefined
  root.remove()
  spacer.remove()
  window.scrollTo(0, 0)
})

test('a root scrolled out of the window is not visible, and is again when scrolled back', async () => {
  const host = fakeHost()
  seen = whileSeen(host, root)
  const told: boolean[] = []
  seen.onVisibility((visible) => told.push(visible))
  // Starts not seen, and stays so while it is far below the window.
  expect(seen.visible()).toBe(false)
  window.scrollTo(0, 4000)
  await vi.waitFor(() => expect(seen?.visible()).toBe(true))
  window.scrollTo(0, 0)
  await vi.waitFor(() => expect(seen?.visible()).toBe(false))
  expect(told).toEqual([true, false])
})

test('a hidden host stays hidden whatever the root does', async () => {
  const host = fakeHost()
  host.hide()
  window.scrollTo(0, 4000)
  seen = whileSeen(host, root)
  // The root is in view, and the host still says no. A second observer, made after the first, hears of the root being in
  // view in the same delivery and after it, so when it has spoken the first has had its say (two animation frames
  // were not always enough on a slow machine).
  await new Promise<void>((resolve) => {
    const second = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      second.disconnect()
      resolve()
    })
    second.observe(root)
  })
  expect(seen.visible()).toBe(false)
  // The host coming back is what makes it visible, which shows the root was in view all along.
  const told: boolean[] = []
  seen.onVisibility((visible) => told.push(visible))
  host.show()
  expect(seen.visible()).toBe(true)
  expect(told).toEqual([true])
})

test('the host going away while the root is in view is told on', async () => {
  const host = fakeHost()
  window.scrollTo(0, 4000)
  seen = whileSeen(host, root)
  await vi.waitFor(() => expect(seen?.visible()).toBe(true))
  const told: boolean[] = []
  seen.onVisibility((visible) => told.push(visible))
  host.hide()
  expect(told).toEqual([false])
})

test('destroy lets go of the host and the observer', async () => {
  const host = fakeHost()
  window.scrollTo(0, 4000)
  seen = whileSeen(host, root)
  const told: boolean[] = []
  seen.onVisibility((visible) => told.push(visible))
  await vi.waitFor(() => expect(told).toEqual([true]))
  seen.destroy()
  host.hide()
  expect(told).toEqual([true])
})
