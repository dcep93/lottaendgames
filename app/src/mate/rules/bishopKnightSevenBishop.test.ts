import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { selectIdealMoves } from './selection'
import { getMateRuleSet } from './index'
import { knightAndBishopFiveBishopPenalty, knightAndBishopFiveKingTargetDistance } from './bishopKnightDiagonalSupport'

const fen = '8/8/8/1k1B4/3K4/3N4/8/8 w - - 0 1'
test('supported seven prefers b3 in the knight support orientation, including every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const reflected = transformFen(fen, transform)
    const san = (to: 'b3' | 'f7') => getChess(reflected).move({from: transformSquare('d5',transform),to:transformSquare(to,transform)}).san
    const preferred = scoreKnightAndBishopWhiteMove(reflected,san('b3'))
    const otherEnd = scoreKnightAndBishopWhiteMove(reflected,san('f7'))
    assert.equal(preferred.supportedDiagonalSizeScore,7)
    assert.equal(otherEnd.supportedDiagonalSizeScore,7)
    assert.equal(preferred.supportedDiagonalKnightScore,0)
    assert.equal(otherEnd.supportedDiagonalKnightScore,0)
    assert.equal(preferred.supportedSevenBishopPenalty,0)
    assert.equal(otherEnd.supportedSevenBishopPenalty,1)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(reflected),[san('b3')])
  }
})

test('the seven bishop preference cannot override r1.5 support size or knight distance', () => {
  const supportRules = knightAndBishopWhiteRules.slice(0,knightAndBishopWhiteRules.findIndex(r=>r.id==='r2.5'))
  for (const start of [fen,'8/k7/2BK4/3N4/8/8/8/8 w - - 0 1','k7/8/BK6/3N4/8/8/8/8 w - - 0 1']) {
    const candidates = bishopKnightRuleSet.scoreWhiteCandidates!(start,bishopKnightRuleSet.whiteMoves(start))
    const allowed = selectIdealMoves(candidates,supportRules)
    for (const move of getIdealKnightAndBishopWhiteMoves(start)) assert.ok(allowed.includes(move))
  }
})

test('with b3 seven bishop, king approaches two files right of Black in all reflections', () => {
  const start = '8/8/1k6/4K3/8/1B1N4/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const reflected = transformFen(start,transform)
    const san = (to: 'd6' | 'd5' | 'd4') => getChess(reflected).move({from:transformSquare('e5',transform),to:transformSquare(to,transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(reflected),[san('d6')])
    for (const [to,distance] of [['d6',0],['d5',1],['d4',2]] as const) {
      const score = scoreKnightAndBishopWhiteMove(reflected,san(to))
      assert.equal(score.supportedDiagonalSizeScore,7)
      assert.equal(score.supportedSevenBishopPenalty,0)
      assert.equal(score.supportedSevenKingTargetDistance,distance)
    }
    const otherBishop = scoreKnightAndBishopWhiteMove(transformFen(fen,transform),
      getChess(transformFen(fen,transform)).move({from:transformSquare('d5',transform),to:transformSquare('f7',transform)}).san)
    assert.equal(otherBishop.supportedSevenKingTargetDistance,0)
  }
})

test('exact r2.5 Ke8 overrides the general target only for its declared placement', () => {
  const start = '8/5K2/3k4/8/8/1B1N4/8/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2','87 51']) {
      const reflected = transformFen(start.replace('2 2',counters),transform)
      const move = getChess(reflected).move({from:transformSquare('f7',transform),to:transformSquare('e8',transform)}).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(reflected),[move])
      const score = scoreKnightAndBishopWhiteMove(reflected,move)
      assert.equal(score.supportedDiagonalSizeScore,7)
      assert.equal(score.supportedDiagonalKnightScore,0)
      assert.equal(score.declaredSupportedSevenPenalty,0)
      const previous = getChess(reflected).move({from:transformSquare('f7',transform),to:transformSquare('f6',transform)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(reflected,previous).declaredSupportedSevenPenalty,1)
    }
    const nearby = transformFen(start.replace('3k4','2k5'),transform)
    for(const move of getChess(nearby).moves()) assert.equal(scoreKnightAndBishopWhiteMove(nearby,move).declaredSupportedSevenPenalty,0)
  }
})

test('r2.5 breaks equal moving-target distances by approaching e8 in every reflection', () => {
  const start = '8/8/3k1K2/8/8/1B1N4/8/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const reflected = transformFen(start,transform)
    const san = (to: 'f7' | 'f5' | 'g6') => getChess(reflected).move({from:transformSquare('f6',transform),to:transformSquare(to,transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(reflected),[san('f7')])
    for (const [to,distance] of [['f7',1],['f5',3],['g6',2]] as const) {
      const score = scoreKnightAndBishopWhiteMove(reflected,san(to))
      assert.equal(score.supportedDiagonalSizeScore,7)
      assert.equal(score.supportedSevenBishopPenalty,0)
      assert.equal(score.supportedSevenKingTargetDistance,1)
      assert.equal(score.supportedSevenKingTieDistance,distance)
    }
  }
})

test('r2.5 also prescribes Ke8 from Kf8 after Kf8 Kd6, including reflections', () => {
  const line = getChess('8/3k1K2/8/8/8/1B1N4/8/8 w - - 0 1')
  line.move('Kf8'); line.move('Kd6')
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2','41 23']) {
      const reflected = transformFen(line.fen().replace(/\d+ \d+$/,counters),transform)
      const expected = getChess(reflected).move({from:transformSquare('f8',transform),to:transformSquare('e8',transform)}).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(reflected),[expected])
      const score = scoreKnightAndBishopWhiteMove(reflected,expected)
      assert.equal(score.supportedDiagonalSizeScore,7)
      assert.equal(score.supportedDiagonalKnightScore,0)
    }
    const nearby = transformFen(line.fen().replace('3k4','2k5'),transform)
    for (const move of getChess(nearby).moves()) assert.equal(scoreKnightAndBishopWhiteMove(nearby,move).declaredSupportedSevenPenalty,0)
  }
})

test('a3 flush walks toward b2 on the opposite color with any seven bishop placement', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const start of [
      '4K3/8/8/3B4/k7/3N4/8/8 w - - 0 1',
      '4K3/8/8/3B4/8/k2N4/8/8 w - - 0 1',
      '4K1B1/8/8/8/k7/3N4/8/8 w - - 0 1',
    ]) {
      const reflected = transformFen(start,transform)
      const san = (to: 'e7' | 'd7' | 'd8') => getChess(reflected).move({from:transformSquare('e8',transform),to:transformSquare(to,transform)}).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(reflected),[san('e7')])
      const e7 = scoreKnightAndBishopWhiteMove(reflected,san('e7'))
      const d7 = scoreKnightAndBishopWhiteMove(reflected,san('d7'))
      const d8 = scoreKnightAndBishopWhiteMove(reflected,san('d8'))
      assert.equal(e7.supportedDiagonalSizeScore,7)
      assert.equal(e7.supportedSevenFlushColorPenalty,0)
      assert.equal(d7.supportedSevenFlushColorPenalty,1)
      assert.equal(e7.supportedSevenFlushDistance,5)
      assert.equal(d7.supportedSevenFlushDistance,5)
      assert.equal(d8.supportedSevenFlushDistance,6)
    }
    const outside = transformFen('4K3/8/8/k2B4/8/3N4/8/8 w - - 0 1',transform)
    for (const san of getChess(outside).moves()) {
      const score = scoreKnightAndBishopWhiteMove(outside,san)
      assert.equal(score.supportedSevenFlushColorPenalty,0)
      assert.equal(score.supportedSevenFlushDistance,0)
    }
  }
})


test('r2.5 prescribes Kd5 instead of Kc7 from Kd6 against Kb5, including reflections', () => {
  const line = getChess('8/8/1k6/3K4/8/1B1N4/8/8 w - - 0 1')
  line.move('Kd6'); line.move('Kb5')
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '41 23']) {
      const fen = transformFen(line.fen().replace(/\d+ \d+$/, counters), transform)
      const preferred = getChess(fen).move({from: transformSquare('d6', transform), to: transformSquare('d5', transform)}).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [preferred])
      const score = scoreKnightAndBishopWhiteMove(fen, preferred)
      assert.equal(score.supportedDiagonalSizeScore, 7)
      assert.equal(score.declaredSupportedSevenPenalty, 0)
      const previous = getChess(fen).move({from: transformSquare('d6', transform), to: transformSquare('c7', transform)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(fen, previous).declaredSupportedSevenPenalty, 1)
    }
    const nearby = transformFen(line.fen().replace('1k6', 'k7'), transform)
    for (const move of getChess(nearby).moves()) assert.equal(scoreKnightAndBishopWhiteMove(nearby, move).declaredSupportedSevenPenalty, 0)
  }
})


test('r2.5 prescribes loaded Kc6 then Kc5 while preserving seven support', () => {
  const line = getChess('8/8/3K4/1k6/8/1B1N4/8/8 w - - 0 1')
  line.move('Kc7'); line.move('Ka5')
  for (const [from, to, reply] of [['c7', 'c6', 'Ka6'], ['c6', 'c5', 'Ka5']] as const) {
    for (const transform of SQUARE_TRANSFORMS) {
      for (const counters of ['2 2', '40 22']) {
        const fen = transformFen(line.fen().replace(/\d+ \d+$/, counters), transform)
        const san = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
        assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san])
        const score = scoreKnightAndBishopWhiteMove(fen, san)
        assert.equal(score.supportedDiagonalSizeScore, 7)
        assert.equal(score.supportedDiagonalKnightScore, 0)
        assert.equal(score.declaredSupportedSevenPenalty, 0)
      }
    }
    line.move({from, to}); line.move(reply)
  }
})


test('the older r2.5 Kc5 declaration cannot override stricter bishop-adjacency support', () => {
  const line = getChess('8/3B4/1k6/3K4/8/3N4/8/8 w - - 0 1')
  line.move('Kd6'); line.move('Ka5')
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '41 23']) {
      const position = transformFen(line.fen().replace(/\d+ \d+$/, counters), transform)
      const san = (to: 'c5' | 'd5') => getChess(position).move({from: transformSquare('d6', transform), to: transformSquare(to, transform)}).san
      const preferred = scoreKnightAndBishopWhiteMove(position, san('c5'))
      const former = scoreKnightAndBishopWhiteMove(position, san('d5'))
      assert.equal(preferred.supportedDiagonalSizeScore, 99)
      assert.equal(former.supportedDiagonalSizeScore, 99)
      assert.equal(preferred.declaredSupportedFivePenalty, 0)
      assert.equal(former.declaredSupportedFivePenalty, 1)
      assert.ok(!getIdealKnightAndBishopWhiteMoves(position).includes(san('c5')))
      const candidates = bishopKnightRuleSet.scoreWhiteCandidates!(position, bishopKnightRuleSet.whiteMoves(position))
      const earlierRules = knightAndBishopWhiteRules.slice(0, knightAndBishopWhiteRules.findIndex(r => r.id === 'r2.5'))
      assert.ok(!selectIdealMoves(candidates, earlierRules).includes(san('c5')))
    }
    const nearby = transformFen('8/3B4/k2K4/8/8/3N4/8/8 w - - 0 1', transform)
    for (const move of getChess(nearby).moves()) {
      const score = scoreKnightAndBishopWhiteMove(nearby, move)
      assert.equal(score.declaredSupportedFivePenalty, undefined)
      if (score.supportedDiagonalSizeScore === 5) {
        assert.equal(knightAndBishopWhiteRules.find(r => r.id === 'r2.5')!.applies!(score), true)
      }
    }
  }
})


test('supported five with previous-stage Nd3 approaches two files right of Black', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const position = transformFen('8/8/1k2K3/8/B7/3N4/8/8 w - - 0 1', transform)
    const san = (to: 'd6' | 'd5') => getChess(position).move({from: transformSquare('e6', transform), to: transformSquare(to, transform)}).san
    for (const [to, distance] of [['d6', 0], ['d5', 1]] as const) {
      const score = scoreKnightAndBishopWhiteMove(position, san(to))
      assert.equal(score.supportedDiagonalSizeScore, 5)
      assert.equal(score.supportedFiveKingTargetDistance, distance)
    }
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(position), [san('d6')])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(position)?.id, 'r2.5')

  }
})


test('supported five with Nd5 and Black near a5 approaches b4, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const position = transformFen('8/8/k1B5/2KN4/8/8/8/8 w - - 0 1', transform)
    const san = (to: 'b4' | 'c4' | 'd6') => getChess(position).move({from: transformSquare('c5', transform), to: transformSquare(to, transform)}).san
    for (const [to, distance] of [['b4', 0]] as const) {
      const score = scoreKnightAndBishopWhiteMove(position, san(to))
      assert.equal(score.supportedDiagonalSizeScore, 5)
      assert.equal(score.supportedFiveKingTargetDistance, distance)
    }
    // Support eligibility precedes the target: c4 is bishop-colored; d6 is supported at three steps.
    assert.equal(scoreKnightAndBishopWhiteMove(position, san('d6')).supportedDiagonalSizeScore, 5)
    assert.equal(scoreKnightAndBishopWhiteMove(position, san('c4')).supportedDiagonalSizeScore, 99)
    const kingCandidates = ['b4', 'c4', 'd6'].map(to => ({san: san(to as 'b4' | 'c4' | 'd6'), score: scoreKnightAndBishopWhiteMove(position, san(to as 'b4' | 'c4' | 'd6'))}))
    assert.deepEqual(selectIdealMoves(kingCandidates, knightAndBishopWhiteRules.filter(r => ['r1.5', 'r2.5'].includes(r.id))), [san('b4')])
    assert.ok(!getIdealKnightAndBishopWhiteMoves(position).includes(san('d6')))
    const rule = knightAndBishopWhiteRules.find(r => r.id === 'r2.5')!
    for (const black of ['a5', 'a6', 'b6'] as const) {
      // Black must also remain inside the five-diagonal; test its eligible trigger squares.
      const board = getChess('8/3B4/8/3N4/8/2K5/8/k7 b - - 0 1')
      board.remove('a1'); board.put({type: 'k', color: 'b'}, black)
      assert.equal(knightAndBishopFiveKingTargetDistance(transformFen(board.fen(), transform)), 1)
    }
    // With Bc6, neither bishop-specific target applies outside the a5 trigger.
    const outside = transformFen('k7/8/2B1K3/3N4/8/8/8/8 b - - 0 1', transform)
    assert.equal(knightAndBishopFiveKingTargetDistance(outside), 0)
    const candidates = bishopKnightRuleSet.scoreWhiteCandidates!(position, bishopKnightRuleSet.whiteMoves(position))
    const earlier = knightAndBishopWhiteRules.slice(0, knightAndBishopWhiteRules.indexOf(rule))
    for (const move of getIdealKnightAndBishopWhiteMoves(position)) assert.ok(selectIdealMoves(candidates, earlier).includes(move))
  }
})


test('supported five bishop and five knight prefer the bishop square farther from White king', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const position = transformFen('2k5/8/3K4/3N4/B7/8/8/8 w - - 0 1', transform)
    const move = (from: 'a4' | 'd6', to: 'b5' | 'd7' | 'c6' | 'e7') => getChess(position).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
    for (const to of ['b5', 'd7', 'c6'] as const) {
      const score = scoreKnightAndBishopWhiteMove(position, move('a4', to))
      assert.equal(score.supportedDiagonalSizeScore, 5)
      assert.equal(score.supportedFiveBishopPenalty, to === 'b5' ? 0 : 1)
    }
    assert.equal(scoreKnightAndBishopWhiteMove(position, move('d6', 'e7')).supportedDiagonalSizeScore, 99)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(position), [move('a4', 'b5')])
    // r2.5 prefers b5, farther from Kd6 than d7 is.
    const bishopCandidates = ['b5', 'd7', 'c6'].map(to => ({san: move('a4', to as 'b5' | 'd7' | 'c6'), score: scoreKnightAndBishopWhiteMove(position, move('a4', to as 'b5' | 'd7' | 'c6'))}))
    assert.deepEqual(selectIdealMoves(bishopCandidates, [knightAndBishopWhiteRules.find(r => r.id === 'r2.5')!]), [move('a4', 'b5')])
    const candidates = bishopKnightRuleSet.scoreWhiteCandidates!(position, bishopKnightRuleSet.whiteMoves(position))
    const earlier = knightAndBishopWhiteRules.slice(0, knightAndBishopWhiteRules.findIndex(r => r.id === 'r2.5'))
    assert.ok(selectIdealMoves(candidates, earlier).includes(move('a4', 'b5')))
    // The previous-stage d3 knight keeps its separate king-target preference.
    const previous = transformFen('8/3B4/k3K3/8/8/3N4/8/8 w - - 0 1', transform)
    for (const san of getChess(previous).moves()) assert.equal(scoreKnightAndBishopWhiteMove(previous, san).supportedFiveBishopPenalty, 0)
  }
})


test('the declared Kd7 exception lets Bb5 and Nd5 target two files right of Black', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const position = transformFen('8/1k6/3K4/1B1N4/8/8/8/8 w - - 2 2', transform)
    const san = (to: 'd7' | 'e7' | 'c5') => getChess(position).move({from: transformSquare('d6', transform), to: transformSquare(to, transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(position, san('d7')).supportedDiagonalSizeScore, 5)
    assert.equal(scoreKnightAndBishopWhiteMove(position, san('d7')).supportedFiveKingTargetDistance, 0)
    assert.equal(scoreKnightAndBishopWhiteMove(position, san('e7')).supportedDiagonalSizeScore, 5) // Three king steps now qualifies.
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(position), [san('d7')])
    for (const move of getIdealKnightAndBishopWhiteMoves(position)) assert.equal(scoreKnightAndBishopWhiteMove(position, move).supportedDiagonalSizeScore, 5)
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(position)?.id, 'r2.5')
  }
})


test('five-bishop distance preference ties symmetrically and follows the farther square', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [king, bishop, expected] of [
      ['d6', 'b5', 0], ['d6', 'd7', 1],
      ['b6', 'b5', 1], ['b6', 'd7', 0],
      ['c6', 'b5', 0], ['c6', 'd7', 0],
      ['c6', 'a4', 1],
    ] as const) {
      const board = getChess('2k5/8/8/3N4/8/8/8/7K b - - 0 1')
      board.remove('h1')
      board.put({type: 'k', color: 'w'}, king)
      board.put({type: 'b', color: 'w'}, bishop)
      assert.equal(knightAndBishopFiveBishopPenalty(transformFen(board.fen(), transform)), expected)
    }
  }
})


test('the loaded second Bb5 takes priority over the e7 king approach', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('2k5/8/2BK4/3N4/8/8/8/8 w - - 2 2', transform)
    const move = getChess(fen).move({from: transformSquare('c6', transform), to: transformSquare('b5', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).supportedDiagonalSizeScore, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
  }
})
