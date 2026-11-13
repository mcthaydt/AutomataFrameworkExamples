// Says whether every engine ended a play the same way, in a sentence a person can act on. It compares hashes and
// nothing else, so it runs in Node, where CI collects what each engine saved.

/** What one engine reports for a play: the hash after every check tick, and where it ended. */
export interface EngineHashes {
  readonly engine: string
  readonly finalHash: string
  readonly checks: readonly { readonly tick: number; readonly hash: string }[]
}

const MUST_MATCH = 'The same play must come out the same in every engine.'

/**
 * `undefined` when every engine agrees. Otherwise one sentence that names the first pair that differs: the first
 * engine in the list is the reference, and the others are compared with it in order.
 */
export function describeDifference(runs: readonly EngineHashes[]): string | undefined {
  const [first, ...others] = runs
  if (first === undefined) return 'No engine reported its hashes.'
  if (others.length === 0)
    return `Only ${first.engine} reported its hashes. The check needs at least two engines.`
  for (const other of others) {
    if (other.checks.length !== first.checks.length) {
      return `${first.engine} took ${first.checks.length} check hashes and ${other.engine} took ${other.checks.length}. They did not play the same recording.`
    }
    for (const [i, check] of first.checks.entries()) {
      const theirs = other.checks[i]
      if (theirs?.hash !== check.hash) {
        return `${first.engine} and ${other.engine} disagree from tick ${check.tick}: ${first.engine} has ${check.hash}, ${other.engine} has ${theirs?.hash}. ${MUST_MATCH}`
      }
    }
    if (other.finalHash !== first.finalHash) {
      return `${first.engine} and ${other.engine} agree at every check but end differently: ${first.engine} on ${first.finalHash}, ${other.engine} on ${other.finalHash}. ${MUST_MATCH}`
    }
  }
  return undefined
}
