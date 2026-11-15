// The strip: the two lines above the level. The first is the goal ("Push the other box.") and, once it is reached, the
// same goal with a tick in front of it; the second is how to do it at a keyboard or a gamepad. A touch screen has no
// second line, because the thumbs carry their own hints. Every line of words above the level in this game goes through
// here, so the look (the chalk, the tick, the size) is in one place and one stylesheet.

export interface Strip {
  /** The goal, as a sentence in the player's language. Takes the tick off, if it was there. */
  say(text: string): void
  /** The goal reached: the same line with the tick before it, so a player sees at a glance that they did it. */
  done(text: string): void
  /** How to do it, at this device. The empty text leaves the second line out. */
  how(text: string): void
  /** Takes every word away and leaves the strip empty. */
  clear(): void
}

function line(className: string): HTMLParagraphElement {
  const made = document.createElement('p')
  made.className = className
  return made
}

/** The strip in `mount`, which it empties first. */
export function createStrip(mount: HTMLElement): Strip {
  const goal = line('play-goal')
  const howTo = line('play-how')
  mount.replaceChildren(goal, howTo)
  return {
    say(text) {
      goal.textContent = text
      goal.classList.remove('play-done')
    },
    done(text) {
      goal.textContent = text
      goal.classList.add('play-done')
    },
    how(text) {
      howTo.textContent = text
      howTo.hidden = text === ''
    },
    clear() {
      goal.textContent = ''
      goal.classList.remove('play-done')
      howTo.textContent = ''
      howTo.hidden = true
    },
  }
}
