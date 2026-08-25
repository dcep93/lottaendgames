import assert from 'node:assert/strict'
import test from 'node:test'
import { MATE_CATALOG } from '../catalog'
import {
  getIdealTwoBishopsWhiteMoves,
  scoreTwoBishopsWhiteMove,
  twoBishopsRuleSet,
  twoBishopsWhiteRules,
} from './twoBishops'

const ACTIVE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'rule a',
  'rule e5',
  'rule e6',
  'rule e8',
  'rule f5',
  'rule f',
  'rule g',
  'rule j',
  'rule m',
  'rule r',
  'rule s',
  'rule w',
  'rule x',
  'rule z',
]

test('Two Bishops uses only the active two-phase policy', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    ACTIVE_RULE_IDS,
  )
  assert.equal(twoBishopsRuleSet.phase('8/8/8/8/8/8/8/K6k w - - 0 1'), '1/2')
  assert.deepEqual(twoBishopsRuleSet.help.notes, [
    'Phase 2: Control a long corner diagonal and the parallel diagonal one step inward, enclosing both kings on the inward side.',
  ])
  assert.deepEqual(twoBishopsRuleSet.help.noteBoards, [])
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule w')?.helpText,
    "Phase 2: With Black on the edge, prefer bishops to control squares along Black's edge closer to Black's corner, from the opposite corner's direction, but not the corner until mate.",
  )
})

test('Training Wheels uses Bg7 Bg6, White Kb1, and Black Kh4', () => {
  const entry = MATE_CATALOG.find(({ id }) => id === 'two-bishops')
  assert.deepEqual(entry?.trainSeeds, [
    '8/6B1/6B1/8/7k/8/8/1K6 w - - 0 1',
  ])
})

test('rule a prefers entering phase 2 after White moves', () => {
  const fen = '8/6B1/6B1/8/7k/8/8/1K6 w - - 0 1'
  const enters = scoreTwoBishopsWhiteMove(fen, 'Kc1')
  const remains = scoreTwoBishopsWhiteMove(fen, 'Ka1')
  assert.equal(enters.ruleAPenalty, 0)
  assert.equal(remains.ruleAPenalty, 1)
  assert.equal(twoBishopsRuleSet.phase('8/6B1/6B1/8/7k/8/8/2K5 b - - 1 1'), '2/2')
})

test('rule g prefers corner-diagonal control away from the corner', () => {
  const fen = '8/7k/8/8/8/8/8/B1B3K1 w - - 0 1'
  const nonCorner = scoreTwoBishopsWhiteMove(fen, 'Bab2')
  const staysInCorner = scoreTwoBishopsWhiteMove(fen, 'Kg2')
  assert.equal(nonCorner.ruleGPenalty, 0)
  assert.equal(staysInCorner.ruleGPenalty, 1)
  assert.ok(nonCorner.ruleGPenalty < staysInCorner.ruleGPenalty)
})

test('rule j builds an adjacent enclosing diagonal without passage through the long diagonal', () => {
  const fen = 'K7/8/8/4B3/8/3B4/8/7k w - - 0 1'
  const wall = scoreTwoBishopsWhiteMove(fen, 'Bf5')
  const checkingWall = scoreTwoBishopsWhiteMove(fen, 'Be4+')
  const noWall = scoreTwoBishopsWhiteMove(fen, 'Bf1')
  assert.equal(wall.ruleJPenalty, 0)
  assert.equal(checkingWall.ruleJPenalty, 0)
  assert.equal(noWall.ruleJPenalty, 1)
})

test("rule m prefers White's king off the edge", () => {
  const fen = '8/8/1B6/3B4/8/8/6K1/4k3 w - - 0 1'
  const edge = scoreTwoBishopsWhiteMove(fen, 'Kg1')
  const interior = scoreTwoBishopsWhiteMove(fen, 'Kg3')
  assert.equal(edge.ruleMApplies, true)
  assert.equal(edge.ruleMPenalty, 1)
  assert.equal(interior.ruleMPenalty, 0)
  assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes('Kg1'))
})

test('rule r minimizes squared Euclidean king distance after White moves', () => {
  const fen = '7k/8/8/8/4K3/8/B7/B7 w - - 0 1'
  const closer = scoreTwoBishopsWhiteMove(fen, 'Kf5')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Kd5')
  assert.equal(closer.kingCloserDistance, 13)
  assert.equal(farther.kingCloserDistance, 25)
})

test("rule s prefers an attacked bishop's maximum squared Euclidean distance from Black in Phase 2", () => {
  const fen = '8/8/8/7K/8/5B1k/7B/8 w - - 0 1'
  const farther = scoreTwoBishopsWhiteMove(fen, 'Bb8')
  const nearer = scoreTwoBishopsWhiteMove(fen, 'Bf4')
  assert.equal(farther.ruleSApplies, true)
  assert.equal(nearer.ruleSApplies, true)
  assert.equal(farther.ruleSPenalty, -61)
  assert.equal(nearer.ruleSPenalty, -5)
  assert.ok(farther.ruleSPenalty < nearer.ruleSPenalty)
})

test('rule s ignores bishop moves when the moved bishop is not attacked', () => {
  const fen = '8/8/5B2/5B2/8/8/5K2/7k w - - 0 1'
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bg7').ruleSApplies, false)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be5').ruleSApplies, false)
})

test("rule w prefers the resulting bishop pair's opposite-corner controls closer along Black's active edge", () => {
  const fen = '8/8/5B2/5B2/8/8/5K2/7k w - - 0 1'
  const fartherEdgeControl = scoreTwoBishopsWhiteMove(fen, 'Bg7')
  const closerEdgeControl = scoreTwoBishopsWhiteMove(fen, 'Be5')
  const cornerCheck = scoreTwoBishopsWhiteMove(fen, 'Be4+')
  const twoEdgeIntersections = scoreTwoBishopsWhiteMove(fen, 'Bd3')
  const losesExistingH3Control = scoreTwoBishopsWhiteMove(fen, 'Bg6')
  const preservesExistingH3Control = scoreTwoBishopsWhiteMove(fen, 'Kg3')
  assert.equal(fartherEdgeControl.ruleWPenalty, 2)
  assert.equal(closerEdgeControl.ruleWPenalty, 1)
  assert.equal(cornerCheck.ruleWApplies, true)
  assert.equal(cornerCheck.ruleWPenalty, 99)
  assert.equal(
    twoEdgeIntersections.ruleWPenalty,
    99,
    'Bd3 must not count f1 because Black\'s active edge is the h-file',
  )
  assert.ok(closerEdgeControl.ruleWPenalty < fartherEdgeControl.ruleWPenalty)
  assert.equal(losesExistingH3Control.ruleWPenalty, 3)
  assert.equal(preservesExistingH3Control.ruleWPenalty, 2)
  assert.ok(
    preservesExistingH3Control.ruleWPenalty <
      losesExistingH3Control.ruleWPenalty,
  )
  assert.ok(
    !getIdealTwoBishopsWhiteMoves(fen).includes('Be4+'),
    'corner control must not survive rule w before mate',
  )
})

test("rule w does not count a bishop's occupied edge square as controlled", () => {
  const fen = '1B6/8/5K2/3B4/7k/8/8/8 w - - 2 2'
  const occupiesH2 = scoreTwoBishopsWhiteMove(fen, 'Bh2')
  assert.equal(occupiesH2.ruleWApplies, true)
  assert.equal(occupiesH2.ruleWPenalty, 99)
})

test('rule w applies only in Phase 2 with Black on an edge', () => {
  const blackOffEdge = scoreTwoBishopsWhiteMove(
    '8/8/3B4/6k1/8/5B2/6K1/8 w - - 4 3',
    'Kh3',
  )
  const leavesPhaseTwo = scoreTwoBishopsWhiteMove(
    '8/6B1/8/8/5K1k/8/2B5/8 w - - 0 1',
    'Ke5',
  )
  assert.equal(blackOffEdge.isPhaseTwoPosition, true)
  assert.equal(blackOffEdge.ruleWApplies, false)
  assert.equal(leavesPhaseTwo.isPhaseTwoPosition, false)
  assert.equal(leavesPhaseTwo.ruleWApplies, false)
  assert.equal(leavesPhaseTwo.ruleW1Applies, false)
})

test('rule e5 forces every Black reply toward the corner enclosed by the bishop cage', () => {
  const fen = '8/8/3B4/5K2/7k/5B2/8/8 w - - 0 1'
  const towardNearestCorner = scoreTwoBishopsWhiteMove(fen, 'Bc7')
  const towardCagedCorner = scoreTwoBishopsWhiteMove(fen, 'Bg2')
  assert.equal(towardNearestCorner.ruleQ5Penalty, 1)
  assert.equal(towardCagedCorner.ruleQ5Penalty, 0)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bg2'])
})

test('rule e5 applies only after White produces Phase 2', () => {
  const phaseOne = scoreTwoBishopsWhiteMove(
    '8/8/8/3B4/8/4BK2/8/4k3 w - - 0 1',
    'Bc4',
  )
  assert.equal(phaseOne.isPhaseTwoPosition, false)
  assert.equal(phaseOne.ruleQ5Applies, false)
})

test("rule e6 prefers king proximity to the corner's knight square not adjacent to Black's edge", () => {
  const fen = '8/8/5B2/8/4BK2/8/7k/8 w - - 2 2'
  const approachesF2 = scoreTwoBishopsWhiteMove(fen, 'Kf3')
  const leavesKingOnF4 = scoreTwoBishopsWhiteMove(fen, 'Bd4')
  assert.equal(approachesF2.ruleE6Applies, true)
  assert.equal(approachesF2.ruleE6Penalty, 1)
  assert.equal(leavesKingOnF4.ruleE6Penalty, 4)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf3'])
})

test('rule e8 forces Black along the edge toward valid targets', () => {
  const fen = '8/6B1/8/8/5K1k/8/2B5/8 w - - 0 1'
  const forcing = scoreTwoBishopsWhiteMove(fen, 'Bf5')
  const releasesFromEdge = scoreTwoBishopsWhiteMove(fen, 'Ke5')
  assert.equal(forcing.ruleQ8Applies, true)
  assert.equal(releasesFromEdge.ruleQ8Applies, false)
  assert.equal(forcing.ruleQ8Penalty, 0)
  assert.equal(releasesFromEdge.ruleQ8Penalty, 1)
})

test("rule e8 also accepts forcing Black along the edge toward its caged corner", () => {
  const fen = '8/8/3B4/5K2/7k/5B2/8/8 w - - 0 1'
  const towardCagedCorner = scoreTwoBishopsWhiteMove(fen, 'Bg2')
  assert.equal(towardCagedCorner.ruleQ5Penalty, 0)
  assert.equal(towardCagedCorner.ruleQ8Penalty, 0)
})

test('rule e8 permits different Black replies to approach different valid targets', () => {
  const fen = '1B6/8/5K2/7k/4B3/8/8/8 w - - 2 2'
  const splitTargets = scoreTwoBishopsWhiteMove(fen, 'Kf5')
  assert.equal(splitTargets.ruleQ8Penalty, 0)
})

test('rule f5 applies when edge-square two or three is bishop controlled and prefers the knight target away from that edge', () => {
  const fen = '8/8/5B2/5BK1/8/8/7k/8 w - - 0 1'
  const closerToF2 = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const fartherFromF2 = scoreTwoBishopsWhiteMove(fen, 'Kh6')
  assert.equal(closerToF2.ruleW2Applies, true)
  assert.equal(closerToF2.ruleW2Penalty, 4)
  assert.equal(fartherFromF2.ruleW2Penalty, 20)
})

test('rule f5 does not apply until edge-square two or three is bishop controlled', () => {
  const fen = '8/8/5B2/5B2/8/6K1/8/6k1 w - - 2 2'
  const staysOnG3 = scoreTwoBishopsWhiteMove(fen, 'Bg7')
  const leavesG3 = scoreTwoBishopsWhiteMove(fen, 'Kf3')
  assert.equal(staysOnG3.ruleW2Applies, false)
  assert.equal(staysOnG3.ruleW2Penalty, 0)
  assert.equal(leavesG3.ruleW2Applies, false)
  assert.equal(leavesG3.ruleW2Penalty, 0)
})

test('rule f5 ignores edge-square control supplied only by White king', () => {
  const fen = '8/8/5B2/5B2/8/8/4K3/6k1 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bg7')
  assert.equal(score.ruleW2Applies, false)
  assert.equal(score.ruleW2Penalty, 0)
})

test('rule f5 selects Kf2 when h3 is the controlled edge square in the h1 cage', () => {
  const fen = '8/8/8/5B2/3B4/5K2/8/7k w - - 0 1'
  const target = scoreTwoBishopsWhiteMove(fen, 'Kf2')
  const edgeAdjacent = scoreTwoBishopsWhiteMove(fen, 'Kg3')
  assert.equal(target.ruleW2Applies, true)
  assert.equal(target.ruleW2Penalty, 0)
  assert.equal(edgeAdjacent.ruleW2Penalty, 2)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf2'])
})

test('rule f prefers White king proximity to the square two diagonal from the enclosed corner', () => {
  const fen = '8/6B1/6B1/8/7k/5K2/8/8 w - - 2 2'
  const staysOnF3 = scoreTwoBishopsWhiteMove(fen, 'Be5')
  const leavesF3 = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  assert.equal(staysOnF3.ruleW1Applies, true)
  assert.equal(leavesF3.ruleW1Applies, true)
  assert.equal(staysOnF3.ruleW1Penalty, 0)
  assert.equal(leavesF3.ruleW1Penalty, 1)
})

test("rule f keeps White's king within two steps of Black before target proximity", () => {
  const fen = '8/8/5K2/4B3/8/5B1k/8/8 w - - 0 1'
  const exactTargetTooFar = scoreTwoBishopsWhiteMove(fen, 'Be4')
  const nearbyKing = scoreTwoBishopsWhiteMove(fen, 'Kf5')
  assert.equal(exactTargetTooFar.ruleW1Penalty, 0)
  assert.equal(exactTargetTooFar.ruleW1BlackDistancePenalty, 1)
  assert.equal(nearbyKing.ruleW1Penalty, 1)
  assert.equal(nearbyKing.ruleW1BlackDistancePenalty, 0)
})

test("rule x prefers the bishops' greater total Euclidean distance from Black", () => {
  const fen = '8/8/8/5BK1/3B4/5k2/8/8 w - - 0 1'
  const farther = scoreTwoBishopsWhiteMove(fen, 'Bd3')
  const nearer = scoreTwoBishopsWhiteMove(fen, 'Be4')
  assert.equal(farther.ruleXApplies, true)
  assert.equal(nearer.ruleXApplies, true)
  assert.equal(farther.ruleXPenalty, -(2 + Math.sqrt(5)))
  assert.equal(nearer.ruleXPenalty, -(Math.sqrt(2) + Math.sqrt(5)))
  assert.ok(farther.ruleXPenalty < nearer.ruleXPenalty)
})

test("rule z prefers the Phase 1 wall's outer bishop adjacent to White's king", () => {
  const fen = '8/8/1B6/8/8/5B2/3k2K1/8 w - - 2 2'
  const preservesAdjacency = scoreTwoBishopsWhiteMove(fen, 'Bf2')
  const breaksWall = scoreTwoBishopsWhiteMove(fen, 'Bh5')
  assert.equal(preservesAdjacency.isPhaseTwoPosition, false)
  assert.equal(preservesAdjacency.ruleZApplies, true)
  assert.equal(preservesAdjacency.ruleZPenalty, 0)
  assert.equal(breaksWall.ruleZPenalty, 1)
})

test('the reset policy selects from A, E5, E6, E8, F5, F, G, J, M, R, S, W, X, then Z', () => {
  const fen = '8/7k/8/8/8/8/8/B1B3K1 w - - 0 1'
  assert.ok(getIdealTwoBishopsWhiteMoves(fen).includes('Bab2'))
})
