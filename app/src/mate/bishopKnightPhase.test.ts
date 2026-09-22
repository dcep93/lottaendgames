import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, transformFen } from './chess'
import { getMateRuleSet } from './rules'
import { knightAndBishopSupportedDiagonal } from './rules/bishopKnightDiagonalSupport'
import { createMateReplaySession, createMateSession, undoMateMove, redoMateMove, type MateSessionDeps } from './session'
import { getCurrentPhase } from './workspaceSupport'

const rule = getMateRuleSet('bishop-knight')
const start = '2k5/8/3K4/1B1N4/8/8/8/8 w - - 0 1'
const deps: MateSessionDeps = {
  now: () => 0,
  random: () => 0,
  generatePosition: () => start,
  getRuleSet: getMateRuleSet,
}

test('supported three, five and seven diagonals enter phase 2 after White in every orientation', () => {
  for (const [fen, size] of [
    ['k7/8/BK6/3N4/8/8/8/8 b - - 1 1', 3],
    ['2k5/3B4/3K4/3N4/8/8/8/8 b - - 1 1', 5],
    ['8/8/8/1k6/8/1B1N4/2K5/8 b - - 1 1', 7],
  ] as const) {
    for (const transform of SQUARE_TRANSFORMS) {
      const reflected = transformFen(fen, transform)
      assert.equal(knightAndBishopSupportedDiagonal(reflected).size, size)
      assert.equal(rule.phaseAfterWhiteMove!(reflected), '2/2')
      const session = createMateSession({mateId: 'bishop-knight', mode: 'standard', startingFen: reflected}, deps)
      assert.equal(getCurrentPhase(rule, session), '2/2')
    }
  }
})

test('phase follows each White result through Black replies, replay, undo and redo', () => {
  let session = createMateReplaySession({
    mateId: 'bishop-knight', mode: 'standard', startingFen: start,
    moves: ['Bd7+', 'Kb8', 'Be6', 'Kb7'],
  }, deps)
  assert.deepEqual(session.logs.map(log => log.phase), ['2/2', '1/2'])
  // Both sides of a Black reply retain the preceding White result.
  for (const expected of ['1/2', '1/2', '2/2', '2/2', '1/2']) {
    assert.equal(getCurrentPhase(rule, session), expected)
    session = undoMateMove(session)
  }
  for (const expected of ['2/2', '2/2', '1/2', '1/2']) {
    session = redoMateMove(session)
    assert.equal(getCurrentPhase(rule, session), expected)
  }
})

test('mating lookup positions do not enter phase 2 without support', () => {
  const mating = 'k1B5/2K5/8/1N6/8/8/8/8 w - - 0 1'
  assert.equal(rule.phase(mating), '1/2')
  assert.throws(() => rule.phaseAfterWhiteMove!(start), /after White/)
  const session = createMateReplaySession({
    mateId: 'bishop-knight', mode: 'standard', startingFen: mating, moves: ['Bb7#'],
  }, deps)
  assert.equal(getCurrentPhase(rule, session), knightAndBishopSupportedDiagonal(session.fen).size < 99 ? '2/2' : '1/2')
  const unsupported = createMateReplaySession({
    mateId: 'bishop-knight', mode: 'standard',
    startingFen: '8/8/8/2k1K2N/4B3/8/8/8 w - - 0 1',
    moves: ['Nf4', 'Kc4', 'Nh5', 'Kc5'],
  }, deps)
  assert.deepEqual(unsupported.logs.map(log => log.phase), ['1/2', '1/2'])
})


test('Kg5 loop stays in phase 1 despite the former mating-path classification', () => {
  const startingFen = '8/6k1/8/5K2/4BN2/8/8/8 w - - 0 1'
  let session = createMateReplaySession({
    mateId: 'bishop-knight', mode: 'standard', startingFen,
    moves: ['Kg5', 'Kf7', 'Kf5', 'Kg7'],
  }, deps)
  assert.deepEqual(session.logs.map(log => log.phase), ['1/2', '1/2'])
  for (let ply = 4; ply >= 0; ply--) {
    assert.equal(getCurrentPhase(rule, session), '1/2')
    if (ply > 0) session = undoMateMove(session)
  }
  for (let ply = 0; ply < 4; ply++) {
    session = redoMateMove(session)
    assert.equal(getCurrentPhase(rule, session), '1/2')
  }
})
