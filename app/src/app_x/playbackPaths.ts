import { Chess } from 'chess.js'

export function isOneMoveFenTransition(currentFen: string, nextFen: string) {
  try {
    const chess = new Chess(currentFen)
    const target = comparableFen(nextFen)

    for (const move of chess.moves({ verbose: true })) {
      chess.move(move)

      if (comparableFen(chess.fen()) === target) {
        chess.undo()
        return true
      }

      chess.undo()
    }
  } catch {
    return false
  }

  return false
}

function comparableFen(fen: string) {
  return fen.split(' ').slice(0, 4).join(' ')
}
