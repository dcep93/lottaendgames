import type { MateId } from '../types'
import type { MateRuleSet, OrderedRule, ScoredMove } from './types'

export type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  RuleNoteBoard,
  RuleNoteBoardArrow,
  RuleNoteBoardHighlight,
  RuleNoteBoardLayout,
  RuleNoteBoardPiece,
  ScoredMove,
} from './types'

function selectIdealCandidates<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
): readonly ScoredMove<Score>[] {
  let remaining = [...candidates]

  for (const orderedRule of rules) {
    const first = remaining[0]
    if (!first) {
      break
    }

    let best = first
    let tiedBest = [best]

    for (const candidate of remaining.slice(1)) {
      const comparison = orderedRule.compare(candidate.score, best.score)
      if (comparison < 0) {
        best = candidate
        tiedBest = [candidate]
      } else if (comparison === 0) {
        tiedBest.push(candidate)
      }
    }

    remaining = tiedBest
  }

  return remaining
}

export function selectIdealMoves<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
): readonly string[] {
  return selectIdealCandidates(candidates, rules).map(({ san }) => san)
}

export function firstDifferingRule<Score>(
  leftScore: Score,
  rightScore: Score,
  rules: readonly OrderedRule<Score>[],
): OrderedRule<Score> | undefined {
  return rules.find(
    (orderedRule) => orderedRule.compare(leftScore, rightScore) !== 0,
  )
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
  if (!findCandidateBySan(candidates, san)) {
    return false
  }

  return selectIdealMoves(candidates, rules).includes(san)
}

export function explainMove<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
  san?: string,
): OrderedRule<Score> | undefined {
  const idealCandidates = selectIdealCandidates(candidates, rules)
  const best = idealCandidates[0]
  if (!best) {
    return undefined
  }

  if (san !== undefined) {
    const played = findCandidateBySan(candidates, san)
    if (!played) {
      return undefined
    }
    if (!idealCandidates.includes(played)) {
      return firstDifferingRule(best.score, played.score, rules)
    }
  }

  const firstNonIdeal = candidates.find(
    (candidate) => !idealCandidates.includes(candidate),
  )
  if (!firstNonIdeal) {
    return undefined
  }

  return firstDifferingRule(best.score, firstNonIdeal.score, rules)
}

export function currentHint<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
): OrderedRule<Score> | undefined {
  return explainMove(candidates, rules)
}

const mateRuleSets = new Map<MateId, MateRuleSet<unknown>>()

export function registerMateRuleSet<Score>(ruleSet: MateRuleSet<Score>): void {
  // This is the registry's only type-erasure boundary. A score producer and its
  // matching rules remain bundled in the same rule-set contract at runtime.
  mateRuleSets.set(ruleSet.id, ruleSet as unknown as MateRuleSet<unknown>)
}

export function getMateRuleSet(id: MateId): MateRuleSet<unknown> {
  const ruleSet = mateRuleSets.get(id)
  if (!ruleSet) {
    throw new Error(`Mate rules not registered: ${id}`)
  }
  return ruleSet
}
