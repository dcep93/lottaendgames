import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../../app/src/mate/chess';
import {getIdealKnightAndBishopWhiteMoves as preferred} from '../../app/src/mate/rules/bishopKnight';
import {happyR2DestinationBounds} from '../../app/src/mate/rules/bishopKnightHappyR2Data';
import {canonical, code, fen} from './encoding.mts';

export function happyR2Starts(): string[] {
  const starts: string[] = [];
  for (const base of ['8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1', '8/8/8/3BN3/3K4/8/8/6k1 w - - 0 1']) {
    for (let file = 0; file < 8; file++) for (let rank = 0; rank < 8; rank++) {
      if (Math.abs(file - rank) < 3) continue;
      const board = getChess(base); board.remove('g1');
      const square = `${'abcdefgh'[file]}${rank + 1}` as Parameters<typeof board.get>[0];
      if (board.get(square)) continue;
      board.put({type: 'k', color: 'b'}, square);
      if (!board.isCheck() && !board.isAttacked(square, 'w')) starts.push(board.fen());
    }
  }
  return starts;
}

/** Check real runtime decisions, including every tie, every Black reply and all D4 orientations. */
export function verifyHappyR2() {
  const starts = happyR2Starts(), nodes: number[] = [], ids = new Map<number, number>();
  function add(source: string) {
    const key = canonical(code(source));
    if (!ids.has(key)) { ids.set(key, nodes.length); nodes.push(key); }
    return ids.get(key)!;
  }
  const roots = starts.map(add);
  // Also certify every destination, even if the final selector avoids it from these roots.
  // This is what makes matching a new source by full destination safe.
  for (const [key] of happyR2DestinationBounds) {
    const board = getChess(); board.clear();
    const pieces = ['k', 'b', 'n', 'k'] as const;
    for (let i = 0; i < 4; i++) board.put({type: pieces[i]!, color: i === 3 ? 'b' : 'w'}, key.slice(i * 2, i * 2 + 2) as Parameters<typeof board.get>[0]);
    const black = getChess(board.fen().replace(' w ', ' b '));
    assert.ok(!black.isStalemate(), `Stalemate destination: ${key}`);
    for (const reply of black.moves({verbose: true})) {
      assert.ok(!reply.captured, `Unsafe destination: ${key}`);
      add(reply.after);
    }
  }
  const edges: number[][] = [];
  let blackReplies = 0, symmetryChecks = 0, mateMoves = 0;
  for (let i = 0; i < nodes.length; i++) {
    assert.ok(nodes.length < 10000, 'Route certificate escaped its bounded region');
    const source = fen(nodes[i]!), board = getChess(source), choices = preferred(source);
    assert.ok(choices.length, `No selected move: ${source}`);
    const moves = choices.map(san => getChess(source).move(san));
    for (const transform of SQUARE_TRANSFORMS) {
      const reflected = transformFen(source, transform);
      const expected = moves.map(move => transformSquare(move.from, transform) + transformSquare(move.to, transform)).sort();
      const actual = preferred(reflected).map(san => { const move = getChess(reflected).move(san); return move.from + move.to; }).sort();
      assert.deepEqual(actual, expected, `Non-equivalent reflected policy: ${source}`);
      symmetryChecks++;
    }
    const row: number[] = [];
    for (const move of moves) {
      board.move(move);
      if (board.isCheckmate()) { mateMoves++; board.undo(); continue; }
      const replies = board.moves({verbose: true});
      assert.ok(replies.length, `Stalemate after ${move.san} from ${source}`);
      for (const reply of replies) {
        assert.ok(!reply.captured, `Piece loss after ${move.san} from ${source}`);
        row.push(add(reply.after)); blackReplies++;
      }
      board.undo();
    }
    edges.push(row);
  }
  const indegree = nodes.map(() => 0);
  for (const row of edges) for (const to of row) indegree[to]!++;
  const order = indegree.flatMap((n, i) => n ? [] : [i]);
  for (let i = 0; i < order.length; i++) for (const to of edges[order[i]!]!) if (!--indegree[to]!) order.push(to);
  assert.equal(order.length, nodes.length, 'The real selected policy contains a cycle');
  const remaining = nodes.map(() => 1);
  for (const i of order.reverse()) for (const to of edges[i]!) remaining[i] = Math.max(remaining[i]!, 2 + remaining[to]!);
  return {complete: true, scope: 'Two satisfied-r4 representatives, |Black file-rank| >= 3, all D4 equivalents. All runtime White ties and legal Black replies; counters excluded from identity.',
    starts: starts.map((source, i) => ({fen: source, maxPlies: remaining[roots[i]!]!})),
    whiteStateOrbits: nodes.length, blackReplies, symmetryChecks, mateMoves, loops: 0,
    maxPlies: Math.max(...roots.map(i => remaining[i]!))};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = verifyHappyR2();
  if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
