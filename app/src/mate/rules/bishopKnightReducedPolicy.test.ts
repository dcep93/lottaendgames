import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { compareScoresByRules } from './selection'
import { knightAndBishopTargetCornerDiagonals, knightAndBishopTargetCorners } from './bishopKnightStrategy'
import positions from './bishopKnightRegressionPositions.json'


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


test('the old behind-White score remains removed', () => {
  assert.equal('minorPiecesBehindKingProximityScore' in scoreKnightAndBishopWhiteMove('8/8/8/3B4/3K2k1/8/8/6N1 w - - 0 1', 'Ne2'), false)
})


test('king adjacency outranks centralization, then Euclidean proximity outranks color across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1NK5/8/2B5/8/8/k7/8/8 w - - 0 1', transform)
    const moves = (['d7', 'd8'] as const).map(to => getChess(fen).move({from: transformSquare('c8', transform), to: transformSquare(to, transform)}).san)
    const scores = moves.map(san => scoreKnightAndBishopWhiteMove(fen, san))
    assert.ok(compareScoresByRules(scores[0]!, scores[1]!, knightAndBishopWhiteRules) < 0)
    const ideal = getIdealKnightAndBishopWhiteMoves(fen)
    assert.deepEqual(ideal, [getChess(fen).move({from: transformSquare('c8', transform), to: transformSquare('c7', transform)}).san], transform.name)
  }
})
