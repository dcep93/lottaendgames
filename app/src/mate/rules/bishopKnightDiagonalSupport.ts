import type { Square } from 'chess.js'
import { isInsideBishopDiagonal } from './bishopKnightGeometry'
import { knightAndBishopKnightProximityToSquare } from './bishopKnightStrategy'
import { getChess, findPiece, getSquareTransform, kingDistance, squareCoordinates, squaredEuclideanDistance, SQUARE_TRANSFORMS, transformSquare } from '../chess'

const SEVEN_DIAGONAL_SUPPORT = SQUARE_TRANSFORMS.map(transform => ({
  inverse: getSquareTransform(transform.inverseName),
  kingTarget: transformSquare('f7', transform),
  wall: (['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8'] as const).map(square => transformSquare(square, transform)),
  knightTarget: transformSquare('d3', transform),
  approachBlackGate: transformSquare('c5', transform),
  approachKingGates: (['f6', 'g7'] as const).map(square => transformSquare(square, transform)),
  edgeRouteBlack: (['a3', 'a4'] as const).map(square => transformSquare(square, transform)),
  edgeRouteKing: (['d4', 'c3', 'c2', 'b2'] as const).map(square => transformSquare(square, transform)),
  edgeRouteReturnBlack: transformSquare('a5', transform),
  edgeRouteReturnBishop: transformSquare('b3', transform),
  edgeRouteReturnKing: transformSquare('d4', transform),
  approachEscapes: (['a3', 'b4', 'c5', 'd6'] as const).map(square => transformSquare(square, transform)),
}))

const FIVE_DIAGONAL_SUPPORT = SQUARE_TRANSFORMS.map(transform => ({
  inverse: getSquareTransform(transform.inverseName),
  bishop: transformSquare('a4', transform),
  sevenSupportBishops: (['a4', 'b5'] as const).map(square => transformSquare(square, transform)),
  oppositeKingSquares: (['d6', 'e7', 'f8'] as const).map(square => transformSquare(square, transform)),
  edgeBishopAttackSquare: transformSquare('a5', transform),
  edgeBishopEscapeSquare: transformSquare('b6', transform),
  checkingKingSquare: transformSquare('e7', transform),
  sevenDiagonal: (['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8'] as const).map(square => transformSquare(square, transform)),
  wall: (['a4', 'b5', 'c6', 'd7', 'e8'] as const).map(square => transformSquare(square, transform)),
  destination: transformSquare('d5', transform),
  kingSupportSquare: transformSquare('d6', transform),
  edgeKingSupportSquare: transformSquare('c5', transform),
  blackEdge: (['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'] as const).map(square => transformSquare(square, transform)),
  nearEdgeKingTarget: transformSquare('d7', transform),
  midpoint: transformSquare('c6', transform),
  midpointEscape: transformSquare('b4', transform),
  // Include the reflected b4/c5 escape squares so reflecting the same wall cannot bypass the check.
  defendedBishopEscapes: (['c5', 'b4', 'd6', 'e7'] as const).map(square => transformSquare(square, transform)),
  approachEscapes: (['e7', 'c7', 'b6', 'a5'] as const).map(square => transformSquare(square, transform)),
  kingApproachBlackGates: (['b6', 'e7'] as const).map(square => transformSquare(square, transform)),
  sixDiagonal: (['a3', 'b4', 'c5', 'd6', 'e7', 'f8'] as const).map(square => transformSquare(square, transform)),
  knight: transformSquare('d3', transform),
  knightSupportedBlackGate: transformSquare('c7', transform),
  knightSupportedWhiteGate: transformSquare('e7', transform),
  edgeBishopExcludedBlack: (['d8', 'e8', 'e7', 'f8'] as const).map(square => transformSquare(square, transform)),
  whiteSquares: (['d6', 'd7', 'e6', 'e7'] as const).map(square => transformSquare(square, transform)),
}))

const THREE_DIAGONAL_SUPPORT = SQUARE_TRANSFORMS.map(transform => ({
  bishopEdges: (['a6', 'c8'] as const).map(square => transformSquare(square, transform)),
  kingSupport: transformSquare('c7', transform),
  approachBishop: transformSquare('a6', transform),
  approachKing: transformSquare('d8', transform),
  bishopAttackSquares: (['a5', 'b5', 'b6', 'b7', 'a7'] as const).map(square => transformSquare(square, transform)),
  knightTargets: (['b5', 'c6'] as const).map(square => transformSquare(square, transform)),
  knight: transformSquare('d5', transform),
  wall: (['a6', 'b7', 'c8'] as const).map(square => transformSquare(square, transform)),
}))

function blackReachability(fen: string, blackDestinations?: readonly Square[]) {
  let replies = blackDestinations
  return (squares: readonly Square[]) => {
    replies ??= getChess(fen.replace(/ [wb] /, ' b ')).moves({verbose: true}).filter(move => move.piece === 'k').map(move => move.to)
    return replies.some(square => squares.includes(square))
  }
}

/** Three-diagonal pressure, evaluated after White moves. */
export function knightAndBishopThreeDiagonalKingProximity(fen: string): number {
  const white = findPiece(fen, 'w', 'k')
  const black = findPiece(fen, 'b', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  if (!white || !black || !bishop || !knight) return 0
  for (const pattern of THREE_DIAGONAL_SUPPORT) {
    if (!pattern.bishopEdges.includes(bishop.square) || !isInsideBishopDiagonal(black.square, pattern.wall)) continue
    if (knight.square !== pattern.knight && !pattern.knightTargets.includes(knight.square)) continue
    return squaredEuclideanDistance(white.square, bishop.square)
  }
  return 0
}

/** r1's trigger belongs to the position before White gives check. */
export function knightAndBishopShouldCheckThreeDiagonal(fen: string): boolean {
  const white = findPiece(fen, 'w', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  const black = findPiece(fen, 'b', 'k')
  if (!white || !bishop || !black || !findPiece(fen, 'w', 'n')) return false
  let distance = 99
  const canReach = blackReachability(fen)
  for (const pattern of THREE_DIAGONAL_SUPPORT) {
    if (!isInsideBishopDiagonal(black.square, pattern.wall) || white.square !== pattern.kingSupport || !pattern.bishopEdges.includes(bishop.square)) continue
    if (canReach(pattern.wall)) continue
    for (const target of pattern.knightTargets) distance = Math.min(distance, knightAndBishopKnightProximityToSquare(fen, target))
  }
  return distance <= 1
}

/** Evaluate the resulting position, before Black replies. */
export function knightAndBishopSupportedDiagonal(fen: string, blackDestinations?: readonly Square[]): { size: number; knight: number } {
  const white = findPiece(fen, 'w', 'k')
  const black = findPiece(fen, 'b', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  if (!white || !black || !bishop || !knight) return {size: 99, knight: 99}
  const canReach = blackReachability(fen, blackDestinations)
  let threeSupported = false
  let threeKnightDistance = 99
  for (const pattern of THREE_DIAGONAL_SUPPORT) {
    if (!pattern.bishopEdges.includes(bishop.square)) continue
    const inside = isInsideBishopDiagonal(black.square, pattern.wall)
    if (!inside && !pattern.wall.includes(black.square)) continue
    if (canReach(pattern.wall)) continue
    const kingSupported = inside && white.square === pattern.kingSupport
    const fiveKnightSupported = inside && knight.square === pattern.knight && pattern.wall.some(square => kingDistance(white.square, square) === 1)
    const approachingKingSupported = bishop.square === pattern.approachBishop && knight.square === pattern.knight &&
      kingDistance(white.square, pattern.approachKing) <= 1 && !canReach(pattern.bishopAttackSquares)
    if (kingSupported || fiveKnightSupported || approachingKingSupported) threeSupported = true
    if (kingSupported) threeKnightDistance = Math.min(threeKnightDistance,
      ...pattern.knightTargets.map(square => knightAndBishopKnightProximityToSquare(fen, square)))
  }
  if (threeSupported) return {size: 3, knight: threeKnightDistance}
  let fiveKnightDistance = 99
  // This race constrains the wall itself, including a king-support interpretation from its other end.
  const fiveSupportRaceLost = FIVE_DIAGONAL_SUPPORT.some(pattern => knight.square === pattern.knight &&
    pattern.wall.includes(bishop.square) && isInsideBishopDiagonal(black.square, pattern.wall) &&
    kingDistance(black.square, pattern.knightSupportedBlackGate) < kingDistance(white.square, pattern.knightSupportedWhiteGate))
  const fiveEdgeBishopAttack = FIVE_DIAGONAL_SUPPORT.some(pattern => bishop.square === pattern.bishop &&
    isInsideBishopDiagonal(black.square, pattern.wall) && knight.square !== pattern.knight &&
    !(knight.square === pattern.destination &&
      kingDistance(white.square, pattern.edgeKingSupportSquare) <= kingDistance(black.square, pattern.edgeKingSupportSquare)) &&
    canReach([pattern.edgeBishopAttackSquare]))
  // A knight on the seven-diagonal support square fixes the end of this wall.
  // Other reflected interpretations must not restore a disallowed bishop placement.
  const sevenSupportPattern = FIVE_DIAGONAL_SUPPORT.find(pattern =>
    pattern.knight === knight.square && pattern.wall.includes(bishop.square))
  for (const pattern of FIVE_DIAGONAL_SUPPORT) {
    if (sevenSupportPattern) {
      if (pattern !== sevenSupportPattern) continue
      const bishopPlacementSupported = pattern.sevenSupportBishops.includes(bishop.square) ||
        kingDistance(white.square, bishop.square) === 1 || kingDistance(black.square, bishop.square) >= 3
      if (!bishopPlacementSupported) continue
    }
    const oppositeSideKingSupport = knight.square === pattern.knight &&
      (pattern.sevenSupportBishops.includes(bishop.square) ||
        kingDistance(white.square, pattern.checkingKingSquare) < kingDistance(black.square, pattern.checkingKingSquare)) &&
      pattern.oppositeKingSquares.every(square => kingDistance(white.square, square) <= kingDistance(black.square, square))
    const checkingKingSupport = knight.square === pattern.knight &&
      kingDistance(white.square, pattern.checkingKingSquare) <= 1 &&
      !canReach(pattern.sixDiagonal) && !canReach(pattern.sevenDiagonal)
    const whiteCoordinates = squareCoordinates(transformSquare(white.square, pattern.inverse))
    const blackCoordinates = squareCoordinates(transformSquare(black.square, pattern.inverse))
    const relativeKingSupport = knight.square === pattern.knight &&
      whiteCoordinates.rank >= blackCoordinates.rank - 1 && whiteCoordinates.file >= blackCoordinates.file
    if (fiveEdgeBishopAttack && !checkingKingSupport && !relativeKingSupport && !oppositeSideKingSupport) continue
    if (!pattern.wall.includes(bishop.square) ||
      (!isInsideBishopDiagonal(black.square, pattern.wall) && !(checkingKingSupport && pattern.wall.includes(black.square)))) continue
    if (white.square === pattern.midpoint && kingDistance(black.square, bishop.square) === 1) continue
    if (canReach(pattern.wall) || canReach(pattern.sixDiagonal)) continue
    const edgeBishopKingSupport = bishop.square === pattern.bishop && knight.square === pattern.knight &&
      kingDistance(white.square, pattern.kingSupportSquare) <= 1 && !pattern.edgeBishopExcludedBlack.includes(black.square)
    const edgeBishopEscapeSupport = bishop.square === pattern.bishop && !canReach(pattern.sixDiagonal) &&
      (knight.square === pattern.knight || knight.square === pattern.destination ||
        (pattern.sixDiagonal.includes(white.square) &&
          (!canReach([pattern.edgeBishopEscapeSquare]) || kingDistance(white.square, pattern.edgeKingSupportSquare) <= 1)))
    if (fiveSupportRaceLost && !edgeBishopKingSupport && !edgeBishopEscapeSupport && !checkingKingSupport && !relativeKingSupport && !oppositeSideKingSupport) continue
    const distance = knightAndBishopKnightProximityToSquare(fen, pattern.destination)
    const originalSupport = pattern.bishop === bishop.square && pattern.knight === knight.square && pattern.whiteSquares.includes(white.square)
    const pairedSupport = knight.square === pattern.knight && white.square === pattern.kingSupportSquare
    const edgeKingSupport = knight.square === pattern.knight && white.square === pattern.edgeKingSupportSquare &&
      pattern.blackEdge.includes(black.square)
    const nearEdgeSupport = knight.square === pattern.knight &&
      kingDistance(white.square, pattern.nearEdgeKingTarget) <= 1
    const approachingSupport = pattern.bishop === bishop.square && distance <= 1 && !canReach(pattern.approachEscapes)
    const kingSupported = pattern.bishop === bishop.square &&
      white.square === pattern.kingSupportSquare && kingDistance(black.square, bishop.square) >= 3
    const midpointSupport = distance <= 1 && bishop.square === pattern.midpoint && white.square === pattern.kingSupportSquare &&
      !canReach([pattern.midpointEscape])
    // After ...b6, White can occupy d6; only the two minor pieces can block that reply.
    const canOccupyKingSupport = kingDistance(white.square, pattern.kingSupportSquare) <= 1 &&
      bishop.square !== pattern.kingSupportSquare && knight.square !== pattern.kingSupportSquare
    const defendedBishopSupport = distance <= 1 && kingDistance(white.square, bishop.square) === 1 &&
      canOccupyKingSupport && !canReach(pattern.defendedBishopEscapes)
    const kingApproachSupport = distance <= 1 && kingDistance(white.square, pattern.kingSupportSquare) <= 1 &&
      pattern.kingApproachBlackGates.every(square => kingDistance(black.square, square) >= 2)
    const sixDiagonalKingSupport = distance <= 1 &&
      pattern.sixDiagonal.every(square => kingDistance(white.square, square) <= kingDistance(black.square, square))
    const arrivedSupport = distance === 0 && !canReach(pattern.sixDiagonal)
    if (oppositeSideKingSupport || relativeKingSupport || checkingKingSupport || edgeBishopEscapeSupport || edgeBishopKingSupport || originalSupport || pairedSupport || edgeKingSupport || nearEdgeSupport || approachingSupport || kingSupported || midpointSupport || defendedBishopSupport || kingApproachSupport || sixDiagonalKingSupport || arrivedSupport) fiveKnightDistance = Math.min(fiveKnightDistance, distance)
  }
  if (fiveKnightDistance < 99) return {size: 5, knight: fiveKnightDistance}
  let sevenKnightDistance = 99
  for (const pattern of SEVEN_DIAGONAL_SUPPORT) {
    if (!isInsideBishopDiagonal(black.square, pattern.wall) || !pattern.wall.includes(bishop.square)) continue
    if (canReach(pattern.wall)) continue
    const distance = knightAndBishopKnightProximityToSquare(fen, pattern.knightTarget)
    const kingRaceSupport = distance <= 1 && kingDistance(black.square, pattern.approachBlackGate) >= 2 &&
      kingDistance(white.square, bishop.square) < kingDistance(black.square, bishop.square) &&
      pattern.approachKingGates.every(square => kingDistance(white.square, square) < kingDistance(black.square, square))
    if (kingRaceSupport) {
      sevenKnightDistance = Math.min(sevenKnightDistance, distance)
      continue
    }
    const nearTarget = kingDistance(white.square, pattern.kingTarget) <= 1
    const onEdgeRoute = distance === 0 && pattern.edgeRouteBlack.includes(black.square) && pattern.edgeRouteKing.includes(white.square)
    const edgeRouteReturn = distance === 0 && black.square === pattern.edgeRouteReturnBlack &&
      bishop.square === pattern.edgeRouteReturnBishop && white.square === pattern.edgeRouteReturnKing
    if (!nearTarget && !onEdgeRoute && !edgeRouteReturn) {
      if (distance !== 0) continue
      const whiteCoordinates = squareCoordinates(transformSquare(white.square, pattern.inverse))
      const blackCoordinates = squareCoordinates(transformSquare(black.square, pattern.inverse))
      if (whiteCoordinates.rank < 4 || whiteCoordinates.file <= blackCoordinates.file) continue
    }
    if (distance === 0 || (distance <= 1 && !canReach(pattern.approachEscapes))) {
      sevenKnightDistance = Math.min(sevenKnightDistance, distance)
    }
  }
  return sevenKnightDistance < 99 ? {size: 7, knight: sevenKnightDistance} : {size: 99, knight: 99}
}
