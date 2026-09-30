import assert from 'node:assert/strict';
import test from 'node:test';
import {Chess, type Square} from 'chess.js';
import {findPiece, getChess, SQUARE_TRANSFORMS, transformFen, transformSquare, squareFromCoords} from '../chess';
import {bishopKnightRuleSet, scoreKnightAndBishopWhiteMove as scoreRuntimeMove} from './bishopKnight';
import {selectIdealMoves} from './selection';
import {matingNetMoves} from './bishopKnightMatingNet';
import {declaredSevenCageMove, sevenCageHeuristicMoves, sevenCageFallbackMoves, sevenCageDestinationMoves, isSevenCageTemporaryTerminal, nonTargetCornerKnightMoves, sevenCageFormationMoves} from './bishopKnightSevenCage';

// These tests pin the historical fallback preferences. The verified destination
// tier may supersede them; bishopKnightHappyR2.test.ts verifies the real runtime
// policy and its complete mating routes separately, without bypassing any rule.
function scoreHeuristicMove(fen: string, san: string) {
  const choices = sevenCageHeuristicMoves(fen), move = getChess(fen).move(san);
  return {...scoreRuntimeMove(fen, san), sevenCagePenalty:
    choices.length && !choices.includes(move.from + move.to) ? 1 : 0};
}
function getIdealHeuristicMoves(fen: string): string[] {
  const choices = sevenCageHeuristicMoves(fen);
  const candidates = bishopKnightRuleSet.scoreWhiteCandidates!(fen, getChess(fen).moves()).map(candidate => {
    const move = getChess(fen).move(candidate.san);
    return {...candidate, score: {...candidate.score, sevenCagePenalty:
      choices.length && !choices.includes(move.from + move.to) ? 1 : 0}};
  });
  return [...selectIdealMoves(candidates, bishopKnightRuleSet.whiteRules)];
}

const position = (king: Square, bishop: Square, knight: Square, black: Square) => {
  const board = new Chess(); board.clear();
  for (const [square, type, color] of [[king, 'k', 'w'], [bishop, 'b', 'w'], [knight, 'n', 'w'], [black, 'k', 'b']] as const) board.put({type, color}, square);
  return board.fen();
};
const square = (file: number, rank: number) => squareFromCoords(file, rank) as Square;


test('d1-start revised fourth Ne3 after Kf3 Kg1 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/3k4 w - - 0 1');
  for (const san of ['Nc4','Ke1','Ke3','Kf1','Kf3','Kg1','Ne3','Kh2']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('d1-start fifth Ng4 after Ne5 Kh1 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/3k4 w - - 0 1');
  for (const san of ['Nc4','Ke1','Ke3','Kf1','Kf3','Kg1','Ne5','Kh1','Ng4','Kg1']) {
    const before = board.fen(), move = board.move(san);
    // Ne3 now supersedes this historical Ne5; replay it to verify Ng4.
    if (move.color !== 'w' || san === 'Ne5') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g3-start third Ng4 check after Kf3 Kh2 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of ['Ke3','Kh3','Kf3','Kh2','Ng4+','Kh3']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g3-start third Kf3 after Kf4 Kg1 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of ['Ke3','Kh2','Kf4','Kg1','Kf3','Kf1']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g3-start revised second Kf4 after Ke3 Kh2 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of ['Ke3','Kh2','Kf4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g3-start revised second Kf3 after Ke3 Kh3 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of ['Ke3','Kh3','Kf3','Kh4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g3-start fourth Ke4 after Bd3 Kg3 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of ['Ke3','Kh3','Nc4','Kg4','Bd3','Kg3','Ke4','Kg4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w' || san === 'Nc4') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g3-start Bd3 after Nc4 Kg3 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of ['Ke3','Kh3','Nc4','Kg3','Bd3','Kg4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w' || san === 'Nc4') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h5-start Ne5 after Ke3 Kg3 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nf7','Kh4','Ke3','Kg3','Ne5','Kh4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h5-start Kf4 after Ke3 Kh3 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nf7','Kh4','Ke3','Kh3','Kf4','Kh4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h5-start eighth Kf5 after Ke5 Kg3 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nf7','Kh4','Ke3','Kg4','Bd3','Kg3','Ne5','Kh3','Nc4','Kg3','Ke4','Kg4','Ke5','Kg3','Kf5','Kf3']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    // The newer full destination is also reached by Kf4 here, superseding Nc4.
    const selected = san === 'Nc4' ? getChess(before).move('Kf4') : move;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(selected.from,transform),to:transformSquare(selected.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h5-start fifth Ne5 after Kf4 Kh3 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nf7','Kh4','Ke3','Kg4','Bd3','Kh4','Kf4','Kh3','Ne5','Kh2']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h5-start fourth Ne5 with Be4 after Kf4 Kh3 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nf7','Kg4','Ke3','Kh4','Kf4','Kh3','Ne5','Kh2']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h6-start second Nf7 receives r2 credit across D4', () => {
  const board = getChess('8/8/7k/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Kd5','Kh5','Nf7','Kg4']) {
    const before = board.fen(), move = board.move(san);
    // Replay the historical approach; initial Kd5 is superseded by Nc6.
    if (move.color !== 'w' || san === 'Kd5') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h6-start revised first Nc6 receives r2 credit across D4', () => {
  const board = getChess('8/8/7k/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nc6','Kg5']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h6-start second Ke5 after Nc6 Kh5 receives r2 credit across D4', () => {
  const board = getChess('8/8/7k/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nc6','Kh5','Ke5','Kg4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h6-start Nc6 Ke5 Kf5 Ne5 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/7k/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nc6','Kg7','Ke5','Kh6','Kf5','Kg7','Ne5','Kf8']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h6-start third Kf5 after Ke5 Kf7 receives r2 credit across D4', () => {
  const board = getChess('8/8/7k/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nc6','Kg7','Ke5','Kf7','Kf5']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g5-start Nc6 Kd5 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N1k1/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nc6','Kf4','Kd5','Ke3']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g5-start Nc6 Ke5 after Kh4 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N1k1/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nc6','Kh4','Ke5','Kg4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g5-start Nc6 Ke5 Nd4 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N1k1/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nc6','Kg4','Ke5','Kg5','Nd4','Kh6']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g5-start Kd5 Ke5 after Nc6 Kf6 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N1k1/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nc6','Kf6','Kd5','Kg5','Ke5','Kg4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g5-start Ke5 Ke6 Ne5 after Nc6 Kh6 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N1k1/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nc6','Kh6','Ke5','Kg7','Ke6','Kg8','Ne5']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('e1-start revised fourth Ne3 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/4k3 w - - 0 1');
  for (const san of 'Nc4 Kf2 Ke5 Kg1 Kf4 Kh2 Ne3 Kg1'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f8-start first Nc6 receives r2 credit across D4', () => {
  const board = getChess('5k2/8/8/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Nc6'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f8-start third Kf6 after Ke5 Kf8 receives r2 credit across D4', () => {
  const board = getChess('5k2/8/8/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Nc6 Kg8 Ke5 Kf8 Kf6 Ke8'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f8-start fourth Ne5 after Kf6 Kg8 receives r2 credit across D4', () => {
  const board = getChess('5k2/8/8/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Nc6 Kg8 Ke5 Kh8 Kf6 Kg8 Ne5 Kf8'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f8-start fifth Ne5 after Bf5 Kf8 receives r2 credit across D4', () => {
  const board = getChess('5k2/8/8/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Nc6 Kg8 Ke5 Kf8 Kf6 Ke8 Bf5 Kf8 Ne5 Ke8'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('b6-start Nd3 Kd4 after Kc4 Kc5 receives r2 credit across D4', () => {
  const board = getChess('8/8/1k6/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Kc4 Ka5 Kc5 Ka4 Nd3 Kb3 Kd4 Ka4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      // Latest Ke3–Be4–Nc4 line supersedes Nd3 at this identical D4 position.
      // Keep replaying the historical route to guard its later declarations.
      const expected = getChess(fen).move(san === 'Nd3'
        ? {from:transformSquare('e4',transform),to:transformSquare('d5',transform)}
        : {from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('a5-start Nc4 Nd6 after Kc5 Ka6 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/k3N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Kc5 Ka6 Nc4 Ka7 Nd6'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('a5-start Nc1 Nb3 Kc6 after Nd3 Ka5 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/k3N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Kc5 Ka4 Nd3 Ka5 Nc1 Ka6 Nb3 Ka7 Kc6'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      // Latest Ke3–Be4–Nc4 line supersedes Nd3 at this identical D4 position.
      // Keep replaying the historical route to guard its later declarations.
      const expected = getChess(fen).move(san === 'Nd3'
        ? {from:transformSquare('e4',transform),to:transformSquare('d5',transform)}
        : {from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('a5-start fourth Ne5 check after Kd4 Kc2 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/k3N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Kc5 Ka4 Nd3 Kb3 Kd4 Kc2 Ne5+ Kd2'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      // Latest Ke3–Be4–Nc4 line supersedes Nd3 at this identical D4 position.
      // Keep replaying the historical route to guard its later declarations.
      const expected = getChess(fen).move(san === 'Nd3'
        ? {from:transformSquare('e4',transform),to:transformSquare('d5',transform)}
        : {from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('a6-start fifth Kc7 after Kd6 Kb5 receives r2 credit across D4', () => {
  const board = getChess('8/8/k7/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Bd5 Ka7 Nd3 Kb6 Ke5 Ka5 Kd6 Kb5 Kc7'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('rotated b6-start third Be4 after Kf4 Kh4 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BK3/3N4/6k1/8/8 w - - 0 1');
  for (const san of 'Kf5 Kh3 Kf4 Kh4 Be4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('established f1-start Be4 Nc4 Ke3 Kf3 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/5k2 w - - 0 1');
  for (const san of 'Be4 Kg1 Nc4 Kf1 Ke3 Ke1 Kf3 Kd1'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('established f1-start Kg1 branch preserves Kf3 then Kg3 ahead of fallback Bd3 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/5k2 w - - 0 1');
  for (const san of 'Be4 Kg1 Nc4 Kf1 Ke3 Kg1 Kf3 Kf1 Kg3 Kg1 Bd3 Kh1 Ne3'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f2-start third Be4 after Kd3 Kf1 Ke3 Kg1 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/5k2/8 w - - 0 1');
  for (const san of 'Kd3 Kf1 Ke3 Kg1 Be4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f1-start second Nc4 after Be4 Kf2 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/5k2 w - - 0 1');
  for (const san of 'Be4 Kf2 Nc4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w' || san !== 'Nc4') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('e1-start second Be4 after Kd3 Kf2 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/4k3 w - - 0 1');
  for (const san of 'Kd3 Kf2 Be4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w' || san !== 'Be4') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g3-start second Be4 after Nc4 Kf4 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/6k1/8/8 w - - 0 1');
  for (const san of 'Nc4 Kf4 Be4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w' || san !== 'Be4') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('Bd5 g3-start third Ng4 check after Kf3 Kh2 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/6k1/8/8 w - - 0 1');
  for (const san of 'Ke3 Kh3 Kf3 Kh2 Ng4+'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      if (san === 'Ng4+') {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('Bd5 g3-start Kf3 Kf4 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/6k1/8/8 w - - 0 1');
  for (const san of 'Ke3 Kh3 Kf3 Kh4 Kf4 Kh3'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f1-start fourth Kf4 after Ke5 Kf1 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/5k2 w - - 0 1');
  for (const san of 'Be4 Kg1 Nc4 Kf2 Ke5 Kf1 Kf4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('c1-start third Ne3 after Nc4 Ka1 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/2k5 w - - 0 1');
  for (const san of 'Kc3 Kb1 Nc4 Ka1 Ne3 Kb1'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('c1-start Nc4 Ne3 after Kc3 Kb1 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/2k5 w - - 0 1');
  for (const san of 'Kc3 Kb1 Nc4 Kc1 Ne3 Kb1'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('c1-start Nc4 after Be4 Kc1 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/2k5 w - - 0 1');
  for (const san of 'Kc3 Kd1 Be4 Kc1 Nc4 Kd1'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('c1-start Kc3 Be4 Nc4 Kd4 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/2k5 w - - 0 1');
  for (const san of 'Kc3 Kd1 Be4 Ke1 Nc4 Kf1 Kd4 Ke2'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('c2-start fourth Nc4 check against Kb2 fallback respects established destinations across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/2k5/8 w - - 0 1');
  // Fallback declarations must not replace these established continuations.
  const established: Record<number, string> = {1: "Be4+"};
  let whitePly = 0;
  for (const san of 'Kc4 Kb2 Kb4 Kc2 Be4+ Kb2 Nc4+ Ka1'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    const override = established[++whitePly];
    const selected = override ? getChess(before).move(override) : move;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(selected.from,transform),to:transformSquare(selected.to,transform)});
      if (override) {
        assert.deepEqual(sevenCageFallbackMoves(fen), [transformSquare(move.from,transform)+transformSquare(move.to,transform)]);
      }
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('c2-start Kb4 Be4 Nc4 checks fallback respects established destinations across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/2k5/8 w - - 0 1');
  // Fallback declarations must not replace these established continuations.
  const established: Record<number, string> = {1: "Be4+"};
  let whitePly = 0;
  for (const san of 'Kc4 Kb2 Kb4 Kc2 Be4+ Kd2 Nc4+ Ke2'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    const override = established[++whitePly];
    const selected = override ? getChess(before).move(override) : move;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(selected.from,transform),to:transformSquare(selected.to,transform)});
      if (override) {
        assert.deepEqual(sevenCageFallbackMoves(fen), [transformSquare(move.from,transform)+transformSquare(move.to,transform)]);
      }
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f5-start Ke5 Kf6 Bd3 after Nc4 Kg3 fallback respects established destinations across D4', () => {
  const board = getChess('8/8/8/3BNk2/3K4/8/8/8 w - - 0 1');
  // Fallback declarations must not replace these established continuations.
  const established: Record<number, string> = {7: "Bf5"};
  let whitePly = 0;
  for (const san of 'Nc6 Kf4 Be4 Kg3 Ne5 Kf4 Nc4 Kg3 Ke5 Kg4 Kf6 Kf4 Bd3 Kf3'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    const override = established[++whitePly];
    const selected = override ? getChess(before).move(override) : move;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(selected.from,transform),to:transformSquare(selected.to,transform)});
      if (override) {
        assert.deepEqual(sevenCageFallbackMoves(fen), [transformSquare(move.from,transform)+transformSquare(move.to,transform)]);
      }
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f5-start revised Ne5 Nc4 after Be4 Kg3 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BNk2/3K4/8/8/8 w - - 0 1');
  for (const san of 'Nc6 Kf4 Be4 Kg3 Ne5 Kf4 Nc4 Kg5'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f5-start Nc6 Be4 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BNk2/3K4/8/8/8 w - - 0 1');
  for (const san of 'Nc6 Kf4 Be4 Kg5'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('c2-start Kc4 Be4 Kd5 Nc4 fallback respects established destinations across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/2k5/8 w - - 0 1');
  // Fallback declarations must not replace these established continuations.
  const established: Record<number, string> = {1: "Be4+", 4: "Nc6"};
  let whitePly = 0;
  for (const san of 'Kc4 Kd2 Be4 Ke3 Kd5 Kf4 Nc4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    const override = established[++whitePly];
    const selected = override ? getChess(before).move(override) : move;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(selected.from,transform),to:transformSquare(selected.to,transform)});
      if (override) {
        assert.deepEqual(sevenCageFallbackMoves(fen), [transformSquare(move.from,transform)+transformSquare(move.to,transform)]);
      }
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f1-start fifth Bd3 check after Kf3 Kf1 fallback respects established destinations across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/5k2 w - - 0 1');
  // Fallback declarations must not replace these established continuations.
  const established: Record<number, string> = {5: "Kg3"};
  let whitePly = 0;
  for (const san of 'Be4 Kg1 Nc4 Kf1 Ke3 Kg1 Kf3 Kf1 Bd3+'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    const override = established[++whitePly];
    const selected = override ? getChess(before).move(override) : move;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(selected.from,transform),to:transformSquare(selected.to,transform)});
      if (override) {
        assert.deepEqual(sevenCageFallbackMoves(fen), [transformSquare(move.from,transform)+transformSquare(move.to,transform)]);
      }
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('e1-start sixth Bd3 check after Kg3 Kf1 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/4k3 w - - 0 1');
  for (const san of 'Ke3 Kd1 Be4 Ke1 Nc4 Kf1 Kf4 Ke2 Kg3 Kf1 Bd3+ Ke1'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('repaired e1-start Ke3 Be4 Nc4 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/8/8/4k3 w - - 0 1');
  for (const san of 'Ke3 Kd1 Be4 Ke1 Nc4 Kd1'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g3-start fourth Be4 after Ng4 Kg5 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/3BN3/3K4/6k1/8/8 w - - 0 1');
  for (const san of 'Ke3 Kh3 Kf3 Kh4 Ng4 Kg5 Be4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      if (san === 'Be4') {
        assert.deepEqual(matingNetMoves(fen),[]);
        assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
        assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      }
      // The later Kf4 request supersedes Ng4 here; retain the later Be4 assertion.
      const selected = san === 'Ng4'
        ? getChess(fen).move({from:transformSquare('f3',transform),to:transformSquare('f4',transform)}).san
        : expected.san;
      assert.deepEqual(getIdealHeuristicMoves(fen),[selected]);
    }
  }
});

test('a4-start fourth Ne5 check after Kc5 Kb7 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/k2KB3/8/8/8 w - - 0 1');
  for (const san of 'Nc6 Kb5 Kd5 Ka6 Kc5 Kb7 Ne5+'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('a4-start fifth Bd5 after Kd6 check Kb6 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/k2KB3/8/8/8 w - - 0 1');
  for (const san of 'Nc6 Kb5 Kd5 Kb6 Nd4 Kb7 Kd6+ Kb6 Bd5'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f8-start fourth Ne5 after Kd5 Kc7 receives r2 credit across D4', () => {
  const board = getChess('5k2/8/8/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Nc6 Ke8 Ke5 Kd7 Kd5 Kc7 Ne5'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('a4-start third Kc4 after Kd5 Ka4 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/k2KB3/8/8/8 w - - 0 1');
  for (const san of 'Nc6 Kb5 Kd5 Ka4 Kc4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('c7-start Kd4 remains preferred after the historical Nd3 line receives r2 credit across D4', () => {
  const board = getChess('8/2k5/8/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Kd5 Kb6 Nd3 Kb5 Kd4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    // The newer Kc4 preference supersedes Nd3 from this source.
    if (move.color !== 'w' || san === 'Nd3') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      // Destination matching now takes Kc5 immediately from the initial position.
      const destination = san === 'Kd5' ? 'c5' : move.to;
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(destination,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('c7-start revised Kc4 Kc5 after Kd5 Kb6 receives r2 credit across D4', () => {
  const board = getChess('8/2k5/8/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Kd5 Kb6 Kc4 Kc7 Kc5 Kd8'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      // Destination matching now takes Kc5 immediately from the initial position.
      const destination = san === 'Kd5' ? 'c5' : move.to;
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(destination,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g7-start third Nc4 after Ke6 Kg5 receives r2 credit across D4', () => {
  const board = getChess('8/6k1/8/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Kd5 Kh6 Ke6 Kg5 Nc4'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w' || san !== 'Nc4') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('b8-start sixth Ke5 after Bc4 Ke7 receives r2 credit across D4', () => {
  const board = getChess('1k6/8/8/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Bd5 Kc8 Nd3 Kd8 Ke5 Ke7 Kf5 Kd6 Bc4 Ke7 Ke5 Kd7'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w' || move.before.split(' ')[0] !== '8/4k3/8/5K2/2B5/3N4/8/8') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h6-start fourth Kf6 after Kf5 Kg8 receives r2 credit across D4', () => {
  const board = getChess('8/8/7k/4N3/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Nc6 Kg7 Ke5 Kf7 Kf5 Kg8 Kf6 Kf8'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('g5-start Ne7 Nf5 line uses revised Ne3 destination across D4', () => {
  const board = getChess('8/8/8/4N1k1/3KB3/8/8/8 w - - 0 1');
  for (const san of 'Nc6 Kh5 Ke5 Kh6 Kf5 Kh7 Kf6+ Kh6 Ne7 Kh5 Kf5 Kh4 Kf4 Kh3 Nf5 Kh2 Nd6 Kh3'.split(' ')) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      // The later Ne3 destination also wins when reached from f5 instead of c4.
      const destination = san === 'Nd6' ? 'e3' : move.to;
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(destination,transform)});
      const r1 = matingNetMoves(fen);
      assert.ok(!r1.length || (r1.length === 1 && r1[0] === expected.from+expected.to));
      if (!r1.length) assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to], before);
      if (!r1.length) assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('established e1-start Nc4 is preserved against reflected Ke5 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/4k3 w - - 0 1');
  for (const san of ['Nc4','Kf2','Ke5','Ke2','Kf4','Kd1']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('established d1-start Nc4 Ke5 Kf4 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/3k4 w - - 0 1');
  for (const san of ['Nc4','Ke2','Ke5','Kd1','Kf4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h5-start eighth Ne3 and ninth Kf4 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nf7','Kh4','Ke3','Kg4','Bd3','Kg3','Ne5','Kg2','Nc4','Kg3','Ke4','Kg4','Ke5','Kg5','Ne3','Kh4','Kf4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('f2-start Ng4 check and Bd3 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/5k2/8 w - - 0 1');
  for (const san of ['Nc4','Kg3','Ke5','Kh4','Kf4','Kh3','Ne5','Kh2','Ng4+','Kg1','Bd3','Kh1']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h5-start fifth Ne5 after Kf3 Kh2 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nf7','Kh4','Ke3','Kg4','Bd3','Kh3','Kf3','Kh2','Ne5','Kh3']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h5-start fourth Ne5 after Bd3 Kg3 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nf7','Kh4','Ke3','Kg4','Bd3','Kg3','Ne5']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h5-start fourth Kf4 after Bd3 Kh4 receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nf7','Kh4','Ke3','Kg4','Bd3','Kh4','Kf4','Kh5']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('h5-start Nf7 Kh4 Ke3 Bd3 branch receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nf7','Kh4','Ke3','Kg4','Bd3','Kh5']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('revised h5-start Nf7 Ke3 Kf4 line receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Nf7','Kg4','Ke3','Kh5','Kf4','Kh4']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('historical h5-start Kf4 continuation receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N2k/3KB3/8/8/8 w - - 0 1');
  for (const san of ['Ke3','Kh4','Kf4','Kh5']) {
    const before = board.fen(), move = board.move(san);
    if (move.color !== 'w' || san === 'Ke3') continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('r2 restores the bishop cage diagonal after an explicit departure across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of 'Nc4 Kf2 Ke5 Kg3 Kf5 Kh4 Bd3 Kg3 Kg5 Kf3 Bf5 Kg3 Bg4 Kg2 Kf4 Kf2 Bf3 Ke1'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const move = getChess(fen).move({from: transformSquare('f3',transform),to: transformSquare('e4',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [move.from + move.to]);
    assert.equal(scoreHeuristicMove(fen,move.san).sevenCagePenalty, 0);
    const other = getChess(fen).move({from: transformSquare('f4',transform),to: transformSquare('e3',transform)});
    assert.equal(scoreHeuristicMove(fen,other.san).sevenCagePenalty, 1);
    assert.deepEqual(getIdealHeuristicMoves(fen), [move.san]);
  }
});

test('loaded sixth Ne5 gets r2 credit independent of the bishop across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of 'Nc4 Kg4 Ke5 Kg5 Bd3 Kh6 Kf4 Kh5 Kf5 Kh6'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('c4',transform),to:transformSquare('e5',transform)});
    assert.deepEqual(matingNetMoves(fen),[]);
    assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
    assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
  }
  for (let index = 0; index < 64; index++) {
    const bishop = square(index % 8,Math.floor(index / 8));
    if (['f5','e5','h6','c4'].includes(bishop)) continue;
    const source = position('f5',bishop,'c4','h6');
    if (getChess(source).isAttacked('h6','w')) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(source,transform);
      const expected = getChess(fen).move({from:transformSquare('c4',transform),to:transformSquare('e5',transform)});
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to],bishop);
    }
  }
});

test('Ne5 arrival permits the bishop anywhere on b1-h7 across D4', () => {
  for (const bishop of ['b1','c2','d3','e4','f5','g6','h7'] as Square[]) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(position('f6',bishop,'c4','h6'),transform);
      const expected = getChess(fen).move({from:transformSquare('c4',transform),to:transformSquare('e5',transform)});
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to], bishop);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      // Existing safety rules still reject stalemate (Bg6) or a hanging Bh7.
      if (bishop === 'g6') assert.equal(getChess(expected.after).isStalemate(),true);
      if (bishop === 'g6' || bishop === 'h7') assert.ok(!getIdealHeuristicMoves(fen).includes(expected.san));
      else assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san],bishop);
    }
  }
});

test('revised fourth Kf5 and fifth Ne5 receive r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/5k2/8 w - - 0 1');
  const line = 'Nc4 Kg3 Ke5 Kg4 Kf6 Kh5 Kf5 Kh4 Ne5 Kg3'.split(' ');
  for (const [ply,san] of line.entries()) {
    const before = board.fen(), move = board.move(san);
    if (ply % 2 || ply < 6) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('loaded seventh Ng6 and eighth Bb5 receive r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  const line = 'Nc4 Kg4 Ke5 Kg5 Bd3 Kh6 Kf6 Kh5 Kf5 Kh6 Ne5 Kg7 Ng6 Kf7 Bb5 Kg7'.split(' ');
  for (const [ply,san] of line.entries()) {
    const before = board.fen(), move = board.move(san);
    if (ply % 2 || ply < 12) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen),[]);
      assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
      assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    }
  }
});

test('loaded fifth Bf5 explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of 'Nc4 Kg4 Ke5 Kg5 Bd3 Kg4 Kf6 Kf4'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('d3',transform),to:transformSquare('f5',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('loaded fourth Kf6 after Kh5 explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of 'Nc4 Kg4 Ke5 Kg5 Bd3 Kh5'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('e5',transform),to:transformSquare('f6',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('loaded fourth Kf6 with Bd3 explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of 'Nc4 Kg4 Ke5 Kg5 Bd3 Kh6'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('e5',transform),to:transformSquare('f6',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('loaded third Kf6 explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB2k/8/8/8 w - - 0 1');
  for (const san of 'Nc4 Kg5 Ke5 Kh6'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('e5',transform),to:transformSquare('f6',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('loaded fifth Kf5 explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of 'Nc4 Kg4 Ke5 Kg5 Bd3 Kg4 Kf6 Kh5'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('f6',transform),to:transformSquare('f5',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('loaded fourth Ne5 explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/6k1/8/8 w - - 0 1');
  for (const san of 'Nc4 Kg4 Ke5 Kh5 Kf6 Kh6'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('c4',transform),to:transformSquare('e5',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('loaded seventh Be4 explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/5k2 w - - 0 1');
  for (const san of 'Nc4 Kg1 Ke3 Kf1 Kf3 Ke1 Bf5 Kd1 Kf2 Kc1 Bd3 Kd1'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('d3',transform),to:transformSquare('e4',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('loaded sixth Bd3 explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/5k2 w - - 0 1');
  for (const san of 'Nc4 Ke2 Ke5 Kf2 Kf4 Kf1 Kg3 Ke2 Kg2 Ke1'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('e4',transform),to:transformSquare('d3',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('loaded sixth Kg2 explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/5k2 w - - 0 1');
  for (const san of 'Nc4 Kg1 Ke3 Kf1 Kf3 Ke1 Bf5 Kf1 Kg3 Ke1'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('g3',transform),to:transformSquare('g2',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('loaded tenth Bc4 check explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of 'Nc4 Kf2 Ke5 Ke1 Kf4 Kd1 Ke3 Kc1 Bd3 Kd1 Na3 Kc1 Nc2 Kb2 Kd2 Kb1 Kc3 Ka2'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('d3',transform),to:transformSquare('c4',transform)});
    assert.ok(expected.san.endsWith('+'));
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('loaded eighth Nf7 check explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of 'Nc4 Kf2 Ke5 Kg3 Kf5 Kh4 Kf4 Kh5 Ne5 Kh6 Kf5 Kh7 Kf6+ Kh8'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('e5',transform),to:transformSquare('f7',transform)});
    assert.ok(expected.san.endsWith('+'));
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('loaded Kd2 Bb5 Bc4 continuation explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  const line = 'Nc4 Kf2 Ke5 Ke1 Kf4 Kd1 Ke3 Kc1 Bd3 Kd1 Na3 Kc1 Nc2 Kb2 Kd2 Kb3 Bb5 Kb2 Bc4 Kb1'.split(' ');
  for (const [ply, san] of line.entries()) {
    const before = board.fen(), move = board.move(san);
    if (ply % 2) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen), [], `${ply/2+1}.${san} r1`);
      assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to], `${ply/2+1}.${san} r2`);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
      assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
      assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san], `${ply/2+1}.${san} selected`);
    }
  }
});

test('historical edge line retains r2 continuations with revised Ne5 replacing Kf4 across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  const line = 'Nc4 Kf2 Ke5 Kg3 Kf5 Kh4 Kf4 Kh5 Ne5 Kh6 Kf5 Kg7 Ng6 Kf7 Bc6 Kg7 Bd5 Kh6'.split(' ');
  for (const [ply, san] of line.entries()) {
    const before = board.fen(), move = board.move(san);
    if (ply % 2) continue;
    // The newer Ne5 destination supersedes Kf4 from this same board.
    const selected = ply === 6 ? getChess(before).move('Ne5') : move;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(selected.from,transform),to:transformSquare(selected.to,transform)});
      // The newly declared Bd5 destination belongs to r1 from Bc6 too.
      assert.deepEqual(matingNetMoves(fen), ply === 16 ? [expected.from+expected.to] : [], `${ply/2+1}.${san} r1`);
      assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to], `${ply/2+1}.${san} r2`);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
      assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
      assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san], `${ply/2+1}.${san} selected`);
    }
  }
});

test('revised sixth Kf5 and seventh Be4 explicitly receive r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  const line = 'Nc4 Kf2 Ke5 Kg3 Kf5 Kh4 Bd3 Kg3 Kg5 Kf3 Kf5 Kg3 Be4 Kf2'.split(' ');
  for (const [ply, san] of line.entries()) {
    const before = board.fen(), move = board.move(san);
    if (ply !== 10 && ply !== 12) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen), []);
      assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from+expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
      assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
      assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
    }
  }
});

test('loaded tenth Bf5 explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of 'Nc4 Kf2 Ke5 Kg3 Kf5 Kh4 Bd3 Kg3 Kg5 Kf3 Bf5 Kg3 Bg4 Kg2 Kf4 Kf1 Kf3 Ke1'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const move = getChess(fen).move({from: transformSquare('g4',transform),to: transformSquare('f5',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [move.from + move.to]);
    assert.equal(scoreHeuristicMove(fen,move.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [move.san]);
  }
});

test('loaded eighth Kf4 explicitly receives r2 credit across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of 'Nc4 Kf2 Ke5 Kg3 Kf5 Kh4 Bd3 Kg3 Kg5 Kf2 Kg4 Kg2 Be4+ Kf2'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const move = getChess(fen).move({from: transformSquare('g4',transform),to: transformSquare('f4',transform)});
    assert.deepEqual(matingNetMoves(fen), []);
    assert.deepEqual(sevenCageHeuristicMoves(fen), [move.from + move.to]);
    assert.equal(scoreHeuristicMove(fen,move.san).sevenCagePenalty, 0);
    assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
    assert.deepEqual(getIdealHeuristicMoves(fen), [move.san]);
  }
});

test('Kf1 branch explicitly credits moves 7-11 to r2 across D4 and legally mates', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  const line = 'Nc4 Kf1 Ke3 Ke1 Kf3 Kd1 Kf2 Kc1 Ke3 Kd1 Na3 Ke1 Nc2+ Kf1 Kf3 Kg1 Kg3 Kf1 Bd3+ Kg1 Ne3 Kh1 Ng2 Kg1 Be2 Kh1 Nf4 Kg1 Nh3+ Kh1 Bf3#'.split(' ');
  for (const [ply, san] of line.entries()) {
    const before = board.fen(), move = board.move(san);
    if (ply < 12 || ply > 20 || ply % 2) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before, transform);
      const expected = getChess(fen).move({from: transformSquare(move.from,transform),to: transformSquare(move.to,transform)});
      assert.deepEqual(matingNetMoves(fen), []);
      assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from + expected.to]);
      assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty, 0);
      assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other).sevenCagePenalty === 1));
      assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
    }
  }
  assert.ok(board.isCheckmate());
});

test('Be4 handoff explicitly credits moves 5-8 to r2 and 9-12 to r1 across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  const line = 'Nc4 Kf1 Ke3 Ke1 Kf3 Kd1 Kf2 Kc1 Ke3 Kd1 Na3 Kc1 Nc2 Kd1 Kd3 Kc1 Kc3 Kd1 Bd3 Kc1 Be2 Kb1 Bc4 Kc1 Ba2'.split(' ');
  for (const [ply, san] of line.entries()) {
    const before = board.fen(), move = board.move(san);
    if (ply < 8 || ply >= 24 || ply % 2) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before,transform);
      const expected = getChess(fen).move({from: transformSquare(move.from,transform),to: transformSquare(move.to,transform)});
      const ruleMoves = ply < 16 ? sevenCageHeuristicMoves(fen) : matingNetMoves(fen);
      assert.deepEqual(ruleMoves, [expected.from + expected.to], `${ply / 2 + 1}.${san} rule credit`);
      if (ply < 16) assert.deepEqual(matingNetMoves(fen), []);
      const field = ply < 16 ? 'sevenCagePenalty' : 'matingNetPenalty';
      assert.equal(scoreHeuristicMove(fen,expected.san)[field], 0);
      assert.ok(getChess(fen).moves().some(other => scoreHeuristicMove(fen,other)[field] === 1));
      assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
    }
  }
});

test('loaded tenth Be2 is selected by r2 across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of 'Nc4 Kf2 Ke5 Kg3 Kf5 Kh4 Bd3 Kg3 Kg5 Kf3 Bf5 Kg3 Bg4 Kh2 Kf4 Kh1 Kg3 Kg1'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const move = getChess(fen).move({from: transformSquare('g4',transform),to: transformSquare('e2',transform)});
    assert.deepEqual(sevenCageHeuristicMoves(fen), [move.from + move.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen), [move.san]);
  }
});

test('loaded seventh Nc2 check is selected by r2 across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of 'Nc4 Kf2 Ke5 Ke1 Kf4 Kd1 Ke3 Kc1 Bd3 Kd1 Na3 Ke1'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const move = getChess(fen).move({from: transformSquare('a3',transform),to: transformSquare('c2',transform)});
    assert.ok(move.san.endsWith('+'));
    assert.deepEqual(sevenCageHeuristicMoves(fen), [move.from + move.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen), [move.san]);
  }
});

test('loaded moves seven through ten use r2 destinations across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  const line = 'Nc4 Kf2 Ke5 Ke1 Kf4 Kd1 Ke3 Kc1 Kf2 Kd1 Bd3 Kc1 Ke3 Kd1 Na3 Kc1 Nc2 Kd1 Be4 Kc1'.split(' ');
  for (const [ply, san] of line.entries()) {
    const before = board.fen(), move = board.move(san);
    if (ply < 12 || ply % 2) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before, transform);
      const expected = getChess(fen).move({from: transformSquare(move.from, transform),to: transformSquare(move.to, transform)});
      assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from + expected.to]);
      assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
    }
  }
});

test('r2 continuation accepts the same arrival via another piece', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('e3','f5','c4','c1'), transform);
    const move = getChess(fen).move({from: transformSquare('f5',transform), to: transformSquare('d3',transform)});
    assert.deepEqual(sevenCageHeuristicMoves(fen), [move.from + move.to]);
  }
});

test('loaded sixth Be4 replaces the old Bg4 preference across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/5k2/8 w - - 0 1');
  for (const san of 'Nc4 Kg3 Ke5 Kg4 Kf6 Kf4 Bf5 Kf3 Kg5 Kg3'.split(' ')) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from:transformSquare('f5',transform),to:transformSquare('e4',transform)});
    const rejected = getChess(fen).move({from:transformSquare('f5',transform),to:transformSquare('g4',transform)});
    assert.equal(declaredSevenCageMove(fen),undefined);
    assert.deepEqual(matingNetMoves(fen),[]);
    assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
    assert.equal(scoreHeuristicMove(fen,expected.san).sevenCagePenalty,0);
    assert.equal(scoreHeuristicMove(fen,rejected.san).sevenCagePenalty,1);
    assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
  }
});


test('general Kg5 approach yields to the revised Kf5 Be4 arrival across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of ['Nc4','Kf2','Ke5','Kg3','Kf6','Kg4','Kg6','Kg3']) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(),transform);
    const expected = getChess(fen).move({from: transformSquare('g6',transform), to: transformSquare('g5',transform)});
    assert.deepEqual(sevenCageFormationMoves(fen), [expected.from + expected.to]);
    // The revised 7.Be4 destination also rewards arriving there with the king.
    const arrival = getChess(fen).move({from:transformSquare('g6',transform),to:transformSquare('f5',transform)});
    assert.deepEqual(sevenCageHeuristicMoves(fen), [arrival.from + arrival.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen), [arrival.san]);
  }
});

test('king exactly two ranks above Black follows the above-right target across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('f6','e4','c4','g4'), transform);
    const expected = getChess(fen).move({from: transformSquare('f6',transform), to: transformSquare('g6',transform)});
    const choices = sevenCageFormationMoves(fen);
    assert.ok(choices.includes(expected.from + expected.to));
    // Black g4 gives target h5; g6 is the nearest legal inland step.
    assert.ok(!choices.includes(transformSquare('f6',transform) + transformSquare('g7',transform)));
    assert.ok(!choices.includes(transformSquare('f6',transform) + transformSquare('g5',transform)));
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
  }
});

test('cage king uses either square color without requiring opposition across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const [king,black,to] of [
    ['e6','h2','f5'],
  ] as const) {
    const fen = transformFen(position(king,'e4','c4',black),transform);
    const move = getChess(fen).move({from: transformSquare(king,transform), to: transformSquare(to,transform)});
    assert.deepEqual(sevenCageFormationMoves(fen), [move.from + move.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen), [move.san]);
  }
});

test('general Bd3 cage preference yields to the explicit Bf5 arrival across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of ['Nc4','Kf2','Ke5','Kg3','Kf6','Kf4']) board.move(san);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(board.fen(), transform);
    const expected = getChess(fen).move({from: transformSquare('e4',transform), to: transformSquare('d3',transform)});
    assert.deepEqual(sevenCageFormationMoves(fen), [expected.from + expected.to]);
    const declared = getChess(fen).move({from:transformSquare('e4',transform),to:transformSquare('f5',transform)});
    assert.deepEqual(sevenCageHeuristicMoves(fen),[declared.from+declared.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen),[declared.san]);
    assert.ok(!sevenCageHeuristicMoves(fen).includes(transformSquare('c4',transform) + transformSquare('d6',transform)));
  }
});

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
      assert.equal(sevenCageHeuristicMoves(fen).includes(jump), allowed, `${transform.name}: ${king}/${black}`);
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
      assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from + expected.to]);
      assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
    }
    // The cage is defined by its minor-piece posts and Black's region, not Kd4.
    const elsewhere = transformFen(position('f5','d3','e5','d1'),transform);
    assert.ok(sevenCageHeuristicMoves(elsewhere).includes(transformSquare('e5',transform) + transformSquare('c4',transform)));
  }
});

test('established cage includes Black h5 while entry jump still excludes it across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('d4','e4','c4','h5'), transform);
    const kingMove = getChess(fen).move({from: transformSquare('d4',transform), to: transformSquare('e5',transform)});
    assert.ok(sevenCageHeuristicMoves(fen).includes(kingMove.from + kingMove.to));
    assert.ok(!sevenCageHeuristicMoves(fen).includes(transformSquare('c4',transform) + transformSquare('e5',transform)));
    assert.deepEqual(getIdealHeuristicMoves(fen), [kingMove.san]);
    const entry = transformFen(position('d4','e4','e5','h5'), transform);
    assert.ok(!sevenCageHeuristicMoves(entry).includes(transformSquare('e5',transform) + transformSquare('c4',transform)));
    for (const black of ['g5','h6'] as const) {
      assert.ok(sevenCageFormationMoves(transformFen(position('d4','e4','c4',black),transform)).length);
    }
  }
});

test('Black d1 prefers the Kd4 Be4 Ne5 arrival across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('d4','d5','e5','d1'),transform);
    const move = getChess(fen).move({from: transformSquare('d5',transform), to: transformSquare('e4',transform)});
    assert.deepEqual(sevenCageHeuristicMoves(fen), [move.from + move.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen), [move.san]);
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
    assert.deepEqual(getIdealHeuristicMoves(fen), [move.san]);
    assert.equal(declaredSevenCageMove(transformFen(position('c3','e4','e5','e1'),transform)), undefined);
  }
});

test('cage king target and occupancy preferences retain the cage across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('d4','e4','c4','f2'), transform);
    const move = getChess(fen).move({from: transformSquare('d4',transform), to: transformSquare('e5',transform)});
    // Ke5 approaches g5 without abandoning the cage.
    assert.deepEqual(sevenCageHeuristicMoves(fen), [move.from + move.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen), [move.san]);
    const afterNc4 = transformFen(position('d4','e4','c4','e2'), transform);
    // First-rank preference was removed; the remaining far-file tie-break selects Ke5.
    assert.deepEqual(getIdealHeuristicMoves(afterNc4), [move.san]);
    const loaded = transformFen(position('d4','d3','c4','f3'), transform);
    assert.deepEqual(sevenCageHeuristicMoves(loaded), [move.from + move.to]);
    assert.deepEqual(getIdealHeuristicMoves(loaded), [move.san]);
    // After reaching the desired color, selected moves retain the cage posts.
    const waiting = transformFen(position('e5','e4','c4','f2'), transform);
    const choices = sevenCageFormationMoves(waiting);
    assert.ok(choices.length);
    // Occupying f4 outranks getting closer to g5.
    assert.deepEqual(choices, [transformSquare('e5',transform) + transformSquare('f4',transform)]);
    for (const uci of choices) {
      const board = getChess(waiting);
      const played = board.move({from: uci.slice(0,2) as Square, to: uci.slice(2) as Square});
      assert.notEqual(played.piece, 'n');
      const after = board.fen();
      assert.equal(findPiece(after, 'w', 'n')!.square, transformSquare('c4', transform));
      const diagonal = Array.from({length: 7}, (_, rank) => transformSquare(square(rank + 1, rank), transform));
      assert.ok(diagonal.includes(findPiece(after, 'w', 'b')!.square));
    }
    assert.deepEqual(sevenCageFormationMoves(transformFen(position('d4','e4','c4','h8'),transform)), []);
    assert.deepEqual(sevenCageFormationMoves(transformFen(position('d4','e4','e5','f2'),transform)), []);
    assert.deepEqual(sevenCageFormationMoves(transformFen(position('d4','d5','c4','f4'),transform)),
      [transformSquare('d5',transform)+transformSquare('e4',transform)]);
    assert.deepEqual(sevenCageFormationMoves(transformFen(position('d4','e5','c4','f4'),transform)), []);
  }
});

test('wrong-corner knight route selects Nc6 then Nd4 across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const first = transformFen(position('c3','e4','e5','a2'), transform);
    const second = transformFen(position('c3','e4','c6','a3'), transform);
    for (const [fen, from, to] of [[first,'e5','c6'],[second,'c6','d4']] as const) {
      const expected = getChess(fen).move({from: transformSquare(from,transform), to: transformSquare(to,transform)});
      assert.ok(sevenCageHeuristicMoves(fen).includes(expected.from + expected.to));
      assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
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
        assert.deepEqual(sevenCageHeuristicMoves(fen), [expected.from + expected.to]);
        assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
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
      assert.ok(sevenCageHeuristicMoves(fen).includes(uci), fen);
    }
  }
  assert.deepEqual(sevenCageHeuristicMoves(position('d4','h1','e5','c2')), []);
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
          assert.ok(sevenCageHeuristicMoves(fen).includes(uci), fen);
      }
      // Arrive at the Nd4 formation from f3; same diagonal wildcard.
      const fen = transformFen(position(square(2 + dx, 2), bishop, square(5 + dx, 2), square(2 + dx, 0)), transform);
      if (getChess(fen).isAttacked(transformSquare(square(2 + dx, 0), transform), 'w')) continue;
      if (dx === 1 && bishop === 'c5') {
        // The new Kf4/Be4/Nf7/Kh4 arrival is reached by Bd4 here.
        assert.ok(sevenCageDestinationMoves(fen).includes(transformSquare('g3',transform) + transformSquare('e4',transform)));
        assert.deepEqual(sevenCageHeuristicMoves(fen), [transformSquare('c5',transform) + transformSquare('d4',transform)]);
        continue;
      }
      if (dx === 1 && !['c5','d4'].includes(bishop)) {
        // The newer Kf4/Bd3/Nf7/Kh4 destination is reachable by Bc5
        // in this reflection and outranks the generic knight arrival.
        assert.ok(sevenCageDestinationMoves(fen).includes(transformSquare('g3',transform) + transformSquare('e4',transform)));
        assert.deepEqual(sevenCageHeuristicMoves(fen), [transformSquare(bishop,transform) + transformSquare('c5',transform)]);
        continue;
      }
      assert.ok(sevenCageHeuristicMoves(fen).includes(transformSquare(square(5 + dx, 2), transform) + transformSquare(square(3 + dx, 3), transform)), fen);
    }
  }
});

test('relative arrivals require Black on the edge; protected entry works without restoring the old terminal', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const inland = transformFen(position('c4','d6','f4','d2'), transform);
    const arrival = transformSquare('d6',transform) + transformSquare('c5',transform);
    assert.ok(!sevenCageDestinationMoves(inland).includes(arrival));
    // It is now independently preferred for restoring the reflected cage diagonal.
    assert.ok(sevenCageFormationMoves(inland).includes(arrival));
    const old = transformFen('8/8/8/4N3/3KB3/8/3k4/8 w - - 0 1', transform);
    assert.equal(declaredSevenCageMove(old), transformSquare('e5',transform)+transformSquare('c4',transform));
    assert.equal(isSevenCageTemporaryTerminal(transformFen('8/8/8/8/8/2K5/B1N5/3k4 w - - 6 4',transform)), false);
  }
});


test('new exact Be4 and regional Nc4 select the loaded moves across D4 and counters', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const counters of ['0 1', '38 20']) {
    const source = transformFen('8/8/8/3BN3/3K4/8/4k3/8 w - - ' + counters, transform);
    const board = getChess(source);
    const bishop = board.move({from: transformSquare('d5',transform), to: transformSquare('e4',transform)});
    assert.deepEqual(getIdealHeuristicMoves(source), [bishop.san]);
    board.move({from: transformSquare('e2',transform), to: transformSquare('d2',transform)});
    const before = board.fen(), knight = board.move({from: transformSquare('e5',transform), to: transformSquare('c4',transform)});
    assert.deepEqual(getIdealHeuristicMoves(before), [knight.san]);
    assert.equal(declaredSevenCageMove(transformFen(position('d4','d5','e5','c2'), transform)), undefined);
  }
});

test('regional Nc4 includes the triangle boundary and excludes the h6 neighborhood across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const black of ['c1','d1','d2','e2','f4','h1','h4'] as Square[]) for (const knight of ['e5','b2'] as Square[]) {
      const fen = transformFen(position('d4','e4',knight,black),transform);
      if (getChess(fen).isAttacked(transformSquare(black,transform), 'w')) continue;
      assert.deepEqual(sevenCageHeuristicMoves(fen), [transformSquare(knight,transform)+transformSquare('c4',transform)]);
    }
    for (const black of ['c2','f5','g5','g6','g7','h5','h6','h7','g8','h8'] as Square[]) {
      const fen = transformFen(position('d4','e4','e5',black),transform);
      if (getChess(fen).isAttacked(transformSquare(black,transform), 'w')) continue;
      assert.ok(!sevenCageHeuristicMoves(fen).includes(transformSquare('e5',transform)+transformSquare('c4',transform)),fen);
    }
  }
});

test('established Nc4 from Black d1 outranks reflected Ke5 across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('d4','e4','e5','d1'), transform);
    const move = getChess(fen).move({from: transformSquare('e5',transform), to: transformSquare('c4',transform)});
    assert.deepEqual(sevenCageHeuristicMoves(fen), [move.from + move.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen), [move.san]);
  }
});


test('h-file target overrides f4 occupancy across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('g5','e4','c4','h2'),transform);
    const expected = getChess(fen).move({from: transformSquare('g5',transform), to: transformSquare('f4',transform)});
    assert.deepEqual(getIdealHeuristicMoves(fen), [expected.san]);
    for (const black of ['h3'] as const) {
      const settled = transformFen(position('f4','e4','c4',black),transform);
      const moves = sevenCageFormationMoves(settled);
      assert.ok(moves.length);
      for (const uci of moves) {
        const board = getChess(settled);
        board.move({from: uci.slice(0,2) as Square, to: uci.slice(2) as Square});
        assert.equal(findPiece(board.fen(),'w','k')!.square,transformSquare('f4',transform));
      }
    }
  }
});


test('withdrawn Ne3 route does not override the cage knight post across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const black of ['g1','g2','h2','h3'] as const) {
    const fen = transformFen(position('f4','d3','c4',black),transform);
    const withdrawn = transformSquare('c4',transform)+transformSquare('e3',transform);
    assert.ok(!sevenCageHeuristicMoves(fen).includes(withdrawn));
    assert.ok(!getIdealHeuristicMoves(fen).includes(getChess(fen).move({from: transformSquare('c4',transform),to: transformSquare('e3',transform)}).san));
  }
});

test('r2 selects specific Kf3 with Be4 Ne3 and Black g1 or h2 across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const black of ['g1','h2'] as const) {
    const fen = transformFen(position('f4','e4','e3',black),transform);
    const move = getChess(fen).move({from: transformSquare('f4',transform),to: transformSquare('f3',transform)});
    assert.equal(declaredSevenCageMove(fen),move.from+move.to);
    assert.deepEqual(getIdealHeuristicMoves(fen),[move.san]);
  }
  assert.equal(declaredSevenCageMove(position('f4','e4','e3','h3')),undefined);
});


test('White at least two ranks above Black targets above-right across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const [black,to] of [
    ['c1','e3'], ['d1','e3'], ['e1','f3'], ['f1','g3'],
  ] as const) {
    const fen = transformFen(position('f4','e4','c4',black),transform);
    const move = getChess(fen).move({from: transformSquare('f4',transform),to: transformSquare(to,transform)});
    assert.deepEqual(sevenCageFormationMoves(fen),[move.from+move.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen),[move.san]);
  }
});


test('one-up two-right occupancy precedes target proximity and f4 across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('f2','e4','c4','d1'),transform);
    const preferred = getIdealHeuristicMoves(fen);
    assert.ok(preferred.length);
    for (const san of preferred) {
      const board = getChess(fen);
      const move = board.move(san);
      assert.equal(move.piece,'b');
      assert.equal(findPiece(board.fen(),'w','k')!.square,transformSquare('f2',transform));
    }
    const approach = transformFen(position('f3','e4','c4','e1'),transform);
    const kingMove = getChess(approach).move({from: transformSquare('f3',transform),to: transformSquare('g2',transform)});
    assert.deepEqual(sevenCageFormationMoves(approach),[kingMove.from+kingMove.to]);
    // The explicit Bf5 destination supersedes the general cage target.
    const bishopMove = getChess(approach).move({from: transformSquare('e4',transform),to: transformSquare('f5',transform)});
    assert.deepEqual(getIdealHeuristicMoves(approach),[bishopMove.san]);
  }
});


test('Black on rank two excludes Ke3 from the cage across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('d4','e4','c4','h2'),transform);
    const expected = getChess(fen).move({from: transformSquare('d4',transform),to: transformSquare('e5',transform)});
    assert.deepEqual(sevenCageFormationMoves(fen),[expected.from+expected.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    const firstRank = transformFen(position('d4','e4','c4','f1'),transform);
    assert.ok(sevenCageFormationMoves(firstRank).includes(transformSquare('d4',transform)+transformSquare('e3',transform)));
  }
});


test('specific sixth move Ne3 with Kg3 Bd3 and Black h1 or g1 across D4', () => {
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of ['Nc4','Kf2','Ke5','Kg1','Kf4','Kf1','Kg3','Kg1','Bd3','Kh1']) board.move(san);
  assert.equal(board.fen().split(' ')[0],position('g3','d3','c4','h1').split(' ')[0]);
  for (const transform of SQUARE_TRANSFORMS) for (const black of ['h1','g1'] as const) {
    const fen = transformFen(position('g3','d3','c4',black),transform);
    const move = getChess(fen).move({from: transformSquare('c4',transform),to: transformSquare('e3',transform)});
    assert.equal(declaredSevenCageMove(fen),move.from+move.to);
    assert.deepEqual(getIdealHeuristicMoves(fen),[move.san]);
  }
  assert.equal(declaredSevenCageMove(position('g3','e4','c4','h1')),undefined);
});


test('Black e2 prefers White g2 over the general g3 offset post across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('g3','e4','c4','e2'),transform);
    const expected = getChess(fen).move({from: transformSquare('g3',transform),to: transformSquare('g2',transform)});
    assert.deepEqual(sevenCageFormationMoves(fen),[expected.from+expected.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    const settled = transformFen(position('g2','e4','c4','e2'),transform);
    for (const san of getIdealHeuristicMoves(settled)) {
      const board = getChess(settled); board.move(san);
      assert.equal(findPiece(board.fen(),'w','k')!.square,transformSquare('g2',transform));
    }
  }
});


test('Black c1 or d1 prefers White f2 until an explicit continuation applies across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const black of ['c1','d1'] as const) {
    const fen = transformFen(position('g3','e4','c4',black),transform);
    const expected = getChess(fen).move({from: transformSquare('g3',transform),to: transformSquare('f2',transform)});
    assert.deepEqual(sevenCageFormationMoves(fen),[expected.from+expected.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
    const settled = transformFen(position('f2','e4','c4',black),transform);
    const choices = getIdealHeuristicMoves(settled);
    assert.ok(choices.length);
    for (const san of choices) {
      const board = getChess(settled); board.move(san);
      assert.equal(findPiece(board.fen(),'w','k')!.square,transformSquare(black === 'c1' ? 'e3' : 'f2',transform));
    }
  }
});


test('h-file target occupancy yields to the explicit Ne5 arrival across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const [king,black,to] of [
    ['f6','h6','f7'],
    ['g5','h3','f4'],
  ] as const) {
    const fen = transformFen(position(king,'d3','c4',black),transform);
    const move = getChess(fen).move({from: transformSquare(king,transform),to: transformSquare(to,transform)});
    assert.deepEqual(sevenCageFormationMoves(fen),[move.from+move.to]);
    const expected = king === 'f6'
      ? getChess(fen).move({from:transformSquare('c4',transform),to:transformSquare('e5',transform)})
      : move;
    assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
  }
});


test('unreachable h-file post retains f4 unless the declared Kf5 arrival applies across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position('f4','d3','c4','h5'),transform);
    const choices = sevenCageFormationMoves(fen);
    assert.ok(choices.length);
    for (const uci of choices) {
      const board = getChess(fen); board.move({from:uci.slice(0,2),to:uci.slice(2,4)});
      assert.equal(findPiece(board.fen(),'w','k')!.square,transformSquare('f4',transform));
    }
    const expected = getChess(fen).move({from:transformSquare('f4',transform),to:transformSquare('f5',transform)});
    assert.deepEqual(sevenCageHeuristicMoves(fen),[expected.from+expected.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen),[expected.san]);
  }
});


test('corner Black h1 prefers king on g3 over f4 and the h-file post across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) for (const king of ['g4','f4'] as const) {
    const fen = transformFen(position(king,'d3','c4','h1'),transform);
    const move = getChess(fen).move({from: transformSquare(king,transform),to: transformSquare('g3',transform)});
    assert.deepEqual(sevenCageFormationMoves(fen),[move.from+move.to]);
    assert.deepEqual(getIdealHeuristicMoves(fen),[move.san]);
  }
});
