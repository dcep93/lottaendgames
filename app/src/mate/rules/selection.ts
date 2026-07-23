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
    for (const subpriority of subpriorities) {
      const hasCompare = typeof subpriority.compare === 'function'
      const hasRank = typeof subpriority.rank === 'function'
      if (hasCompare && hasRank) {
        throw new Error(
          `rule ${orderedRule.id} subpriority must define compare or rank, not both`,
        )
      }
      if (!hasCompare && !hasRank) {
        throw new Error(
          `rule ${orderedRule.id} subpriority must define compare or rank`,
        )
      }
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
  compare: (left: Score, right: Score) => number,
  left: Score,
  right: Score,
): number {
  const result = compare(left, right)
  if (!Number.isFinite(result)) {
    throw new Error(
      `rule ${orderedRule.id} comparator returned non-finite result`,
    )
  }
  return result
}

function finiteRanks<Score>(
  orderedRule: OrderedRule<Score>,
  rank: (scores: readonly Score[]) => readonly number[],
  scores: readonly Score[],
): readonly number[] {
  const result = rank(scores)
  if (!Array.isArray(result)) {
    throw new Error(`rule ${orderedRule.id} rank must return an array`)
  }
  if (result.length !== scores.length) {
    throw new Error(
      `rule ${orderedRule.id} rank returned ${result.length} values for ${scores.length} scores`,
    )
  }
  const ranks = result.map((value, index) => {
    if (!Number.isFinite(value)) {
      throw new Error(
        `rule ${orderedRule.id} rank returned non-finite result at index ${index}`,
      )
    }
    return value
  })
  return Object.freeze(ranks)
}

function compareFiniteRanks(left: number, right: number): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function subpriorityPairComparison<Score>(
  orderedRule: OrderedRule<Score>,
  subpriority: RuleSubpriority<Score>,
  scores: readonly Score[],
): number {
  const rank = subpriority.rank
  if (rank) {
    const ranks = finiteRanks(orderedRule, rank, scores)
    return compareFiniteRanks(ranks[0]!, ranks[1]!)
  }
  return finiteComparison(
    orderedRule,
    subpriority.compare,
    scores[0]!,
    scores[1]!,
  )
}

/**
 * Ranks every score with no incoming strict loss ahead of defeated scores.
 * If a comparison cycle leaves no undefeated score, every score ties so a
 * later deterministic subpriority can resolve the group.
 */
export function rankUndefeatedScores<Score>(
  scores: readonly Score[],
  compare: (left: Score, right: Score) => number,
): readonly number[] {
  const defeated = scores.map(() => false)
  for (const [challengerIndex, challenger] of scores.entries()) {
    for (const [candidateIndex, candidate] of scores.entries()) {
      if (challengerIndex === candidateIndex) continue
      const comparison = compare(challenger, candidate)
      if (!Number.isFinite(comparison)) {
        throw new Error('undefeated comparator returned non-finite result')
      }
      if (comparison < 0) defeated[candidateIndex] = true
    }
  }
  const hasUndefeatedScore = defeated.some((isDefeated) => !isDefeated)
  return Object.freeze(
    defeated.map((isDefeated) =>
      hasUndefeatedScore && isDefeated ? 1 : 0,
    ),
  )
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

      let tiedBest: readonly ScoredMove<Score>[]
      const rank = subpriority.rank
      if (rank) {
        const ranks = finiteRanks(orderedRule, rank, scores)
        const bestRank = Math.min(...ranks)
        tiedBest = applicable.filter((_, index) => ranks[index] === bestRank)
      } else {
        let best = first
        const tied: ScoredMove<Score>[] = [best]
        for (const candidate of applicable.slice(1)) {
          const comparison = finiteComparison(
            orderedRule,
            subpriority.compare,
            candidate.score,
            best.score,
          )
          if (comparison < 0) {
            best = candidate
            tied.splice(0, tied.length, candidate)
          } else if (comparison === 0) {
            tied.push(candidate)
          }
        }
        tiedBest = tied
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
      const comparison = subpriorityPairComparison(
        orderedRule,
        subpriority,
        scores,
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
      if (subpriorityPairComparison(orderedRule, subpriority, scores) !== 0) {
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

/**
 * Keeps correctness guards exact while attributing an ideal move to a
 * board-visible teaching priority whenever one truthfully favors it over the
 * alternatives rejected by the guard.
 */
export function currentTeachingHint<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
  san?: string,
): OrderedRule<Score> | undefined {
  const selection = selectCandidatesByRules(candidates, rules)
  const decisiveRule = selection.lastEliminatingRule
  if (decisiveRule?.presentationRole !== 'guard') return decisiveRule

  const idealCandidates =
    san === undefined
      ? selection.idealCandidates
      : selection.idealCandidates.filter((candidate) => candidate.san === san)
  if (idealCandidates.length === 0) return decisiveRule
  const rejectedByGuard = candidates.filter(
    (candidate) =>
      selection.eliminatedBy.get(candidate)?.presentationRole === 'guard',
  )
  let best:
    | { readonly rule: OrderedRule<Score>; readonly support: number }
    | undefined

  for (const rule of rules) {
    if (rule.presentationRole === 'guard') continue
    let support = 0
    for (const ideal of idealCandidates) {
      for (const rejected of rejectedByGuard) {
        if (
          !ruleApplies(rule, ideal.score) ||
          !ruleApplies(rule, rejected.score)
        ) {
          continue
        }
        for (const subpriority of ruleSubpriorities(rule)) {
          const scores = Object.freeze([ideal.score, rejected.score])
          if (subpriority.when && !subpriority.when(scores)) continue
          const comparison = subpriorityPairComparison(
            rule,
            subpriority,
            scores,
          )
          if (comparison < 0) support += 1
          if (comparison !== 0) break
        }
      }
    }
    if (support > (best?.support ?? 0)) best = { rule, support }
  }
  return best?.rule
}
