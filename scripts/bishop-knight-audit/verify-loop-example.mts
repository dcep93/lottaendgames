import {getChess} from '../../app/src/mate/chess.ts';
import {getIdealKnightAndBishopWhiteMoves} from '../../app/src/mate/rules/bishopKnight.ts';
import {code} from './encoding.mts';
import {loopExclusion} from './loop-exclusions.mts';

/** Check every ply, preferred White moves, legal Black replies, and exact closure. */
export function verifyLoopExample(fen: string, moves: readonly string[]): boolean {
  if (!moves.length || moves.length % 2) return false;
  const board = getChess(fen), start = code(fen), turn = board.turn();
  for (const san of moves) {
    if (loopExclusion(board.fen())) return false;
    if (board.turn() === 'w' && !getIdealKnightAndBishopWhiteMoves(board.fen()).includes(san)) return false;
    if (!board.moves().includes(san)) return false;
    const move = board.move(san);
    if (move.captured) return false;
  }
  return !loopExclusion(board.fen()) && board.turn() === turn && code(board.fen()) === start;
}
