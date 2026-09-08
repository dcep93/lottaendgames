import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import { SQUARE_TRANSFORMS, edgeDistance, getChess, transformFen, transformSquare } from '../chess'
import { getMateRuleSet } from './index'
import { getIdealTwoBishopsWhiteMoves, scoreTwoBishopsWhiteMove, twoBishopsWhiteRules } from './twoBishops'

function position(whiteKing: Square, blackKing: Square, bishops: readonly [Square, Square]): string {
  const chess = getChess()
  chess.clear()
  chess.put({ color: 'w', type: 'k' }, whiteKing)
  chess.put({ color: 'b', type: 'k' }, blackKing)
  for (const bishop of bishops) chess.put({ color: 'w', type: 'b' }, bishop)
  return chess.fen()
}

function moveTo(fen: string, from: Square, to: Square): string {
  const move = getChess(fen).moves({ verbose: true }).find((candidate) => candidate.from === from && candidate.to === to)
  assert.ok(move, `Expected legal move ${from}-${to}`)
  return move.san
}

test('king wall rejects Kd5 and selects Ke5 in the user position under all eight symmetries', () => {
  const original = '5B2/3k4/8/8/4K3/1B6/8/8 w - - 18 10'
  const ruleSet = getMateRuleSet('two-bishops')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(original, transform)
    const from = transformSquare('e4', transform)
    const onWall = moveTo(fen, from, transformSquare('d5', transform))
    const offWall = moveTo(fen, from, transformSquare('e5', transform))
    assert.equal(scoreTwoBishopsWhiteMove(fen, onWall).kingWallPenalty, 1, transform.name)
    assert.equal(scoreTwoBishopsWhiteMove(fen, offWall).kingWallPenalty, 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [offWall], transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [offWall], transform.name)
    assert.equal(ruleSet.explainWhiteMove(fen, onWall)?.id, 'king wall', transform.name)
  }
})

test('king wall covers both the inner a3-f8 and outer a2-g8 diagonals', () => {
  const fen = position('e5', 'a8', ['f8', 'b3'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, moveTo(fen, 'e5', 'd6')).kingWallPenalty, 1)
  assert.equal(scoreTwoBishopsWhiteMove(fen, moveTo(fen, 'e5', 'd5')).kingWallPenalty, 1)
})

test('king wall allows destinations exactly one square from the edge on either wall', () => {
  const original = position('f6', 'h1', ['f8', 'b3'])
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(original, transform)
    for (const target of ['e7', 'f7'] as const) {
      const destination = transformSquare(target, transform)
      assert.equal(edgeDistance(destination), 1)
      const san = moveTo(fen, transformSquare('f6', transform), destination)
      assert.equal(scoreTwoBishopsWhiteMove(fen, san).kingWallPenalty, 0, `${transform.name} ${target}`)
    }
  }
})

test('king wall rejects an edge endpoint and destinations two or more squares from the edge', () => {
  const cases = [
    { king: 'f7', target: 'g8', distance: 0 },
    { king: 'f6', target: 'e6', distance: 2 },
    { king: 'e5', target: 'd5', distance: 3 },
  ] as const
  for (const { king, target, distance } of cases) {
    const fen = position(king, 'h1', ['f8', 'b3'])
    assert.equal(edgeDistance(target), distance)
    assert.equal(scoreTwoBishopsWhiteMove(fen, moveTo(fen, king, target)).kingWallPenalty, 1, target)
  }
})

test('both diagonal orientations count when the same bishop pair defines two wall pairs', () => {
  const fen = position('b4', 'e8', ['c4', 'd4'])
  // c3 lies on a1-h8; c5 lies on a7-g1. Each belongs to a different wall axis.
  for (const target of ['c3', 'c5'] as const) {
    assert.equal(scoreTwoBishopsWhiteMove(fen, moveTo(fen, 'b4', target)).kingWallPenalty, 1, target)
  }
  for (const target of ['b3', 'b5'] as const) {
    assert.equal(scoreTwoBishopsWhiteMove(fen, moveTo(fen, 'b4', target)).kingWallPenalty, 0, target)
  }
})

test('the two- and three-square Phase 2 walls retain the same edge-distance guard', () => {
  const original = position('g3', 'a8', ['f1', 'g1'])
  // Inner g1-h2 has two squares; outer f1-g2-h3 has three.
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(original, transform)
    for (const target of ['h2', 'h3'] as const) {
      const san = moveTo(fen, transformSquare('g3', transform), transformSquare(target, transform))
      assert.equal(scoreTwoBishopsWhiteMove(fen, san).kingWallPenalty, 1, `${transform.name} ${target}`)
    }
    const allowed = moveTo(fen, transformSquare('g3', transform), transformSquare('g2', transform))
    assert.equal(scoreTwoBishopsWhiteMove(fen, allowed).kingWallPenalty, 0, transform.name)
  }
})

test('bishop moves remain neutral while White king already stands on a wall', () => {
  const fen = position('d5', 'd7', ['f8', 'b3'])
  const bishopMoves = getChess(fen).moves({ verbose: true }).filter((move) => move.piece === 'b')
  assert.ok(bishopMoves.some((move) => move.from === 'b3' && move.to === 'a2'))
  assert.ok(bishopMoves.some((move) => move.from === 'f8' && move.to === 'g7'))
  for (const move of bishopMoves) {
    assert.equal(scoreTwoBishopsWhiteMove(fen, move.san).kingWallPenalty, 0, move.san)
  }
})

test('White king may leave a wall for an interior square', () => {
  const fen = position('d5', 'd7', ['f8', 'b3'])
  assert.equal(edgeDistance('e5'), 3)
  assert.equal(scoreTwoBishopsWhiteMove(fen, moveTo(fen, 'd5', 'e5')).kingWallPenalty, 0)
})

test('an isolated bishop diagonal does not activate the wall guard', () => {
  const fen = position('c3', 'a8', ['a1', 'e2'])
  // a1 and e2 differ by three difference-diagonals and five sum-diagonals.
  // Kd4 remains on a1-h8, but that diagonal is not part of an adjacent pair.
  const kingMoves = getChess(fen).moves({ verbose: true }).filter((move) => move.piece === 'k')
  assert.ok(kingMoves.some((move) => move.to === 'd4'))
  for (const move of kingMoves) {
    assert.equal(scoreTwoBishopsWhiteMove(fen, move.san).kingWallPenalty, 0, move.san)
  }
})

test('king wall is a visible guard after terminal and safety priorities and before r3', () => {
  assert.deepEqual(twoBishopsWhiteRules.slice(0, 5).map((rule) => rule.id),
    ['mate', 'bishops safe', 'no stalemate', 'king wall', 'rule r3'])
  const guard = twoBishopsWhiteRules.find((rule) => rule.id === 'king wall')!
  assert.equal(guard.presentationRole, 'guard')
  assert.equal(guard.shortLabel, 'king wall')
  assert.equal(guard.helpText, "Move White's king onto an inner or outer wall only one square from the board edge.")
  const displayed = getMateRuleSet('two-bishops').whiteRuleDescriptions
  assert.deepEqual(displayed.filter((rule) => rule.id === 'king wall'), [{
    id: guard.id, shortLabel: guard.shortLabel, helpText: guard.helpText, presentationRole: 'guard',
  }])
  assert.ok(displayed.findIndex((rule) => rule.id === 'king wall') < displayed.findIndex((rule) => rule.id === 'rule r3'))
})
