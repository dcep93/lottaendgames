import type { Square } from 'chess.js'
import { isInsideBishopDiagonal } from './bishopKnightGeometry'
import { isDeclaredCheckingThreePlacement, isDeclaredCornerSupportWithoutKnightTarget, isDeclaredInsideThreeSupport, isRecordedSupportedCornerPosition } from './bishopKnightDeclaredSupport'
import { knightAndBishopKnightProximityToSquare } from './bishopKnightStrategy'
import { allSquares, edgeDistance, getChess, findPiece, kingDistance, squaredEuclideanDistance, squareColor, squareCoords, squareFromCoordinates, SQUARE_TRANSFORMS, transformSquare } from '../chess'

const CANONICAL_DIAGONALS: readonly {
  wall: readonly Square[];
  boundary: readonly Square[];
  previousSupport?: Square;
  previousSupportNearbyBishop?: Square;
  previousSupportPlacements?: readonly {king: Square; bishops: readonly Square[]}[];
  support: readonly Square[];
  kingSupportTargets?: readonly {king: Square; targets: readonly Square[]}[];
  kingGuard?: Square;
  bishopAttackRaceTarget?: Square;
  kingRaceSquares?: readonly Square[];
}[] = [
  {
    wall: ['a6', 'b7', 'c8'],
    boundary: ['a5', 'b6', 'c7', 'd8'],
    previousSupport: 'd5',
    support: ['b5', 'c6'],
    kingSupportTargets: [
      {king: 'c7', targets: ['b5', 'c6']},
    ],
  },
  {
    wall: ['a4', 'b5', 'c6', 'd7', 'e8'],
    boundary: ['a3', 'b4', 'c5', 'd6', 'e7', 'f8'],
    previousSupport: 'd3',
    previousSupportNearbyBishop: 'd7',
    previousSupportPlacements: [
      {king: 'c5', bishops: ['a4', 'd7']},
      {king: 'c6', bishops: ['a4', 'd7']},
      {king: 'c7', bishops: ['a4', 'd7']},
      {king: 'd6', bishops: ['a4', 'd7']},
    ],
    support: ['d5'],
    kingGuard: 'd6',
    bishopAttackRaceTarget: 'e7',
  },
  {
    wall: ['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8'],
    boundary: ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'],
    support: ['d3'],
    kingRaceSquares: ['f6', 'g7'],
  },
]

const DIAGONALS = CANONICAL_DIAGONALS.flatMap(pattern => SQUARE_TRANSFORMS.map(transform => ({
  preferredSevenBishop: pattern.wall.length === 7 ? transformSquare('b3', transform) : undefined,
  sevenKingTieTarget: transformSquare('e8', transform),
  sevenFlushTrigger: transformSquare('a3', transform),
  sevenFlushTarget: transformSquare('b2', transform),
  preferredThreeKings: ['b6', 'c7'].map(square => transformSquare(square as Square, transform)),
  preferredFiveBishops: ['b5', 'd7'].map(square => transformSquare(square as Square, transform)),
  fiveRemoteBishop: transformSquare('a4', transform),
  fiveOppositeEdgeBishop: transformSquare('e8', transform),
  fiveBlackEdge: allSquares().filter(square => square[0] === 'a').map(square => transformSquare(square, transform)),
  fiveRightTargetBishop: transformSquare('b5', transform),
  fiveFlushTrigger: transformSquare('a5', transform),
  fiveFlushTarget: transformSquare('b4', transform),
  rightOffset: {file: transform.map(2, 0).file - transform.map(0, 0).file,
    rank: transform.map(2, 0).rank - transform.map(0, 0).rank},
  corner: squareCoords(transformSquare('a8', transform)),
  wall: pattern.wall.map(square => transformSquare(square, transform)),
  boundary: pattern.boundary.map(square => transformSquare(square, transform)),
  previousSupport: pattern.previousSupport && transformSquare(pattern.previousSupport, transform),
  previousSupportNearbyBishop: pattern.previousSupportNearbyBishop && transformSquare(pattern.previousSupportNearbyBishop, transform),
  previousSupportPlacements: pattern.previousSupportPlacements?.map(entry => ({
    king: transformSquare(entry.king, transform),
    bishops: entry.bishops.map(square => transformSquare(square, transform)),
  })),
  support: pattern.support.map(square => transformSquare(square, transform)),
  kingSupportTargets: pattern.kingSupportTargets?.map(entry => ({
    king: transformSquare(entry.king, transform),
    targets: entry.targets.map(square => transformSquare(square, transform)),
  })),
  kingGuard: pattern.kingGuard && transformSquare(pattern.kingGuard, transform),
  bishopAttackRaceTarget: pattern.bishopAttackRaceTarget && transformSquare(pattern.bishopAttackRaceTarget, transform),
  kingRaceSquares: pattern.kingRaceSquares?.map(square => transformSquare(square, transform)),
})))

// Bc6 and its reflected squares are unsupported regardless of other pieces.
const UNSUPPORTED_BISHOP_SQUARES = new Set(SQUARE_TRANSFORMS.map(transform => transformSquare('c6', transform)))

const UNSUPPORTED_FIVE_ARRANGEMENTS = SQUARE_TRANSFORMS.map(transform => ({
  king: transformSquare('c6', transform),
  bishop: transformSquare('e8', transform),
  black: transformSquare('c8', transform),
}))

const UNSUPPORTED_THREE_ENDPOINTS = SQUARE_TRANSFORMS.map(transform => ({
  bishop: transformSquare('a6', transform),
  king: transformSquare('c8', transform),
}))

const DECLARED_UNSUPPORTED_PLACEMENTS = [
  {bishop: 'c8', king: 'b5', knight: 'c6', black: 'a7'},
  {bishop: 'f1', king: 'g4', knight: 'e2', black: 'h2'},
  {bishop: 'b1', king: 'd3', knight: 'c4', black: 'd1'},
] as const
const DECLARED_UNSUPPORTED_REFLECTIONS = DECLARED_UNSUPPORTED_PLACEMENTS.flatMap(placement => SQUARE_TRANSFORMS.map(transform => ({
  bishop: transformSquare(placement.bishop, transform),
  king: transformSquare(placement.king, transform),
  knight: transformSquare(placement.knight, transform),
  black: transformSquare(placement.black, transform),
})))

const UNSUPPORTED_THREE_KNIGHTS = SQUARE_TRANSFORMS.map(transform => ({
  bishop: transformSquare('c8', transform),
  knights: (['b6', 'c7'] as const).map(square => transformSquare(square, transform)),
}))

const THREE_BISHOP_RACES = SQUARE_TRANSFORMS.map(transform => ({
  bishop: transformSquare('a6', transform),
  target: transformSquare('b6', transform),
}))

const DECLARED_FIVE_SUPPORT = [
  {king: 'd7', bishop: 'b5', knight: 'd5', black: 'b7', allowSameColorKing: true},
  {king: 'd5', bishop: 'd7', knight: 'd3', black: 'a5', allowRemoteBishop: true},
  {king: 'd5', bishop: 'a4', knight: 'd3', black: 'b6'},
] as const
const DECLARED_FIVE_PLACEMENTS = DECLARED_FIVE_SUPPORT.flatMap(placement => SQUARE_TRANSFORMS.map(transform => ({
  allowSameColorKing: 'allowSameColorKing' in placement && placement.allowSameColorKing,
  allowRemoteBishop: 'allowRemoteBishop' in placement && placement.allowRemoteBishop,
  king: transformSquare(placement.king, transform),
  bishop: transformSquare(placement.bishop, transform),
  knight: transformSquare(placement.knight, transform),
  black: transformSquare(placement.black, transform),
  support: transformSquare('d5', transform),
})))

const FIVE_BISHOP_APPROACHES = SQUARE_TRANSFORMS.map(transform => ({
  wall: (['a4', 'b5', 'c6', 'd7', 'e8'] as const).map(square => transformSquare(square, transform)),
  bishops: (['a4', 'b5', 'c6'] as const).map(square => transformSquare(square, transform)),
  approach: transformSquare('b6', transform),
  escape: transformSquare('c5', transform),
}))

const BISHOP_ATTACK_SQUARES = new Map(allSquares().map(bishop => [
  bishop, allSquares().filter(square => kingDistance(bishop, square) === 1),
]))

/** A bishop attack along a shortest king-step route costs White one tempo in the race. */
function losesBishopAttackRace(fen: string, white: Square, black: Square, bishop: Square, target: Square, allowKingDefense = false): boolean {
  const whiteDistance = kingDistance(white, target)
  const blackDistance = kingDistance(black, target)
  if (whiteDistance > blackDistance) return true
  if (whiteDistance < blackDistance || kingDistance(black, bishop) >= kingDistance(white, bishop)) return false
  const board = getChess(fen)
  return BISHOP_ATTACK_SQUARES.get(bishop)!.some(square =>
    kingDistance(black, square) + kingDistance(square, target) === blackDistance &&
    (!allowKingDefense || kingDistance(white, bishop) - 1 > kingDistance(black, square)) &&
    !board.isAttacked(square, 'w'))
}

function hasExposedFiveBishopApproach(fen: string, bishop: Square, black: Square, blackDestinations?: readonly Square[]): boolean {
  const patterns = FIVE_BISHOP_APPROACHES.filter(pattern => pattern.bishops.includes(bishop) &&
    isInsideBishopDiagonal(black, pattern.wall))
  if (!patterns.length) return false
  const board = getChess(fen)
  if (board.isAttacked(bishop, 'w')) return false
  let replies = blackDestinations
  return patterns.some(pattern => {
    if (board.isAttacked(pattern.escape, 'w')) return false
    replies ??= board.moves({verbose: true}).filter(move => move.piece === 'k').map(move => move.to)
    if (!replies.includes(pattern.approach)) return false
    board.move({from: black, to: pattern.approach})
    // One legal king response can defend the bishop and close this escape.
    const canAnswer = board.moves({verbose: true}).some(move => move.piece === 'k' &&
      kingDistance(move.to, bishop) === 1 && kingDistance(move.to, pattern.escape) <= 1)
    board.undo()
    return !canAnswer
  })
}

function supportTargets(whiteKing: Square, pattern: typeof DIAGONALS[number]): readonly Square[] {
  return pattern.kingSupportTargets
    ? pattern.kingSupportTargets.find(entry => entry.king === whiteKing)?.targets ?? []
    : pattern.support
}

function supportDistance(fen: string, whiteKing: Square, pattern: typeof DIAGONALS[number]): number {
  const targets = supportTargets(whiteKing, pattern)
  return targets.length ? Math.min(...targets.map(square => knightAndBishopKnightProximityToSquare(fen, square))) : 99
}

/** A one-move destination must be empty; the knight already occupying it still qualifies. */
function knightWithinOneOfAvailableSupport(fen: string, whiteKing: Square, pattern: typeof DIAGONALS[number]): boolean {
  const board = getChess(fen)
  return supportTargets(whiteKing, pattern).some(square => {
    const distance = knightAndBishopKnightProximityToSquare(fen, square)
    return distance === 0 || (distance === 1 && !board.get(square))
  })
}

/** Test only the immediate bishop attacks and a single White response, without recursive support evaluation. */
function canAnswerBishopAttacks(fen: string, bishop: Square, boundary: readonly Square[], allowResponse = true): boolean {
  const board = getChess(fen.replace(/ [wb] /, ' b '))
  for (const attack of board.moves({verbose: true})) {
    if (attack.piece !== 'k') continue
    if (attack.to === bishop) return false
    if (kingDistance(attack.to, bishop) !== 1) continue
    board.move(attack)
    if (board.isAttacked(bishop, 'w')) {
      board.undo()
      continue
    }
    if (!allowResponse) return false
    let answer = false
    for (const response of board.moves({verbose: true})) {
      board.move(response)
      const defendedBishop = findPiece(board.fen(), 'w', 'b')
      answer = Boolean(defendedBishop) && !board.moves({verbose: true}).some(reply =>
        reply.piece === 'k' && (boundary.includes(reply.to) || reply.to === defendedBishop!.square))
      board.undo()
      if (answer) break
    }
    board.undo()
    if (!answer) return false
  }
  return true
}

/** Evaluate the resulting position, before Black replies. */
export function knightAndBishopSupportedDiagonal(fen: string, blackDestinations?: readonly Square[]): { size: number; knight: number } {
  const {size, knight} = evaluateKnightAndBishopSupportedDiagonal(fen, blackDestinations)
  return {size, knight}
}

type SupportedDiagonalEvaluation = {
  size: number;
  knight: number;
  sevenFlushColorPenalty?: number;
  sevenFlushDistance?: number;
  sevenBishopPenalty?: number;
  sevenKingTargetDistance?: number;
  sevenKingTieDistance?: number;
}

const SEVEN_PREFERENCE_KEYS = ['sevenFlushColorPenalty', 'sevenFlushDistance', 'sevenBishopPenalty',
  'sevenKingTargetDistance', 'sevenKingTieDistance'] as const

function compareSevenPreferences(a: SupportedDiagonalEvaluation, b: SupportedDiagonalEvaluation): number {
  for (const key of SEVEN_PREFERENCE_KEYS) {
    const delta = (a[key] ?? 0) - (b[key] ?? 0)
    if (delta) return delta
  }
  return 0
}

/** Includes placement preferences only for orientations that pass the support checks. */
export function evaluateKnightAndBishopSupportedDiagonal(fen: string, blackDestinations?: readonly Square[]): SupportedDiagonalEvaluation {
  if (fen.split(' ')[1] !== 'b') throw new Error('Diagonal support must be evaluated after White moves, with Black to move')
  const white = findPiece(fen, 'w', 'k')
  const black = findPiece(fen, 'b', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  if (!white || !black || !bishop || !knight) return {size: 99, knight: 99}
  // A knight on the three-diagonal's middle square (Ng2 with Bf1/ Bh3)
  // disqualifies support, including older king-and-bishop placement declarations.
  if (DIAGONALS.some(pattern => pattern.wall.length === 3 &&
    pattern.wall.includes(bishop.square) && pattern.wall[1] === knight.square)) return {size: 99, knight: 99}
  // The Ba6/Kb6 declaration requires Black inside its diagonal, retaining real knight targets.
  if (isDeclaredInsideThreeSupport(white.square, bishop.square, black.square)) return {
    size: 3,
    knight: Math.min(...DIAGONALS.filter(pattern => pattern.wall.length === 3 && pattern.wall.includes(bishop.square))
      .map(pattern => supportDistance(fen, white.square, pattern))),
  }
  // A king-protected Bb7+ remains supported even with an edge knight approaching c6/d7.
  if (isDeclaredCheckingThreePlacement(white.square, bishop.square, black.square)) {
    const checkingPatterns = DIAGONALS.filter(pattern => pattern.wall.length === 3 &&
      pattern.wall.includes(bishop.square) && isInsideBishopDiagonal(black.square, pattern.wall) &&
      knightWithinOneOfAvailableSupport(fen, white.square, pattern))
    if (checkingPatterns.length) return {
      size: 3,
      knight: Math.min(...checkingPatterns.map(pattern => supportDistance(fen, white.square, pattern))),
    }
  }
  // Explicit Kb5 placements waive the otherwise absent target, without creating one.
  // No three-diagonal target exists at Kb5, so do not invent a knight-distance preference.
  if (isDeclaredCornerSupportWithoutKnightTarget(white.square, bishop.square, black.square, knight.square)) return {size: 3, knight: 99}
  const declaredFive = DECLARED_FIVE_PLACEMENTS.find(pattern =>
    pattern.king === white.square && pattern.bishop === bishop.square &&
    pattern.knight === knight.square && pattern.black === black.square)
  // Universal post-White limits, including declared support placements.
  if (UNSUPPORTED_BISHOP_SQUARES.has(bishop.square)) return {size: 99, knight: 99}
  // Away from the edge, a five-bishop with its five-knight requires the king off the bishop's color.
  if (edgeDistance(white.square) > 0 && !declaredFive?.allowSameColorKing && squareColor(white.square) === squareColor(bishop.square) && DIAGONALS.some(pattern =>
    pattern.wall.length === 5 && pattern.wall.includes(bishop.square) &&
    pattern.support.includes(knight.square))) return {size: 99, knight: 99}
  if (edgeDistance(knight.square) === 0) return {size: 99, knight: 99}
  if (kingDistance(white.square, black.square) > 3) return {size: 99, knight: 99}
  if (DECLARED_UNSUPPORTED_REFLECTIONS.some(pattern =>
    pattern.king === white.square && pattern.bishop === bishop.square &&
    pattern.knight === knight.square && pattern.black === black.square)) return {size: 99, knight: 99}
  // The previous-stage knight fixes the orientation of these strict five-diagonal conditions.
  const whiteCoordinates = squareCoords(white.square)
  const blackCoordinatesForSupport = squareCoords(black.square)
  const previousFivePlacementRejected = DIAGONALS.some(pattern => pattern.wall.length === 5 &&
    pattern.previousSupport === knight.square && pattern.wall.includes(bishop.square) &&
    ((whiteCoordinates.file - blackCoordinatesForSupport.file) * pattern.rightOffset.file +
      (whiteCoordinates.rank - blackCoordinatesForSupport.rank) * pattern.rightOffset.rank <= 0 ||
      (!declaredFive?.allowRemoteBishop && bishop.square !== pattern.fiveRemoteBishop && kingDistance(white.square, bishop.square) !== 1 &&
        !((bishop.square === pattern.fiveOppositeEdgeBishop || bishop.square === pattern.previousSupportNearbyBishop) &&
          pattern.fiveBlackEdge.includes(black.square)))))
  if (declaredFive && !previousFivePlacementRejected) return {
    size: 5,
    knight: knightAndBishopKnightProximityToSquare(fen, declaredFive.support),
  }
  // A king on the other endpoint does not support this edge bishop.
  if (UNSUPPORTED_THREE_ENDPOINTS.some(pattern =>
    pattern.bishop === bishop.square && pattern.king === white.square)) return {size: 99, knight: 99}
  // Without a three-diagonal target, only its previous-stage knight can establish support.
  // Apply this before older exact placements, which cannot restore a removed target.
  const threePatterns = DIAGONALS.filter(pattern => pattern.wall.length === 3 &&
    pattern.wall.includes(bishop.square))
  const unavailableThreeTarget = threePatterns.length > 0 && !threePatterns.some(pattern =>
    knight.square === pattern.previousSupport || supportTargets(white.square, pattern).length > 0)
  if (!unavailableThreeTarget && isRecordedSupportedCornerPosition(fen)) return {
    size: 3,
    knight: Math.min(...DIAGONALS.filter(pattern => pattern.wall.length === 3 && pattern.wall.includes(bishop.square))
      .map(pattern => supportDistance(fen, white.square, pattern))),
  }
  if (kingDistance(black.square, bishop.square) === 1 &&
    kingDistance(white.square, bishop.square) > 1 &&
    squaredEuclideanDistance(knight.square, bishop.square) === 5) return {size: 99, knight: 99}
  // An approaching knight does not waive the king-side requirement, even for an
  // edge king. Check both reflected orientations so one cannot rescue the other.
  // Previous-stage knights already fix their orientation in the check above.
  const hasPreviousFiveKnight = DIAGONALS.some(pattern => pattern.wall.length === 5 &&
    pattern.wall.includes(bishop.square) && pattern.previousSupport === knight.square)
  const approachingFiveWrongSide = !hasPreviousFiveKnight && DIAGONALS.some(pattern => pattern.wall.length === 5 &&
    pattern.wall.includes(bishop.square) && isInsideBishopDiagonal(black.square, pattern.wall) &&
    !pattern.support.includes(knight.square) && pattern.previousSupport !== knight.square &&
    ((whiteCoordinates.file - blackCoordinatesForSupport.file) * pattern.rightOffset.file +
      (whiteCoordinates.rank - blackCoordinatesForSupport.rank) * pattern.rightOffset.rank <= 0))
  const excludedFive = previousFivePlacementRejected || approachingFiveWrongSide || UNSUPPORTED_FIVE_ARRANGEMENTS.some(pattern =>
    pattern.king === white.square && pattern.bishop === bishop.square && pattern.black === black.square) ||
    hasExposedFiveBishopApproach(fen, bishop.square, black.square, blackDestinations)
  const excludedThree = unavailableThreeTarget || UNSUPPORTED_THREE_KNIGHTS.some(pattern =>
    pattern.bishop === bishop.square && pattern.knights.includes(knight.square)) ||
    THREE_BISHOP_RACES.some(pattern => pattern.bishop === bishop.square &&
      squaredEuclideanDistance(knight.square, pattern.target) !== 5 &&
      losesBishopAttackRace(fen, white.square, black.square, bishop.square, pattern.target, true))
  // The king need not win a race to a square the knight already controls.
  const losesFiveKingRace = DIAGONALS.some(pattern => pattern.kingGuard &&
    pattern.wall.includes(bishop.square) && isInsideBishopDiagonal(black.square, pattern.wall) &&
    !pattern.support.includes(knight.square) &&
    squaredEuclideanDistance(knight.square, pattern.kingGuard) !== 5 &&
    losesBishopAttackRace(fen, white.square, black.square, bishop.square, pattern.kingGuard, true))
  const losesFiveBishopTempoRace = DIAGONALS.some(pattern => pattern.bishopAttackRaceTarget &&
    pattern.wall.includes(bishop.square) && isInsideBishopDiagonal(black.square, pattern.wall) &&
    !pattern.support.includes(knight.square) &&
    squaredEuclideanDistance(knight.square, pattern.bishopAttackRaceTarget) !== 5 &&
    kingDistance(white.square, pattern.bishopAttackRaceTarget) === kingDistance(black.square, pattern.bishopAttackRaceTarget) &&
    losesBishopAttackRace(fen, white.square, black.square, bishop.square, pattern.bishopAttackRaceTarget, true))
  const king = squareCoords(white.square)
  let replies = blackDestinations
  const attackChecks = new Map<string, boolean>()
  let best: SupportedDiagonalEvaluation = {size: 99, knight: 99}
  for (const pattern of DIAGONALS) {
    if (pattern.wall.length > best.size || !pattern.wall.includes(bishop.square) ||
      !isInsideBishopDiagonal(black.square, pattern.wall)) continue
    if (pattern.wall.length === 5 && (excludedFive || losesFiveKingRace || losesFiveBishopTempoRace)) continue
    if (pattern.wall.length === 3 && excludedThree) continue
    // Seven-diagonal support requires the knight on its actual support square.
    if (pattern.wall.length === 7 && !pattern.support.includes(knight.square)) continue
    // Exact declarations and edge kings are exempt; other same-color kings need an occupied current-stage target.
    if (edgeDistance(white.square) > 0 && squareColor(white.square) === squareColor(bishop.square) &&
      !supportTargets(white.square, pattern).includes(knight.square)) continue
    // Apply the king-side requirement in each qualifying seven-support orientation.
    if (pattern.wall.length === 7 &&
      (king.file - blackCoordinatesForSupport.file) * pattern.rightOffset.file +
      (king.rank - blackCoordinatesForSupport.rank) * pattern.rightOffset.rank <= 0 &&
      squaredEuclideanDistance(black.square, bishop.square) < squaredEuclideanDistance(white.square, bishop.square)) continue
    // The n-diagonal is n−1 orthogonal steps from its corner; n+2 is n+1 steps.
    if (Math.abs(king.file - pattern.corner.file) + Math.abs(king.rank - pattern.corner.rank) > pattern.wall.length + 1) continue
    const kingSupportsThree = pattern.wall.length === 3 && pattern.wall
      .some(square => square !== knight.square && kingDistance(white.square, square) === 1)
    if (pattern.wall.length === 3 && !kingSupportsThree) continue
    if (knight.square === pattern.previousSupport && pattern.previousSupportPlacements &&
      !pattern.previousSupportPlacements.some(entry => entry.king === white.square && entry.bishops.includes(bishop.square)) &&
      !(bishop.square === pattern.fiveOppositeEdgeBishop && pattern.fiveBlackEdge.includes(black.square)) &&
      !(bishop.square === pattern.previousSupportNearbyBishop && kingDistance(white.square, black.square) <= 2)) continue
    if (knight.square === pattern.previousSupport && pattern.bishopAttackRaceTarget &&
      losesBishopAttackRace(fen, white.square, black.square, bishop.square, pattern.bishopAttackRaceTarget)) continue
    const distance = supportDistance(fen, white.square, pattern)
    if (!kingSupportsThree && knight.square !== pattern.previousSupport && !knightWithinOneOfAvailableSupport(fen, white.square, pattern)) continue
    // The king must cover the escape side opposite this knight support square.
    if (pattern.kingRaceSquares?.some(square =>
      kingDistance(white.square, square) > kingDistance(black.square, square))) continue
    replies ??= getChess(fen.replace(/ [wb] /, ' b ')).moves({verbose: true})
      .filter(move => move.piece === 'k').map(move => move.to)
    if (replies.some(square => pattern.boundary.includes(square))) continue
    if (replies.some(square => pattern.wall.includes(square))) continue
    const allowAttackResponse = pattern.wall.length !== 7 || pattern.support.includes(knight.square)
    const key = [...pattern.boundary].sort().join(',') + ':' + allowAttackResponse
    let canAnswer = attackChecks.get(key)
    if (canAnswer === undefined) {
      canAnswer = !replies.some(square => kingDistance(square, bishop.square) <= 1) ||
        canAnswerBishopAttacks(fen, bishop.square, pattern.boundary, allowAttackResponse)
      attackChecks.set(key, canAnswer)
    }
    if (!canAnswer) continue
    const sevenBishopPenalty = pattern.preferredSevenBishop === bishop.square ? 0 : 1
    const blackCoordinates = squareCoords(black.square)
    const kingTarget = sevenBishopPenalty === 0 ? squareFromCoordinates(
      blackCoordinates.file + pattern.rightOffset.file, blackCoordinates.rank + pattern.rightOffset.rank) : null
    // An off-board target supplies no preference; it is not clamped to an edge.
    const sevenKingTargetDistance = kingTarget ? kingDistance(white.square, kingTarget) : 0
    const sevenKingTieDistance = pattern.wall.length === 7 ? kingDistance(white.square, pattern.sevenKingTieTarget) : 0
    const flush = pattern.wall.length === 7 && kingDistance(black.square, pattern.sevenFlushTrigger) <= 1
    const candidate: SupportedDiagonalEvaluation = {
      size: pattern.wall.length, knight: distance,
      sevenFlushColorPenalty: flush && squareColor(white.square) === squareColor(bishop.square) ? 1 : 0,
      sevenFlushDistance: flush ? kingDistance(white.square, pattern.sevenFlushTarget) : 0,
      sevenBishopPenalty, sevenKingTargetDistance, sevenKingTieDistance,
    }
    // Keep every preference in one qualifying support orientation, in rule order.
    if (candidate.size < best.size || distance < best.knight ||
      (candidate.size === best.size && distance === best.knight && compareSevenPreferences(candidate, best) < 0)) best = candidate
  }
  return best
}

/** Equal king placements on the three-diagonal boundary, including reflections. */
export function knightAndBishopThreeKingPlacementPenalty(fen: string): number {
  const white = findPiece(fen, 'w', 'k')
  const black = findPiece(fen, 'b', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  if (!white || !black || !bishop) return 0
  const patterns = DIAGONALS.filter(pattern => pattern.wall.length === 3 &&
    pattern.wall.includes(bishop.square) && isInsideBishopDiagonal(black.square, pattern.wall))
  return patterns.length && !patterns.some(pattern => pattern.preferredThreeKings.includes(white.square)) ? 1 : 0
}

/** Equivalent preferred bishop squares, in the five-knight orientation. */
export function knightAndBishopFiveBishopPenalty(fen: string): number {
  const black = findPiece(fen, 'b', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  if (!black || !bishop || !knight) return 0
  const patterns = DIAGONALS.filter(pattern => pattern.wall.length === 5 &&
    pattern.support.includes(knight.square) && pattern.wall.includes(bishop.square) &&
    isInsideBishopDiagonal(black.square, pattern.wall))
  return patterns.length && !patterns.some(pattern => pattern.preferredFiveBishops.includes(bishop.square)) ? 1 : 0
}

/** Five-diagonal king targets in the orientation fixed by the knight. */
export function knightAndBishopFiveKingTargetDistance(fen: string): number {
  const white = findPiece(fen, 'w', 'k')
  const black = findPiece(fen, 'b', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  if (!white || !black || !bishop || !knight) return 0
  const blackCoordinates = squareCoords(black.square)
  const distances = DIAGONALS.filter(pattern => pattern.wall.length === 5 &&
    (pattern.previousSupport === knight.square || pattern.support.includes(knight.square)) && pattern.wall.includes(bishop.square) &&
    isInsideBishopDiagonal(black.square, pattern.wall)).flatMap(pattern => {
      if (pattern.support.includes(knight.square) && bishop.square !== pattern.fiveRightTargetBishop) {
        return kingDistance(black.square, pattern.fiveFlushTrigger) <= 1
          ? [kingDistance(white.square, pattern.fiveFlushTarget)] : []
      }
      const target = squareFromCoordinates(blackCoordinates.file + pattern.rightOffset.file,
        blackCoordinates.rank + pattern.rightOffset.rank)
      return target ? [kingDistance(white.square, target)] : []
    })
  return distances.length ? Math.min(...distances) : 0
}

/** Detect r1's starting geometry; support itself is evaluated after the candidate White move. */
export function knightAndBishopShouldCheckThreeDiagonal(fen: string): boolean {
  const white = findPiece(fen, 'w', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  const black = findPiece(fen, 'b', 'k')
  return Boolean(white && bishop && black && DIAGONALS.some(pattern => pattern.wall.length === 3 &&
    pattern.wall.includes(bishop.square) &&
    isInsideBishopDiagonal(black.square, pattern.wall) &&
    knightWithinOneOfAvailableSupport(fen, white.square, pattern)))
}
