import { readFileSync } from 'node:fs'
import { getChess, validateMatePosition } from '../../app/src/mate/chess.ts'
import { getMateRuleSet } from '../../app/src/mate/rules/index.ts'
import {
  createTwoBishopsDevelopmentFingerprints,
  defaultDevelopmentCachePath,
  DevelopmentVerificationCache,
  PersistentProductionTransitionCache,
} from './development-cache.mts'
import {
  canonicalVerifierPositionKey,
  createProductionMateAdapter,
  normalizeVerifierState,
  type ProductionMateStateKeyMode,
  type ProductionMateVerificationState,
} from './production.mts'
import { verifyMateRoots } from './search.mts'
import { sampleTwoBishopsRoots } from './two-bishops-root-sampler.mts'
import type {
  MateVerificationResult,
  MateVerificationRoot,
  MateVerificationStats,
} from './types.mts'

const DEVELOPMENT_ROOT_COUNT = 10
const DEVELOPMENT_SEED = 0x2b15_40cc
const MAX_NODES_PER_ROOT = 100_000
const SMOKE_ROOTS_URL = new URL(
  './two-bishops-smoke-roots.json',
  import.meta.url,
)

const startedAt = Date.now()
const stateKeyMode: ProductionMateStateKeyMode = 'symmetry'
const fingerprints = createTwoBishopsDevelopmentFingerprints()
const cachePath = defaultDevelopmentCachePath()
const transitionCache = new PersistentProductionTransitionCache(
  cachePath,
  fingerprints.engine,
)
const productionAdapter = createProductionMateAdapter('two-bishops', {
  stateKeyMode,
  transitionCache,
})
const policyCache = new DevelopmentVerificationCache(
  cachePath,
  `two-bishops:${stateKeyMode}:${fingerprints.engine}`,
  fingerprints.policy,
  productionAdapter,
)
const adapter = policyCache.adapter()
const roots = developmentGateRoots()
const aggregate: MateVerificationStats = {
  blackReplies: 0,
  maximumMatePlies: 0,
  provenRoots: 0,
  uniquePositions: 0,
  whiteChoices: 0,
}
let firstFailure: MateVerificationResult | undefined
let rootsAttempted = 0

try {
  for (const root of roots) {
    rootsAttempted += 1
    const rootKey = [
      adapter.key(root.state),
      root.halfmoveClock,
    ].join('\u0000')
    let result = policyCache.get(fingerprints.policy, rootKey)
    if (result === undefined) {
      result = verifyMateRoots([root], adapter, {
        maxNodes: MAX_NODES_PER_ROOT,
        progressEvery: 5_000,
      })
      if (result.status !== 'incomplete') {
        policyCache.set(fingerprints.policy, rootKey, result)
      }
    }
    mergeStats(aggregate, result.stats)
    if (result.status !== 'verified') {
      firstFailure = result
      break
    }
  }
} finally {
  policyCache.close()
  transitionCache.close()
}

const failure =
  firstFailure?.status === 'failed' ? firstFailure.failure : undefined
const reasonId =
  failure === undefined
    ? undefined
    : getMateRuleSet('two-bishops').currentWhiteHint(
        failure.startingFen,
      )?.id
const localhostUrl =
  failure === undefined
    ? undefined
    : `http://localhost:5173/mate/two-bishops#${new URLSearchParams({
        cursor: '0',
        fen: failure.startingFen,
        moves: failure.moves.join(','),
      }).toString()}`

console.log(
  JSON.stringify(
    {
      cache: {
        policy: policyCache.stats(),
        transitions: transitionCache.stats(),
      },
      elapsedMs: Date.now() - startedAt,
      fingerprints: {
        engine: fingerprints.engine.slice(0, 16),
        policy: fingerprints.policy.slice(0, 16),
      },
      firstFailure:
        firstFailure === undefined
          ? null
          : firstFailure.status === 'failed'
            ? {
                ...firstFailure.failure,
                localhostUrl,
                reasonId: reasonId ?? 'rule gap',
              }
            : {
                kind: 'incomplete',
                message:
                  firstFailure.status === 'incomplete'
                    ? firstFailure.message
                    : 'Unexpected verified result',
              },
      rootsAttempted,
      rootsCompleted: aggregate.provenRoots,
      rootSelection: {
        developmentRoots: DEVELOPMENT_ROOT_COUNT,
        seed: DEVELOPMENT_SEED,
        smokeRoots: roots.length - DEVELOPMENT_ROOT_COUNT,
        total: roots.length,
      },
      stats: aggregate,
      status:
        firstFailure === undefined
          ? 'passed'
          : firstFailure.status === 'failed'
            ? 'failed'
            : 'incomplete',
    },
    null,
    2,
  ),
)

process.exitCode =
  firstFailure === undefined
    ? 0
    : firstFailure.status === 'failed'
      ? 1
      : 2

function developmentGateRoots(): readonly MateVerificationRoot<ProductionMateVerificationState>[] {
  const smokeFens = parseSmokeRoots()
  const randomRoots = sampleTwoBishopsRoots(
    DEVELOPMENT_ROOT_COUNT,
    DEVELOPMENT_SEED,
    [],
  ).roots
  const seen = new Set<string>()
  const roots: MateVerificationRoot<string>[] = []
  const add = (root: MateVerificationRoot<string>): void => {
    const key = canonicalVerifierPositionKey('two-bishops', root.state)
    if (seen.has(key)) return
    seen.add(key)
    roots.push(root)
  }
  for (const [index, fen] of smokeFens.entries()) {
    const canonicalFen = getChess(fen).fen()
    if (!validateMatePosition('two-bishops', canonicalFen).ok) {
      throw new Error(
        `Invalid Two Bishops smoke root ${index + 1}: ${fen}`,
      )
    }
    add({
      fen: canonicalFen,
      halfmoveClock: Number(canonicalFen.split(' ')[4] ?? 0),
      source: `essential smoke witness ${index + 1}`,
      state: normalizeVerifierState(canonicalFen),
    })
  }
  for (const root of randomRoots) add(root)
  if (roots.length !== smokeFens.length + DEVELOPMENT_ROOT_COUNT) {
    throw new Error('Development and smoke roots must be D4-distinct')
  }
  return roots
}

function parseSmokeRoots(): readonly string[] {
  const parsed: unknown = JSON.parse(readFileSync(SMOKE_ROOTS_URL, 'utf8'))
  if (
    !Array.isArray(parsed) ||
    parsed.some((value) => typeof value !== 'string')
  ) {
    throw new Error('Two Bishops smoke roots must be a JSON string array')
  }
  return parsed
}

function mergeStats(
  aggregate: MateVerificationStats,
  root: MateVerificationStats,
): void {
  aggregate.blackReplies += root.blackReplies
  aggregate.maximumMatePlies = Math.max(
    aggregate.maximumMatePlies,
    root.maximumMatePlies,
  )
  aggregate.provenRoots += root.provenRoots
  aggregate.uniquePositions += root.uniquePositions
  aggregate.whiteChoices += root.whiteChoices
}
