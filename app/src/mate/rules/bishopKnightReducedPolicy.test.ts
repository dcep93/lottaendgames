import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { compareScoresByRules } from './selection'
import { knightAndBishopTargetCornerDiagonals, knightAndBishopTargetCorners, knightAndBishopKnightTargetSquares, knightAndBishopKnightTargetProximityScore } from './bishopKnightStrategy'
import positions from './bishopKnightRegressionPositions.json'

test('r10 ranks king center, opposite color, long diagonal, then protected central bishop', () => {
  const rule = knightAndBishopWhiteRules.find(({ id }) => id === 'r10')!
  for (const fen of positions) {
    const scored = getChess(fen).moves().map(san => {
      const chess = getChess(fen)
      chess.move(san)
      const pieces = chess.board().flatMap((rank, row) => rank.flatMap((piece, col) =>
        piece ? [{ ...piece, row, col }] : []))
      const king = pieces.find(p => p.color === 'w' && p.type === 'k')!
      const bishop = pieces.find(p => p.color === 'w' && p.type === 'b')!
      const center = (2 * king.row - 7) ** 2 + (2 * king.col - 7) ** 2
      const colorPenalty = Number((king.row + king.col) % 2 === (bishop.row + bishop.col) % 2)
      const longDiagonalPenalty = Number(bishop.row !== bishop.col && bishop.row + bishop.col !== 7)
      const knight = pieces.find(p => p.color === 'w' && p.type === 'n')!
      const centralBishop = [3, 4].includes(bishop.row) && [3, 4].includes(bishop.col)
      const kingDefends = Math.max(Math.abs(king.row - bishop.row), Math.abs(king.col - bishop.col)) === 1
      const knightDefends = Math.abs(knight.row - bishop.row) * Math.abs(knight.col - bishop.col) === 2
      const centerPenalty = Number(!centralBishop || !(kingDefends || knightDefends))
      const score = scoreKnightAndBishopWhiteMove(fen, san)
      assert.equal(score.kingCenterProximityScore, center, `${fen}: ${san}`)
      assert.equal(score.kingBishopColorPenalty, colorPenalty, `${fen}: ${san}`)
      assert.equal(score.bishopLongDiagonalPenalty, longDiagonalPenalty, `${fen}: ${san}`)
      assert.equal(score.bishopProtectedCenterPenalty, centerPenalty, `${fen}: ${san}`)
      return {score, center, colorPenalty, longDiagonalPenalty, centerPenalty}
    })
    for (const candidate of scored) {
      const first = scored[0]!
      assert.equal(Math.sign(compareScoresByRules(candidate.score, first.score, [{ ...rule, subpriorities: rule.subpriorities!.slice(0, 4) }])),
        Math.sign(candidate.center - first.center || candidate.colorPenalty - first.colorPenalty || candidate.longDiagonalPenalty - first.longDiagonalPenalty || candidate.centerPenalty - first.centerPenalty), fen)
    }
  }
})

test('r10 ranks precage distances even ahead of White', () => {
  const rule = knightAndBishopWhiteRules.find(({ id }) => id === 'r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/4K3/k3B3/1N6/8/8 w - - 0 1', transform)
    const knightMove = getChess(fen).move({from: transformSquare('b3', transform), to: transformSquare('d4', transform)}).san
    const kingMove = getChess(fen).move({from: transformSquare('e5', transform), to: transformSquare('d4', transform)}).san
    const knight = scoreKnightAndBishopWhiteMove(fen, knightMove)
    const king = scoreKnightAndBishopWhiteMove(fen, kingMove)
    for (const priority of rule.subpriorities!.slice(0, 4)) {
      assert.equal(priority.compare!(knight, king), 0)
    }
    assert.deepEqual([knight.knightTargetProximityScore, king.knightTargetProximityScore], [1, 2])
    assert.ok(compareScoresByRules(knight, king, [rule]) < 0)
  }
})


test('reduced policy preserves mate, piece safety, and stalemate precedence across the regression corpus', () => {
  for (const fen of positions) {
    const legal = getChess(fen).moves()
    const safety = legal.map(san => {
      const result = getChess(fen)
      result.move(san)
      return {
        san,
        // Independently use chess.js replies, rather than the strategy scores.
        rank: [Number(!result.isCheckmate()),
          Number(result.moves({verbose: true}).some(m => m.captured === 'b' || m.captured === 'n')),
          Number(result.isStalemate())],
      }
    })
    const compare = (a: typeof safety[number], b: typeof safety[number]) =>
      a.rank[0]! - b.rank[0]! || a.rank[1]! - b.rank[1]! || a.rank[2]! - b.rank[2]!
    const best = [...safety].sort(compare)[0]!
    const preferred = getIdealKnightAndBishopWhiteMoves(fen)
    assert.ok(preferred.length > 0, fen)
    for (const san of preferred) {
      const candidate = safety.find(c => c.san === san)
      assert.ok(candidate, `${fen}: ${san} is legal`)
      assert.equal(compare(candidate, best), 0, `${fen}: ${san}`)
    }
  }
})

test('shared scoring context and lazy scores are independent of candidate evaluation order', () => {
  for (const fen of positions) {
    const moves = getChess(fen).moves()
    const batch = bishopKnightRuleSet.scoreWhiteCandidates!(fen, [...moves].reverse())
    for (const candidate of batch) {
      const individually = scoreKnightAndBishopWhiteMove(fen, candidate.san)
      // Materialize getters after all candidates were created, in reverse field order.
      const fields = Object.keys(individually).reverse() as (keyof typeof individually)[]
      for (const field of fields) {
        assert.equal(candidate.score[field], individually[field], `${fen}: ${candidate.san}: ${field}`)
      }
    }
  }
})


test('r10 routes diagonally beside a central bishop off the long diagonal after higher priorities', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [knight, distance] of [['d6', 0], ['c4', 1], ['e4', 1]] as const) {
      const board = getChess('8/8/8/3KB2k/8/8/8/8 w - - 0 1')
      board.put({type: 'n', color: 'w'}, knight)
      const fen = transformFen(board.fen(), transform)
      assert.deepEqual(knightAndBishopKnightTargetSquares(fen).sort(), (['d6'] as const).map(square => transformSquare(square, transform)).sort())
      assert.equal(knightAndBishopKnightTargetProximityScore(fen), distance)
    }
    const fen = transformFen('8/2N5/7k/3KB3/8/8/8/8 w - - 0 1', transform)
    const wall = getChess(fen).move({from: transformSquare('e5', transform), to: transformSquare('f6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, wall).supportedDiagonalSizeScore, 99)
    const routes = (['e6', 'b5'] as const).map(to => getChess(fen).move({from: transformSquare('c7', transform), to: transformSquare(to, transform)}).san)
    const kingMove = getChess(fen).move({from: transformSquare('d5', transform), to: transformSquare('e6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kingMove).supportedDiagonalSizeScore, 99)
    // Ne6 establishes seven-diagonal support before r10's distance tie-break.
    assert.equal(scoreKnightAndBishopWhiteMove(fen, routes[0]!).supportedDiagonalSizeScore, 7)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, routes[1]!).supportedDiagonalSizeScore, 99)
    const behind = getChess(fen).move({from: transformSquare('c7', transform), to: transformSquare('a6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, behind).supportedDiagonalSizeScore, 7)
    // Both moves preserve support; the final center tie-break favors Ne6 over Na6.
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [routes[0]!])
  }
})

test('r10 only defines knight targets beside a central bishop', () => {
  const fen = '8/8/8/3K3k/8/2B5/8/1N6 w - - 0 1'
  assert.deepEqual(knightAndBishopKnightTargetSquares(fen), [])
  assert.equal(knightAndBishopKnightTargetProximityScore(fen), 99)
  const central = scoreKnightAndBishopWhiteMove(fen, 'Be5')
  const outside = scoreKnightAndBishopWhiteMove(fen, 'Bf6')
  assert.equal(central.bishopProtectedCenterPenalty, 0)
  assert.equal(outside.bishopProtectedCenterPenalty, 1)
  assert.equal(central.knightTargetProximityScore, 3)
  assert.equal(outside.knightTargetProximityScore, 99)
})


test('old central king placement scoring fields remain removed', () => {
  const score = scoreKnightAndBishopWhiteMove('8/6k1/8/3BK3/4N3/8/8/8 w - - 0 1', 'Kf5')
  assert.equal('centralKingTargetScore' in score, false)
  assert.equal('kingBishopSeparationScore' in score, false)
})

test('recorded mating moves do not contribute White scores', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('4k3/8/5K2/3B4/4N3/8/8/8 w - - 0 1', transform)
    const recorded = getChess(fen).move({from: transformSquare('f6', transform), to: transformSquare('e6', transform)}).san
    const score = scoreKnightAndBishopWhiteMove(fen, recorded)
    for (const field of ['hasLookupMove', 'lookupMovePenalty', 'phaseTwoEntryScore', 'matingContinuationScore']) {
      assert.equal(field in score, false)
    }
  }
})


test('the f6/f7/h7 target-corner exception selects a8 regardless of bishop position in every orientation', () => {
  for (const bishop of ['e6', 'd5', 'c4', 'b3', 'e2'] as const) {
    const board = getChess('8/5N1k/5K2/8/8/8/8/8 w - - 0 1')
    board.put({type: 'b', color: 'w'}, bishop)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(board.fen(), transform)
      assert.deepEqual(knightAndBishopTargetCorners(fen), [transformSquare('a8', transform)])
      assert.deepEqual(knightAndBishopTargetCornerDiagonals(fen).map(wall => [...wall].sort()), [(['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8'] as const).map(square => transformSquare(square, transform)).sort()])
    }
  }
})

test('the target-corner exception needs all three specified pieces', () => {
  for (const fen of [
    '8/5N1k/4B3/5K2/8/8/8/8 w - - 0 1',
    '8/7k/3NBK2/8/8/8/8/8 w - - 0 1',
    '8/5N2/4BK1k/8/8/8/8/8 w - - 0 1',
  ]) assert.deepEqual(knightAndBishopTargetCorners(fen), ['h1'])

})


test('r10 rewards central bishops protected by either king or knight in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [base, from, to, expected] of [
      ['8/7k/8/8/4B3/5K2/8/N7 w - - 0 1', 'a1', 'b3', 0], // Non-central king protects Be4.
      ['8/7k/8/2N5/4B3/8/8/1K6 w - - 0 1', 'b1', 'b2', 0], // Nc5 protects Be4, king is remote.
      ['8/7k/8/8/4BN2/8/8/1K6 w - - 0 1', 'b1', 'b2', 1], // Central bishop without protection.
      ['8/7k/8/2N5/8/2B5/8/1K6 w - - 0 1', 'b1', 'b2', 1], // Protected bishop outside the center.
    ] as const) {
      const fen = transformFen(base, transform)
      const move = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move).bishopProtectedCenterPenalty, expected)
    }
  }
})

test('r10 keeps a knight diagonally beside the bishop off the long diagonal', () => {
  const rule = knightAndBishopWhiteRules.find(({id}) => id === 'r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/7k/8/4K3/4B3/3N4/8/8 w - - 0 1', transform)
    const move = (from: 'd3' | 'e5', to: 'c5' | 'd4') => getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
    const leaving = scoreKnightAndBishopWhiteMove(fen, move('d3', 'c5'))
    const staying = scoreKnightAndBishopWhiteMove(fen, move('e5', 'd4'))
    assert.equal(staying.knightTargetProximityScore, 0)
    assert.equal(leaving.knightTargetProximityScore, 1)
    for (const priority of rule.subpriorities!.slice(0, 4)) assert.equal(priority.compare!(staying, leaving), 0)
    assert.ok(compareScoresByRules(staying, leaving, [rule]) < 0)
  }
})

test('r1.5 compares only supported diagonal size and knight route', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('k3B3/2K5/8/3N4/8/8/8/8 w - - 0 1', transform)
    const scores = (['a4', 'b5', 'c6', 'd7'] as const).map(to =>
      scoreKnightAndBishopWhiteMove(fen, getChess(fen).move({from: transformSquare('e8', transform), to: transformSquare(to, transform)}).san))
    const rule = knightAndBishopWhiteRules.find(({id}) => id === 'r1.5')!
    for (const score of scores) assert.equal(compareScoresByRules(scores[0], score, [rule]), 0)
    assert.ok(compareScoresByRules({...scores[0], supportedDiagonalSizeScore: 3}, scores[1], [rule]) < 0)
    assert.ok(compareScoresByRules({...scores[0], supportedDiagonalKnightScore: 1}, {...scores[1], supportedDiagonalKnightScore: 2}, [rule]) < 0)
  }
})

test('r10 prefers the loaded Kd7 toward the center even on the bishop color', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/2K5/8/2kN4/8/8/8/7B w - - 2 2', transform)
    const move = getChess(fen).move({from: transformSquare('c7', transform), to: transformSquare('d7', transform)}).san
    const rule = knightAndBishopWhiteRules.find(({id}) => id === 'r10')!
    const score = scoreKnightAndBishopWhiteMove(fen, move)
    for (const san of getChess(fen).moves()) {
      assert.ok(compareScoresByRules(score, scoreKnightAndBishopWhiteMove(fen, san), [rule]) <= 0)
    }
  }
})


test('r10 credits Ke5 over Be4 for precage proximity even ahead of White', () => {
  const rule = knightAndBishopWhiteRules.find(({id}) => id === 'r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/3k4/8/1N1B4/3K4/8/8/8 w - - 0 1', transform)
    const king = getChess(fen).move({from: transformSquare('d4', transform), to: transformSquare('e5', transform)}).san
    const bishop = getChess(fen).move({from: transformSquare('d5', transform), to: transformSquare('e4', transform)}).san
    const kingScore = scoreKnightAndBishopWhiteMove(fen, king)
    const bishopScore = scoreKnightAndBishopWhiteMove(fen, bishop)
    for (const priority of rule.subpriorities!.slice(0, 4)) assert.equal(priority.compare!(kingScore, bishopScore), 0)
    assert.ok(kingScore.knightTargetProximityScore < bishopScore.knightTargetProximityScore)
    assert.ok(compareScoresByRules(kingScore, bishopScore, [rule]) < 0)
  }
})


test('r10 targets only diagonal neighbors strictly behind the bishop from Black in every reflection', () => {
  for (const [black, target] of [['f5', 'c4'], ['f4', 'c4'], ['b5', 'e6']] as const) {
    const board = getChess('7k/8/4N3/3B4/3K4/8/8/8 w - - 0 1')
    board.remove('h8')
    board.put({type: 'k', color: 'b'}, black)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(board.fen(), transform)
      assert.deepEqual(knightAndBishopKnightTargetSquares(fen), [transformSquare(target, transform)])
    }
  }
})

test('r10 does not reward precage existence in the loaded Be4 loop, including reflections', () => {
  const rule = knightAndBishopWhiteRules.find(({id}) => id === 'r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('BN1K4/8/3k4/8/8/8/8/8 w - - 0 1', transform)
    const move = (to: 'e4' | 'h1') => getChess(fen).move({from: transformSquare('a8', transform), to: transformSquare(to, transform)}).san
    const central = scoreKnightAndBishopWhiteMove(fen, move('e4'))
    const edge = scoreKnightAndBishopWhiteMove(fen, move('h1'))
    assert.deepEqual([central.knightTargetProximityScore, edge.knightTargetProximityScore], [3, 99])
    assert.equal(compareScoresByRules(central, edge, [{...rule, subpriorities: [rule.subpriorities![4]!]}]), 0)
  }
})

test('r10 keeps absent precage targets neutral while ranking available distances in any order', () => {
  const rank = knightAndBishopWhiteRules.find(({id}) => id === 'r10')!.subpriorities![4]!.rank!
  const base = scoreKnightAndBishopWhiteMove('BN1K4/8/3k4/8/8/8/8/8 w - - 0 1', 'Be4')
  for (const distances of [[99, 3, 1], [1, 99, 3], [3, 1, 99], [99, 99]]) {
    const ranked = rank(distances.map(distance => ({...base, knightTargetProximityScore: distance})))
    const best = Math.min(...distances)
    assert.deepEqual(ranked, distances.map(distance => distance === 99 ? best : distance))
  }
})


test('r15 is removed and r10 ends with its sixth center-distance priority', () => {
  assert.equal(knightAndBishopWhiteRules.some(rule => rule.id === 'r15'), false)
  assert.equal(knightAndBishopWhiteRules.at(-1)!.id, 'r10')
  assert.equal(knightAndBishopWhiteRules.at(-1)!.subpriorities!.length, 6)
})


test('r10 ranks precage distances without checking whether the knight is behind White', () => {
  const rank = knightAndBishopWhiteRules.find(rule => rule.id === 'r10')!.subpriorities![4]!.rank!;
  const fen = '8/8/8/3B4/3K2k1/8/8/6N1 w - - 0 1';
  const knight = scoreKnightAndBishopWhiteMove(fen, 'Ne2');
  const king = scoreKnightAndBishopWhiteMove(fen, 'Ke5');
  assert.deepEqual(rank([knight, king]), [4, 3]);
});

test('the old behind-White score remains removed', () => {
  assert.equal('minorPiecesBehindKingProximityScore' in scoreKnightAndBishopWhiteMove('8/8/8/3B4/3K2k1/8/8/6N1 w - - 0 1', 'Ne2'), false)
})


test('r10 final center tie-break prefers loaded 2. Bc4 or Be6 over Nd8 in every symmetry', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r10')!;
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/1N6/K1k5/8/8/8/B7/8 w - - 2 2', transform);
    const move = (from: 'a2' | 'b7', to: 'c4' | 'e6' | 'd8') => getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
    const central = scoreKnightAndBishopWhiteMove(fen, move('a2', 'c4'));
    const edge = scoreKnightAndBishopWhiteMove(fen, move('b7', 'd8'));
    assert.equal(compareScoresByRules(central, edge, [{...rule, subpriorities: rule.subpriorities!.slice(0, 5)}]), 0);
    assert.equal(central.minorCenterProximityScore, Math.sqrt(2.5) + Math.sqrt(12.5));
    assert.equal(edge.minorCenterProximityScore, Math.sqrt(18.5) + Math.sqrt(12.5));
    assert.ok(compareScoresByRules(central, edge, [rule]) < 0);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen).sort(), [move('a2', 'c4'), move('a2', 'e6')].sort());
  }
});
