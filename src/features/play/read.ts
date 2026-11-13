// Reading the game's files in a page: a `fetch` beside the page. The game's files are plain static files next to
// `index.html`, so this is all a page needs, on this site or any other.

/** A `read` for `loadGame` that fetches `path` relative to `base`. Rejects unless the server answers 200 to 299. */
export function readFrom(base: string | URL): (path: string) => Promise<string> {
  return async (path) => {
    const response = await fetch(new URL(path, base))
    if (!response.ok) throw new Error(`${path}: no such file`)
    return response.text()
  }
}
