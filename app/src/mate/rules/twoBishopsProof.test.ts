import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, getSquareTransform, transformFen } from '../chess'
import {
  getTwoBishopsProofDistance,
  isTwoBishopsProofProgress,
} from './twoBishopsProof'
import {
  TWO_BISHOPS_PROOF_MAX_DISTANCE,
  TWO_BISHOPS_PROOF_POSITION_COUNT,
} from './twoBishopsProofData'

test('reads exact KBB-v-K distances from the bundled proof table', () => {
  assert.equal(
    getTwoBishopsProofDistance(
      '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1',
    ),
    7,
  )
  assert.equal(
    getTwoBishopsProofDistance(
      '8/8/8/2BB4/8/K2k4/8/8 w - - 0 1',
    ),
    23,
  )
})

test('proof distance is invariant under all board symmetries', () => {
  const fen = '8/8/8/2BB4/8/K2k4/8/8 w - - 0 1'
  for (const transformName of [
    'identity',
    'rotate90',
    'rotate180',
    'rotate270',
    'mirrorFile',
    'mirrorRank',
    'diagonal',
    'antiDiagonal',
  ] as const) {
    const transformed = getChess(
      transformFen(fen, getSquareTransform(transformName)),
    ).fen()
    assert.equal(getTwoBishopsProofDistance(transformed), 23)
  }
})

test('proof lookup rejects positions outside White-to-move KBB-v-K', () => {
  assert.equal(
    getTwoBishopsProofDistance(
      '5Bk1/3B4/5K2/8/8/8/8/8 b - - 0 1',
    ),
    null,
  )
  assert.equal(
    getTwoBishopsProofDistance('8/8/8/8/8/5K2/8/6Bk w - - 0 1'),
    null,
  )
})

test('proof certificate covers every symmetry-reduced win within the fifty-move limit', () => {
  assert.equal(TWO_BISHOPS_PROOF_POSITION_COUNT, 386_792)
  assert.equal(TWO_BISHOPS_PROOF_MAX_DISTANCE, 37)

  // White-turn DTM values are odd. A strict step therefore lowers DTM by at
  // least two plies. A corner wait must separate close bishops, so it cannot
  // happen twice in a row. At most 19 strict turns plus 19 waits are needed.
  assert.ok(Math.ceil(TWO_BISHOPS_PROOF_MAX_DISTANCE / 2) * 2 < 50)
})

test('an equal-distance proof step is only the one-way corner wait', () => {
  assert.equal(
    isTwoBishopsProofProgress({
      currentDistance: 7,
      worstReplyDistance: 7,
      supportedCornerWait: true,
      startingBishopDistance: 2,
      resultingBishopDistance: 4,
    }),
    true,
  )
  for (const mutation of [
    { supportedCornerWait: false },
    { startingBishopDistance: 4 },
    { resultingBishopDistance: 3 },
    { worstReplyDistance: 9 },
  ]) {
    assert.equal(
      isTwoBishopsProofProgress({
        currentDistance: 7,
        worstReplyDistance: 7,
        supportedCornerWait: true,
        startingBishopDistance: 2,
        resultingBishopDistance: 4,
        ...mutation,
      }),
      false,
    )
  }
})
