import type { Square } from 'chess.js'
import {
  findPiece,
  getChess,
  kingDistance,
  squareColor,
  squareCoordinates,
  squareFromCoordinates,
} from '../chess'
import {
  centerDistance,
  getWhiteBishopSquares,
  isTwoBishopsPhaseTwoPosition,
  whiteBishopsAreAdjacent,
} from './twoBishopsGeometry'

export type TwoBishopsWaitingMove = {
  readonly from: Square
  readonly to: Square
}

export type TwoBishopsLineWaitingMoveTargets = {
  readonly from: Square
  readonly to: readonly Square[]
}

export type TwoBishopsWaitingMoveContext = {
  readonly knightDistanceMoves: readonly TwoBishopsWaitingMove[]
  readonly lineTargets: TwoBishopsLineWaitingMoveTargets | null
}

function squaresAreContiguousRankOrFileLine(
  squares: readonly Square[],
): boolean {
  if (squares.length < 2) return false
  const coordinates = squares.map(squareCoordinates)
  const files = new Set(coordinates.map(({ file }) => file))
  const ranks = new Set(coordinates.map(({ rank }) => rank))
  if (files.size !== 1 && ranks.size !== 1) return false
  const values =
    files.size === 1
      ? coordinates.map(({ rank }) => rank)
      : coordinates.map(({ file }) => file)
  return (
    new Set(values).size === squares.length &&
    Math.max(...values) - Math.min(...values) === squares.length - 1
  )
}

function getDiagonalNeighborSquares(square: Square): Square[] {
  const { file, rank } = squareCoordinates(square)
  return [
    squareFromCoordinates(file - 1, rank - 1),
    squareFromCoordinates(file - 1, rank + 1),
    squareFromCoordinates(file + 1, rank - 1),
    squareFromCoordinates(file + 1, rank + 1),
  ].filter((target): target is Square => target !== null)
}

function isLegalMove(fen: string, from: Square, to: Square): boolean {
  try {
    return getChess(fen).move({ from, to }) !== null
  } catch {
    return false
  }
}

function kingsAreAKnightMoveApart(fen: string): boolean {
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  if (!whiteKing || !blackKing) return false
  const white = squareCoordinates(whiteKing.square)
  const black = squareCoordinates(blackKing.square)
  const distances = [
    Math.abs(white.file - black.file),
    Math.abs(white.rank - black.rank),
  ].sort((first, second) => first - second)
  return distances[0] === 1 && distances[1] === 2
}

function keepsPhaseTwoAfterEveryBlackReply(
  fen: string,
  from: Square,
  to: Square,
): boolean {
  const afterWhite = getChess(fen)
  if (afterWhite.move({ from, to }) === null) return false
  const blackMoves = afterWhite.moves()
  if (blackMoves.length === 0) return false
  return blackMoves.every((san) => {
    const afterBlack = getChess(afterWhite.fen())
    afterBlack.move(san)
    return isTwoBishopsPhaseTwoPosition(afterBlack.fen())
  })
}

export function getTwoBishopsKnightDistanceWaitingMoves(
  fen: string,
): TwoBishopsWaitingMove[] {
  if (
    !isTwoBishopsPhaseTwoPosition(fen) ||
    !kingsAreAKnightMoveApart(fen) ||
    !whiteBishopsAreAdjacent(fen)
  ) {
    return []
  }
  return getChess(fen)
    .moves({ verbose: true })
    .filter(
      (move) =>
        move.piece === 'b' &&
        kingDistance(move.from, move.to) === 1 &&
        centerDistance(move.to) < centerDistance(move.from) &&
        keepsPhaseTwoAfterEveryBlackReply(fen, move.from, move.to),
    )
    .map(({ from, to }) => ({ from, to }))
}

export function getTwoBishopsPhaseTwoWaitingMoveTargets(
  fen: string,
): TwoBishopsLineWaitingMoveTargets | null {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return null
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  const bishops = getWhiteBishopSquares(fen)
  if (
    !whiteKing ||
    !blackKing ||
    bishops.length !== 2 ||
    !squaresAreContiguousRankOrFileLine([whiteKing.square, ...bishops])
  ) {
    return null
  }
  const white = squareCoordinates(whiteKing.square)
  const black = squareCoordinates(blackKing.square)
  if (
    Math.abs(white.file - black.file) !== 2 ||
    Math.abs(white.rank - black.rank) !== 2
  ) {
    return null
  }
  const kingColorBishop = bishops.find(
    (bishop) => squareColor(bishop) === squareColor(whiteKing.square),
  )
  if (!kingColorBishop) return null
  const sourceCenterDistance = centerDistance(kingColorBishop)
  const sourceKingDistance = kingDistance(
    kingColorBishop,
    whiteKing.square,
  )
  const targets = getDiagonalNeighborSquares(kingColorBishop).filter(
    (target) =>
      kingDistance(target, whiteKing.square) < sourceKingDistance &&
      centerDistance(target) < sourceCenterDistance &&
      isLegalMove(fen, kingColorBishop, target),
  )
  if (targets.length === 0) return null
  const bestCenterDistance = Math.min(...targets.map(centerDistance))
  return {
    from: kingColorBishop,
    to: targets.filter(
      (target) => centerDistance(target) === bestCenterDistance,
    ),
  }
}

export function getTwoBishopsWaitingMoveContext(
  fen: string,
): TwoBishopsWaitingMoveContext {
  return {
    knightDistanceMoves: getTwoBishopsKnightDistanceWaitingMoves(fen),
    lineTargets: getTwoBishopsPhaseTwoWaitingMoveTargets(fen),
  }
}

export function twoBishopsPhaseTwoWaitingMovePenalty(
  from: Square,
  to: Square,
  context: TwoBishopsWaitingMoveContext,
): number {
  const targets = context.lineTargets
  if (targets) {
    return targets.from === from && targets.to.includes(to) ? 0 : 1
  }
  if (context.knightDistanceMoves.length > 0) {
    return context.knightDistanceMoves.some(
      (target) => target.from === from && target.to === to,
    )
      ? 0
      : 1
  }
  return 0
}
