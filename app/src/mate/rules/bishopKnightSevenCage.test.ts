import assert from 'node:assert/strict';
import test from 'node:test';
import {Chess, type Square} from 'chess.js';
import {findPiece, getChess, squareColor, SQUARE_TRANSFORMS, transformFen, transformSquare, squareFromCoords} from '../chess';
import {getIdealKnightAndBishopWhiteMoves} from './bishopKnight';
import {declaredSevenCageMove, sevenCageMoves, sevenCageDestinationMoves, isSevenCageTemporaryTerminal, nonTargetCornerKnightMoves, sevenCageFormationMoves} from './bishopKnightSevenCage';

const position = (king: Square, bishop: Square, knight: Square, black: Square) => {
  const board = new Chess(); board.clear();
  for (const [square, type, color] of [[king, 'k', 'w'], [bishop, 'b', 'w'], [knight, 'n', 'w'], [black, 'k', 'b']] as const) board.put({type, color}, square);
  return board.fen();
};
const square = (file: number, rank: number) => squareFromCoords(file, rank) as Square;

test('cage entry requires a strict king-step lead over Black reaching the h6 neighborhood', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    // Kc3 is one step from d4. From h3 Black is two steps from that neighborhood;
    // from h4 Black is one step away, so equality must not admit the entry jump.
    for (const [king,black,allowed] of [
      ['c3','h3',true], ['c3','h4',false],
      ['d4','h4',true], ['d4','h5',false],
      ['b2','h2',true], ['b2','h3',false],
      ['c3','c1',true],
    ] as const) {
      const fen = transformFen(position(king,'e4','e5',black),transform);
      const jump = transformSquare('e5',transform) + transformSquare('c4',transform);
      assert.equal(sevenCageMoves(fen).includes(jump), allowed, `${transform.name}: ${king}/${black}`);
    }
  }
});

test('loaded specific Be4 then cage-entry Nc4 work with Kc3 across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess('8/8/8/3BN3/3K4/8/8/2k5 w - - 0 1');
    for (const san of ['Kc3','Kd1','Be4','Kc1','Nc4']) {
      const before = board.fen(), move = board.move(san);
      if (!['Be4','Nc4'].includes(san)) continue;
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from: transformSquare(move.from,transform),to: transformSquare(move.to,transform)});
      assert.deepEqual(sevenCageMoves(fen), [expected.from + expected.to]);
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected.san]);
    }
    // The cage is defined by its minor-piece posts and Black's region, not Kd4.
    const elsewhere = transformFen(position('f5','d3','e5','d1'),transform);
    assert.ok(sevenCageMoves(elsewhere).includes(transformSquare('e5',transform) + transformSquare('c4',transform)));
  }
});

test('established cage includes Black h5 while entry jump still excludes it across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('d4','e4','c4','h5'), transform);
    const kingMove = getChess(fen).move({from: transformSquare('d4',transform), to: transformSquare('e5',transform)});
    assert.ok(sevenCageMoves(fen).includes(kingMove.from + kingMove.to));
    assert.ok(!sevenCageMoves(fen).includes(transformSquare('c4',transform) + transformSquare('e5',transform)));
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [kingMove.san]);
    const entry = transformFen(position('d4','e4','e5','h5'), transform);
    assert.ok(!sevenCageMoves(entry).includes(transformSquare('e5',transform) + transformSquare('c4',transform)));
    for (const black of ['g5','h6'] as const) {
      assert.ok(sevenCageFormationMoves(transformFen(position('d4','e4','c4',black),transform)).length);
    }
  }
});

test('Black d1 prefers the Kd4 Be4 Ne5 arrival across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('d4','d5','e5','d1'),transform);
    const move = getChess(fen).move({from: transformSquare('d5',transform), to: transformSquare('e4',transform)});
    assert.deepEqual(sevenCageMoves(fen), [move.from + move.to]);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san]);
  }
});

test('five-diagonal arrival accepts any moving piece and includes the triangle boundary across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const black of ['d1','e1','e2','g3','h1','h5'] as Square[]) {
      for (const [king,bishop,knight,from,to] of [
        ['d4','d5','e5','d5','e4'],
        ['c3','e4','e5','c3','d4'],
        ['d4','e4','g4','g4','e5'],
      ] as const) {
        const fen = transformFen(position(king,bishop,knight,black),transform);
        if (getChess(fen).isAttacked(transformSquare(black,transform),'w')) continue;
        const uci = transformSquare(from,transform) + transformSquare(to,transform);
        assert.ok(sevenCageDestinationMoves(fen).includes(uci), fen);
      }
    }
    for (const black of ['c1','d2','e3','h6'] as Square[]) {
      const fen = transformFen(position('d4','d5','e5',black),transform);
      if (getChess(fen).isAttacked(transformSquare(black,transform),'w')) continue;
      assert.ok(!sevenCageDestinationMoves(fen).includes(transformSquare('d5',transform) + transformSquare('e4',transform)));
    }
  }
});

test('specific third-move Kd4 matches the supplied position across D4 and counters', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/1k6/8 w - - 0 1');
  for (const move of ['Kd3','Kc1','Kc3','Kd1']) board.move(move);
  for (const transform of SQUARE_TRANSFORMS) for (const counters of ['0 1','4 3','38 20']) {
    const fen = transformFen(board.fen().replace(/\d+ \d+$/, counters), transform);
    const move = getChess(fen).move({from: transformSquare('c3',transform), to: transformSquare('d4',transform)});
    assert.equal(declaredSevenCageMove(fen), move.from + move.to);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san]);
    assert.equal(declaredSevenCageMove(transformFen(position('c3','e4','e5','e1'),transform)), undefined);
  }
});

test('established cage prefers opposite-color king squares nearer the edge opposite N across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('d4','e4','c4','f2'), transform);
    const move = getChess(fen).move({from: transformSquare('d4',transform), to: transformSquare('e5',transform)});
    assert.ok(sevenCageMoves(fen).includes(move.from + move.to));
    const waitingBishop = getChess(fen).move({from: transformSquare('e4',transform), to: transformSquare('d3',transform)});
    // e5 is closer to the h-file than d4, despite equal distance to h1.
    assert.ok(!sevenCageMoves(fen).includes(waitingBishop.from + waitingBishop.to));
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san]);
    const afterNc4 = transformFen(position('d4','e4','c4','e2'), transform);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(afterNc4), [move.san]);
    const loaded = transformFen(position('d4','d3','c4','f3'), transform);
    assert.deepEqual(sevenCageMoves(loaded), [move.from + move.to]);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(loaded), [move.san]);
    // After reaching the desired color, selected moves retain the cage posts.
    const waiting = transformFen(position('e5','e4','c4','f2'), transform);
    const choices = sevenCageFormationMoves(waiting);
    assert.ok(choices.length);
    // f4 and f6 tie in proximity to the h-file; rank does not break the tie.
    assert.deepEqual(new Set(choices), new Set(['f4','f6'].map(to => transformSquare('e5',transform) + transformSquare(to as Square,transform))));
    for (const uci of choices) {
      const board = getChess(waiting);
      const played = board.move({from: uci.slice(0,2) as Square, to: uci.slice(2) as Square});
      assert.notEqual(played.piece, 'n');
      const after = board.fen();
      assert.equal(findPiece(after, 'w', 'n')!.square, transformSquare('c4', transform));
      assert.notEqual(squareColor(findPiece(after, 'w', 'k')!.square), squareColor(findPiece(after, 'w', 'b')!.square));
      const diagonal = Array.from({length: 7}, (_, rank) => transformSquare(square(rank + 1, rank), transform));
      assert.ok(diagonal.includes(findPiece(after, 'w', 'b')!.square));
    }
    assert.deepEqual(sevenCageFormationMoves(transformFen(position('d4','e4','c4','h8'),transform)), []);
    assert.deepEqual(sevenCageFormationMoves(transformFen(position('d4','e4','e5','f2'),transform)), []);
    assert.deepEqual(sevenCageFormationMoves(transformFen(position('d4','d5','c4','f4'),transform)), []);
  }
});

test('wrong-corner knight route selects Nc6 then Nd4 across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const first = transformFen(position('c3','e4','e5','a2'), transform);
    const second = transformFen(position('c3','e4','c6','a3'), transform);
    for (const [fen, from, to] of [[first,'e5','c6'],[second,'c6','d4']] as const) {
      const expected = getChess(fen).move({from: transformSquare(from,transform), to: transformSquare(to,transform)});
      assert.ok(sevenCageMoves(fen).includes(expected.from + expected.to));
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected.san]);
    }
    for (const [king, bishop, knight, black] of [
      ['c3','d4','e5','a2'], // Bishop targets a1: not the wrong corner.
      ['c3','e4','e5','a4'], // Black outside the two-step corner region.
      ['d3','e4','e5','a2'], // White king not two diagonally from the corner.
      ['c3','e4','d4','a2'], // Already at the target.
    ] as const) assert.deepEqual(nonTargetCornerKnightMoves(transformFen(position(king,bishop,knight,black),transform)), []);
  }
});

test('r2 selects the three new steps in the loaded line across D4 and counters', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess('8/8/8/3BN3/3K4/8/2k5/8 w - - 0 1');
    for (const san of ['Nf3','Kd1','Kd3','Kc1','Kc3','Kd1','Bc4','Kc1','Nd4','Kd1']) {
      const before = board.fen(), move = board.move(san);
      if (!['Nf3','Bc4','Nd4'].includes(san)) continue;
      for (const counters of ['0 1','38 20']) {
        const fen = transformFen(before.replace(/\d+ \d+$/, counters), transform);
        const expected = getChess(fen).move({from: transformSquare(move.from, transform), to: transformSquare(move.to, transform)});
        assert.deepEqual(sevenCageMoves(fen), [expected.from + expected.to]);
        assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected.san]);
      }
    }
  }
});

test('Nf3 arrival permits every bishop square on a2–g8 and any incoming piece', () => {
  for (let file = 0; file < 7; file++) for (const transform of SQUARE_TRANSFORMS) {
    const bishop = square(file, file + 1);
    for (const [king, knight, from, to] of [['d4','e5','e5','f3'], ['e4','f3','e4','d4']] as const) {
      const fen = transformFen(position(king, bishop, knight, 'c2'), transform);
      if (getChess(fen).isAttacked(transformSquare('c2', transform), 'w')) continue;
      const uci = transformSquare(from, transform) + transformSquare(to, transform);
      assert.ok(sevenCageMoves(fen).includes(uci), fen);
    }
  }
  assert.deepEqual(sevenCageMoves(position('d4','h1','e5','c2')), []);
});

test('translated bishop and knight arrivals use the full shifted diagonal across D4', () => {
  // Shift by two files: Kc3/Nf3/Kd1 -> Ke3/Nh3/Kf1, diagonal a8–h1.
  for (const dx of [-1, 0, 1, 2]) for (let file = 0; file < 8; file++) {
    const rank = 5 + dx - file;
    if (rank < 0 || rank > 7) continue;
    const bishop = square(file, rank);
    for (const transform of SQUARE_TRANSFORMS) {
      // Arrive at the Bc4 formation by moving the king; bishop location is a wildcard.
      const from = square(1 + dx, 2), to = square(2 + dx, 2);
      if (bishop !== from) {
        const fen = transformFen(position(from, bishop, square(5 + dx, 2), square(3 + dx, 0)), transform);
        const uci = transformSquare(from, transform) + transformSquare(to, transform);
        if (!getChess(fen).isAttacked(transformSquare(square(3 + dx, 0), transform), 'w'))
          assert.ok(sevenCageMoves(fen).includes(uci), fen);
      }
      // Arrive at the Nd4 formation from f3; same diagonal wildcard.
      const fen = transformFen(position(square(2 + dx, 2), bishop, square(5 + dx, 2), square(2 + dx, 0)), transform);
      if (getChess(fen).isAttacked(transformSquare(square(2 + dx, 0), transform), 'w')) continue;
      assert.ok(sevenCageMoves(fen).includes(transformSquare(square(5 + dx, 2), transform) + transformSquare(square(3 + dx, 3), transform)), fen);
    }
  }
});

test('relative arrivals require Black on the edge; old r2 entry and terminal stay discarded', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const inland = transformFen(position('c4','d6','f4','d2'), transform);
    assert.ok(!sevenCageMoves(inland).includes(transformSquare('d6',transform) + transformSquare('c5',transform)));
    const old = transformFen('8/8/8/4N3/3KB3/8/3k4/8 w - - 0 1', transform);
    assert.equal(declaredSevenCageMove(old), undefined);
    assert.equal(isSevenCageTemporaryTerminal(transformFen('8/8/8/8/8/2K5/B1N5/3k4 w - - 6 4',transform)), false);
  }
});


test('new exact Be4 and regional Nc4 select the loaded moves across D4 and counters', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const counters of ['0 1', '38 20']) {
    const source = transformFen('8/8/8/3BN3/3K4/8/4k3/8 w - - ' + counters, transform);
    const board = getChess(source);
    const bishop = board.move({from: transformSquare('d5',transform), to: transformSquare('e4',transform)});
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(source), [bishop.san]);
    board.move({from: transformSquare('e2',transform), to: transformSquare('d2',transform)});
    const before = board.fen(), knight = board.move({from: transformSquare('e5',transform), to: transformSquare('c4',transform)});
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [knight.san]);
    assert.equal(declaredSevenCageMove(transformFen(position('d4','d5','e5','c2'), transform)), undefined);
  }
});

test('regional Nc4 includes the triangle boundary and excludes the h6 neighborhood across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const black of ['c1','d1','d2','e2','f4','h1','h4'] as Square[]) for (const knight of ['e5','b2'] as Square[]) {
      const fen = transformFen(position('d4','e4',knight,black),transform);
      if (getChess(fen).isAttacked(transformSquare(black,transform), 'w')) continue;
      assert.deepEqual(sevenCageMoves(fen), [transformSquare(knight,transform)+transformSquare('c4',transform)]);
    }
    for (const black of ['c2','f5','g5','g6','g7','h5','h6','h7','g8','h8'] as Square[]) {
      const fen = transformFen(position('d4','e4','e5',black),transform);
      if (getChess(fen).isAttacked(transformSquare(black,transform), 'w')) continue;
      assert.ok(!sevenCageMoves(fen).includes(transformSquare('e5',transform)+transformSquare('c4',transform)),fen);
    }
  }
});

test('explicit Black d1 formation selects Nc4 under r2 across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('d4','e4','e5','d1'), transform);
    const move = getChess(fen).move({from: transformSquare('e5',transform), to: transformSquare('c4',transform)});
    assert.deepEqual(sevenCageMoves(fen), [move.from + move.to]);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san]);
  }
});
