import { Chess } from 'chess.js'

export function isOneMoveFenTransition(currentFen: string, nextFen: string) {
  try {
    const chess = new Chess(currentFen)
    const target = comparableFen(nextFen)

    return chess.moves({ verbose: true }).some(
      move => comparableFen(move.after) === target,
    )
  } catch {
    return false
  }
}

function comparableFen(fen: string) {
  return fen.split(' ').slice(0, 4).join(' ')
}
