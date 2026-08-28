import { getMateRuleSet } from '../../app/src/mate/rules/index.ts'
import {
  createTwoBishopsDevelopmentFingerprints,
  defaultDevelopmentCachePath,
  DevelopmentVerificationCache,
  PersistentProductionTransitionCache,
} from './development-cache.mts'
import { PersistentExhaustiveProofCache } from './exhaustive-cache.mts'
import {
  createProductionMateAdapter,
  enumerateProductionMateRoots,
} from './production.mts'
import { verifyMateRoots } from './search.mts'
import type { MateVerificationRoot } from './types.mts'

const startedAtMs = Date.now()
const fingerprints = createTwoBishopsDevelopmentFingerprints()
const cachePath = defaultDevelopmentCachePath()
const positionFingerprint = `two-bishops:symmetry:${fingerprints.engine}`
const transitionCache = new PersistentProductionTransitionCache(
  cachePath,
  fingerprints.engine,
)
const productionAdapter = createProductionMateAdapter('two-bishops', {
  stateKeyMode: 'symmetry',
  transitionCache,
})
const policyCache = new DevelopmentVerificationCache(
  cachePath,
  positionFingerprint,
  fingerprints.policy,
  productionAdapter,
)
const proofCache = new PersistentExhaustiveProofCache(
  cachePath,
  positionFingerprint,
  fingerprints.policy,
)
const adapter = policyCache.adapter()
const rootStats = { canonical: 0 }

let result: ReturnType<typeof verifyMateRoots<string>>
try {
  result = verifyMateRoots(canonicalStandardRoots(), adapter, {
    onExpansion: (positionKey, expansion) => {
      if (expansion.ruleFilterCounts !== undefined) {
        proofCache.recordRuleFilterCounts(
          positionKey,
          expansion.ruleFilterCounts,
        )
      }
    },
    onProgress: (stats) => {
      console.error(
        `two-bishops exhaustive: ${rootStats.canonical} canonical roots, ` +
          `${stats.uniquePositions} new positions, ` +
          `${proofCache.stats().proofsStored} persisted proofs`,
      )
    },
    progressEvery: 10_000,
    proofCache,
  })
} finally {
  policyCache.close()
  transitionCache.close()
}

const failure = result.status === 'failed' ? result.failure : undefined
const localhostUrl = failure === undefined
  ? undefined
  : `http://localhost:5173/mate/two-bishops#${new URLSearchParams({
      cursor: '0',
      fen: failure.startingFen,
      moves: failure.moves.join(','),
    }).toString()}`
const reasonId = failure === undefined
  ? undefined
  : getMateRuleSet('two-bishops').currentWhiteHint(
      failure.startingFen,
    )?.id
const proofStats = proofCache.stats()
const ruleFilterCensus = proofCache.ruleFilterCensus()
proofCache.close()

console.log(JSON.stringify({
  certificate: {
    completeStandardUniverse: result.status === 'verified',
    stateKeyMode: 'symmetry',
    traversesAllLegalBlackReplies: true,
    traversesAllTiedBestWhiteMoves: true,
  },
  elapsedMs: Date.now() - startedAtMs,
  failure: failure === undefined
    ? null
    : {
        ...failure,
        localhostUrl,
        reasonId: reasonId ?? 'rule gap',
      },
  fingerprints: {
    engine: fingerprints.engine,
    policy: fingerprints.policy,
  },
  proofCache: proofStats,
  roots: rootStats,
  ruleFilterCensus,
  status: result.status,
  verification: result,
}, null, 2))

process.exitCode = result.status === 'verified'
  ? 0
  : result.status === 'failed'
    ? 1
    : 2

function* canonicalStandardRoots(): Generator<MateVerificationRoot<string>> {
  const seen = new Set<string>()
  for (const root of enumerateProductionMateRoots('two-bishops')) {
    const key = productionAdapter.key(root.state)
    if (seen.has(key)) continue
    seen.add(key)
    rootStats.canonical += 1
    yield root
  }
}
