import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { compareScoresByRules } from './selection'
import { knightAndBishopTargetCornerDiagonals, knightAndBishopTargetCorners, knightAndBishopCornerKnightTarget, knightAndBishopKnightProximityToSquare, knightAndBishopCentralKingTargets, knightAndBishopKnightTargetSquares, knightAndBishopKnightTargetProximityScore } from './bishopKnightStrategy'
import { getMateRuleSet } from './index'
import positions from './bishopKnightRegressionPositions.json'

test('r10 ranks king center, bishop center, then noncentral bishop distance to Black', () => {
  const rule = knightAndBishopWhiteRules.find(({ id }) => id === 'r10')!
  for (const fen of positions) {
    const scored = getChess(fen).moves().map(san => {
      const chess = getChess(fen)
      chess.move(san)
      const pieces = chess.board().flatMap((rank, row) => rank.flatMap((piece, col) =>
        piece ? [{ ...piece, row, col }] : []))
      const king = pieces.find(p => p.color === 'w' && p.type === 'k')!
      const bishop = pieces.find(p => p.color === 'w' && p.type === 'b')!
      const black = pieces.find(p => p.color === 'b' && p.type === 'k')!
      const center = (2 * king.row - 7) ** 2 + (2 * king.col - 7) ** 2
      const distance = (2 * bishop.row - 7) ** 2 + (2 * bishop.col - 7) ** 2
      const centralBishop = [3, 4].includes(bishop.row) && [3, 4].includes(bishop.col)
      const blackDistance = centralBishop ? 0 : (bishop.row - black.row) ** 2 + (bishop.col - black.col) ** 2
      const score = scoreKnightAndBishopWhiteMove(fen, san)
      assert.equal(score.kingCenterProximityScore, center, `${fen}: ${san}`)
      assert.equal(score.bishopCenterProximityScore, distance, `${fen}: ${san}`)
      assert.equal(score.bishopBlackKingProximityScore, blackDistance, `${fen}: ${san}`)
      return {score, center, distance, blackDistance}
    })
    for (const candidate of scored) {
      const first = scored[0]!
      assert.equal(Math.sign(compareScoresByRules(candidate.score, first.score, [{ ...rule, subpriorities: rule.subpriorities!.slice(0, 3) }])),
        Math.sign(candidate.center - first.center || candidate.distance - first.distance || candidate.blackDistance - first.blackDistance), fen)
    }
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


test('r10 routes toward the opposite central square after higher priorities', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [knight, distance] of [['c7', 2], ['b5', 1], ['e6', 1], ['d4', 0]] as const) {
      const board = getChess('8/7k/8/3KB3/8/8/8/8 w - - 0 1')
      board.put({type: 'n', color: 'w'}, knight)
      const fen = transformFen(board.fen(), transform)
      assert.deepEqual(knightAndBishopKnightTargetSquares(fen), [transformSquare('d4', transform)])
      assert.equal(knightAndBishopKnightTargetProximityScore(fen), distance)
    }
    const fen = transformFen('8/2N5/7k/3KB3/8/8/8/8 w - - 0 1', transform)
    const wall = getChess(fen).move({from: transformSquare('e5', transform), to: transformSquare('f6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, wall).supportedDiagonalSizeScore, 99)
    const routes = (['e6', 'b5'] as const).map(to => getChess(fen).move({from: transformSquare('c7', transform), to: transformSquare(to, transform)}).san)
    assert.ok(scoreKnightAndBishopWhiteMove(fen, routes[1]!).knightBlackKingDistanceScore < scoreKnightAndBishopWhiteMove(fen, routes[0]!).knightBlackKingDistanceScore)
    const kingMove = getChess(fen).move({from: transformSquare('d5', transform), to: transformSquare('e6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kingMove).supportedDiagonalSizeScore, 99)
    // Ne6 establishes seven-diagonal support before r10's distance tie-break.
    assert.equal(scoreKnightAndBishopWhiteMove(fen, routes[0]!).supportedDiagonalSizeScore, 7)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, routes[1]!).supportedDiagonalSizeScore, 99)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [routes[0]])
  }
})

test('r10 requires a central bishop and measures the resulting position', () => {
  const fen = '8/7k/8/3K4/8/2B5/8/1N6 w - - 0 1'
  assert.deepEqual(knightAndBishopKnightTargetSquares(fen), [])
  assert.equal(knightAndBishopKnightTargetProximityScore(fen), 99)
  const central = scoreKnightAndBishopWhiteMove(fen, 'Be5')
  const outside = scoreKnightAndBishopWhiteMove(fen, 'Bf6')
  assert.equal(central.bishopCenterProximityScore, 2)
  assert.equal(outside.bishopCenterProximityScore, 18)
  assert.equal(central.knightTargetProximityScore, 3)
  assert.equal(outside.knightTargetProximityScore, 99)
})


test('r8 selects Kf5 with Black outside the prospective five-diagonal', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/6k1/8/3BK3/4N3/8/8/8 w - - 2 2', transform)
    assert.deepEqual(knightAndBishopCentralKingTargets(fen), [transformSquare('f6', transform)])
    const move = getChess(fen).move({from: transformSquare('e5', transform), to: transformSquare('f5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r8')
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).centralKingTargetScore, 1)
  }
})

test('r8 retains equally close shared targets and needs both central pieces of matching color', () => {
  const tied = '8/1k6/8/3BK3/4N3/8/8/8 w - - 0 1'
  assert.deepEqual(knightAndBishopCentralKingTargets(tied).sort(), ['c3', 'f6'])
  for (const fen of [
    '8/6k1/8/3BK3/3N4/8/8/8 w - - 0 1',
    '8/6k1/8/3BK3/8/5N2/8/8 w - - 0 1',
    '8/6k1/2B5/4K3/4N3/8/8/8 w - - 0 1',
  ]) {
    assert.deepEqual(knightAndBishopCentralKingTargets(fen), [])
    for (const move of getChess(fen).moves()) {
      const score = scoreKnightAndBishopWhiteMove(fen, move)
      assert.equal(score.centralKingTargetScore, 0)
      assert.equal(score.kingBishopSeparationScore, 0)
    }
  }
})

test('r8 compares resulting king proximity before its distance from the bishop', () => {
  const fen = '8/6k1/8/3BK3/4N3/8/8/8 w - - 0 1'
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r8')!
  const f5 = scoreKnightAndBishopWhiteMove(fen, 'Kf5')
  const e6 = scoreKnightAndBishopWhiteMove(fen, 'Ke6')
  const f4 = scoreKnightAndBishopWhiteMove(fen, 'Kf4')
  assert.equal(f5.centralKingTargetScore, 1)
  assert.equal(e6.centralKingTargetScore, 1)
  assert.equal(f5.kingBishopSeparationScore, -4)
  assert.equal(e6.kingBishopSeparationScore, -2)
  assert.ok(compareScoresByRules(f5, e6, [rule]) < 0)
  assert.ok(compareScoresByRules(f5, f4, [rule]) < 0)
  assert.equal(scoreKnightAndBishopWhiteMove(fen, 'Nf2').centralKingTargetScore, 2)
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


test('r4 selects Nd6 when Black is outside the prospective supported diagonal', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('7k/8/5K2/3B4/4N3/8/8/8 w - - 2 2', transform)
    const target = transformSquare('h8', transform)
    assert.equal(knightAndBishopCornerKnightTarget(fen), target)
    assert.equal(knightAndBishopKnightProximityToSquare(fen, target), 3)
    const move = getChess(fen).move({from: transformSquare('e4', transform), to: transformSquare('d6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).cornerKnightProximityScore, 2)
    const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r4')!
    const alternative = getChess(fen).move({from: transformSquare('e4', transform), to: transformSquare('f2', transform)}).san
    assert.ok(compareScoresByRules(scoreKnightAndBishopWhiteMove(fen, move), scoreKnightAndBishopWhiteMove(fen, alternative), [rule]) < 0)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(scoreKnightAndBishopWhiteMove(fen, alternative).supportedDiagonalSizeScore, 99)
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, alternative)?.id, 'r4')
  }
})

test('r4 requires Black within one edge move of an opposite-colored corner', () => {
  for (const square of ['d4', 'e4', 'd5', 'e5', 'b3'] as const) {
    const chess = getChess('7k/8/5K2/8/8/8/8/N7 w - - 0 1')
    chess.put({type: 'b', color: 'w'}, square)
    assert.equal(knightAndBishopCornerKnightTarget(chess.fen()), ['e4', 'd5', 'b3'].includes(square) ? 'h8' : undefined)
  }
  for (const fen of [
    '8/8/5K1k/3B4/4N3/8/8/8 w - - 0 1',
  ]) {
    assert.equal(knightAndBishopCornerKnightTarget(fen), undefined)
    for (const move of getChess(fen).moves()) assert.equal(scoreKnightAndBishopWhiteMove(fen, move).cornerKnightProximityScore, 0)
  }
})


test('r4 also targets h8 from h7 and g8 in every orientation', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const black of ['h8', 'h7', 'g8'] as const) {
      const chess = getChess('7k/8/5K2/3B4/4N3/8/8/8 w - - 0 1')
      chess.remove('h8')
      chess.put({type: 'k', color: 'b'}, black)
      const fen = transformFen(chess.fen(), transform)
      assert.equal(knightAndBishopCornerKnightTarget(fen), transformSquare('h8', transform))
    }
    const fen = transformFen('8/7k/3N1K2/3B4/8/8/8/8 w - - 4 3', transform)
    const move = getChess(fen).move({from: transformSquare('d6', transform), to: transformSquare('f7', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).cornerKnightProximityScore, 1)
  }
})


test('r4 prefers king setup when the prospective five-diagonal does not contain Black', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('7k/8/8/4K3/2B1N3/8/8/8 w - - 0 1', transform)
    const kingMove = getChess(fen).move({from: transformSquare('e5', transform), to: transformSquare('f6', transform)}).san
    const knightMove = getChess(fen).move({from: transformSquare('e4', transform), to: transformSquare('d6', transform)}).san
    const bishopMove = getChess(fen).move({from: transformSquare('c4', transform), to: transformSquare('e2', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bishopMove).supportedDiagonalSizeScore, 99)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [kingMove])
    const king = scoreKnightAndBishopWhiteMove(fen, kingMove)
    const knight = scoreKnightAndBishopWhiteMove(fen, knightMove)
    assert.equal(king.cornerKingProximityScore, 0)
    assert.equal(knight.cornerKingProximityScore, 2)
    assert.ok(knight.cornerKnightProximityScore < king.cornerKnightProximityScore)
  }
})


test('r4 targets the correct seven-diagonal even when Black is on its boundary', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('6k1/5N2/5K2/3B4/8/8/8/8 w - - 0 1', transform)
    assert.deepEqual(knightAndBishopTargetCorners(fen), [transformSquare('a8', transform)])
    assert.deepEqual(knightAndBishopTargetCornerDiagonals(fen).map(wall => [...wall].sort()), [(['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8'] as const).map(square => transformSquare(square, transform)).sort()])
    const san = (to: 'c4' | 'e4' | 'e6') => getChess(fen).move({from: transformSquare('d5', transform), to: transformSquare(to, transform)}).san
    const closer = scoreKnightAndBishopWhiteMove(fen, san('c4'))
    const farther = scoreKnightAndBishopWhiteMove(fen, san('e4'))
    assert.equal(closer.cornerKingProximityScore, farther.cornerKingProximityScore)
    assert.equal(closer.cornerKnightProximityScore, farther.cornerKnightProximityScore)
    assert.equal(closer.bishopCornerDiagonalScore, 0)
    assert.equal(farther.bishopCornerDiagonalScore, 1)
    const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r4')!
    assert.ok(compareScoresByRules(closer, farther, [rule]) < 0)
  }
})

test('r4 retains the seven-diagonal for each equally close target corner', () => {
  const fen = '7k/8/5K2/3B4/4N3/8/8/8 w - - 0 1'
  assert.deepEqual(knightAndBishopTargetCorners(fen), ['a8', 'h1'])
  assert.equal(knightAndBishopTargetCornerDiagonals(fen).length, 2)
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

test('the corner exception needs all three specified pieces and rejects the bishop shuffle', () => {
  for (const fen of [
    '8/5N1k/4B3/5K2/8/8/8/8 w - - 0 1',
    '8/7k/3NBK2/8/8/8/8/8 w - - 0 1',
    '8/5N2/4BK1k/8/8/8/8/8 w - - 0 1',
  ]) assert.deepEqual(knightAndBishopTargetCorners(fen), ['h1'])
  const fen = '8/5N1k/4BK2/8/8/8/8/8 w - - 0 1'
  assert.equal(scoreKnightAndBishopWhiteMove(fen, 'Bf5+').bishopCornerDiagonalScore, 1)
  assert.equal(scoreKnightAndBishopWhiteMove(fen, 'Bd5').bishopCornerDiagonalScore, 0)
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), ['Bd5'])
  assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, 'Bf5+')?.id, 'r4')
})


test('r4 is exempt for a Black king diagonally adjacent to a corner in every orientation', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/6k1/8/2NBK3/8/8/8/8 w - - 0 1', transform)
    assert.equal(knightAndBishopCornerKnightTarget(fen), undefined)
    for (const move of getChess(fen).moves()) {
      const score = scoreKnightAndBishopWhiteMove(fen, move)
      assert.equal(score.cornerKingProximityScore, 0)
      assert.equal(score.cornerKnightProximityScore, 0)
      assert.equal(score.bishopCornerDiagonalScore, 0)
    }
  }
})


test('Bc4 passes r4 and Be4+ fails it in every orientation', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/5N1k/5K2/3B4/8/8/8/8 w - - 2 2', transform)
    const move = (to: 'c4' | 'e4') => getChess(fen).move({from: transformSquare('d5', transform), to: transformSquare(to, transform)}).san
    const right = scoreKnightAndBishopWhiteMove(fen, move('c4'))
    const wrong = scoreKnightAndBishopWhiteMove(fen, move('e4'))
    assert.equal(right.bishopCornerDiagonalScore, 0)
    assert.equal(wrong.bishopCornerDiagonalScore, 1)
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, move('e4'))?.id, 'r4')
  }
})

test('r10 breaks its remaining ties by preferring knight distance from Black after White moves', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/3kBK2/3N4/8/8/8/8 w - - 0 1', transform)
    const knightMove = (to: 'b6' | 'c3' | 'e3') => getChess(fen).move({from: transformSquare('d5', transform), to: transformSquare(to, transform)}).san
    const near = scoreKnightAndBishopWhiteMove(fen, knightMove('b6'))
    const far = scoreKnightAndBishopWhiteMove(fen, knightMove('c3'))
    for (const field of ['kingCenterProximityScore', 'bishopCenterProximityScore', 'bishopBlackKingProximityScore', 'knightTargetProximityScore'] as const) {
      assert.equal(near[field], far[field])
    }
    assert.deepEqual([near.knightBlackKingDistanceScore, far.knightBlackKingDistanceScore], [-4, -10])
    const king = getChess(fen).move({from: transformSquare('f6', transform), to: transformSquare('f5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [king])
  }
})

test('r10 finally brings the minor pieces closer to White’s king, preferring the loaded Nb6', () => {
  const rule = knightAndBishopWhiteRules.find(({ id }) => id === 'r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('6B1/3K4/8/8/Nk6/8/8/8 w - - 0 1', transform)
    const move = (to: 'b2' | 'b6') => getChess(fen).move({from: transformSquare('a4', transform), to: transformSquare(to, transform)}).san
    const near = scoreKnightAndBishopWhiteMove(fen, move('b6'))
    const far = scoreKnightAndBishopWhiteMove(fen, move('b2'))
    for (const priority of rule.subpriorities!.slice(0, -1)) {
      assert.ok(priority.compare)
      assert.equal(priority.compare(near, far), 0)
    }
    assert.equal(near.whitePiecesKingProximityScore, Math.sqrt(10) + Math.sqrt(5))
    assert.equal(far.whitePiecesKingProximityScore, Math.sqrt(10) + Math.sqrt(29))
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('b6')])
  }
})

test('r10 exempts the four central bishop squares from Black proximity', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/7k/8/8/8/2B5/8/NK6 w - - 0 1', transform)
    for (const [to, expected] of [['d4', 0], ['e5', 0], ['f6', 5]] as const) {
      const move = getChess(fen).move({from: transformSquare('c3', transform), to: transformSquare(to, transform)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move).bishopBlackKingProximityScore, expected)
    }
  }
})

test('Bd5 establishing seven-diagonal race support outranks r10 knight development', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('5k2/8/8/8/3KB3/4N3/8/8 w - - 2 2', transform)
    const knight = getChess(fen).move({from: transformSquare('e3', transform), to: transformSquare('d5', transform)}).san
    const bishop = getChess(fen).move({from: transformSquare('e4', transform), to: transformSquare('d5', transform)}).san
    const knightScore = scoreKnightAndBishopWhiteMove(fen, knight)
    const bishopScore = scoreKnightAndBishopWhiteMove(fen, bishop)
    assert.deepEqual([knightScore.bishopBlackKingProximityScore, bishopScore.bishopBlackKingProximityScore], [0, 0])
    assert.ok(knightScore.knightTargetProximityScore < bishopScore.knightTargetProximityScore)
    assert.deepEqual([bishopScore.supportedDiagonalSizeScore, knightScore.supportedDiagonalSizeScore], [7, 99])
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [bishop])
  }
})


test('r4 is exempt by a bishop-colored corner; the loaded Nc4 reaches r10', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1k6/8/1NK5/3B4/8/8/8/8 w - - 2 2', transform)
    assert.equal(knightAndBishopCornerKnightTarget(fen), undefined)
    for (const move of getChess(fen).moves()) {
      const score = scoreKnightAndBishopWhiteMove(fen, move)
      assert.deepEqual([score.cornerKingProximityScore, score.cornerKnightProximityScore, score.bishopCornerDiagonalScore], [0, 0, 0])
    }
    const move = getChess(fen).move({from: transformSquare('b6', transform), to: transformSquare('c4', transform)}).san
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, move)?.id, 'r10')
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
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
  }
})
