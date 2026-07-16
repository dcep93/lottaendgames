import type { OrderedRule, RuleSubpriority, ScoredMove } from './types'

type CandidateSelection<Score> = {
  readonly idealCandidates: readonly ScoredMove<Score>[]
  readonly eliminatedBy: ReadonlyMap<ScoredMove<Score>, OrderedRule<Score>>
  readonly lastEliminatingRule: OrderedRule<Score> | undefined
}

function ruleApplies<Score>(
  orderedRule: OrderedRule<Score>,
  score: Score,
): boolean {
  return orderedRule.applies?.(score) ?? true
}

function ruleSubpriorities<Score>(
  orderedRule: OrderedRule<Score>,
): readonly RuleSubpriority<Score>[] {
  const { compare, subpriorities } = orderedRule
  if (compare && subpriorities) {
    throw new Error(
      `rule ${orderedRule.id} must define compare or subpriorities, not both`,
    )
  }
  if (subpriorities) {
    if (subpriorities.length === 0) {
      throw new Error(`rule ${orderedRule.id} subpriorities must not be empty`)
    }
    return subpriorities
  }
  if (!compare) {
    throw new Error(`rule ${orderedRule.id} must define compare or subpriorities`)
  }
  return [{ compare }]
}

function finiteComparison<Score>(
  orderedRule: OrderedRule<Score>,
  subpriority: RuleSubpriority<Score>,
  left: Score,
  right: Score,
): number {
  const result = subpriority.compare(left, right)
  if (!Number.isFinite(result)) {
    throw new Error(
      `rule ${orderedRule.id} comparator returned non-finite result`,
    )
  }
  return result
}

function immutableScores<Score>(
  candidates: readonly ScoredMove<Score>[],
): readonly Score[] {
  return Object.freeze(candidates.map(({ score }) => score))
}

function selectCandidatesByRules<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
): CandidateSelection<Score> {
  let remaining = [...candidates]
  const eliminatedBy = new Map<ScoredMove<Score>, OrderedRule<Score>>()
  let lastEliminatingRule: OrderedRule<Score> | undefined

  rulesLoop: for (const orderedRule of rules) {
    for (const subpriority of ruleSubpriorities(orderedRule)) {
      const applicable = remaining.filter((candidate) =>
        ruleApplies(orderedRule, candidate.score),
      )
      const first = applicable[0]
      if (!first) continue

      const scores = immutableScores(applicable)
      if (subpriority.when && !subpriority.when(scores)) continue

      let best = first
      let tiedBest = [best]
      for (const candidate of applicable.slice(1)) {
        const comparison = finiteComparison(
          orderedRule,
          subpriority,
          candidate.score,
          best.score,
        )
        if (comparison < 0) {
          best = candidate
          tiedBest = [candidate]
        } else if (comparison === 0) {
          tiedBest.push(candidate)
        }
      }

      const applicableSet = new Set(applicable)
      const tiedBestSet = new Set(tiedBest)
      remaining = remaining.filter((candidate) => {
        if (!applicableSet.has(candidate) || tiedBestSet.has(candidate)) {
          return true
        }
        eliminatedBy.set(candidate, orderedRule)
        lastEliminatingRule = orderedRule
        return false
      })
    }

    const stopWhenBest = orderedRule.stopWhenBest
    if (
      stopWhenBest &&
      remaining.length > 0 &&
      remaining.every((candidate) => stopWhenBest(candidate.score))
    ) {
      lastEliminatingRule = orderedRule
      break rulesLoop
    }
  }

  return { idealCandidates: remaining, eliminatedBy, lastEliminatingRule }
}

export function selectIdealMoves<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
): readonly string[] {
  return selectCandidatesByRules(candidates, rules).idealCandidates.map(
    ({ san }) => san,
  )
}

/**
 * Pair helpers resolve group predicates against exactly the supplied pair.
 * Batch selection resolves them once per current survivor group instead.
 */
export function compareScoresByRules<Score>(
  leftScore: Score,
  rightScore: Score,
  rules: readonly OrderedRule<Score>[],
): number {
  for (const orderedRule of rules) {
    if (
      !ruleApplies(orderedRule, leftScore) ||
      !ruleApplies(orderedRule, rightScore)
    ) {
      continue
    }
    for (const subpriority of ruleSubpriorities(orderedRule)) {
      const scores = Object.freeze([leftScore, rightScore])
      if (subpriority.when && !subpriority.when(scores)) continue
      const comparison = finiteComparison(
        orderedRule,
        subpriority,
        leftScore,
        rightScore,
      )
      if (comparison !== 0) return comparison
    }
    if (
      orderedRule.stopWhenBest?.(leftScore) &&
      orderedRule.stopWhenBest(rightScore)
    ) {
      return 0
    }
  }
  return 0
}

export function firstDifferingRule<Score>(
  leftScore: Score,
  rightScore: Score,
  rules: readonly OrderedRule<Score>[],
): OrderedRule<Score> | undefined {
  for (const orderedRule of rules) {
    if (
      !ruleApplies(orderedRule, leftScore) ||
      !ruleApplies(orderedRule, rightScore)
    ) {
      continue
    }
    for (const subpriority of ruleSubpriorities(orderedRule)) {
      const scores = Object.freeze([leftScore, rightScore])
      if (subpriority.when && !subpriority.when(scores)) continue
      if (
        finiteComparison(
          orderedRule,
          subpriority,
          leftScore,
          rightScore,
        ) !== 0
      ) {
        return orderedRule
      }
    }
    if (
      orderedRule.stopWhenBest?.(leftScore) &&
      orderedRule.stopWhenBest(rightScore)
    ) {
      return undefined
    }
  }
  return undefined
}

export function findCandidateBySan<Score>(
  candidates: readonly ScoredMove<Score>[],
  san: string,
): ScoredMove<Score> | undefined {
  return candidates.find((candidate) => candidate.san === san)
}

export function isMoveIdeal<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
  san: string,
): boolean {
  if (!findCandidateBySan(candidates, san)) return false
  return selectIdealMoves(candidates, rules).includes(san)
}

export function explainMove<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
  san?: string,
): OrderedRule<Score> | undefined {
  const selection = selectCandidatesByRules(candidates, rules)
  if (selection.idealCandidates.length === 0) return undefined

  if (san !== undefined) {
    const played = findCandidateBySan(candidates, san)
    if (!played) return undefined
    if (!selection.idealCandidates.includes(played)) {
      return selection.eliminatedBy.get(played)
    }
  }
  return selection.lastEliminatingRule
}

export function currentHint<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
): OrderedRule<Score> | undefined {
  return explainMove(candidates, rules)
}
