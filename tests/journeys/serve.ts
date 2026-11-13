// Starts the built game, `dist/`, on a free port for the journeys, and stops it at the end. Vitest runs this once
// before the journeys and gives them the address as `siteUrl`.
import { existsSync } from 'node:fs'
import { preview } from 'vite'
import type { TestProject } from 'vitest/node'

declare module 'vitest' {
  export interface ProvidedContext {
    /** Where the built game is served, with a trailing slash. */
    siteUrl: string
  }
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  if (!existsSync(new URL('../../dist/index.html', import.meta.url))) {
    throw new Error('There is no dist/ folder. Build the game first: pnpm build')
  }
  const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: false, open: false } })
  const address = server.resolvedUrls?.local[0]
  if (address === undefined) throw new Error('The preview server did not say where it is.')
  project.provide('siteUrl', address)
  return async () => {
    await server.close()
  }
}
