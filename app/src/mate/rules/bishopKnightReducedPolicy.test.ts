import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess } from '../chess'
import { bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import positions from './bishopKnightRegressionPositions.json'

test('removing priorities 5, 6, 7 and 9 permits the minimal knight loop', () => {
  assert.deepEqual(knightAndBishopWhiteRules.map(({ id }) => id), [
    'mate', 'minors safe', 'no stalemate', 'mating net', 'king closer',
  ])
  const startingFen = '8/6N1/6k1/8/B7/3K4/8/8 w - - 0 1'
  const chess = getChess(startingFen)
  for (const san of ['Ne8', 'Kf5', 'Ng7+', 'Kg6']) {
    if (chess.turn() === 'w') {
      assert.ok(getIdealKnightAndBishopWhiteMoves(chess.fen()).includes(san), san)
    }
    assert.ok(chess.move(san), san)
    assert.equal(chess.isGameOver(), false)
  }
  assert.equal(chess.fen().split(' ').slice(0, 4).join(' '),
    startingFen.split(' ').slice(0, 4).join(' '))
})

// Preserve former rule examples as a safety corpus without requiring deleted strategies.
// The additional deterministic sample was recorded before the scoring cleanup.

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
