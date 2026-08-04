import {
  createTwoBishopsDevelopmentFingerprints,
  defaultDevelopmentCachePath,
  DevelopmentVerificationCache,
  PersistentProductionTransitionCache,
} from './development-cache.mts'
import { MatePolicySccSession } from './policy-scc.mts'
import {
  createProductionMateAdapter,
  type ProductionMateStateKeyMode,
  type ProductionMateVerificationState,
} from './production.mts'
import { sampleTwoBishopsRoots } from './two-bishops-root-sampler.mts'

const LOOP_LEADING_THRESHOLD = 30
const SAMPLE_SEED = 0x2b15_40cc
const SAMPLE_POOL_SIZE = 64

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
let lastReportedWhiteStates = 0
const session = new MatePolicySccSession<ProductionMateVerificationState>(
  policyCache.adapter(),
  {
    includeCycleWitnesses: false,
    onProgress: ({ queuedWhiteStates, roots, whiteStates }) => {
      if (whiteStates < lastReportedWhiteStates + 10_000) return
      lastReportedWhiteStates = whiteStates
      process.stderr.write(
        `census progress: ${whiteStates} expanded, ${queuedWhiteStates} seen, ${roots} sampled\n`,
      )
    },
    progressEvery: 10_000,
  },
)
process.stderr.write(
  `sampling ${SAMPLE_POOL_SIZE} fixed-seed D4-canonical positions\n`,
)
const sample = sampleTwoBishopsRoots(SAMPLE_POOL_SIZE, SAMPLE_SEED, [])
process.stderr.write('sampling complete; expanding policy closures\n')
const graphCache = {
  expansionHits: 0,
  expansionMisses: 0,
  graphNodeHits: 0,
  graphNodeMisses: 0,
  newEdges: 0,
  newRoots: 0,
  newStates: 0,
  requestedRoots: 0,
}
let sampledStartingPositions = 0
let finalRung: ReturnType<typeof session.extend> | undefined

try {
  for (const root of sample.roots) {
    sampledStartingPositions += 1
    const rung = session.extend([root])
    finalRung = rung
    for (const key of Object.keys(graphCache) as Array<keyof typeof graphCache>) {
      graphCache[key] += rung.cache[key]
    }
    if (
      rung.result.positionOutcomes.loopLeadingPositions >=
      LOOP_LEADING_THRESHOLD
    ) {
      break
    }
  }

  if (finalRung === undefined) {
    throw new Error('Two Bishops progress census sampled no positions')
  }
  const outcomes = finalRung.result.positionOutcomes
  const denominator =
    outcomes.loopLeadingPositions + outcomes.mateTerminatingPositions
  const thresholdReached =
    outcomes.loopLeadingPositions >= LOOP_LEADING_THRESHOLD

  console.log(
    JSON.stringify(
      {
        cache: {
          graph: graphCache,
          policy: policyCache.stats(),
          transitions: transitionCache.stats(),
        },
        completionShare:
          denominator === 0
            ? null
            : outcomes.mateTerminatingPositions / denominator,
        elapsedMs: Date.now() - startedAt,
        fingerprints: {
          engine: fingerprints.engine.slice(0, 16),
          policy: fingerprints.policy.slice(0, 16),
        },
        incompletePositions: 0,
        otherFailureLeadingPositions:
          outcomes.otherFailureLeadingPositions,
        sampledStartingPositions,
        seed: SAMPLE_SEED,
        structuralCycles: {
          cyclicPositions: finalRung.result.stats.cyclicStates,
          sccs: finalRung.result.stats.cyclicComponents,
        },
        threshold: LOOP_LEADING_THRESHOLD,
        thresholdReached,
        totalPositionsSeen: outcomes.totalPositions,
        x: outcomes.loopLeadingPositions,
        y: outcomes.mateTerminatingPositions,
      },
      null,
      2,
    ),
  )
  if (!thresholdReached) process.exitCode = 2
} finally {
  policyCache.close()
  transitionCache.close()
}
