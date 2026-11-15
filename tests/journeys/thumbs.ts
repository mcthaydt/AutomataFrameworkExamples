// A thumb on the framework's two halves of the screen, for the journeys. The page is driven from outside, so a finger
// is a pointer event of the touch kind sent to the half it lands on: the same events a real finger makes, in every
// engine (Playwright's own touchscreen can only tap). The walking half walks towards where the thumb has slid to; the
// jumping half jumps on the tick the thumb lands.
import type { Page } from 'playwright'

type Half = 'walk' | 'jump'

/** How far a walking thumb slides from where it landed to walk: past the dead zone, short of a flick (a dash). */
export const SLIDE_PX = 40

/**
 * A thumb lands on `half` (`down`), moves `along` pixels to the right of where it landed (`move`; negative is left),
 * or lifts from there (`up`). Each half has its own finger, so both can be down at once.
 */
export async function thumb(page: Page, half: Half, step: 'down' | 'move' | 'up', along = 0): Promise<void> {
  await page.evaluate(
    ({ half, step, along }) => {
      const target = document.querySelector(`.automata-thumb-half[data-half="${half}"]`)
      if (target === null) throw new Error(`there is no ${half} half on the page`)
      const box = target.getBoundingClientRect()
      target.dispatchEvent(
        new PointerEvent(`pointer${step}`, {
          pointerId: half === 'walk' ? 11 : 12,
          pointerType: 'touch',
          clientX: box.x + box.width / 2 + (step === 'down' ? 0 : along),
          clientY: box.y + box.height / 2,
          bubbles: true,
          cancelable: true,
        }),
      )
    },
    { half, step, along },
  )
}

/** The colour the browser reports for the background of the first element that matches `selector`. */
export const backgroundOf = (page: Page, selector: string): Promise<string> =>
  page.evaluate((found) => {
    const element = document.querySelector(found)
    if (element === null) throw new Error(`there is no ${found} on the page`)
    return getComputedStyle(element).backgroundColor
  }, selector)
