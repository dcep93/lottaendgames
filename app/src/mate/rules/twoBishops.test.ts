import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, getChess, transformFen } from '../chess'
import {
  compareTwoBishopsBlackScores,
  getMateRuleSet,
  scoreTwoBishopsBlackMove,
  scoreTwoBishopsWhiteMove,
  twoBishopsWhiteRules,
} from './index'
import {
  getBlackKingReachableArea,
  getWhiteKingBishopScreeningPenalty,
} from './twoBishopsGeometry'

const WHITE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'finish guarantee',
  'waiting move',
  'corner finish',
  'corner finish',
  'corner finish',
  'bishop wall',
  'bishop wall',
  'bishop wall',
  'king closer',
] as const

test('Two Bishops exposes concise position-only teaching rules', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
  for (const rule of twoBishopsWhiteRules.slice(3)) {
    assert.ok(rule.helpText.length > 0, `${rule.id} needs an explanation`)
    assert.ok(rule.helpText.length < 240, `${rule.id} is too verbose`)
  }
  assert.match(
    twoBishopsWhiteRules.find(({ id }) => id === 'waiting move')!.helpText,
    /controls that corner/,
  )
  assert.deepEqual(
    getMateRuleSet('two-bishops').whiteRuleDescriptions.map(({ id }) => id),
    [
      'mate',
      'bishops safe',
      'no stalemate',
      'finish guarantee',
      'waiting move',
      'corner finish',
      'bishop wall',
      'king closer',
    ],
  )
})

test('Two Bishops chooses the requested dark-square corner wait', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const fen = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1'
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bh6'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'waiting move')
})

test('corner wait cannot immediately reverse', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const afterWaitAndReply =
    '8/3B3k/5K1B/8/8/8/8/8 w - - 2 2'
  assert.deepEqual(ruleSet.idealWhiteMoves(afterWaitAndReply), ['Kg5'])
  assert.equal(
    scoreTwoBishopsWhiteMove(afterWaitAndReply, 'Bf8')
      .proofProgressPenalty,
    1,
  )
})

test('former supported-corner oscillations now leave the cycle', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(
    ruleSet.idealWhiteMoves(
      '8/8/2B5/8/8/2K5/8/1kB5 w - - 0 1',
    ),
    ['Kd2'],
  )
  assert.deepEqual(
    ruleSet.idealWhiteMoves(
      '8/8/8/1B6/8/2K5/8/1kB5 w - - 2 2',
    ),
    ['Kd2'],
  )
})

test('all recommended moves in the regression positions pass the proof guard', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  for (const fen of [
    '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1',
    '8/3B3k/5K1B/8/8/8/8/8 w - - 2 2',
    '8/8/2B5/8/8/2K5/8/1kB5 w - - 0 1',
    '8/8/8/1B6/8/B1K5/k7/8 w - - 0 1',
    '8/8/8/2BB4/8/K2k4/8/8 w - - 0 1',
  ]) {
    const moves = ruleSet.idealWhiteMoves(fen)
    assert.ok(moves.length > 0)
    for (const san of moves) {
      assert.equal(
        scoreTwoBishopsWhiteMove(fen, san).proofProgressPenalty,
        0,
        `${fen}: ${san}`,
      )
    }
  }
})

test('two-bishop recommendations are symmetric', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const fen = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1'
  const expectedCount = ruleSet.idealWhiteMoves(fen).length
  for (const transform of SQUARE_TRANSFORMS) {
    const transformed = getChess(transformFen(fen, transform)).fen()
    assert.equal(ruleSet.idealWhiteMoves(transformed).length, expectedCount)
  }
})

test('White recommendations depend only on the board position', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const fresh = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1'
  const old = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 76 39'
  assert.deepEqual(ruleSet.idealWhiteMoves(fresh), ['Bh6'])
  assert.deepEqual(ruleSet.idealWhiteMoves(old), ['Bh6'])
  assert.equal(
    ruleSet.currentWhiteHint(fresh)?.id,
    ruleSet.currentWhiteHint(old)?.id,
  )
})

test('bishop screening counts only White king between Black and a bishop', () => {
  assert.equal(
    getWhiteKingBishopScreeningPenalty(
      '8/8/8/2B5/3K4/4k3/6B1/8 b - - 0 1',
    ),
    1,
  )
  assert.equal(
    getWhiteKingBishopScreeningPenalty(
      '8/8/8/2B5/8/4k3/6B1/3K4 b - - 0 1',
    ),
    0,
  )
})

test('coordinated bishops leave Black less room', () => {
  const scattered = getBlackKingReachableArea(
    '8/8/8/2B5/8/K2k4/8/6B1 w - - 0 1',
  )
  const wall = getBlackKingReachableArea(
    '8/8/8/2BB4/8/K2k4/8/8 w - - 0 1',
  )
  assert.ok(wall < scattered)
})

test('king closer compares king distance before row-plus-file distance', () => {
  const fen = '8/8/8/8/3k4/8/2K1BB2/8 w - - 0 1'
  const closer = scoreTwoBishopsWhiteMove(fen, 'Kd2')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Kb2')
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'king closer')!
  assert.ok(rule.compare!(closer, farther) < 0)
})

test('Black captures before seeking the center or a bishop', () => {
  const fen = '6B1/8/8/8/3k4/2B5/8/K7 b - - 0 1'
  const capture = scoreTwoBishopsBlackMove(fen, 'Kxc3')
  const quiet = scoreTwoBishopsBlackMove(fen, 'Ke4')
  assert.ok(compareTwoBishopsBlackScores(capture, quiet) < 0)
})

test('Black resistance and the finish guarantee stay explicit', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const help = ruleSet.help
  assert.deepEqual(help.blackPriorities, [
    'Return to the previous board position when a legal reply can recreate it.',
    "Take a piece if White isn't looking.",
    'Move toward the center.',
    'Move toward an unprotected bishop.',
  ])
  const guard = ruleSet.whiteRuleDescriptions.find(
    ({ presentationRole }) => presentationRole === 'guard',
  )
  assert.equal(guard?.id, 'finish guarantee')
  assert.match(guard?.helpText ?? '', /repetition/)
  assert.match(guard?.helpText ?? '', /fifty-move draw/)
})
