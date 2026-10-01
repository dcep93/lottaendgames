import './load-setup.mts';
import {getChess} from '../../app/src/mate/chess.ts';
import {getIdealKnightAndBishopWhiteMoves} from '../../app/src/mate/rules/bishopKnight.ts';
import {code} from './encoding.mts';
import {loopExclusion, loopSearchExclusion, deferredKnightOppositionCycle, deferredCompleteR4Loop} from './loop-exclusions.mts';

/** Check every ply, preferred White moves, legal Black replies, and exact closure. */
export function verifyLoopExample(fen: string, moves: readonly string[], options: {fullAudit?: boolean; includeDegenerate?: boolean} = {}): boolean {
  const excluded = options.fullAudit && options.includeDegenerate ? () => null : options.fullAudit ? loopExclusion : loopSearchExclusion;
  if (!moves.length || moves.length % 2) return false;
  const board = getChess(fen), start = code(fen), turn = board.turn();
  const whitePositions: string[] = [], whiteMoves: string[] = [];
  const positions: string[] = [];
  for (const san of moves) {
    positions.push(board.fen());
    if (excluded(board.fen())) return false;
    if (board.turn() === 'w' && !getIdealKnightAndBishopWhiteMoves(board.fen()).includes(san)) return false;
    if (!board.moves().includes(san)) return false;
    if (board.turn() === 'w') { whitePositions.push(board.fen()); whiteMoves.push(san); }
    const move = board.move(san);
    if (move.captured) return false;
  }
  if (!options.fullAudit && deferredKnightOppositionCycle(whitePositions, whiteMoves)) return false;
  if (!options.fullAudit && deferredCompleteR4Loop(positions)) return false;
  return !excluded(board.fen()) && board.turn() === turn && code(board.fen()) === start;
}
