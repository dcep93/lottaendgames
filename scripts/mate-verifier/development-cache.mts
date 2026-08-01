import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import type { MateId } from '../../app/src/mate/types.ts'
import type {
  ProductionLegalTransition,
  ProductionMateTransitionCache,
} from './production.mts'
import type {
  MateVerificationAdapter,
  MateVerificationExpansion,
  MateVerificationResult,
} from './types.mts'

export type DevelopmentVerificationCacheStats = {
  readonly expansionHits: number
  readonly expansionMisses: number
  readonly positionKeyHits: number
  readonly positionKeyMisses: number
  readonly rootResultHits: number
  readonly rootResultMisses: number
}

export type ProductionTransitionCacheStats = {
  readonly diskHits: number
  readonly memoryHits: number
  readonly misses: number
}

export type MateDevelopmentFingerprints = {
  readonly engine: string
  readonly policy: string
}

const CACHE_SCHEMA_VERSION = 'mate-development-cache-v2'

/**
 * Generic policy cache shared by every mate verifier. Position keys survive
 * policy edits; expansions and root results are isolated by policy fingerprint.
 */
export class DevelopmentVerificationCache<State>
{
  private readonly database: DatabaseSync
  private readonly expansionMemory = new Map<
    string,
    MateVerificationExpansion<State>
  >()
  private expansionHits = 0
  private expansionMisses = 0
  private readonly positionKeyMemory = new Map<string, string>()
  private positionKeyHits = 0
  private positionKeyMisses = 0
  private readonly rootResultMemory = new Map<string, MateVerificationResult>()
  private rootResultHits = 0
  private rootResultMisses = 0
  private readonly policyFingerprint: string
  private readonly positionFingerprint: string
  private readonly source: MateVerificationAdapter<State>

  constructor(
    cachePath: string,
    positionFingerprint: string,
    policyFingerprint: string,
    source: MateVerificationAdapter<State>,
  ) {
    this.positionFingerprint = positionFingerprint
    this.policyFingerprint = policyFingerprint
    this.source = source
    mkdirSync(dirname(cachePath), { recursive: true })
    this.database = openDatabase(cachePath)
  }

  adapter(): MateVerificationAdapter<State> {
    return {
      expand: (state) => this.expand(state),
      key: (state) => this.positionKey(state),
      render: this.source.render,
    }
  }

  close(): void {
    this.database.close()
  }

  get(
    policyFingerprint: string,
    rootKey: string,
  ): MateVerificationResult | undefined {
    const memoryKey = `${policyFingerprint}\u0000${rootKey}`
    const memory = this.rootResultMemory.get(memoryKey)
    if (memory !== undefined) {
      this.rootResultHits += 1
      return memory
    }
    const row = this.database
      .prepare(
        `SELECT payload FROM root_results
         WHERE position_fingerprint = ? AND policy_fingerprint = ?
           AND root_key = ?`,
      )
      .get(this.positionFingerprint, policyFingerprint, rootKey) as
      | { payload: string }
      | undefined
    const disk = parseJson<MateVerificationResult>(row?.payload)
    if (disk !== undefined) {
      this.rootResultHits += 1
      this.rootResultMemory.set(memoryKey, disk)
      return disk
    }
    if (row !== undefined) {
      this.database
        .prepare(
          `DELETE FROM root_results
           WHERE position_fingerprint = ? AND policy_fingerprint = ?
             AND root_key = ?`,
        )
        .run(this.positionFingerprint, policyFingerprint, rootKey)
    }
    this.rootResultMisses += 1
    return undefined
  }

  set(
    policyFingerprint: string,
    rootKey: string,
    result: MateVerificationResult,
  ): void {
    this.database
      .prepare(
        `INSERT OR REPLACE INTO root_results
         (position_fingerprint, policy_fingerprint, root_key, payload)
         VALUES (?, ?, ?, ?)`,
      )
      .run(
        this.positionFingerprint,
        policyFingerprint,
        rootKey,
        JSON.stringify(result),
      )
    this.rootResultMemory.set(
      `${policyFingerprint}\u0000${rootKey}`,
      result,
    )
  }

  stats(): DevelopmentVerificationCacheStats {
    return {
      expansionHits: this.expansionHits,
      expansionMisses: this.expansionMisses,
      positionKeyHits: this.positionKeyHits,
      positionKeyMisses: this.positionKeyMisses,
      rootResultHits: this.rootResultHits,
      rootResultMisses: this.rootResultMisses,
    }
  }

  private expand(state: State): MateVerificationExpansion<State> {
    const stateKey = this.source.render(state)
    const memoryKey = `${this.policyFingerprint}\u0000${stateKey}`
    const memory = this.expansionMemory.get(memoryKey)
    if (memory !== undefined) {
      this.expansionHits += 1
      return memory
    }
    const row = this.database
      .prepare(
        `SELECT payload FROM policy_expansions
         WHERE position_fingerprint = ? AND policy_fingerprint = ?
           AND state_key = ?`,
      )
      .get(
        this.positionFingerprint,
        this.policyFingerprint,
        stateKey,
      ) as { payload: string } | undefined
    const disk = parseJson<MateVerificationExpansion<State>>(row?.payload)
    if (disk !== undefined) {
      this.expansionHits += 1
      this.expansionMemory.set(memoryKey, disk)
      return disk
    }
    if (row !== undefined) {
      this.database
        .prepare(
          `DELETE FROM policy_expansions
           WHERE position_fingerprint = ? AND policy_fingerprint = ?
             AND state_key = ?`,
        )
        .run(
          this.positionFingerprint,
          this.policyFingerprint,
          stateKey,
        )
    }
    this.expansionMisses += 1
    const expansion = this.source.expand(state)
    this.database
      .prepare(
        `INSERT OR REPLACE INTO policy_expansions
         (position_fingerprint, policy_fingerprint, state_key, payload)
         VALUES (?, ?, ?, ?)`,
      )
      .run(
        this.positionFingerprint,
        this.policyFingerprint,
        stateKey,
        JSON.stringify(expansion),
      )
    this.expansionMemory.set(memoryKey, expansion)
    return expansion
  }

  private positionKey(state: State): string {
    const stateKey = this.source.render(state)
    const memory = this.positionKeyMemory.get(stateKey)
    if (memory !== undefined) {
      this.positionKeyHits += 1
      return memory
    }
    const row = this.database
      .prepare(
        `SELECT position_key FROM position_keys
         WHERE position_fingerprint = ? AND state_key = ?`,
      )
      .get(this.positionFingerprint, stateKey) as
      | { position_key: string }
      | undefined
    if (row !== undefined) {
      this.positionKeyHits += 1
      this.positionKeyMemory.set(stateKey, row.position_key)
      return row.position_key
    }
    this.positionKeyMisses += 1
    const key = this.source.key(state)
    this.database
      .prepare(
        `INSERT OR REPLACE INTO position_keys
         (position_fingerprint, state_key, position_key)
         VALUES (?, ?, ?)`,
      )
      .run(this.positionFingerprint, stateKey, key)
    this.positionKeyMemory.set(stateKey, key)
    return key
  }
}

/** Caches immutable legal transitions independently from teaching policy. */
export class PersistentProductionTransitionCache
  implements ProductionMateTransitionCache
{
  private readonly database: DatabaseSync
  private diskHits = 0
  private readonly memory = new Map<
    string,
    readonly ProductionLegalTransition[]
  >()
  private memoryHits = 0
  private misses = 0
  private readonly engineFingerprint: string

  constructor(
    cachePath: string,
    engineFingerprint: string,
  ) {
    this.engineFingerprint = engineFingerprint
    mkdirSync(dirname(cachePath), { recursive: true })
    this.database = openDatabase(cachePath)
  }

  close(): void {
    this.database.close()
  }

  getLegalTransitions(
    mateId: MateId,
    state: string,
    compute: () => readonly ProductionLegalTransition[],
  ): readonly ProductionLegalTransition[] {
    const memoryKey = `${mateId}\u0000${state}`
    const memory = this.memory.get(memoryKey)
    if (memory !== undefined) {
      this.memoryHits += 1
      return memory
    }
    const row = this.database
      .prepare(
        `SELECT payload FROM board_transitions
         WHERE engine_fingerprint = ? AND mate_id = ? AND state_key = ?`,
      )
      .get(this.engineFingerprint, mateId, state) as
      | { payload: string }
      | undefined
    const disk = parseJson<readonly ProductionLegalTransition[]>(
      row?.payload,
    )
    if (disk !== undefined) {
      this.diskHits += 1
      this.memory.set(memoryKey, disk)
      return disk
    }
    if (row !== undefined) {
      this.database
        .prepare(
          `DELETE FROM board_transitions
           WHERE engine_fingerprint = ? AND mate_id = ? AND state_key = ?`,
        )
        .run(this.engineFingerprint, mateId, state)
    }
    this.misses += 1
    const transitions = compute()
    this.database
      .prepare(
        `INSERT OR REPLACE INTO board_transitions
         (engine_fingerprint, mate_id, state_key, payload)
         VALUES (?, ?, ?, ?)`,
      )
      .run(
        this.engineFingerprint,
        mateId,
        state,
        JSON.stringify(transitions),
      )
    this.memory.set(memoryKey, transitions)
    return transitions
  }

  stats(): ProductionTransitionCacheStats {
    return {
      diskHits: this.diskHits,
      memoryHits: this.memoryHits,
      misses: this.misses,
    }
  }
}

export function createTwoBishopsDevelopmentFingerprints(): MateDevelopmentFingerprints {
  const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
  const engine = hashSources(repositoryRoot, 'engine', [
    'app/package-lock.json',
    'app/src/mate/chess.ts',
    'app/src/mate/session.ts',
    'scripts/mate-verifier/development-cache.mts',
    'scripts/mate-verifier/production.mts',
    'scripts/mate-verifier/search.mts',
    'scripts/mate-verifier/types.mts',
  ])
  const policy = hashSources(
    repositoryRoot,
    `two-bishops-policy\u0000${engine}`,
    [
      'app/src/mate/MatePriorityGuide.tsx',
      'app/src/mate/rules/index.ts',
      'app/src/mate/rules/selection.ts',
      'app/src/mate/rules/twoBishops.ts',
      'app/src/mate/rules/twoBishopsGeometry.ts',
      'app/src/mate/rules/types.ts',
    ],
  )
  return { engine, policy }
}

export function createBishopKnightDevelopmentFingerprints(): MateDevelopmentFingerprints {
  const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
  const engine = hashSources(repositoryRoot, 'engine', [
    'app/package-lock.json',
    'app/src/mate/chess.ts',
    'app/src/mate/session.ts',
    'scripts/mate-verifier/development-cache.mts',
    'scripts/mate-verifier/production.mts',
    'scripts/mate-verifier/search.mts',
    'scripts/mate-verifier/types.mts',
  ])
  const policy = hashSources(
    repositoryRoot,
    `bishop-knight-policy\u0000${engine}`,
    [
      'app/src/mate/MatePriorityGuide.tsx',
      'app/src/mate/rules/bishopKnight.ts',
      'app/src/mate/rules/bishopKnightData.ts',
      'app/src/mate/rules/bishopKnightGeometry.ts',
      'app/src/mate/rules/bishopKnightKeySquare.ts',
      'app/src/mate/rules/bishopKnightLookup.ts',
      'app/src/mate/rules/bishopKnightStrategy.ts',
      'app/src/mate/rules/bishopKnightZoneX.ts',
      'app/src/mate/rules/index.ts',
      'app/src/mate/rules/selection.ts',
      'app/src/mate/rules/types.ts',
    ],
  )
  return { engine, policy }
}

export function defaultDevelopmentCachePath(): string {
  return fileURLToPath(
    new URL('../../tmp/mate-verifier-cache/development.sqlite', import.meta.url),
  )
}

function openDatabase(cachePath: string): DatabaseSync {
  const database = new DatabaseSync(cachePath)
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS position_keys (
      position_fingerprint TEXT NOT NULL,
      state_key TEXT NOT NULL,
      position_key TEXT NOT NULL,
      PRIMARY KEY (position_fingerprint, state_key)
    );
    CREATE TABLE IF NOT EXISTS policy_expansions (
      position_fingerprint TEXT NOT NULL,
      policy_fingerprint TEXT NOT NULL,
      state_key TEXT NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY (position_fingerprint, policy_fingerprint, state_key)
    );
    CREATE TABLE IF NOT EXISTS root_results (
      position_fingerprint TEXT NOT NULL,
      policy_fingerprint TEXT NOT NULL,
      root_key TEXT NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY (position_fingerprint, policy_fingerprint, root_key)
    );
    CREATE TABLE IF NOT EXISTS board_transitions (
      engine_fingerprint TEXT NOT NULL,
      mate_id TEXT NOT NULL,
      state_key TEXT NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY (engine_fingerprint, mate_id, state_key)
    );
  `)
  return database
}

function hashSources(
  repositoryRoot: string,
  namespace: string,
  paths: readonly string[],
): string {
  const hash = createHash('sha256')
  hash.update(CACHE_SCHEMA_VERSION)
  hash.update('\u0000')
  hash.update(namespace)
  for (const path of [...paths].sort()) {
    hash.update('\u0000')
    hash.update(path)
    hash.update('\u0000')
    hash.update(readFileSync(resolve(repositoryRoot, path)))
  }
  return hash.digest('hex')
}

function parseJson<Value>(value: string | undefined): Value | undefined {
  if (value === undefined) return undefined
  try {
    return JSON.parse(value) as Value
  } catch {
    return undefined
  }
}
