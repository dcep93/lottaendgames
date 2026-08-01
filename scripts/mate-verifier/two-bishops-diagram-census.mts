import {
  createProductionMateAdapter,
  enumerateProductionMateRoots,
  type ProductionMateVerificationState,
} from './production.mts'
import type {
  MateVerificationAdapter,
  MateVerificationExpansion,
  MateVerificationRoot,
} from './types.mts'

export type TwoBishopsDiagramCandidate = {
  readonly canonicalFen: string
  readonly canonicalKey: string
  readonly observations: number
}

export type TwoBishopsDiagramCensus = {
  readonly expandedPositions: number
  readonly observations: number
  readonly positions: ReadonlyMap<string, TwoBishopsDiagramCandidate>
  readonly roots: number
}

export type PolicyCensusProgress = {
  readonly expandedPositions: number
  readonly observations: number
  readonly roots: number
}

export function collectPolicyGraphObservations<State>(
  roots: Iterable<MateVerificationRoot<State>>,
  adapter: MateVerificationAdapter<State>,
  options: {
    readonly maxRoots?: number
    readonly onProgress?: (progress: PolicyCensusProgress) => void
    readonly progressEvery?: number
  } = {},
): TwoBishopsDiagramCensus {
  const expansions = new Map<string, MateVerificationExpansion<State>>()
  const positions = new Map<string, TwoBishopsDiagramCandidate>()
  const progressEvery = Math.max(1, options.progressEvery ?? 250)
  let observations = 0
  let rootCount = 0
  let nextProgress = progressEvery

  const increment = (state: State): string => {
    const canonicalKey = adapter.key(state)
    const previous = positions.get(canonicalKey)
    positions.set(canonicalKey, {
      canonicalFen: canonicalFen(canonicalKey),
      canonicalKey,
      observations: (previous?.observations ?? 0) + 1,
    })
    observations += 1
    return canonicalKey
  }

  const expansionFor = (
    state: State,
    key: string,
  ): MateVerificationExpansion<State> => {
    const cached = expansions.get(key)
    if (cached) return cached
    const expansion = adapter.expand(state)
    expansions.set(key, expansion)
    if (expansions.size >= nextProgress) {
      nextProgress += progressEvery
      options.onProgress?.({
        expandedPositions: expansions.size,
        observations,
        roots: rootCount,
      })
    }
    return expansion
  }

  const incrementChildren = (state: State, key: string): void => {
    for (const branch of expansionFor(state, key).branches) {
      if (branch.kind === 'continue') increment(branch.next)
    }
  }

  const expandNew = (state: State, key: string): void => {
    const expansion = expansionFor(state, key)
    for (const branch of expansion.branches) {
      if (branch.kind !== 'continue') continue
      const childKey = increment(branch.next)
      if (expansions.has(childKey)) {
        incrementChildren(branch.next, childKey)
      } else {
        expandNew(branch.next, childKey)
      }
    }
  }

  for (const root of roots) {
    if (options.maxRoots !== undefined && rootCount >= options.maxRoots) break
    rootCount += 1
    const rootKey = increment(root.state)
    if (expansions.has(rootKey)) {
      incrementChildren(root.state, rootKey)
    } else {
      expandNew(root.state, rootKey)
    }
  }

  options.onProgress?.({
    expandedPositions: expansions.size,
    observations,
    roots: rootCount,
  })
  return {
    expandedPositions: expansions.size,
    observations,
    positions,
    roots: rootCount,
  }
}

export function selectMostCommonRulePositions(
  positions: Iterable<TwoBishopsDiagramCandidate>,
  targetRuleIds: readonly string[],
  activeRuleId: (fen: string) => string | undefined,
  onClassified?: (classified: number) => void,
): ReadonlyMap<string, TwoBishopsDiagramCandidate> {
  const targets = new Set(targetRuleIds)
  const selected = new Map<string, TwoBishopsDiagramCandidate>()
  const ordered = [...positions].sort(
    (left, right) =>
      right.observations - left.observations ||
      left.canonicalKey.localeCompare(right.canonicalKey),
  )

  let classified = 0
  for (const candidate of ordered) {
    const ruleId = activeRuleId(candidate.canonicalFen)
    classified += 1
    onClassified?.(classified)
    if (ruleId && targets.has(ruleId) && !selected.has(ruleId)) {
      selected.set(ruleId, candidate)
      if (selected.size === targets.size) break
    }
  }
  return selected
}

export function createTwoBishopsDiagramCensus({
  maxRoots,
  onProgress,
}: {
  readonly maxRoots: number
  readonly onProgress?: (progress: PolicyCensusProgress) => void
}): TwoBishopsDiagramCensus {
  return collectPolicyGraphObservations<ProductionMateVerificationState>(
    enumerateProductionMateRoots('two-bishops'),
    createProductionMateAdapter('two-bishops'),
    { maxRoots, onProgress },
  )
}

function canonicalFen(canonicalKey: string): string {
  return `${canonicalKey} 0 1`
}
