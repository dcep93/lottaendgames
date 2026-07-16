import type { MateId } from '../types'
import type {
  MateRuleSet,
  OrderedRule,
  RegisteredMateRuleSet,
  RuleDescription,
  ScoredMove,
} from './types'

export type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RegisteredMateRuleSet,
  RuleDescription,
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

export function compareScoresByRules<Score>(
  leftScore: Score,
  rightScore: Score,
  rules: readonly OrderedRule<Score>[],
): number {
  for (const orderedRule of rules) {
    const comparison = orderedRule.compare(leftScore, rightScore)
    if (comparison !== 0) {
      return comparison
    }
  }

  return 0
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

  const nonIdealCandidates = candidates.filter(
    (candidate) => !idealCandidates.includes(candidate),
  )
  let closestNonIdeal = nonIdealCandidates[0]
  if (!closestNonIdeal) {
    return undefined
  }

  for (const candidate of nonIdealCandidates.slice(1)) {
    if (
      compareScoresByRules(candidate.score, closestNonIdeal.score, rules) < 0
    ) {
      closestNonIdeal = candidate
    }
  }

  return firstDifferingRule(best.score, closestNonIdeal.score, rules)
}

export function currentHint<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
): OrderedRule<Score> | undefined {
  return explainMove(candidates, rules)
}

type MateRuleSetRegistration = {
  readonly registeredRuleSet: RegisteredMateRuleSet
}

const mateRuleSets = new Map<MateId, MateRuleSetRegistration>()

function createRegisteredMateRuleSet<Score>(
  ruleSet: MateRuleSet<Score>,
): RegisteredMateRuleSet {
  const { id, phase, scoreWhite, whiteMoves, blackCandidates, help } = ruleSet
  const whiteRules = Object.freeze(
    ruleSet.whiteRules.map((orderedRule) =>
      Object.freeze({
        id: orderedRule.id,
        shortLabel: orderedRule.shortLabel,
        helpText: orderedRule.helpText,
        compare: orderedRule.compare,
      }),
    ),
  )
  const ruleEntries = Object.freeze(
    whiteRules.map((orderedRule) => ({
      orderedRule,
      description: Object.freeze({
        id: orderedRule.id,
        shortLabel: orderedRule.shortLabel,
        helpText: orderedRule.helpText,
      }),
    })),
  )
  const whiteRuleDescriptions = Object.freeze(
    ruleEntries.map(({ description }) => description),
  )
  const scoredWhiteMoves = (fen: string): readonly ScoredMove<Score>[] =>
    whiteMoves(fen).map((san) => ({
      san,
      score: scoreWhite(fen, san),
    }))
  const describeRule = (
    orderedRule: OrderedRule<Score> | undefined,
  ): RuleDescription | undefined =>
    ruleEntries.find((entry) => entry.orderedRule === orderedRule)?.description

  return {
    id,
    phase: (fen) => phase(fen),
    whiteMoves: (fen) => whiteMoves(fen),
    blackCandidates: (fen, previousTurnFen) =>
      blackCandidates(fen, previousTurnFen),
    help,
    whiteRuleDescriptions,
    idealWhiteMoves: (fen) =>
      selectIdealMoves(scoredWhiteMoves(fen), whiteRules),
    explainWhiteMove: (fen, san) =>
      describeRule(explainMove(scoredWhiteMoves(fen), whiteRules, san)),
    currentWhiteHint: (fen) =>
      describeRule(currentHint(scoredWhiteMoves(fen), whiteRules)),
  }
}

export function registerMateRuleSet<Score>(
  ruleSet: MateRuleSet<Score>,
): () => void {
  const registeredRuleSet = createRegisteredMateRuleSet(ruleSet)
  const id = registeredRuleSet.id
  const registration = {
    registeredRuleSet,
  }
  mateRuleSets.set(id, registration)

  return () => {
    if (mateRuleSets.get(id) === registration) {
      mateRuleSets.delete(id)
    }
  }
}

export function getMateRuleSet(id: MateId): RegisteredMateRuleSet {
  const registration = mateRuleSets.get(id)
  if (!registration) {
    throw new Error(`Mate rules not registered: ${id}`)
  }
  return registration.registeredRuleSet
}
