// The proof that this game can be played in a room. The room server is this game's own `server.ts` (its content and
// its code), started on a port the system picks; two headless players, each with a real socket and their own two
// sims, join it and play a few seconds at 60 Hz. Both must end on the hash the server computed itself. The game's
// pages stay offline: this is Node only, and nothing here is built into `dist/`.
import {
  type Command,
  controlsCommand,
  createGameSim,
  type Joined,
  joinSession,
  type Sim,
  verifyReplay,
} from '@automataframework/framework/headless'
import { createRoomServer, type RoomServer } from '@automataframework/framework/server'
import { afterEach, expect, test, vi } from 'vitest'
import { serverGame } from '../../server.ts'

// Real sockets and real timers: 240 ticks are four real seconds, and a slow runner needs room.
vi.setConfig({ testTimeout: 60_000 })

/** The tick after which the first check hash is sent: the room sends one on every 60th tick, counting from 0. */
const CHECK_TICK = 239

interface Player {
  readonly joined: Joined
  /** The hash of each checked tick, by tick, as this player computed it. */
  readonly checks: Map<number, string>
  stop(): void
}

let server: RoomServer | undefined
const players: Player[] = []
const sims: Sim[] = []
afterEach(async () => {
  for (const player of players.splice(0)) player.stop()
  for (const sim of sims.splice(0)) sim.dispose()
  await server?.close()
  server = undefined
})

/** The places in the room: the game's `players` in `automata.toml`. Seats 3 and 4 are taken and stand where they start. */
const SEATS = 4
const EVERYONE = [1, 2, 3, 4]

/** What each seat holds from which tick: the push-crate idea, once for each of two players. */
const HOLDS: Readonly<Record<number, Readonly<Record<number, readonly string[]>>>> = {
  1: { 10: ['right'], 120: ['jump', 'right'], 180: [] },
  2: { 30: ['left'], 90: ['jump', 'left'], 200: [] },
}
const script = (seat: number, tick: number): Command[] => {
  const held = HOLDS[seat]?.[tick]
  return held === undefined ? [] : [controlsCommand(tick, seat, 0, held)]
}

async function makeSim(): Promise<Sim> {
  const { content, plugins } = await serverGame()
  const sim = await createGameSim({ content, plugins, players: EVERYONE })
  sims.push(sim)
  return sim
}

async function join(url: string, room?: string): Promise<Player> {
  const checks = new Map<number, string>()
  const joined = await joinSession({
    server: url,
    ...(room === undefined ? {} : { room }),
    level: 'level-1',
    seats: SEATS,
    confirmed: await makeSim(),
    predicted: await makeSim(),
    onCheck: (tick, hash) => void checks.set(tick, hash),
  })
  let given = 0
  const timer = setInterval(() => {
    const { session } = joined
    const local: Command[] = []
    if (session.seat !== undefined)
      for (; given <= session.sim.tick; given++) local.push(...script(session.seat, given))
    session.advance(local)
  }, 1000 / 60)
  const player: Player = {
    joined,
    checks,
    stop() {
      clearInterval(timer)
      joined.leave()
    },
  }
  players.push(player)
  return player
}

/** Waits, polling, until `condition` holds; throws, saying what it waited for, after thirty seconds. */
async function until(what: string, condition: () => boolean): Promise<void> {
  const end = Date.now() + 30_000
  while (!condition()) {
    if (Date.now() > end) throw new Error(`Gave up waiting for ${what}.`)
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

test('two players in this game’s room end on the hash the server computed', async () => {
  server = await createRoomServer({ game: await serverGame() })
  const url = `ws://127.0.0.1:${server.port}`
  const one = await join(url)
  const two = await join(url, one.joined.code)
  await until(
    'both players to reach the first check',
    () => one.checks.has(CHECK_TICK) && two.checks.has(CHECK_TICK),
  )
  const hash = one.checks.get(CHECK_TICK)
  expect(hash).toBeDefined()
  expect(two.checks.get(CHECK_TICK)).toBe(hash)
  // A replay leaves out the check that falls on its last tick (that hash is `finalHash`), and the clients hear the
  // check the moment the room takes it. So wait until the room has played one tick further and the check is kept.
  const code = one.joined.code
  const checkOf = (): string | undefined =>
    server?.replays()[code]?.checks.find((c) => c.tick === CHECK_TICK + 1)?.hash
  await until('the room to keep its first check', () => checkOf() !== undefined)
  expect(checkOf()).toBe(hash)
  const replay = server.replays()[code]
  expect(replay).toBeDefined()
  if (replay === undefined) return
  // The room's own play, played again from the start, ends where the room said it did.
  for (const player of players.splice(0)) player.stop()
  expect(verifyReplay(await makeSim(), replay)).toEqual({ ok: true })
})
