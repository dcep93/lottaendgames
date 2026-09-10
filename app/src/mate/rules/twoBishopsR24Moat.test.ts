import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  getChess,
  transformFen,
  transformSquare,
  withFenTurn,
  type SquareTransform,
} from '../chess'
import { compareScoresByRules, firstDifferingRule, selectCandidatesByRules } from './selection'
import { scoreTwoBishopsWhiteMove, twoBishopsWhiteRules } from './twoBishops'

const loopFen = '8/3k4/8/4K3/8/8/B6B/8 w - - 0 1'
const r24 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r24')!

function transformedMove(
  fen: string,
  transform: SquareTransform,
  from: Square,
  to: Square,
): string {
  const move = getChess(fen).moves({ verbose: true }).find((candidate) =>
    candidate.from === transformSquare(from, transform) &&
    candidate.to === transformSquare(to, transform))
  assert.ok(move, `${transform.name}: ${from}-${to}`)
  return move.san
}

test('Be6 creates a non-confining wall and beats the no-wall king move under r24', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loopFen, transform)
    const bishopMove = transformedMove(fen, transform, 'a2', 'e6')
    const kingMove = transformedMove(fen, transform, 'e5', 'd5')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const bishop = candidates.find(({ san }) => san === bishopMove)!
    const king = candidates.find(({ san }) => san === kingMove)!
    assert.equal(bishop.score.ruleR24Applies, true, transform.name)
    assert.equal(bishop.score.ruleR24Penalty, 0, transform.name)
    assert.equal(king.score.ruleR24Penalty, 2, transform.name)
    assert.equal(firstDifferingRule(bishop.score, king.score,
      twoBishopsWhiteRules)?.id, 'rule r24', transform.name)
    assert.ok(compareScoresByRules(bishop.score, king.score, [r24]) < 0, transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    const throughR24 = twoBishopsWhiteRules.slice(0, twoBishopsWhiteRules.indexOf(r24) + 1)
    assert.ok(selectCandidatesByRules(candidates, throughR24).idealCandidates.includes(bishop), transform.name)
    assert.equal(selection.eliminatedBy.get(king)?.id, 'rule r24', transform.name)
    // Rank 6 is halfway between Ke5 and Kd7. The other bishop cannot
    // reach d6 because White's king blocks its ray on e5.
    assert.equal(getChess(fen).moves({ verbose: true }).some(({ from, to }) =>
      from === transformSquare('h2', transform) &&
      to === transformSquare('d6', transform)), false, transform.name)
  }
})

test('a preserved wall with an inside-wall target beats breaking that wall under r24', () => {
  const starting = '8/8/8/8/5K1k/8/1B6/1B6 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    // Bb1 and Bb2 enclose Black; White is inside and may target f6.
    // Bc3 preserves both wall diagonals, while Ba3 breaks their alignment.
    const preserves = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'b2', 'c3'))
    const breaks = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'b2', 'a3'))
    assert.equal(preserves.ruleR10DiagonalCount, 6, transform.name)
    assert.deepEqual(preserves.ruleR10TargetSquares, [transformSquare('f6', transform)], transform.name)
    assert.equal(breaks.ruleR10DiagonalCount, 99, transform.name)
    assert.equal(preserves.ruleR24Applies, true, transform.name)
    assert.equal(preserves.ruleR24Penalty, 0, transform.name)
    assert.equal(breaks.ruleR24Applies, true, transform.name)
    assert.equal(breaks.ruleR24Penalty, 2, transform.name)
  }
})

test('r24 credits walls with either a controlled or uncontrolled outer screen', () => {
  const fixtures = [
    { fen: '8/7B/6K1/8/7k/8/8/2B5 w - - 0 1', uncontrolled: true },
    { fen: '8/8/6K1/8/7k/8/2B5/2B5 w - - 0 1', uncontrolled: false },
  ] as const
  for (const fixture of fixtures) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(fixture.fen, transform)
      const score = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, 'c1', 'g5'))
      // Reversing Bh7 to Bc2 leaves the same outer diagonal, but changes
      // Kg6's hidden tail from f5-b1 to the single controlled square h7.
      assert.equal(getChess(fen).isAttacked(
        transformSquare(fixture.uncontrolled ? 'e4' : 'h7', transform), 'w'),
      !fixture.uncontrolled, transform.name)
      assert.equal(score.ruleR10DiagonalCount, 5, transform.name)
      assert.equal(score.ruleR24Applies, true, transform.name)
      assert.equal(score.ruleR24Penalty, 0, transform.name)

      // Kf6 clears the previously screened ray. Its resulting wall makes
      // r24 credit, as it had while the outer wall was screened.
      const repaired = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, 'g6', 'f6'))
      assert.equal(repaired.ruleR10DiagonalCount, 5, transform.name)
      assert.equal(repaired.ruleR24Applies, true, transform.name)
      assert.equal(repaired.ruleR24Penalty, 0, transform.name)
    }
  }
})

test('r24 accepts an exposed geometric wall while bishop safety still rejects capture', () => {
  const starting = '8/8/8/5KB1/8/5Bk1/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    // Bf3 and Bg5 occupy adjacent diagonals, but Black can capture f3.
    const black = getChess(withFenTurn(fen, 'b'))
    assert.ok(black.moves({ verbose: true }).some(({ to, captured }) =>
      to === transformSquare('f3', transform) && captured === 'b'), transform.name)
    const intoMoat = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'g5', 'h4'))
    const exposed = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f5', 'e6'))
    const repaired = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f3', 'd1'))
    assert.equal(intoMoat.ruleR24Applies, true, transform.name)
    assert.equal(intoMoat.ruleR24Penalty, 1, transform.name)
    assert.equal(exposed.ruleR10DiagonalCount, 99, transform.name)
    assert.equal(exposed.ruleR24Applies, true, transform.name)
    assert.equal(exposed.ruleR24Penalty, 0, transform.name)
    assert.ok(compareScoresByRules(intoMoat, exposed, [r24]) > 0, transform.name)
    assert.equal(exposed.bishopSafetyPenalty, 1, transform.name)
    assert.equal(repaired.ruleR10DiagonalCount, 4, transform.name)
    assert.equal(repaired.ruleR24Applies, true, transform.name)
    assert.equal(repaired.ruleR24Penalty, 0, transform.name)
  }
})

test('r24 retains a bishop in the starting moat without a bonus for a second bishop', () => {
  const starting = '8/3k4/B7/4K3/8/8/8/2B5 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const score = (from: Square, to: Square) => scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, from, to))
    const retained = score('c1', 'b2')
    const twoBishops = score('c1', 'h6')
    const changesMoat = score('e5', 'f6')
    const removesMoat = score('e5', 'e4')
    const leavesMoat = score('a6', 'c4')
    // Ba6 already occupies rank 6. Kf6 would change a newly computed moat
    // to the e-file; Ke4 would remove it. Both retain the starting rank 6.
    for (const candidate of [retained, twoBishops, changesMoat, removesMoat]) {
      assert.equal(candidate.ruleR24Applies, true, transform.name)
      assert.equal(candidate.ruleR24Penalty, 1, transform.name)
      assert.equal(compareScoresByRules(candidate, retained, [r24]), 0, transform.name)
    }
    assert.equal(leavesMoat.ruleR24Penalty, 2, transform.name)
  }
})

test('either midpoint line is a moat when the kings differ by two files and two ranks', () => {
  const starting = '8/8/8/4k3/8/2K5/8/2B4B w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    // Kc3 and Ke5 have the d-file and fourth rank between them.
    for (const [to, penalty] of [['e4', 0], ['d5', 1], ['g2', 2]] as const) {
      const score = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, 'h1', to))
      // Be4 creates a wall; Bd5 enters the moat without one; Bg2 does neither.
      assert.equal(score.ruleR24Applies, true, transform.name)
      assert.equal(score.ruleR24Penalty, penalty, `${transform.name}: ${to}`)
    }
  }
})

test('Bg4 is not rejected by r24 when it creates a wall just as Bd7 does', () => {
  const starting = '8/4k3/2K1B3/8/8/6B1/8/8 w - - 2 2'
  const throughR24 = twoBishopsWhiteRules.slice(0,
    twoBishopsWhiteRules.findIndex(({ id }) => id === 'rule r24') + 1)
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const bg4 = transformedMove(fen, transform, 'e6', 'g4')
    const bd7 = transformedMove(fen, transform, 'e6', 'd7')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    for (const san of [bg4, bd7]) {
      const score = candidates.find((candidate) => candidate.san === san)!.score
      assert.equal(score.ruleR10DiagonalCount, 5, transform.name)
      assert.deepEqual(score.ruleR10TargetSquares,
        [transformSquare('d6', transform)], transform.name)
      assert.equal(score.ruleR24Applies, true, transform.name)
      assert.equal(score.ruleR24Penalty, 0, transform.name)
    }
    const selection = selectCandidatesByRules(candidates, throughR24)
    assert.ok(selection.idealCandidates.some(({ san }) => san === bg4), transform.name)
    assert.ok(selection.idealCandidates.some(({ san }) => san === bd7), transform.name)
  }
})

test('r24 requires a starting king moat and does not create one from a candidate king move', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/3k4/8/8/4K3/8/B6B/8 w - - 0 1', transform)
    const approaching = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'e4', 'e5'))
    assert.equal(approaching.ruleR24Applies, false, transform.name)
    assert.equal(approaching.ruleR24Penalty, 2, transform.name)

    // Kb3 and Ke5 have a midpoint rank, but they are three king steps
    // apart, so that line alone does not make a king moat.
    const distant = transformFen('8/8/8/4k3/8/1K6/8/2B4B w - - 0 1', transform)
    const bishop = scoreTwoBishopsWhiteMove(distant,
      transformedMove(distant, transform, 'h1', 'g2'))
    assert.equal(bishop.ruleR24Applies, false, transform.name)
    assert.equal(bishop.ruleR24Penalty, 2, transform.name)
  }
})

test('r24 accepts the a3-f8/a4-e8 wall even when Ke6 allows Black to cross it', () => {
  const throughR24 = twoBishopsWhiteRules.slice(0,
    twoBishopsWhiteRules.findIndex(({ id }) => id === 'rule r24') + 1)
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('4BB2/4K3/8/2k5/8/8/8/8 w - - 0 1', transform)
    const san = transformedMove(fen, transform, 'e7', 'e6')
    const candidates = getChess(fen).moves().map(san => ({san,score:scoreTwoBishopsWhiteMove(fen,san)}))
    const candidate = candidates.find(c => c.san === san)!
    assert.equal(candidate.score.ruleR10DiagonalCount, 9, transform.name)
    assert.equal(candidate.score.ruleR24Applies, true, transform.name)
    assert.equal(candidate.score.ruleR24Penalty, 0, transform.name)
    assert.ok(selectCandidatesByRules(candidates,throughR24).idealCandidates.includes(candidate),transform.name)
    const result=getChess(fen)
    result.move(san)
    assert.ok(result.moves({verbose:true}).some(reply => reply.to === transformSquare('b6',transform)),transform.name)
  }
})

test('r24 compares wall, moat, and neither without exempting a missing moat', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    // These kings are three steps apart, so there is no starting moat.
    const fen=transformFen('4BB2/4K3/8/8/2k5/8/8/8 w - - 0 1',transform)
    const wall=scoreTwoBishopsWhiteMove(fen,transformedMove(fen,transform,'e7','e6'))
    const neither=scoreTwoBishopsWhiteMove(fen,transformedMove(fen,transform,'e8','g6'))
    assert.equal(wall.ruleR24Penalty,0,transform.name)
    assert.equal(neither.ruleR24Applies,false,transform.name)
    assert.equal(neither.ruleR24Penalty,2,transform.name)
    assert.ok(compareScoresByRules(wall,neither,[r24])<0,transform.name)
    const moatFen=transformFen('8/8/8/4k3/8/2K5/8/2B4B w - - 0 1',transform)
    const moat=scoreTwoBishopsWhiteMove(moatFen,transformedMove(moatFen,transform,'h1','d5'))
    assert.equal(moat.ruleR24Penalty,1,transform.name)
    assert.ok(compareScoresByRules(wall,moat,[r24])<0,transform.name)
    assert.ok(compareScoresByRules(moat,neither,[r24])<0,transform.name)
  }
})
