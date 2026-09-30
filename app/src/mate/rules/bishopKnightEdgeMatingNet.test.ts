import assert from 'node:assert/strict';
import test from 'node:test';
import {Chess, type Square} from 'chess.js';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare, squareFromCoords} from '../chess';
import {getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {edgeMatingNetMoves, matingNetCornerwardKnightMoves, matingNetEdgeOppositionMoves, matingNetFrontKnightMoves, matingNetEdgeSequenceMoves} from './bishopKnightEdgeMatingNet';
import {matingNetMoves} from './bishopKnightMatingNet';

const position = (king: Square, bishop: Square, knight: Square, black: Square) => {
  const board = new Chess(); board.clear();
  for (const [square, type, color] of [[king, 'k', 'w'], [bishop, 'b', 'w'], [knight, 'n', 'w'], [black, 'k', 'b']] as const) board.put({type, color}, square);
  return board.fen();
};
const square = (file: number, rank: number) => squareFromCoords(file, rank) as Square;

test('same-color edge opposition puts the knight toward the mating corner across D4', () => {
  for (let rank = 1; rank < 7; rank++) for (const transform of SQUARE_TRANSFORMS) {
    const bishop = rank === 6 ? 'b3' : rank % 2 === 0 ? 'b1' : 'b2';
    const targetRank = rank + (rank % 2 === 0 ? -1 : 1);
    const fen = transformFen(position(square(5,rank),bishop,square(4,rank),square(7,rank)),transform);
    const move = getChess(fen).move({from:transformSquare(square(4,rank),transform),to:transformSquare(square(6,targetRank),transform)});
    assert.deepEqual(matingNetCornerwardKnightMoves(fen),[move.from+move.to]);
  }
});

test('loaded sixth Ng4 receives r1 credit across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('f5','d3','e5','h5'),transform);
    const expected = getChess(fen).move({from:transformSquare('e5',transform),to:transformSquare('g4',transform)});
    assert.deepEqual(matingNetCornerwardKnightMoves(fen),[expected.from+expected.to]);
    assert.ok(matingNetMoves(fen).includes(expected.from+expected.to));
    assert.equal(scoreKnightAndBishopWhiteMove(fen,expected.san).matingNetPenalty,0);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[expected.san]);
  }
});

test('creating opposition with Kb3 does not qualify for the knight-placement rule across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/5k2 w - - 0 1');
  for (const san of 'Nc4 Ke1 Ke3 Kd1 Na3 Kc1 Nc2 Kb2 Kd3 Kb3 Bc6 Ka2 Kc3 Kb1'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const rejected = getChess(fen).move({from:transformSquare('c3',transform),to:transformSquare('b3',transform)});
    assert.deepEqual(matingNetCornerwardKnightMoves(fen),[]);
    assert.ok(!matingNetMoves(fen).includes(rejected.from+rejected.to));
    assert.equal(scoreKnightAndBishopWhiteMove(fen,rejected.san).matingNetPenalty,1);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[getChess(fen).move({from:transformSquare('c6',transform),to:transformSquare('d5',transform)}).san]);
  }
});


test('cornerward knight requires matching bishop color and inland opposition', () => {
  for (const fen of [position('f5','d4','e5','h5'),position('f4','d3','e5','h5'),position('f1','d3','e1','h1'),position('e5','d3','c5','g5')]) {
    assert.deepEqual(matingNetCornerwardKnightMoves(fen),[]);
  }
});

test('loaded tenth Bf3 check and eleventh Kc3 explicitly receive r1 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  const line = 'Nc4 Kf2 Ke5 Ke1 Kf4 Kd1 Ke3 Kc1 Bd3 Kd1 Na3 Ke1 Nc2+ Kd1 Be4 Kc1 Kd3 Kd1 Bf3+ Kc1 Kc3 Kb1'.split(' ');
  for (const [ply, san] of line.entries()) {
    const before = board.fen(), move = board.move(san);
    if (ply !== 18 && ply !== 20) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen), [expected.from+expected.to]);
      assert.equal(scoreKnightAndBishopWhiteMove(fen,expected.san).matingNetPenalty, 0);
      assert.ok(getChess(fen).moves().some(other => scoreKnightAndBishopWhiteMove(fen,other).matingNetPenalty === 1));
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected.san]);
    }
  }
});

test('Bc4 branch selects eighth Kf6 and tenth Bg8 under r1 across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  const line = 'Nc4 Kf2 Ke5 Kg3 Kf5 Kh4 Bd3 Kh5 Ne5 Kh6 Ng6 Kg7 Bc4 Kh6 Kf6 Kh5 Be6 Kh6 Bg8 Kh5'.split(' ');
  for (const [ply, san] of line.entries()) {
    const before = board.fen(), move = board.move(san);
    if (ply !== 14 && ply !== 18) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before, transform);
      const expected = getChess(fen).move({from: transformSquare(move.from,transform),to: transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen), [expected.from + expected.to]);
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected.san]);
      assert.equal(scoreKnightAndBishopWhiteMove(fen, expected.san).matingNetPenalty, 0);
    }
  }
});

test('loaded eighth Kf4 is r1 and its destination accepts any arriving piece across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const [king,bishop,knight,from,to] of [
    ['f3','c2','g4','f3','f4'],
    ['f4','d3','g4','d3','c2'],
    ['f4','c2','e5','e5','g4'],
  ] as const) {
    const fen = transformFen(position(king,bishop,knight,'h4'), transform);
    const move = getChess(fen).move({from: transformSquare(from,transform),to: transformSquare(to,transform)});
    assert.deepEqual(matingNetEdgeSequenceMoves(fen), [move.from + move.to]);
    // Older r1 mating-net declarations retain precedence for other sources.
    if (from === 'f3') {
      assert.deepEqual(matingNetMoves(fen), [move.from + move.to]);
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san]);
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move.san).matingNetPenalty, 0);
    }
  }
});

test('declared moves five through twelve are selected by r1 across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  const line = 'Nc4 Kf2 Ke5 Kg3 Kf5 Kh4 Bd3 Kh5 Ne5 Kh6 Ng6 Kh7 Kf6 Kg8 Bc4+ Kh7 Bf7 Kh6 Bg8 Kh5 Ne5 Kh4 Kf5 Kh5'.split(' ');
  for (const [ply, san] of line.entries()) {
    const before = board.fen(), move = board.move(san);
    if (ply < 8 || ply % 2) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before, transform);
      const transformed = getChess(fen).move({from: transformSquare(move.from, transform), to: transformSquare(move.to, transform)});
      assert.ok(matingNetMoves(fen).includes(transformed.from + transformed.to), `${san} must receive r1 credit`);
      assert.equal(scoreKnightAndBishopWhiteMove(fen, transformed.san).matingNetPenalty, 0);
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [transformed.san]);
    }
  }
});

test('opposite-color opposition replaces the earlier specific Bg6 preference across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of ['Nc4','Kh2','Ke5','Kh3','Kf4','Kh4']) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const move = getChess(fen).move({from: transformSquare('c4',transform),to: transformSquare('e5',transform)});
    assert.deepEqual(edgeMatingNetMoves(fen),[move.from+move.to]);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  }
});


test('edge opposition places the knight behind White then takes opposition across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const [king,knight,black,from,to] of [
    ['f4','c4','h4','c4','e5'],
    ['f5','c4','h5','c4','e5'],
    ['f3','c4','h3','c4','e3'],
    ['f2','c4','h2','c4','e3'],
  ] as const) {
    const fen = transformFen(position(king,'d3',knight,black),transform);
    const move = getChess(fen).move({from: transformSquare(from,transform),to: transformSquare(to,transform)});
    assert.deepEqual(edgeMatingNetMoves(fen),[move.from+move.to]);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  }
});


test('new knight post requires direct opposition on the far edge', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const [king,bishop,knight,black] of [
    ['f4','d3','c4','h5'], // Not yet in opposition; knight not on its post.
    ['f5','d3','c4','g3'], // Black is not on the far edge.
    ['f4','c3','e5','h5'], // Bishop is not on the cage diagonal.
  ] as const) {
    assert.deepEqual(matingNetEdgeOppositionMoves(transformFen(position(king,bishop,knight,black),transform)),[]);
  }
});


test('opposite-color edge target now precedes taking opposition in Be4 Ne3 formation', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('f3','e4','e3','h4'),transform);
    const move = getChess(fen).move({from: transformSquare('e3',transform),to: transformSquare('g4',transform)});
    assert.deepEqual(edgeMatingNetMoves(fen),[move.from+move.to]);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  }
});


test('bishop covers the far escape so knight goes in front of White across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const bishop of ['e4','d3','h7'] as const) {
    const fen = transformFen(position('f4',bishop,'e5','h5'),transform);
    const move = getChess(fen).move({from: transformSquare('e5',transform),to: transformSquare('g4',transform)});
    assert.deepEqual(matingNetFrontKnightMoves(fen),[move.from+move.to]);
    assert.deepEqual(edgeMatingNetMoves(fen),[move.from+move.to]);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  }
});

test('front knight requires bishop control and the specified king geometry', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const [king,bishop,knight,black] of [
    ['f4','d5','e5','h5'], // Does not control g6.
    ['f5','e4','e5','h5'], // Kings in opposition, not a knight move apart.
    ['e4','d3','e5','h5'], // King not two files from the edge.
  ] as const) {
    assert.deepEqual(matingNetFrontKnightMoves(transformFen(position(king,bishop,knight,black),transform)),[]);
  }
});


test('opposite-color Black on edge places knight directly in front of Black across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const [king,bishop,knight,black,to] of [
    ['f5','d3','e5','h6','g6'],
    ['f5','d3','e5','h4','g4'],
    ['f5','b1','e5','h6','g6'],
    ['f5','b3','e5','h6','g6'], // No bishop control of the escape required.
  ] as const) {
    const fen = transformFen(position(king,bishop,knight,black),transform);
    const move = getChess(fen).move({from: transformSquare(knight,transform),to: transformSquare(to,transform)});
    assert.deepEqual(matingNetFrontKnightMoves(fen),[move.from+move.to]);
    assert.deepEqual(edgeMatingNetMoves(fen),[move.from+move.to]);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  }
});


test('loaded Be2 Kf6 Bc4 Bg8 sequence is r1 along the edge and under D4', () => {
  for (const shift of [-1,0]) for (const transform of SQUARE_TRANSFORMS) {
    const shifted = (s: Square) => {
      const file = s.charCodeAt(0) - 97, rank = Number(s[1]) - 1 + shift;
      return transformSquare(square(file,rank),transform);
    };
    const fen = position(shifted('f5'),shifted('d3'),shifted('g6'),shifted('h5'));
    const board = getChess(fen);
    for (const [from,to,blackFrom,blackTo] of [
      ['d3','e2','h5','h6'], ['f5','f6','h6','h7'],
      ['e2','c4','h7','h6'], ['c4','g8','h6','h5'],
    ] as const) {
      const before = board.fen(), move = board.move({from:shifted(from),to:shifted(to)});
      assert.deepEqual(matingNetEdgeSequenceMoves(before),[move.from+move.to]);
      assert.deepEqual(edgeMatingNetMoves(before),[move.from+move.to]);
      // The shifted final position already has a higher-priority r1 move.
      if (shift === 0) assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before),[move.san]);
      board.move({from:shifted(blackFrom),to:shifted(blackTo)});
    }
  }
});

test('edge sequence accepts every legal bishop source on a6-f1 across D4', () => {
  for (const bishop of ['a6','b5','c4','d3','f1'] as const) for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('f5',bishop,'g6','h5'),transform);
    const move = getChess(fen).move({from:transformSquare(bishop,transform),to:transformSquare(bishop === 'c4' ? 'g8' : 'e2',transform)});
    assert.deepEqual(matingNetEdgeSequenceMoves(fen),[move.from+move.to]);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  }
});


test('front-knight destination rewards king, bishop, and knight arrivals across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const [king,bishop,knight,black,from,to] of [
    ['f5','d3','g4','h5','f5','f4'], // Loaded 7.Kf4 also clears bishop's line.
    ['f4','d3','e5','h5','e5','g4'], // Same destination via knight.
    ['f4','f1','g4','h5','f1','d3'], // Same destination via bishop.
    ['f4','d3','g6','h6','f4','f5'], // Opposite-color motif via king.
  ] as const) {
    const fen = transformFen(position(king,bishop,knight,black),transform);
    const move = getChess(fen).move({from:transformSquare(from,transform),to:transformSquare(to,transform)});
    assert.ok(matingNetFrontKnightMoves(fen).includes(move.from+move.to));
    assert.ok(edgeMatingNetMoves(fen).includes(move.from+move.to));
    if (from === 'f5' && to === 'f4') assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  }
});


test('loaded seventh Bg6 destination slides along the edge across D4', () => {
  for (const shift of [-1,0,1,2]) for (const transform of SQUARE_TRANSFORMS) {
    const shifted = (s: Square) => transformSquare(square(s.charCodeAt(0)-97,Number(s[1])-1+shift),transform);
    const fen = position(shifted('f3'),shifted('d3'),shifted('g4'),shifted('h3'));
    const move = getChess(fen).move({from:shifted('d3'),to:shifted('g6')});
    assert.deepEqual(matingNetEdgeSequenceMoves(fen),[move.from+move.to]);
    assert.deepEqual(edgeMatingNetMoves(fen),[move.from+move.to]);
    // Existing r1 mating-net declarations can outrank the newer edge patterns in shifted cases.
    if (shift === 0) assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  }
});

test('Bg6 destination also accepts king and knight arrivals across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const [king,knight,from,to] of [
    ['f4','g4','f4','f3'], ['f3','e5','e5','g4'],
  ] as const) {
    const fen = transformFen(position(king,'g6',knight,'h3'),transform);
    const move = getChess(fen).move({from:transformSquare(from,transform),to:transformSquare(to,transform)});
    assert.deepEqual(matingNetEdgeSequenceMoves(fen),[move.from+move.to]);
    assert.deepEqual(edgeMatingNetMoves(fen),[move.from+move.to]);
  }
});


test('loaded seventh Bc4 destination slides vertically across D4', () => {
  for (const shift of [-2,-1,0,1]) for (const transform of SQUARE_TRANSFORMS) {
    const shifted = (s: Square) => transformSquare(square(s.charCodeAt(0)-97,Number(s[1])-1+shift),transform);
    const fen = position(shifted('f5'),shifted('d3'),shifted('g6'),shifted('g7'));
    const move = getChess(fen).move({from:shifted('d3'),to:shifted('c4')});
    assert.deepEqual(matingNetEdgeSequenceMoves(fen),[move.from+move.to]);
    assert.deepEqual(edgeMatingNetMoves(fen),[move.from+move.to]);
    if (shift === 0) assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move.san]);
  }
});

test('Bc4 destination accepts king and knight arrivals across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const [king,knight,from,to] of [
    ['f4','g6','f4','f5'], ['f5','e5','e5','g6'],
  ] as const) {
    const fen = transformFen(position(king,'c4',knight,'g7'),transform);
    const move = getChess(fen).move({from:transformSquare(from,transform),to:transformSquare(to,transform)});
    assert.deepEqual(matingNetEdgeSequenceMoves(fen),[move.from+move.to]);
    assert.deepEqual(edgeMatingNetMoves(fen),[move.from+move.to]);
  }
});

test('edge-pattern moves receive r1 credit', () => {
  for (const [king,bishop,knight,black,san,other] of [
    ['f5','d3','c4','h5','Ne5','Nb6'],
    ['f5','d3','g4','h5','Kf4','Ne5'],
    ['f3','d3','g4','h3','Bg6','Be4'],
    ['f5','d3','g6','g7','Bc4','Be4'],
  ] as const) {
    const fen = position(king,bishop,knight,black), board=getChess(fen);
    const moves=board.moves({verbose:true});
    const wanted=moves.find(move=>move.san===san)!;
    const alternative=moves.find(move=>move.san===other)!;
    assert.ok(matingNetMoves(fen).includes(wanted.from+wanted.to));
    assert.equal(scoreKnightAndBishopWhiteMove(fen,wanted.san).matingNetPenalty,0);
    assert.equal(scoreKnightAndBishopWhiteMove(fen,alternative.san).matingNetPenalty,1);
  }
});
