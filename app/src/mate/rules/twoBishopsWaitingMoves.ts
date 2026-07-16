import type { Square } from 'chess.js'
import {
  edgeDistance,
  findPiece,
  getChess,
  kingDistance,
  squareColor,
  squareCoordinates,
  squareFromCoordinates,
} from '../chess'
import {
  bishopControlsOrOccupiesSquare,
  centerDistance,
  getWhiteBishopDistanceToSquare,
  getWhiteBishopSquares,
  isCorner,
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
  readonly cornerMoves: readonly TwoBishopsWaitingMove[]
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

function canBishopMoveToControlSquare(
  fen: string,
  bishop: Square,
  target: Square,
): boolean {
  return getChess(fen)
    .moves({ verbose: true })
    .filter((move) => move.piece === 'b' && move.from === bishop)
    .some((move) => {
      const chess = getChess(fen)
      chess.move(move.san)
      return bishopControlsOrOccupiesSquare(chess.fen(), move.to, target)
    })
}

function isTwoBishopsCornerWaitingMove(
  fen: string,
  from: Square,
  to: Square,
): boolean {
  const chess = getChess(fen)
  const move = chess.move({ from, to })
  if (move.piece !== 'b' || chess.isCheckmate() || chess.isStalemate()) {
    return false
  }
  const blackMoves = chess.moves({ verbose: true })
  if (blackMoves.length !== 1) return false
  const escapeSquare = blackMoves[0].to
  if (bishopControlsOrOccupiesSquare(chess.fen(), to, escapeSquare)) {
    return false
  }
  const afterBlack = getChess(chess.fen())
  afterBlack.move(blackMoves[0].san)
  return canBishopMoveToControlSquare(afterBlack.fen(), to, escapeSquare)
}

function isMiddle16Square(square: Square): boolean {
  const { file, rank } = squareCoordinates(square)
  return file >= 2 && file <= 5 && rank >= 2 && rank <= 5
}

function getWhiteBishopMiddle16Penalty(fen: string): number {
  return getWhiteBishopSquares(fen).filter(
    (square) => !isMiddle16Square(square),
  ).length
}

function compareNumberArrays(
  first: readonly number[],
  second: readonly number[],
): number {
  for (
    let index = 0;
    index < Math.min(first.length, second.length);
    index += 1
  ) {
    const difference = first[index] - second[index]
    if (difference !== 0) return difference
  }
  return first.length - second.length
}

export function getTwoBishopsCornerWaitingMoves(
  fen: string,
): TwoBishopsWaitingMove[] {
  const blackKing = findPiece(fen, 'b', 'k')
  if (
    !blackKing ||
    !isCorner(blackKing.square) ||
    !isTwoBishopsPhaseTwoPosition(fen)
  ) {
    return []
  }
  const moves = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => move.piece === 'b')
    .filter((move) =>
      isTwoBishopsCornerWaitingMove(fen, move.from, move.to),
    )
  if (moves.length === 0) return []
  const scoredMoves = moves.map((move) => {
    const chess = getChess(fen)
    chess.move(move.san)
    const whiteKing = findPiece(chess.fen(), 'w', 'k')
    const nextBlackKing = findPiece(chess.fen(), 'b', 'k')
    return {
      from: move.from,
      to: move.to,
      score: [
        getWhiteBishopMiddle16Penalty(chess.fen()),
        whiteBishopsAreAdjacent(chess.fen()) ? 0 : 1,
        whiteKing && edgeDistance(whiteKing.square) === 0 ? 1 : 0,
        whiteKing && nextBlackKing
          ? kingDistance(whiteKing.square, nextBlackKing.square)
          : 99,
        nextBlackKing
          ? getWhiteBishopDistanceToSquare(
              chess.fen(),
              nextBlackKing.square,
            )
          : 99,
      ],
    }
  })
  const bestScore = scoredMoves
    .map(({ score }) => score)
    .sort(compareNumberArrays)[0]
  return scoredMoves
    .filter(({ score }) => compareNumberArrays(score, bestScore) === 0)
    .map(({ from, to }) => ({ from, to }))
}

export function getTwoBishopsWaitingMoveContext(
  fen: string,
): TwoBishopsWaitingMoveContext {
  return {
    cornerMoves: getTwoBishopsCornerWaitingMoves(fen),
    lineTargets: getTwoBishopsPhaseTwoWaitingMoveTargets(fen),
  }
}

export function twoBishopsPhaseTwoWaitingMovePenalty(
  from: Square,
  to: Square,
  context: TwoBishopsWaitingMoveContext,
): number {
  if (context.cornerMoves.length > 0) {
    return context.cornerMoves.some(
      (target) => target.from === from && target.to === to,
    )
      ? 0
      : 1
  }
  const targets = context.lineTargets
  if (!targets) return 0
  return targets.from === from && targets.to.includes(to) ? 0 : 1
}
