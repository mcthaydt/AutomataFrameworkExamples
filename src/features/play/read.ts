// Reading the game's files in a page: a `fetch` beside the page. The game's files are plain static files next to
// `index.html`, so this is all a page needs, on this site or any other.

/**
 * A `read` for `loadGame` that fetches `path` relative to `base`. Rejects unless the server answers 200 to 299 with
 * something that is not a web page. The game reads only TOML and JSON, and a single-page host (Cloudflare Pages with
 * no `404.html` is one) answers a missing path with its home page and a 200; taking that for the file would tell a
 * person their file is not valid JSON, when it is not there at all.
 */
export function readFrom(base: string | URL): (path: string) => Promise<string> {
  return async (path) => {
    const response = await fetch(new URL(path, base))
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || type.toLowerCase().startsWith('text/html')) throw new Error(`${path}: no such file`)
    return response.text()
  }
}
