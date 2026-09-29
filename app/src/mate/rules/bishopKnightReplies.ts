import type {Chess, Move, Square} from 'chess.js';

type KingReply = Pick<Move, 'from' | 'to' | 'piece' | 'captured' | 'san'>;

/** KBNvK scoring needs legal destinations and captures, not before/after FENs.
 * Keep chess.js as the legality authority, but avoid constructing verbose Moves.
 */
export function bishopKnightBlackReplies(chess: Chess, blackKing: Square | undefined): KingReply[] {
  const moves = chess.moves();
  // Preserve the general scorer's behavior if called outside the lone-king case.
  if (!blackKing || chess.turn() !== 'b' || moves.some(san => !/^Kx?[a-h][1-8][+#]?$/.test(san))) {
    return chess.moves({verbose: true});
  }
  return moves.map(san => {
    const to = san.slice(san[1] === 'x' ? 2 : 1, san[1] === 'x' ? 4 : 3) as Square;
    return {san, from: blackKing, to, piece: 'k', captured: chess.get(to)?.type};
  });
}
