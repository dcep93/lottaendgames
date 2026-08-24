import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  getChess,
  transformFen,
  transformSquare,
} from '../chess'
import {
  getMateRuleSet,
  scoreTwoBishopsWhiteMove,
  twoBishopsRuleSet,
  twoBishopsWhiteRules,
} from './index'

const ACTIVE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'rule g',
  'rule n',
  'rule o',
  'rule w2',
  'rule w3',
  'rule w',
  'rule x',
]

test('Two Bishops activates only safeguards and the seven-rule wall policy', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    ACTIVE_RULE_IDS,
  )
  assert.deepEqual(
    getMateRuleSet('two-bishops').whiteRuleDescriptions.map(({ id }) => id),
    ACTIVE_RULE_IDS,
  )
})

test('the seven active bishop rules render in order', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.slice(3).map(({ id, helpText }) => ({
      id,
      helpText,
    })),
    [
      {
        id: 'rule g',
        helpText:
          "Phase 2: Prefer White's king closer to a square a knight's move away from Black's proximate corner.",
      },
      {
        id: 'rule n',
        helpText:
          "With a bishop wall and White's king controlling the escape square, shrink and check along the bishop wall, from at least 4 diagonals from the corner.",
      },
      {
        id: 'rule o',
        helpText:
          "Prefer a bishop wall keeping Black's king in a smaller area from at least 4 diagonals from the corner.",
      },
      {
        id: 'rule w2',
        helpText: "Prefer White's king closer to Black's king.",
      },
      {
        id: 'rule w3',
        helpText: 'Phase 1: Prefer outer wall bishop off the edge.',
      },
      {
        id: 'rule w',
        helpText: "Phase 1: Prefer bishops 3 or more steps from Black's king.",
      },
      {
        id: 'rule x',
        helpText: "Phase 2: Force Black's king towards the corner.",
      },
    ],
  )
})

test('Rule X requires every legal Black reply to approach the wall corner', () => {
  const ruleX = twoBishopsWhiteRules.find(({ id }) => id === 'rule x')
  assert.ok(ruleX)
  const compare = ruleX.compare
  assert.ok(compare)

  const fen = '8/B7/3K4/1B6/8/8/8/4k3 w - - 0 1'
  const forcing = scoreTwoBishopsWhiteMove(fen, 'Bb6')
  const permitsEscape = scoreTwoBishopsWhiteMove(fen, 'Bb8')

  assert.equal(getMateRuleSet('two-bishops').phase(fen), '2/2')
  assert.equal(forcing.ruleXApplies, true)
  assert.equal(forcing.ruleXPenalty, 0)
  assert.equal(permitsEscape.ruleXPenalty, 1)
  assert.ok(compare(forcing, permitsEscape) < 0)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const forcingMove = chess.moves({ verbose: true }).find(
      ({ from, to }) =>
        from === transformSquare('a7', transform) &&
        to === transformSquare('b6', transform),
    )
    const escapeMove = chess.moves({ verbose: true }).find(
      ({ from, to }) =>
        from === transformSquare('a7', transform) &&
        to === transformSquare('b8', transform),
    )
    assert.ok(forcingMove, transform.name)
    assert.ok(escapeMove, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, forcingMove.san).ruleXPenalty,
      0,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, escapeMove.san).ruleXPenalty,
      1,
      transform.name,
    )
  }
})

test('Rule G prefers the resulting king nearer a corner-knight square when the move enters Phase 2', () => {
  const ruleG = twoBishopsWhiteRules.find(({ id }) => id === 'rule g')
  assert.ok(ruleG)
  const compare = ruleG.compare
  assert.ok(compare)

  const phaseTwoFen = '8/8/8/8/5K2/4B2k/8/3B4 w - - 2 2'
  const phaseOneFen = '8/8/8/8/7k/4BK2/8/3B4 w - - 0 1'
  const closer = scoreTwoBishopsWhiteMove(phaseTwoFen, 'Kf3')
  const farther = scoreTwoBishopsWhiteMove(phaseTwoFen, 'Ke4')

  assert.equal(closer.ruleGApplies, true)
  assert.equal(closer.ruleGPenalty, 1)
  assert.equal(farther.ruleGPenalty, 5)
  assert.ok(compare(closer, farther) < 0)
  const entersPhaseTwo = scoreTwoBishopsWhiteMove(phaseOneFen, 'Kf2')
  assert.equal(entersPhaseTwo.ruleGApplies, true)
  assert.equal(entersPhaseTwo.ruleGPenalty, 0)

  const tiedCornerFen = '8/8/5K2/4B2k/8/3B4/8/8 w - - 0 1'
  const tiedCornerScore = scoreTwoBishopsWhiteMove(tiedCornerFen, 'Bf4')
  assert.equal(tiedCornerScore.ruleGApplies, true)
  assert.equal(tiedCornerScore.ruleGPenalty, 1)

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(phaseTwoFen, transform)
    const chess = getChess(fen)
    const from = transformSquare('f4', transform)
    const closerTo = transformSquare('f3', transform)
    const fartherTo = transformSquare('e4', transform)
    const moves = chess.moves({ verbose: true })
    const closerMove = moves.find(
      (move) => move.from === from && move.to === closerTo,
    )
    const fartherMove = moves.find(
      (move) => move.from === from && move.to === fartherTo,
    )
    assert.ok(closerMove, transform.name)
    assert.ok(fartherMove, transform.name)
    assert.ok(
      compare(
        scoreTwoBishopsWhiteMove(fen, closerMove.san),
        scoreTwoBishopsWhiteMove(fen, fartherMove.san),
      ) < 0,
      transform.name,
    )
  }
})

test('Rule W2 compares resulting squared Euclidean king distance', () => {
  const ruleW2 = twoBishopsWhiteRules.find(({ id }) => id === 'rule w2')
  assert.ok(ruleW2)
  const compare = ruleW2.compare
  assert.ok(compare)

  const fen = '8/8/6BB/4K3/6k1/8/8/8 w - - 4 3'
  const closer = scoreTwoBishopsWhiteMove(fen, 'Ke4')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Kd6')

  assert.equal(closer.kingCloserDistance, 4)
  assert.equal(farther.kingCloserDistance, 13)
  assert.ok(compare(closer, farther) < 0)
})

test('Training Info retains only the Phase 2 definition and Rule N diagram', () => {
  assert.deepEqual(twoBishopsRuleSet.help.notes, [
    "Phase 2: There is an eligible functional bishop wall at least 4 diagonals from its corner, with Black restricted inside it.",
  ])
  assert.deepEqual(
    twoBishopsRuleSet.help.noteBoards.map(({ id }) => id),
    ['bishop-rule-n', 'bishop-phase-two-wall'],
  )
})
