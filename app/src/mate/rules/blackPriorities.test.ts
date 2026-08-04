import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, positionKey } from '../chess'
import { getMateRuleSet } from './index'

const CAPTURE_PRIORITY = "Take a piece when White isn't looking."
const RETURN_PRIORITY = 'Return to the previous board position when possible.'

const fixtures = [
  {
    id: 'queen',
    captureFen: '8/8/8/8/3k4/2Q5/8/K7 b - - 0 1',
    returnFen: '6Q1/8/8/8/3k4/8/8/K7 b - - 0 1',
  },
  {
    id: 'rook',
    captureFen: '8/8/8/8/3k4/2R5/8/K7 b - - 0 1',
    returnFen: '6R1/8/8/8/3k4/8/8/K7 b - - 0 1',
  },
  {
    id: 'two-bishops',
    captureFen: '6B1/8/8/8/3k4/2B5/8/K7 b - - 0 1',
    returnFen: '6B1/8/8/8/3k4/8/B7/K7 b - - 0 1',
  },
  {
    id: 'bishop-knight',
    captureFen: '6N1/8/8/8/3k4/2B5/8/K7 b - - 0 1',
    returnFen: '6N1/8/8/8/3k4/8/B7/K7 b - - 0 1',
  },
  {
    id: 'two-knights-pawn',
    captureFen: '6N1/7p/8/8/3k4/2N5/8/K7 b - - 0 1',
    returnFen: '6N1/7p/8/8/3k4/8/N7/K7 b - - 0 1',
  },
] as const

function previousPositionAfterQuietMove(fen: string): {
  readonly san: string
  readonly fen: string
} {
  const chess = getChess(fen)
  const quiet = chess.moves({ verbose: true }).find((move) => !move.captured)
  assert.ok(quiet, fen)
  chess.move(quiet.san)
  return { san: quiet.san, fen: chess.fen() }
}

test('every endgame displays capture then return as Black priorities', () => {
  for (const { id } of fixtures) {
    assert.deepEqual(getMateRuleSet(id).help.blackPriorities.slice(0, 2), [
      CAPTURE_PRIORITY,
      RETURN_PRIORITY,
    ])
  }
})

test('every endgame captures before considering a return', () => {
  for (const { id, captureFen } of fixtures) {
    const chess = getChess(captureFen)
    const captureMoves = new Set(
      chess
        .moves({ verbose: true })
        .filter((move) => move.captured)
        .map((move) => move.san),
    )
    assert.ok(captureMoves.size > 0, id)
    const previous = previousPositionAfterQuietMove(captureFen)
    const candidates = getMateRuleSet(id).blackCandidates(
      captureFen,
      previous.fen,
    )
    assert.ok(candidates.idealMoves.length > 0, id)
    assert.ok(
      candidates.idealMoves.every((san) => captureMoves.has(san)),
      `${id}: ${candidates.idealMoves.join(', ')}`,
    )
  }
})

test('every endgame returns to the previous board when no capture exists', () => {
  for (const { id, returnFen } of fixtures) {
    const previous = previousPositionAfterQuietMove(returnFen)
    const candidates = getMateRuleSet(id).blackCandidates(
      returnFen,
      previous.fen,
    )
    assert.ok(candidates.idealMoves.length > 0, id)
    for (const san of candidates.idealMoves) {
      const chess = getChess(returnFen)
      chess.move(san)
      assert.equal(positionKey(chess.fen()), positionKey(previous.fen), id)
    }
  }
})
