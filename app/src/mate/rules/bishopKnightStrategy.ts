import type { Square } from 'chess.js'
import { allSquares, kingDistance, findPiece, getChess, isKnightMove, squareColor, squareCoords, squaredEuclideanDistance, SQUARE_TRANSFORMS, transformSquare } from '../chess'

const matingBishopDiagonal = ['a7', 'b6', 'c5', 'd4', 'e3', 'f2', 'g1'] as const
const bishopApproachDiagonal = ['b6', 'c5', 'd4', 'e3', 'f2', 'g1'] as const
const finishingBishopDiagonal = ['d7', 'e6', 'f5', 'g4', 'h3'] as const

const bishopSetupDiagonal = ['a3', 'b4', 'c5', 'd6', 'e7', 'f8'] as const
const bishopSetupPatterns = SQUARE_TRANSFORMS.flatMap(transform =>
  ([
    { knight: 'b7', blackKing: 'a6', sourceDiagonal: ['c8', ...finishingBishopDiagonal], destinations: finishingBishopDiagonal, reply: 'a7' },
    { knight: 'c7', blackKing: 'b8', sourceDiagonal: matingBishopDiagonal, destinations: matingBishopDiagonal, reply: 'c8' },
    { knight: 'c7', blackKing: 'c8', sourceDiagonal: bishopApproachDiagonal, destinations: ['a7'], reply: 'd8' },
    { knight: 'c7', blackKing: 'd8', sourceDiagonal: bishopApproachDiagonal, destinations: bishopSetupDiagonal, reply: 'c8' },
    { knight: 'c7', blackKing: 'c8', sourceDiagonal: ['a3', 'b4', 'd6', 'e7', 'f8'], destinations: ['e7'], reply: 'b8' },
    { knight: 'c7', blackKing: 'b8', sourceDiagonal: bishopSetupDiagonal, destinations: ['c5'], reply: 'c8' },
  ] as const).map(pattern => ({
    whiteKing: transformSquare('c6', transform),
    knight: transformSquare(pattern.knight, transform),
    blackKing: transformSquare(pattern.blackKing, transform),
    sourceDiagonal: pattern.sourceDiagonal.map(square => transformSquare(square, transform)),
    destinations: pattern.destinations.map(square => transformSquare(square, transform)),
    reply: transformSquare(pattern.reply, transform),
  })))

const matingContinuationPatterns = SQUARE_TRANSFORMS.flatMap(transform =>
  ([
    { whiteKing: 'f6', knight: 'e4', blackKing: 'h6', bishopSquares: ['d5'], from: 'f6', to: 'f5' },
    { whiteKing: 'f5', knight: 'e4', blackKing: 'h5', bishopSquares: ['d5'], from: 'e4', to: 'f2' },
    { whiteKing: 'f5', knight: 'f2', blackKing: 'h6', bishopSquares: ['d5'], from: 'f2', to: 'g4' },
    { whiteKing: 'f5', knight: 'g4', blackKing: 'g7', bishopSquares: ['d5'], from: 'g4', to: 'e5' },
    { whiteKing: 'f5', knight: 'e5', blackKing: 'f8', bishopSquares: ['d5'], from: 'f5', to: 'f6' },
    { whiteKing: 'f6', knight: 'e5', blackKing: 'e8', bishopSquares: ['d5'], from: 'f6', to: 'e6' },
    { whiteKing: 'e6', knight: 'e5', blackKing: 'd8', bishopSquares: ['d5'], from: 'e5', to: 'd7' },
    { whiteKing: 'e5', knight: 'e4', blackKing: 'h7', bishopSquares: ['d5'], from: 'e5', to: 'f6' },
    { whiteKing: 'f6', knight: 'e4', blackKing: 'h8', bishopSquares: ['d5'], from: 'e4', to: 'd6' },
    { whiteKing: 'f6', knight: 'd6', blackKing: 'h7', bishopSquares: ['d5'], from: 'd6', to: 'f7' },
    { whiteKing: 'f6', knight: 'f7', blackKing: 'g8', bishopSquares: ['d5'], from: 'd5', to: 'e4' },
    { whiteKing: 'e6', knight: 'e4', blackKing: 'f8', bishopSquares: ['d5'], from: 'e4', to: 'd6' },
    { whiteKing: 'e6', knight: 'd6', blackKing: 'g7', bishopSquares: ['d5'], from: 'd6', to: 'f7' },
    { whiteKing: 'e6', knight: 'f7', blackKing: 'g6', bishopSquares: ['d5'], from: 'd5', to: 'f3' },
    { whiteKing: 'e6', knight: 'f7', blackKing: 'g7', bishopSquares: ['f3'], from: 'f3', to: 'e4' },
    { whiteKing: 'f6', knight: 'e4', blackKing: 'e8', bishopSquares: ['d5'], from: 'f6', to: 'e6' },
    { whiteKing: 'e6', knight: 'e4', blackKing: 'd8', bishopSquares: ['d5'], from: 'e4', to: 'c5' },
    { whiteKing: 'e6', knight: 'c5', blackKing: 'c8', bishopSquares: ['d5'], from: 'c5', to: 'd7' },
    { whiteKing: 'c6', knight: 'b7', blackKing: 'a7', bishopSquares: finishingBishopDiagonal, from: 'b7', to: 'c5' },
    { whiteKing: 'c6', knight: 'c5', blackKing: 'a8', bishopSquares: finishingBishopDiagonal, from: 'c6', to: 'b6' },
    { whiteKing: 'b6', knight: 'c5', blackKing: 'b8', bishopSquares: finishingBishopDiagonal, from: 'c5', to: 'a6' },
    { whiteKing: 'c6', knight: 'b7', blackKing: 'a8', bishopSquares: ['c8', 'd7', 'e6', 'f5', 'g4', 'h3'], from: 'c6', to: 'b6' },
    { whiteKing: 'c6', knight: 'c7', blackKing: 'd8', bishopSquares: ['a7'], from: 'c7', to: 'd5' },
    { whiteKing: 'c6', knight: 'd5', blackKing: 'e8', bishopSquares: matingBishopDiagonal, from: 'c6', to: 'd6' },
    { whiteKing: 'd6', knight: 'd5', blackKing: 'f7', bishopSquares: matingBishopDiagonal, from: 'd5', to: 'e7' },
    { whiteKing: 'd6', knight: 'd5', blackKing: 'd8', bishopSquares: matingBishopDiagonal, from: 'd5', to: 'e7' },
    { whiteKing: 'd6', knight: 'e7', blackKing: 'e8', bishopSquares: matingBishopDiagonal, from: 'd6', to: 'e6' },
  ] as const).map(pattern => ({
    whiteKing: transformSquare(pattern.whiteKing, transform),
    knight: transformSquare(pattern.knight, transform),
    blackKing: transformSquare(pattern.blackKing, transform),
    from: transformSquare(pattern.from, transform),
    to: transformSquare(pattern.to, transform),
    diagonal: pattern.bishopSquares.map(square => transformSquare(square, transform)),
  })))

export function getKnightAndBishopMatingContinuationMoves(fen: string): readonly string[] {
  const white = findPiece(fen, 'w', 'k')
  const black = findPiece(fen, 'b', 'k')
  const knight = findPiece(fen, 'w', 'n')
  const bishop = findPiece(fen, 'w', 'b')
  if (!bishop) return []
  const patterns = matingContinuationPatterns.filter(pattern =>
    pattern.whiteKing === white?.square && pattern.blackKing === black?.square &&
    pattern.knight === knight?.square && pattern.diagonal.includes(bishop.square))
  const bishopPatterns = bishopSetupPatterns.filter(pattern =>
    pattern.whiteKing === white?.square && pattern.blackKing === black?.square &&
    pattern.knight === knight?.square && pattern.sourceDiagonal.includes(bishop.square))
  if (patterns.length === 0 && bishopPatterns.length === 0) return []
  const chess = getChess(fen)
  if (chess.turn() !== 'w') return []
  return chess.moves({ verbose: true }).filter(move => {
    if (patterns.some(pattern => move.from === pattern.from && move.to === pattern.to)) return true
    if (move.piece !== 'b') return false
    const matching = bishopPatterns.filter(pattern => pattern.destinations.includes(move.to))
    if (matching.length === 0) return false
    const after = getChess(fen)
    after.move(move.san)
    const replies = after.moves({ verbose: true })
    return replies.length === 1 && matching.some(pattern => replies[0]!.to === pattern.reply)
  }).map(move => move.san)
}

export function knightAndBishopCenterProximityScore(square: Square): number {
  const { file, rank } = squareCoords(square)
  // Four times squared distance to the board's midpoint keeps scores integral.
  return (2 * file - 7) ** 2 + (2 * rank - 7) ** 2
}

export function knightAndBishopKingCenterProximityScore(fen: string): number {
  const king = findPiece(fen, 'w', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  if (!king || !bishop) return 99
  return Math.min(...CENTRAL_SQUARES
    .filter(square => squareColor(square) !== squareColor(bishop.square))
    .map(square => squaredEuclideanDistance(king.square, square)))
}

const CENTRAL_SQUARES: readonly Square[] = ['d4', 'e4', 'd5', 'e5']
const squares = allSquares()
const knightNeighbors = new Map(squares.map(square =>
  [square, squares.filter(other => isKnightMove(square, other))]))
// Knight-move distances depend only on board geometry, so compute them once.
const knightDistances = new Map(squares.map(start => {
  const distances = new Map<Square, number>([[start, 0]])
  const queue = [start]
  for (let i = 0; i < queue.length; i++) {
    const square = queue[i]!
    for (const next of knightNeighbors.get(square)!) {
      if (distances.has(next)) continue
      distances.set(next, distances.get(square)! + 1)
      queue.push(next)
    }
  }
  return [start, distances]
}))

export function knightAndBishopKnightTargetSquares(fen: string): Square[] {
  const bishop = findPiece(fen, 'w', 'b')
  if (!bishop || !CENTRAL_SQUARES.includes(bishop.square)) return []
  const centers = CENTRAL_SQUARES.filter(square => squareColor(square) === squareColor(bishop.square)).map(squareCoords)
  return squares.filter(square => {
    const target = squareCoords(square)
    return centers.some(center => Math.abs(target.file - center.file) === 1 &&
      Math.abs(target.rank - center.rank) === 1) &&
      !CENTRAL_SQUARES.includes(square) &&
      target.file !== target.rank && target.file + target.rank !== 7
  })
}

export function knightAndBishopKnightTargetProximityScore(fen: string): number {
  const knight = findPiece(fen, 'w', 'n')
  const targets = knightAndBishopKnightTargetSquares(fen)
  return knight && targets.length > 0
    ? Math.min(...targets.map(target => knightDistances.get(knight.square)!.get(target)!)) : 99
}

export function knightAndBishopKnightProximityToSquare(fen: string, target: Square): number {
  const knight = findPiece(fen, 'w', 'n')
  return knight ? knightDistances.get(knight.square)!.get(target)! : 99
}

export const SEVEN_SQUARE_DIAGONALS: readonly (readonly Square[])[] = [
  ['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8'],
  ['b1', 'c2', 'd3', 'e4', 'f5', 'g6', 'h7'],
  ['a7', 'b6', 'c5', 'd4', 'e3', 'f2', 'g1'],
  ['b8', 'c7', 'd6', 'e5', 'f4', 'g3', 'h2'],
]

const TARGET_CORNER_EXCEPTIONS = SQUARE_TRANSFORMS.map(transform => ({
  whiteKing: transformSquare('f6', transform),
  knight: transformSquare('f7', transform),
  blackKing: transformSquare('h7', transform),
  target: transformSquare('a8', transform),
}))

export function knightAndBishopTargetCorners(fen: string): Square[] {
  const black = findPiece(fen, 'b', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  if (!black || !bishop) return []
  const white = findPiece(fen, 'w', 'k')
  const knight = findPiece(fen, 'w', 'n')
  const exception = TARGET_CORNER_EXCEPTIONS.find(pattern =>
    pattern.whiteKing === white?.square && pattern.knight === knight?.square &&
    pattern.blackKing === black.square)
  if (exception) return [exception.target]
  const corners: Square[] = ['a1', 'a8', 'h1', 'h8']
  const matching = corners.filter(corner => squareColor(corner) === squareColor(bishop.square))
  const closest = Math.min(...matching.map(corner => squaredEuclideanDistance(corner, black.square)))
  return matching.filter(corner => squaredEuclideanDistance(corner, black.square) === closest)
}

export function knightAndBishopTargetCornerDiagonals(fen: string): readonly (readonly Square[])[] {
  const targets = knightAndBishopTargetCorners(fen)
  const diagonals = SEVEN_SQUARE_DIAGONALS.filter(diagonal => targets.some(corner =>
    squareColor(diagonal[0]!) === squareColor(corner)))
  return diagonals.filter(diagonal => targets.some(corner => {
    const distance = (line: readonly Square[]) => Math.min(...line.map(square => squaredEuclideanDistance(square, corner)))
    return distance(diagonal) === Math.min(...diagonals.map(distance))
  }))
}


/** Knight-move distance to an available square defended by White's king. */
export function knightKingProtectionDistance(fen: string): number {
 const king = findPiece(fen, 'w', 'k');
 const knight = findPiece(fen, 'w', 'n');
 if (!king || !knight) return 99;
 const bishop = findPiece(fen, 'w', 'b');
 const black = findPiece(fen, 'b', 'k');
 const targets = squares.filter(s => kingDistance(s, king.square) === 1
   && s !== bishop?.square && s !== black?.square);
 return Math.min(...targets.map(s => knightDistances.get(knight.square)!.get(s)!));
}
