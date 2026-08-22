import type { MateId } from '../types'
import { bishopKnightRuleSet } from './bishopKnight'
import { queenRuleSet, rookRuleSet } from './majorPieces'
import { explainMove, selectIdealMoves } from './selection'
import { twoBishopsRuleSet } from './twoBishops'
import { twoKnightsPawnRuleSet } from './twoKnightsPawn'
import type {
  MateRuleSet,
  OrderedRule,
  RegisteredMateRuleSet,
  RuleDescription,
  RuleHelp,
  ScoredMove,
  WhitePositionAnalysis,
  WhiteMoveOverride,
} from './types'

export {
  compareScoresByRules,
  currentHint,
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
  getIdealQueenBlackMoves,
  getIdealQueenWhiteMoves,
  getIdealRookBlackMoves,
  getIdealRookWhiteMoves,
  getMajorEndgamePhase,
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

export { getEndgameReturnToPositionMoves } from './blackPriorities'
export type {
  QueenBlackMoveScore,
  QueenWhiteMoveScore,
  RookBlackMoveScore,
  RookWhiteMoveScore,
} from './majorPieces'

export {
  getQueenBoxAxisSides,
  getRookBox,
  getRookBoxFromFen,
  getRookCuts,
  isQueenTighterChannelBetween,
} from './majorPieceGeometry'
export type {
  QueenBoxAxisSides,
  RookAxis,
  RookBox,
  RookCut,
  RookEdge,
} from './majorPieceGeometry'

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
  areBishopsOnWhiteSideOfOppositionMoat,
  compareTwoBishopsBlackScores,
  compareTwoBishopsWhiteScores,
  getIdealTwoBishopsBlackMoves,
  getIdealTwoBishopsWhiteMoves,
  getProximateBishopWall,
  getTwoBishopsEdgeFlankSquares,
  getTwoBishopsDegenerateReasonLabel,
  getTwoBishopsMatingPositionSquares,
  getTwoBishopsPhaseLabel,
  isTwoBishopsPhaseTwoPosition,
  isTwoBishopsCentralPieceSquare,
  isTwoBishopsSquareBehindBlack,
  scoreTwoBishopsBlackMove,
  scoreTwoBishopsWhiteMove,
  TWO_BISHOPS_DEGENERATE_PRIORITY_ORDER,
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
  WhitePositionAnalysis,
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
        ...(board.animationSrc === undefined
          ? {}
          : { animationSrc: board.animationSrc }),
        ...(board.animationAlt === undefined
          ? {}
          : { animationAlt: board.animationAlt }),
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
  readonly select: WhiteMoveOverride['select']
}

function snapshotWhiteMoveOverride(
  override: WhiteMoveOverride | undefined,
): SnapshottedWhiteMoveOverride | undefined {
  if (!override) return undefined
  const sourceSelect = override.select
  return Object.freeze({
    description: Object.freeze({ ...override.description }),
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
    whiteRuleReasonLabel: sourceWhiteRuleReasonLabel,
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
  const whiteRuleReasonLabel = sourceWhiteRuleReasonLabel
    ? Object.freeze(
        (fen: string, rule: OrderedRule<Score>) =>
          sourceWhiteRuleReasonLabel(fen, rule),
      )
    : undefined
  const descriptionsById = new Map<string, RuleDescription>()
  const registerDescription = (
    source: RuleDescription,
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
    return description
  }
  const overrideDescription = whiteMoveOverride
    ? registerDescription(whiteMoveOverride.description)
    : undefined
  const ruleEntries = Object.freeze(
    whiteRules.map((orderedRule) => {
      const description = registerDescription(orderedRule)
      return { orderedRule, description }
    }),
  )
  const whiteRuleDescriptions = Object.freeze([
    ...descriptionsById.values(),
  ])
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
    fen: string,
    orderedRule: OrderedRule<Score> | undefined,
  ): RuleDescription | undefined => {
    const description = ruleEntries.find(
      (entry) => entry.orderedRule === orderedRule,
    )?.description
    if (!description || !orderedRule || !whiteRuleReasonLabel) {
      return description
    }
    const shortLabel = whiteRuleReasonLabel(fen, orderedRule)
    if (shortLabel === undefined || shortLabel === description.shortLabel) {
      return description
    }
    if (shortLabel.trim() === '') {
      throw new Error(`rule ${orderedRule.id} reason label must not be empty`)
    }
    return Object.freeze({ ...description, shortLabel })
  }

  const analyzeWhitePosition = (fen: string): WhitePositionAnalysis => {
    const moves = getLegalWhiteMoves(fen)
    const overrideMoves = selectedOverrideMoves(fen, moves)
    if (overrideMoves) {
      return Object.freeze({
        idealWhiteMoves: overrideMoves,
        currentWhiteHint: overrideDescription,
        explainWhiteMove: (san?: string) =>
          san !== undefined && !moves.includes(san)
            ? undefined
            : overrideDescription,
      })
    }
    const candidates = scoredWhiteMoves(fen, moves)
    return Object.freeze({
      idealWhiteMoves: selectIdealMoves(candidates, whiteRules),
      currentWhiteHint: describeRule(
        fen,
        explainMove(candidates, whiteRules),
      ),
      explainWhiteMove: (san?: string) =>
        san !== undefined && !moves.includes(san)
          ? undefined
          : describeRule(
              fen,
              explainMove(candidates, whiteRules, san),
            ),
    })
  }

  return Object.freeze({
    id,
    phase,
    whiteMoves,
    blackCandidates,
    help: snapshotRuleHelp(help),
    whiteRuleDescriptions,
    analyzeWhitePosition,
    idealWhiteMoves: (fen) => analyzeWhitePosition(fen).idealWhiteMoves,
    explainWhiteMove: (fen, san) =>
      analyzeWhitePosition(fen).explainWhiteMove(san),
    currentWhiteHint: (fen) =>
      analyzeWhitePosition(fen).currentWhiteHint,
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
  if (ruleSet.whiteMoveOverride) {
    throw new Error(
      `Built-in mate rule ${ruleSet.id} cannot bypass its visible priorities`,
    )
  }
  const ids = new Set<string>()
  for (const rule of ruleSet.whiteRules) {
    if (rule.guideOrder !== undefined) {
      throw new Error(
        `Built-in mate rule ${ruleSet.id} cannot reorder selector ${rule.id}`,
      )
    }
    if (ids.has(rule.id)) {
      throw new Error(
        `Built-in mate rule ${ruleSet.id} repeats selector ${rule.id}`,
      )
    }
    ids.add(rule.id)
  }
  const registeredRuleSet = createRegisteredMateRuleSet(ruleSet)
  const evaluatorIds = ruleSet.whiteRules.map(({ id }) => id)
  const renderedIds = registeredRuleSet.whiteRuleDescriptions.map(({ id }) => id)
  if (
    evaluatorIds.length !== renderedIds.length ||
    evaluatorIds.some((id, index) => id !== renderedIds[index])
  ) {
    throw new Error(
      `Built-in mate rule ${ruleSet.id} must render every selector in evaluator order`,
    )
  }
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
