import type { MateId } from '../types'
import { queenRuleSet, rookRuleSet } from './majorPieces'
import type {
  MateRuleSet,
  OrderedRule,
  RegisteredMateRuleSet,
  RuleDescription,
  RuleHelp,
  ScoredMove,
} from './types'

export {
  compareQueenBlackScores,
  compareQueenWhiteScores,
  compareRookBlackScores,
  compareRookWhiteScores,
  getEndgameReturnToPositionMoves,
  getIdealQueenBlackMoves,
  getIdealQueenWhiteMoves,
  getIdealRookBlackMoves,
  getIdealRookWhiteMoves,
  getMajorEndgamePhase,
  getQueenCageKingApproachDistance,
  getQueenCageKingApproachManhattanDistance,
  getQueenTwoSquareCage,
  queenRuleSet,
  queenWhiteRules,
  rookRuleSet,
  rookWhiteRules,
  scoreQueenBlackMove,
  scoreQueenWhiteMove,
  scoreRookBlackMove,
  scoreRookWhiteMove,
} from './majorPieces'
export type {
  QueenBlackMoveScore,
  QueenWhiteMoveScore,
  RookBlackMoveScore,
  RookWhiteMoveScore,
} from './majorPieces'

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

function selectCandidatesByRules<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
): CandidateSelection<Score> {
  let remaining = [...candidates]
  const eliminatedBy = new Map<ScoredMove<Score>, OrderedRule<Score>>()
  let lastEliminatingRule: OrderedRule<Score> | undefined

  for (const orderedRule of rules) {
    const applicable = remaining.filter((candidate) =>
      ruleApplies(orderedRule, candidate.score),
    )
    const first = applicable[0]
    if (!first) {
      continue
    }

    let best = first
    let tiedBest = [best]

    for (const candidate of applicable.slice(1)) {
      const comparison = orderedRule.compare(candidate.score, best.score)
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

  return {
    idealCandidates: remaining,
    eliminatedBy,
    lastEliminatingRule,
  }
}

function selectIdealCandidates<Score>(
  candidates: readonly ScoredMove<Score>[],
  rules: readonly OrderedRule<Score>[],
): readonly ScoredMove<Score>[] {
  return selectCandidatesByRules(candidates, rules).idealCandidates
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
    if (
      !ruleApplies(orderedRule, leftScore) ||
      !ruleApplies(orderedRule, rightScore)
    ) {
      continue
    }
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
    (orderedRule) =>
      ruleApplies(orderedRule, leftScore) &&
      ruleApplies(orderedRule, rightScore) &&
      orderedRule.compare(leftScore, rightScore) !== 0,
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
  const selection = selectCandidatesByRules(candidates, rules)
  if (selection.idealCandidates.length === 0) {
    return undefined
  }

  if (san !== undefined) {
    const played = findCandidateBySan(candidates, san)
    if (!played) {
      return undefined
    }
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

type MateRuleSetRegistration = {
  readonly registeredRuleSet: RegisteredMateRuleSet
}

const mateRuleSets = new Map<MateId, MateRuleSetRegistration>()
const builtInMateRuleSets = new Map<MateId, MateRuleSetRegistration>()

function snapshotRuleHelp(help: RuleHelp): RuleHelp {
  const noteBoards = Object.freeze(
    help.noteBoards.map((board) =>
      Object.freeze({
        id: board.id,
        title: board.title,
        caption: board.caption,
        ...(board.layout === undefined
          ? {}
          : { layout: Object.freeze({ ...board.layout }) }),
        pieces: Object.freeze(
          board.pieces.map((piece) => Object.freeze({ ...piece })),
        ),
        highlights: Object.freeze(
          board.highlights.map((highlight) =>
            Object.freeze({ ...highlight }),
          ),
        ),
        ...(board.arrows === undefined
          ? {}
          : {
              arrows: Object.freeze(
                board.arrows.map((arrow) => Object.freeze({ ...arrow })),
              ),
            }),
      }),
    ),
  )

  return Object.freeze({
    title: help.title,
    whiteIntro: help.whiteIntro,
    blackIntro: help.blackIntro,
    blackPriorities: Object.freeze([...help.blackPriorities]),
    notes: Object.freeze([...help.notes]),
    noteBoards,
  })
}

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
        applies: orderedRule.applies,
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

  return Object.freeze({
    id,
    phase,
    whiteMoves,
    blackCandidates,
    help: snapshotRuleHelp(help),
    whiteRuleDescriptions,
    idealWhiteMoves: (fen) =>
      selectIdealMoves(scoredWhiteMoves(fen), whiteRules),
    explainWhiteMove: (fen, san) =>
      describeRule(explainMove(scoredWhiteMoves(fen), whiteRules, san)),
    currentWhiteHint: (fen) =>
      describeRule(currentHint(scoredWhiteMoves(fen), whiteRules)),
  })
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

function registerBuiltInMateRuleSet<Score>(
  ruleSet: MateRuleSet<Score>,
): void {
  const registeredRuleSet = createRegisteredMateRuleSet(ruleSet)
  if (builtInMateRuleSets.has(registeredRuleSet.id)) {
    throw new Error(`Mate rules already registered as built-in: ${registeredRuleSet.id}`)
  }
  builtInMateRuleSets.set(registeredRuleSet.id, { registeredRuleSet })
}

export function getMateRuleSet(id: MateId): RegisteredMateRuleSet {
  const registration = mateRuleSets.get(id) ?? builtInMateRuleSets.get(id)
  if (!registration) {
    throw new Error(`Mate rules not registered: ${id}`)
  }
  return registration.registeredRuleSet
}

registerBuiltInMateRuleSet(queenRuleSet)
registerBuiltInMateRuleSet(rookRuleSet)
