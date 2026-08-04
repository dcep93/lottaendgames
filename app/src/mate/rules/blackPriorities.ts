import { getChess, positionKey } from '../chess'

export const BLACK_CAPTURE_PRIORITY =
  "Take a piece when White isn't looking."
export const BLACK_RETURN_PRIORITY =
  'Return to the previous board position when possible.'

export function getEndgameReturnToPositionMoves(
  fen: string,
  previousTurnFen: string | undefined,
  moves: readonly string[] = getChess(fen).moves(),
): string[] {
  if (!previousTurnFen) return []
  const previousPositionKey = positionKey(previousTurnFen)
  return moves.filter((san) => {
    const chess = getChess(fen)
    return (
      chess.move(san) !== null &&
      positionKey(chess.fen()) === previousPositionKey
    )
  })
}

export function applyUniversalBlackPriorities(
  fen: string,
  previousTurnFen: string | undefined,
  moves: readonly string[],
): readonly string[] {
  let survivors = [...moves]
  const captures = survivors.filter((san) => {
    const chess = getChess(fen)
    return chess.move(san)?.captured !== undefined
  })
  if (captures.length > 0) survivors = captures

  if (previousTurnFen) {
    const returns = getEndgameReturnToPositionMoves(
      fen,
      previousTurnFen,
      survivors,
    )
    if (returns.length > 0) survivors = returns
  }
  return survivors
}
