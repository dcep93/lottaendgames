import assert from 'node:assert/strict'
import test from 'node:test'
import { allSquares, getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { fiveDiagonalPressureScore } from './bishopKnightFivePressure'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { getMateRuleSet } from './index'

test('five-diagonal pressure prefers b6/c7, then b5/d7, then the rest of the four-diagonal', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const square of allSquares()) {
      if (['a8', 'c6', 'd5'].includes(square)) continue
      const board = getChess('k7/8/2B5/3N4/8/8/8/7K b - - 0 1')
      board.remove('h1')
      board.put({color: 'w', type: 'k'}, square)
      assert.equal(fiveDiagonalPressureScore(transformFen(board.fen(), transform)).king,
        ['b6', 'c7'].includes(square) ? 0 : ['b5', 'd7'].includes(square) ? 1 : ['a5', 'd8'].includes(square) ? 2 : 3)
    }
  }
})

test('b6/c7 occupancy decides when Black is less than two steps from the corner', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('3K4/k7/8/1B1N4/8/8/8/8 w - - 0 1', transform)
    const endpoint = getChess(fen).move({from: transformSquare('d8', transform), to: transformSquare('e8', transform)}).san
    const middle = getChess(fen).move({from: transformSquare('d8', transform), to: transformSquare('c7', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [middle])
    assert.equal(scoreKnightAndBishopWhiteMove(fen, endpoint).fiveDiagonalApproachScore, null)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, middle).fiveDiagonalKingScore, 0)
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, endpoint)?.id, 'r2.5')
  }
})

test('five-diagonal approach uses king steps to the six-diagonal square on Black’s side, independently of bishop placement', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const bishop of ['a4', 'b5', 'c6', 'd7', 'e8'] as const) {
      for (const [black, expected] of [['a6', 2], ['c8', 1], ['a7', null], ['a8', null]] as const) {
        const board = getChess('7k/8/3K4/3N4/8/8/8/8 b - - 0 1')
        board.remove('h8')
        board.put({color: 'w', type: 'b'}, bishop)
        board.put({color: 'b', type: 'k'}, black)
        assert.equal(fiveDiagonalPressureScore(transformFen(board.fen(), transform)).approach, expected)
      }
    }
    for (const fen of ['7k/8/3K4/3N4/B7/8/8/8 w - - 0 1', '1k6/8/3K4/8/B7/8/3N4/8 w - - 0 1']) {
      assert.equal(fiveDiagonalPressureScore(transformFen(fen, transform)).approach, null)
    }
  }
})

test('Kd7 takes precedence over the edge, and Kc7 remains preferred when available', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, from, to] of [
      ['3K4/1k6/8/1B1N4/8/8/8/8 w - - 0 1', 'd8', 'd7'],
      ['4K3/1k6/8/1B1N4/8/8/8/8 w - - 0 1', 'e8', 'd7'],
      ['3K4/k7/8/1B1N4/8/8/8/8 w - - 0 1', 'd8', 'c7'],
    ] as const) {
      const before = transformFen(fen, transform)
      const move = getChess(before).move({from: transformSquare(from, transform), to: transformSquare(to, transform)})
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move.san])
    }
  }
})

test('Ba6+ establishes a smaller supported diagonal before six-diagonal approach is compared', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('2k5/4K3/8/1B1N4/8/8/8/8 w - - 0 1', transform)
    const move = getChess(fen).move({from: transformSquare('e7', transform), to: transformSquare('e8', transform)}).san
    const shuffle = getChess(fen).move({from: transformSquare('b5', transform), to: transformSquare('d7', transform)}).san
    const smaller = getChess(fen).move({from: transformSquare('b5', transform), to: transformSquare('a6', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [smaller])
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, move)?.id, 'r1.5')
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).fiveDiagonalApproachScore, 1)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, shuffle).fiveDiagonalApproachScore, 0)
  }
})

test('bishop placement takes precedence over all king-placement preferences', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, from, to, bishopFrom, bishopTo] of [
      ['8/1k1K4/8/1B1N4/8/8/8/8 w - - 0 1', 'd7', 'd8', 'b5', 'c6'],
      ['3K4/k7/2B5/3N4/8/8/8/8 w - - 0 1', 'd8', 'c7', 'c6', 'b5'],
    ] as const) {
      const before = transformFen(fen, transform)
      const kingMove = getChess(before).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      const bishopMove = getChess(before).move({from: transformSquare(bishopFrom, transform), to: transformSquare(bishopTo, transform)}).san
      const preferred = from === 'd7' ? kingMove : bishopMove
      const rejected = from === 'd7' ? bishopMove : kingMove
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [preferred])
      assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(before, rejected)?.id, 'r2.5')
      const king = scoreKnightAndBishopWhiteMove(before, kingMove)
      const bishop = scoreKnightAndBishopWhiteMove(before, bishopMove)
      if (from === 'd7') {
        assert.ok(king.fiveDiagonalKingScore > bishop.fiveDiagonalKingScore)
        assert.ok(king.fiveDiagonalBishopScore < bishop.fiveDiagonalBishopScore)
      } else {
        assert.equal(king.fiveDiagonalKingScore, 0)
        assert.ok(king.fiveDiagonalBishopScore > bishop.fiveDiagonalBishopScore)
      }
    }
  }
})

test('six-diagonal approach outranks king placement only at least two steps from the cage corner', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [black, expected, promoted] of [['a5', ['Kc5'], true], ['a6', ['Kc5'], true], ['a7', ['Kc7'], false], ['a8', ['Kc7'], false]] as const) {
      const board = getChess('8/3B4/3K4/8/8/8/8/7k w - - 0 1')
      board.remove('h1')
      board.put({color: 'b', type: 'k'}, black)
      board.put({color: 'w', type: 'n'}, 'd5')
      const fen = transformFen(board.fen(), transform)
      const preferred = expected.map(san => {
        const move = getChess(board.fen()).move(san)
        return getChess(fen).move({from: transformSquare(move.from, transform), to: transformSquare(move.to, transform)}).san
      })
      assert.deepEqual([...getIdealKnightAndBishopWhiteMoves(fen)].sort(), preferred.sort())
      for (const target of ['c5', 'c7'] as const) {
        const move = getChess(fen).move({from: transformSquare('d6', transform), to: transformSquare(target, transform)}).san
        const score = scoreKnightAndBishopWhiteMove(fen, move)
        assert.equal(score.fiveDiagonalApproachScore, promoted ? (target === 'c5' ? 1 : 3) : null)
      }
    }
  }
})


test('the midpoint bishop no longer exempts approach, so Kd6 beats Ba4 in the loaded loop', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/3K4/k1B5/3N4/8/8/8/8 w - - 0 1', transform)
    const king = getChess(fen).move({from: transformSquare('d7', transform), to: transformSquare('d6', transform)}).san
    const bishop = getChess(fen).move({from: transformSquare('c6', transform), to: transformSquare('a4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, king).fiveDiagonalApproachScore, 2)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bishop).fiveDiagonalApproachScore, 3)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [king])
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, bishop)?.id, 'r2.5')
  }
})

test('Bd7 still wins bishop placement when both moves tie on six-diagonal approach', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/2K5/2B5/k2N4/8/8/8/8 w - - 2 2', transform)
    assert.equal(fiveDiagonalPressureScore(before).approach, 3)
    const bishopMove = getChess(before).move({from: transformSquare('c6', transform), to: transformSquare('d7', transform)}).san
    const kingMove = getChess(before).move({from: transformSquare('c7', transform), to: transformSquare('d7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, bishopMove).fiveDiagonalApproachScore, 3)
    assert.equal(scoreKnightAndBishopWhiteMove(before, kingMove).fiveDiagonalApproachScore, 3)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [bishopMove])
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(before, kingMove)?.id, 'r2.5')
  }
})


test('keeping Bd7 beats Ba4 and king steps follow Black’s side', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/2KB4/k7/3N4/8/8/8/8 w - - 0 1', transform)
    const kingMove = getChess(fen).move({from: transformSquare('c7', transform), to: transformSquare('d6', transform)}).san
    const bishopMove = getChess(fen).move({from: transformSquare('d7', transform), to: transformSquare('a4', transform)}).san
    const king = scoreKnightAndBishopWhiteMove(fen, kingMove)
    const bishop = scoreKnightAndBishopWhiteMove(fen, bishopMove)
    assert.equal(king.fiveDiagonalBishopScore, 0)
    assert.equal(bishop.fiveDiagonalBishopScore, 1)
    assert.equal(king.fiveDiagonalApproachScore, 2)
    assert.equal(bishop.fiveDiagonalApproachScore, 3)
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, bishopMove)?.id, 'r2.5')
    const preferred = getChess(fen).move({from: transformSquare('c7', transform), to: transformSquare('c6', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [preferred])
  }
})


test('final five-diagonal corner proximity selects Kd6 before r10 center proximity', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/1k1B4/8/3NK3/8/8/8/8 w - - 0 1', transform)
    const king = getChess(fen).move({from: transformSquare('e5', transform), to: transformSquare('d6', transform)}).san
    const bishop = getChess(fen).move({from: transformSquare('d7', transform), to: transformSquare('b5', transform)}).san
    const first = scoreKnightAndBishopWhiteMove(fen, king)
    const second = scoreKnightAndBishopWhiteMove(fen, bishop)
    assert.equal(first.fiveDiagonalApproachScore, null)
    assert.equal(second.fiveDiagonalApproachScore, null)
    assert.equal(first.fiveDiagonalKingScore, second.fiveDiagonalKingScore)
    assert.equal(first.fiveDiagonalBishopScore, second.fiveDiagonalBishopScore)
    assert.equal(first.forceCornerKingProximityScore, 13)
    assert.equal(second.forceCornerKingProximityScore, 25)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [king])
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, bishop)?.id, 'r2.5')
  }
})

test('Nd3 pressure compares king proximity to c5/d6, then to an eligible bishop', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const edge = fiveDiagonalPressureScore(transformFen('8/1k6/3K4/8/B7/3N4/8/8 b - - 0 1', transform))
    const nearEdge = fiveDiagonalPressureScore(transformFen('8/1k6/3K4/1B6/8/3N4/8/8 b - - 0 1', transform))
    assert.equal(edge.sevenSupportKingProximity, 0)
    assert.equal(nearEdge.sevenSupportKingProximity, 0)
    assert.equal(edge.bishop, nearEdge.bishop)
    assert.equal(edge.king, 13)
    assert.equal(nearEdge.king, 5)
    assert.equal(edge.approach, null)
  }
})


test('with Nd3, king proximity to c5/d6 precedes bishop placement and proximity in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/k3K3/8/8/B7/3N4/8/8 w - - 2 2', transform)
    const king = getChess(fen).move({from: transformSquare('e7', transform), to: transformSquare('d6', transform)}).san
    const bishop = getChess(fen).move({from: transformSquare('a4', transform), to: transformSquare('b5', transform)}).san
    const preferred = getChess(fen).move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [preferred])
    const kingScore = scoreKnightAndBishopWhiteMove(fen, king)
    const bishopScore = scoreKnightAndBishopWhiteMove(fen, bishop)
    assert.equal(kingScore.fiveDiagonalSevenSupportKingScore, 0)
    assert.equal(bishopScore.fiveDiagonalSevenSupportKingScore, 2)
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, bishop)?.id, 'r1.5')
    assert.equal(fiveDiagonalPressureScore(transformFen('k7/8/3K4/1B1N4/8/8/8/8 w - - 0 1', transform)).sevenSupportKingProximity, 0)
  }
})


test('Nd3 five-diagonal pressure prefers d6 and scores both c5 and d6 as reached', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, from, to] of [
      ['8/1k1K4/8/8/B7/3N4/8/8 w - - 0 1', 'd7', 'd6'],
      ['8/8/k2K4/8/B7/3N4/8/8 w - - 2 2', 'd6', 'c5'],
    ] as const) {
      const before = transformFen(fen, transform)
      const move = getChess(before).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).fiveDiagonalSevenSupportKingScore, 0)
      if (from === 'd7') {
        const knight = getChess(before).move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
        assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [knight])
      }
      else {
        const bishop = getChess(before).move({from: transformSquare('a4', transform), to: transformSquare('c6', transform)}).san
        assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [bishop])
        assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(before, move)?.id, 'r2.5')
      }
    }
  }
})


test('Black on b6 makes b4 the Nd3 five-diagonal king target in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/8/1k6/1B6/2K5/3N4/8/8 w - - 0 1', transform)
    const king = getChess(before).move({from: transformSquare('c4', transform), to: transformSquare('b4', transform)}).san
    const bishop = getChess(before).move({from: transformSquare('b5', transform), to: transformSquare('a4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, king).fiveDiagonalSevenSupportKingScore, 0)
    assert.equal(scoreKnightAndBishopWhiteMove(before, bishop).fiveDiagonalSevenSupportKingScore, 1)
    const knightMove = getChess(before).move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [knightMove])
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(before, bishop)?.id, 'r1.5')
  }
})
