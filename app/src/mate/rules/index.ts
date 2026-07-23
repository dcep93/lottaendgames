import type { MateId } from '../types'
import { bishopKnightRuleSet } from './bishopKnight'
import { queenRuleSet, rookRuleSet } from './majorPieces'
import {
  currentTeachingHint,
  explainMove,
  selectIdealMoves,
} from './selection'
import { twoBishopsRuleSet } from './twoBishops'
import { twoKnightsPawnRuleSet } from './twoKnightsPawn'
import type {
  MateRuleSet,
  OrderedRule,
  RegisteredMateRuleSet,
  RuleDescription,
  RuleHelp,
  ScoredMove,
  WhiteMoveOverride,
} from './types'

export {
  compareScoresByRules,
  currentHint,
  currentTeachingHint,
  explainMove,
  findCandidateBySan,
  firstDifferingRule,
  isMoveIdeal,
  rankUndefeatedScores,
  selectIdealMoves,
} from './selection'

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

export {
  getRookBox,
  getRookBoxFromFen,
  getRookCuts,
  isQueenRankOrFileChannelBetween,
} from './majorPieceGeometry'
export type { RookAxis, RookBox, RookCut } from './majorPieceGeometry'

export {
  bishopKnightRuleSet,
  compareKnightAndBishopBlackScores,
  compareKnightAndBishopWhiteScores,
  getIdealKnightAndBishopWhiteMoves,
  getKnightAndBishopEstablishedZoneXKnightRouteTarget,
  getKnightAndBishopKeySquarePatternScore,
  getKnightAndBishopLookupEntryResultFen,
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopOpponentCandidates,
  getKnightAndBishopPhaseLabel,
  getKnightAndBishopZone5,
  getKnightAndBishopZoneXKnightDriftTarget,
  getKnightAndBishopZoneXSetup,
  isKnightAndBishopLookupPhasePosition,
  isKnightAndBishopMatingNetWhiteTurnPosition,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopBlackHasLookupReply,
  knightAndBishopWhiteMoveForcesZone5,
  knightAndBishopWhiteMoveReachesLookupPath,
  knightAndBishopWhiteRules,
  scoreKnightAndBishopOpponentPosition,
  scoreKnightAndBishopWhiteMove,
  wManeuverSetupDistance,
} from './bishopKnight'
export type {
  KnightAndBishopBlackMoveScore,
  KnightAndBishopWhiteMoveScore,
  KnightAndBishopZone5,
  KnightAndBishopZoneXSetup,
} from './bishopKnight'

export {
  compareTwoBishopsBlackScores,
  compareTwoBishopsWhiteScores,
  getBlackKingFrontSquares,
  getIdealTwoBishopsBlackMoves,
  getIdealTwoBishopsWhiteMoves,
  getPhaseTwoCornerSupportDistance,
  getPhaseTwoControlledOppositionEdgeSquares,
  getTwoBishopsAdjacentWallWaitingMoves,
  getTwoBishopsKnightDistanceWaitingMoves,
  getTwoBishopsPhaseOneOppositionWaitingMoves,
  getTwoBishopsPhaseTwoWaitingMoveTargets,
  getTwoBishopsSupportedCornerWaitingMoves,
  isTwoBishopsPhaseTwoPosition,
  scoreTwoBishopsBlackMove,
  scoreTwoBishopsWhiteMove,
  twoBishopsRuleSet,
  twoBishopsWhiteRules,
} from './twoBishops'

export {
  compareTwoKnightsPawnBlackScores,
  compareTwoKnightsPawnWhiteScores,
  getIdealTwoKnightsPawnBlackMoves,
  getIdealTwoKnightsPawnWhiteMoves,
  getTwoKnightsPawnBlackKingRegion,
  getTwoKnightsPawnTerminalOutcome,
  scoreTwoKnightsPawnBlackMove,
  scoreTwoKnightsPawnWhiteCandidates,
  scoreTwoKnightsPawnWhiteMove,
  twoKnightsPawnRuleSet,
  twoKnightsPawnWhiteRules,
} from './twoKnightsPawn'
export type {
  TwoKnightsPawnBlackMoveScore,
  TwoKnightsPawnTerminalOutcome,
  TwoKnightsPawnWhiteMoveScore,
} from './twoKnightsPawn'
export type {
  TwoBishopsBlackMoveScore,
  TwoBishopsWhiteMoveScore,
} from './twoBishops'

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
  RuleSubpriority,
  ScoredMove,
  WhiteMoveOverride,
  WhiteMoveOverrideSelection,
} from './types'

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

function snapshotOrderedRule<Score>(
  orderedRule: OrderedRule<Score>,
): OrderedRule<Score> {
  if (orderedRule.compare && orderedRule.subpriorities) {
    throw new Error(
      `rule ${orderedRule.id} must define compare or subpriorities, not both`,
    )
  }
  if (!orderedRule.compare && !orderedRule.subpriorities) {
    throw new Error(
      `rule ${orderedRule.id} must define compare or subpriorities`,
    )
  }
  if (orderedRule.subpriorities?.length === 0) {
    throw new Error(`rule ${orderedRule.id} subpriorities must not be empty`)
  }
  const compare = orderedRule.compare
  const applies = orderedRule.applies
  const stopWhenBest = orderedRule.stopWhenBest
  const subpriorities = orderedRule.subpriorities
    ? Object.freeze(
        orderedRule.subpriorities.map((subpriority) => {
          const subpriorityCompare = subpriority.compare
          const subpriorityRank = subpriority.rank
          const when = subpriority.when
          if (subpriorityCompare && subpriorityRank) {
            throw new Error(
              `rule ${orderedRule.id} subpriority must define compare or rank, not both`,
            )
          }
          if (!subpriorityCompare && !subpriorityRank) {
            throw new Error(
              `rule ${orderedRule.id} subpriority must define compare or rank`,
            )
          }
          return Object.freeze({
            ...(when
              ? {
                  when: Object.freeze((scores: readonly Score[]) =>
                    when(scores),
                  ),
                }
              : {}),
            ...(subpriorityCompare
              ? {
                  compare: Object.freeze((left: Score, right: Score) =>
                    subpriorityCompare(left, right),
                  ),
                }
              : {
                  rank: Object.freeze((scores: readonly Score[]) =>
                    subpriorityRank!(scores),
                  ),
                }),
          })
        }),
      )
    : undefined

  return Object.freeze({
    id: orderedRule.id,
    shortLabel: orderedRule.shortLabel,
    helpText: orderedRule.helpText,
    ...(orderedRule.presentationRole === undefined
      ? {}
      : { presentationRole: orderedRule.presentationRole }),
    guideOrder: orderedRule.guideOrder,
    ...(applies
      ? { applies: Object.freeze((score: Score) => applies(score)) }
      : {}),
    ...(stopWhenBest
      ? {
          stopWhenBest: Object.freeze((score: Score) => stopWhenBest(score)),
        }
      : {}),
    ...(compare
      ? {
          compare: Object.freeze((left: Score, right: Score) =>
            compare(left, right),
          ),
        }
      : {}),
    ...(subpriorities ? { subpriorities } : {}),
  })
}

type SnapshottedWhiteMoveOverride = {
  readonly description: RuleDescription
  readonly guideOrder: number | undefined
  readonly select: WhiteMoveOverride['select']
}

function snapshotWhiteMoveOverride(
  override: WhiteMoveOverride | undefined,
): SnapshottedWhiteMoveOverride | undefined {
  if (!override) return undefined
  const sourceSelect = override.select
  return Object.freeze({
    description: Object.freeze({ ...override.description }),
    guideOrder: override.guideOrder,
    select: Object.freeze((fen: string, legalMoves: readonly string[]) =>
      sourceSelect(fen, legalMoves),
    ),
  })
}

function createRegisteredMateRuleSet<Score>(
  ruleSet: MateRuleSet<Score>,
): RegisteredMateRuleSet {
  const {
    id,
    phase,
    scoreWhite,
    scoreWhiteCandidates,
    whiteMoves,
    blackCandidates,
    help,
  } = ruleSet
  const whiteRules = Object.freeze(
    ruleSet.whiteRules.map(snapshotOrderedRule),
  )
  const whiteMoveOverride = snapshotWhiteMoveOverride(
    ruleSet.whiteMoveOverride,
  )
  const descriptionsById = new Map<string, RuleDescription>()
  const descriptionOrderById = new Map<string, number>()
  const registerDescription = (
    source: RuleDescription,
    guideOrder?: number,
    fallbackOrder = 0,
  ): RuleDescription => {
    const existing = descriptionsById.get(source.id)
    if (
      existing &&
      (existing.shortLabel !== source.shortLabel ||
        existing.helpText !== source.helpText ||
        existing.presentationRole !== source.presentationRole)
    ) {
      throw new Error(`conflicting rule description for id ${source.id}`)
    }
    const description =
      existing ??
      Object.freeze({
        id: source.id,
        shortLabel: source.shortLabel,
        helpText: source.helpText,
        ...(source.presentationRole === undefined
          ? {}
          : { presentationRole: source.presentationRole }),
      })
    descriptionsById.set(source.id, description)
    descriptionOrderById.set(
      source.id,
      Math.min(
        descriptionOrderById.get(source.id) ?? Number.POSITIVE_INFINITY,
        guideOrder ?? fallbackOrder,
      ),
    )
    return description
  }
  const overrideDescription = whiteMoveOverride
    ? registerDescription(
        whiteMoveOverride.description,
        whiteMoveOverride.guideOrder,
        whiteRules.length,
      )
    : undefined
  const ruleEntries = Object.freeze(
    whiteRules.map((orderedRule, index) => {
      const description = registerDescription(
        orderedRule,
        orderedRule.guideOrder,
        index,
      )
      return { orderedRule, description }
    }),
  )
  const whiteRuleDescriptions = Object.freeze([
    ...descriptionsById.values(),
  ].sort(
    (first, second) =>
      (descriptionOrderById.get(first.id) ?? 0) -
      (descriptionOrderById.get(second.id) ?? 0),
  ))
  const getLegalWhiteMoves = (fen: string): readonly string[] =>
    Object.freeze([...whiteMoves(fen)])
  const selectedOverrideMoves = (
    fen: string,
    moves: readonly string[],
  ): readonly string[] | undefined => {
    if (!whiteMoveOverride) return undefined
    const selection = whiteMoveOverride.select(fen, moves)
    if (!selection.active) return undefined
    if (selection.moves.length === 0) {
      throw new Error('active move override must select at least one legal move')
    }
    const legalMoves = new Set(moves)
    const selected = new Set<string>()
    for (const san of selection.moves) {
      if (selected.has(san)) {
        throw new Error(`move override selected duplicate SAN: ${san}`)
      }
      if (!legalMoves.has(san)) {
        throw new Error(`move override selected illegal SAN: ${san}`)
      }
      selected.add(san)
    }
    return Object.freeze([...selection.moves])
  }
  const scoredWhiteMoves = (
    fen: string,
    moves: readonly string[],
  ): readonly ScoredMove<Score>[] => {
    return scoreWhiteCandidates
      ? scoreWhiteCandidates(fen, moves).map(({ san, score }) => ({
          san,
          score,
        }))
      : moves.map((san) => ({
          san,
          score: scoreWhite(fen, san),
        }))
  }
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
    idealWhiteMoves: (fen) => {
      const moves = getLegalWhiteMoves(fen)
      return (
        selectedOverrideMoves(fen, moves) ??
        selectIdealMoves(scoredWhiteMoves(fen, moves), whiteRules)
      )
    },
    explainWhiteMove: (fen, san) => {
      const moves = getLegalWhiteMoves(fen)
      if (san !== undefined && !moves.includes(san)) return undefined
      if (selectedOverrideMoves(fen, moves)) return overrideDescription
      const candidates = scoredWhiteMoves(fen, moves)
      const idealMoves = selectIdealMoves(candidates, whiteRules)
      const rule =
        san === undefined || idealMoves.includes(san)
          ? currentTeachingHint(candidates, whiteRules, san)
          : explainMove(candidates, whiteRules, san)
      return describeRule(rule)
    },
    currentWhiteHint: (fen) => {
      const moves = getLegalWhiteMoves(fen)
      if (selectedOverrideMoves(fen, moves)) return overrideDescription
      return describeRule(
        currentTeachingHint(scoredWhiteMoves(fen, moves), whiteRules),
      )
    },
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
registerBuiltInMateRuleSet(twoBishopsRuleSet)
registerBuiltInMateRuleSet(bishopKnightRuleSet)
registerBuiltInMateRuleSet(twoKnightsPawnRuleSet)
