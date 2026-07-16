import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  edgeDistance,
  findPiece,
  getChess,
  getSquareTransform,
  kingDistance,
  manhattanDistance,
  squareColor,
  squareCoords,
  transformFen,
  transformSquare,
} from '../chess'
import {
  BISHOP_KNIGHT_LOOKUP_ENTRIES,
  type BishopKnightLookupEntry,
} from './bishopKnightData'

function boardTurnKey(fen: string): string {
  const [board, turn] = fen.split(' ')
  return `${board} ${turn}`
}

function getTransformedPositionKey(
  fen: string,
  transform: (typeof SQUARE_TRANSFORMS)[number],
): string {
  return boardTurnKey(transformFen(fen, transform))
}

export function knightAndBishopPiecesPresent(fen: string): boolean {
  return Boolean(findPiece(fen, 'w', 'b') && findPiece(fen, 'w', 'n'))
}

function terminalLookupOutcome(fen: string): 'checkmate' | 'other' | null {
  if (!knightAndBishopPiecesPresent(fen)) return 'other'
  const chess = getChess(fen)
  if (chess.isCheckmate()) return 'checkmate'
  if (chess.isGameOver()) return 'other'
  return null
}

export function wManeuverSetupDistance(fen: string): number {
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  const bishop = findPiece(fen, "w", "b");
  const knight = findPiece(fen, "w", "n");
  if (!whiteKing || !blackKing || !bishop || !knight) {
    return 99;
  }
  if (edgeDistance(blackKing.square) > 1) {
    return 0;
  }
  const canonicalTargetCorner: Square = "a8";
  const canonicalWrongCorner: Square = "h8";
  const canonicalKing: Square = "f6";
  const canonicalBishops: Square[] = ["e4", "f3"];
  const canonicalKnights: Square[] = ["g5", "e5", "f7", "g4"];
  const scores = SQUARE_TRANSFORMS.map((transform) => {
    const transformedBishop = transformSquare(bishop.square, transform);
    if (
      squareColor(transformedBishop) !==
      squareColor(canonicalTargetCorner)
    ) {
      return null;
    }
    const transformedBlack = transformSquare(
      blackKing.square,
      transform
    );
    const blackCoords = squareCoords(transformedBlack);
    if (blackCoords.file < 5 || blackCoords.rank < 6) {
      return null;
    }
    if (
      kingDistance(transformedBlack, canonicalWrongCorner) >
      kingDistance(transformedBlack, canonicalTargetCorner)
    ) {
      return null;
    }
    const transformedWhiteKing = transformSquare(
      whiteKing.square,
      transform
    );
    const transformedKnight = transformSquare(knight.square, transform);
    const blackDistance = manhattanDistance(
      transformedBlack,
      canonicalWrongCorner
    );
  const kingSetupDistance = manhattanDistance(
      transformedWhiteKing,
      canonicalKing
    );
    const bishopDistance = Math.min(
      ...canonicalBishops.map((square) =>
        manhattanDistance(transformedBishop, square)
      )
    );
    const knightDistance = Math.min(
      ...canonicalKnights.map((square) =>
        manhattanDistance(transformedKnight, square)
      )
    );
  return blackDistance * 4 + kingSetupDistance * 2 + bishopDistance + knightDistance;
  }).filter((score): score is number => score !== null);
  return scores.length > 0 ? Math.min(...scores) : 99;
}

type TransformedLookupMove = {
  readonly from: Square
  readonly to: Square
}

const TRANSFORMED_LOOKUP_MOVES_BY_KEY: ReadonlyMap<
  string,
  readonly TransformedLookupMove[]
> = (() => {
  const movesByKey = new Map<string, TransformedLookupMove[]>()
  for (const transform of SQUARE_TRANSFORMS) {
    const inverse = getSquareTransform(transform.inverseName)
    for (const entry of BISHOP_KNIGHT_LOOKUP_ENTRIES) {
      const [board, turn] = entry.key.split(' ')
      const transformedFen = transformFen(
        `${board} ${turn} - - 0 1`,
        inverse,
      )
      const key = boardTurnKey(transformedFen)
      const candidate = Object.freeze({
        from: transformSquare(entry.from, inverse),
        to: transformSquare(entry.to, inverse),
      })
      movesByKey.set(key, [...(movesByKey.get(key) ?? []), candidate])
    }
  }
  return new Map(
    [...movesByKey.entries()].map(([key, moves]) => [
      key,
      Object.freeze([...moves]),
    ]),
  )
})()

export function getKnightAndBishopLookupWhiteMoves(fen: string): string[] {
  const lookupMoves: string[] = []
  for (const candidate of
    TRANSFORMED_LOOKUP_MOVES_BY_KEY.get(boardTurnKey(fen)) ?? []) {
    const chess = getChess(fen)
    const move = chess.move(candidate)
    if (move && !lookupMoves.includes(move.san)) {
      lookupMoves.push(move.san)
    }
  }
  return lookupMoves
}

export function getKnightAndBishopLookupEntryResultFen(
  entry: BishopKnightLookupEntry,
): string {
  const [board, turn] = entry.key.split(' ')
  const chess = getChess(`${board} ${turn} - - 0 1`)
  chess.move({ from: entry.from, to: entry.to })
  return chess.fen()
}

const LOOKUP_RESULT_KEYS: ReadonlySet<string> = (() => {
  const resultKeys = new Set<string>()
  for (const entry of BISHOP_KNIGHT_LOOKUP_ENTRIES) {
    const resultFen = getKnightAndBishopLookupEntryResultFen(entry)
    for (const transform of SQUARE_TRANSFORMS) {
      resultKeys.add(getTransformedPositionKey(resultFen, transform))
    }
  }
  return resultKeys
})()

export function isKnightAndBishopLookupPhasePosition(fen: string): boolean {
  return (
    knightAndBishopPiecesPresent(fen) &&
    getChess(fen).turn() === 'b' &&
    LOOKUP_RESULT_KEYS.has(boardTurnKey(fen))
  )
}

export function knightAndBishopWhiteMoveReachesLookupPath(
  fen: string,
  san: string,
): boolean {
  const chess = getChess(fen)
  if (chess.turn() !== 'w') return false
  const move = chess.move(san)
  return Boolean(move && knightAndBishopBlackLookupPathSurvives(chess.fen()))
}

export function knightAndBishopBlackLookupPathSurvives(
  fen: string,
): boolean {
  const terminal = terminalLookupOutcome(fen)
  if (terminal) return terminal === 'checkmate'
  if (!isKnightAndBishopLookupPhasePosition(fen)) return false
  const replies = getChess(fen).moves()
  return (
    replies.length > 0 &&
    replies.every((reply) => {
      const next = getChess(fen)
      next.move(reply)
      return knightAndBishopWhiteCanContinueLookupPath(next.fen())
    })
  )
}

export function knightAndBishopWhiteCanContinueLookupPath(
  fen: string,
): boolean {
  const terminal = terminalLookupOutcome(fen)
  if (terminal) return terminal === 'checkmate'
  const chess = getChess(fen)
  if (chess.turn() !== 'w') return false
  if (getKnightAndBishopLookupWhiteMoves(fen).length > 0) return true
  return chess.moves().some((san) => {
    const next = getChess(fen)
    const move = next.move(san)
    return Boolean(
      move &&
        (next.isCheckmate() ||
          isKnightAndBishopLookupPhasePosition(next.fen())),
    )
  })
}

export function isKnightAndBishopMatingNetWhiteTurnPosition(
  fen: string,
): boolean {
  const chess = getChess(fen)
  return (
    chess.turn() === 'w' &&
    knightAndBishopPiecesPresent(fen) &&
    (getKnightAndBishopLookupWhiteMoves(fen).length > 0 ||
      chess
        .moves()
        .some((san) => knightAndBishopWhiteMoveReachesLookupPath(fen, san)))
  )
}

export function getKnightAndBishopPhaseLabel(fen: string): string {
  return isKnightAndBishopMatingNetWhiteTurnPosition(fen) ? '2/2' : '1/2'
}

export function isKnightAndBishopWManeuverPosition(fen: string): boolean {
  const blackKing = findPiece(fen, 'b', 'k')
  return Boolean(
    blackKing &&
      edgeDistance(blackKing.square) <= 1 &&
      wManeuverSetupDistance(fen) === 0,
  )
}
