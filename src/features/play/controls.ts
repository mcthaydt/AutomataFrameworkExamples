// The controls: which keys, and which on-screen buttons, make which action. The hero's rules read these action names
// (`left`, `right`, `jump`); the framework turns keys and fingers into them.
import type { Controls } from '@automataframework/framework'

export const CONTROLS: Controls = {
  left: { label: 'Left', keys: ['ArrowLeft', 'KeyA'], side: 'left' },
  right: { label: 'Right', keys: ['ArrowRight', 'KeyD'], side: 'left' },
  jump: { label: 'Jump', keys: ['Space', 'ArrowUp'], side: 'right' },
}
