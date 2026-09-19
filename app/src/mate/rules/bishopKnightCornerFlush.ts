import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import example from './bishopKnightCornerFlushExample.json'

const declaredMoves = new Map<string, string>()
const lines = [
  { fen: example.fen, moves: example.moves.map(step => step.san) },
  { fen: '7k/8/5K2/8/4B3/3N4/8/8 w - - 0 1', moves: ['Ne5', 'Kg8', 'Nf7', 'Kf8', 'Bh7'] },
  { fen: '8/6k1/8/6K1/4B3/3N4/8/8 w - - 0 1', moves: ['Ne5', 'Kf8', 'Kg6'] },
]
for (const declaration of lines) {
  const line = getChess(declaration.fen)
  for (const san of declaration.moves) {
    const fen = line.fen()
    const move = line.move(san)
    if (move.color !== 'w') continue
    for (const transform of SQUARE_TRANSFORMS) {
      const key = transformFen(fen, transform).split(' ').slice(0, 2).join(' ')
      const preferred = transformSquare(move.from, transform) + transformSquare(move.to, transform)
      const existing = declaredMoves.get(key)
      if (existing && existing !== preferred) throw new Error(`Conflicting r4 moves for ${key}`)
      declaredMoves.set(key, preferred)
    }
  }
}

export function knightAndBishopDeclaredCornerFlushMove(fen: string): string | undefined {
  return declaredMoves.get(fen.split(' ').slice(0, 2).join(' '))
}
