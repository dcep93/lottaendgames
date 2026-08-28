import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type {
  MateNodeProof,
  MateVerificationProofCache,
} from './types.mts'

export type RuleFilterCensusEntry = {
  readonly eliminatedMoves: number
  readonly positionsAffected: number
}

export type ExhaustiveProofCacheStats = {
  readonly proofHits: number
  readonly proofMisses: number
  readonly proofsStored: number
}

export class PersistentExhaustiveProofCache
  implements MateVerificationProofCache
{
  private readonly database: DatabaseSync
  private readonly memory = new Map<string, MateNodeProof>()
  private proofHits = 0
  private proofMisses = 0
  private readonly policyFingerprint: string
  private readonly positionFingerprint: string

  constructor(
    cachePath: string,
    positionFingerprint: string,
    policyFingerprint: string,
  ) {
    this.positionFingerprint = positionFingerprint
    this.policyFingerprint = policyFingerprint
    mkdirSync(dirname(cachePath), { recursive: true })
    this.database = new DatabaseSync(cachePath)
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      CREATE TABLE IF NOT EXISTS exhaustive_policy_proofs (
        position_fingerprint TEXT NOT NULL,
        policy_fingerprint TEXT NOT NULL,
        position_key TEXT NOT NULL,
        maximum_mate_plies INTEGER NOT NULL,
        safe_incoming_halfmove_clock INTEGER NOT NULL,
        PRIMARY KEY (
          position_fingerprint,
          policy_fingerprint,
          position_key
        )
      );
      CREATE TABLE IF NOT EXISTS exhaustive_rule_filter_census (
        position_fingerprint TEXT NOT NULL,
        policy_fingerprint TEXT NOT NULL,
        position_key TEXT NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (
          position_fingerprint,
          policy_fingerprint,
          position_key
        )
      );
    `)
  }

  get(positionKey: string): MateNodeProof | undefined {
    const memory = this.memory.get(positionKey)
    if (memory !== undefined) {
      this.proofHits += 1
      return memory
    }
    const row = this.database.prepare(
      `SELECT maximum_mate_plies, safe_incoming_halfmove_clock
       FROM exhaustive_policy_proofs
       WHERE position_fingerprint = ? AND policy_fingerprint = ?
         AND position_key = ?`,
    ).get(
      this.positionFingerprint,
      this.policyFingerprint,
      positionKey,
    ) as {
      maximum_mate_plies: number
      safe_incoming_halfmove_clock: number
    } | undefined
    if (row === undefined) {
      this.proofMisses += 1
      return undefined
    }
    const proof = {
      maximumMatePlies: row.maximum_mate_plies,
      safeIncomingHalfmoveClock: row.safe_incoming_halfmove_clock,
    }
    this.memory.set(positionKey, proof)
    this.proofHits += 1
    return proof
  }

  set(positionKey: string, proof: MateNodeProof): void {
    this.database.prepare(
      `INSERT OR IGNORE INTO exhaustive_policy_proofs
       (position_fingerprint, policy_fingerprint, position_key,
        maximum_mate_plies, safe_incoming_halfmove_clock)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      this.positionFingerprint,
      this.policyFingerprint,
      positionKey,
      proof.maximumMatePlies,
      proof.safeIncomingHalfmoveClock,
    )
    this.memory.set(positionKey, proof)
  }

  recordRuleFilterCounts(
    positionKey: string,
    counts: Readonly<Record<string, number>>,
  ): void {
    this.database.prepare(
      `INSERT OR IGNORE INTO exhaustive_rule_filter_census
       (position_fingerprint, policy_fingerprint, position_key, payload)
       VALUES (?, ?, ?, ?)`,
    ).run(
      this.positionFingerprint,
      this.policyFingerprint,
      positionKey,
      JSON.stringify(counts),
    )
  }

  ruleFilterCensus(): Readonly<Record<string, RuleFilterCensusEntry>> {
    const totals: Record<string, {
      eliminatedMoves: number
      positionsAffected: number
    }> = {}
    const rows = this.database.prepare(
      `SELECT payload FROM exhaustive_rule_filter_census
       WHERE position_fingerprint = ? AND policy_fingerprint = ?`,
    ).all(this.positionFingerprint, this.policyFingerprint) as {
      payload: string
    }[]
    for (const row of rows) {
      const counts = JSON.parse(row.payload) as Record<string, number>
      for (const [ruleId, eliminatedMoves] of Object.entries(counts)) {
        const total = totals[ruleId] ??= {
          eliminatedMoves: 0,
          positionsAffected: 0,
        }
        total.eliminatedMoves += eliminatedMoves
        if (eliminatedMoves > 0) total.positionsAffected += 1
      }
    }
    return totals
  }

  stats(): ExhaustiveProofCacheStats {
    const row = this.database.prepare(
      `SELECT COUNT(*) AS count FROM exhaustive_policy_proofs
       WHERE position_fingerprint = ? AND policy_fingerprint = ?`,
    ).get(this.positionFingerprint, this.policyFingerprint) as { count: number }
    return {
      proofHits: this.proofHits,
      proofMisses: this.proofMisses,
      proofsStored: row.count,
    }
  }

  close(): void {
    this.database.close()
  }
}
