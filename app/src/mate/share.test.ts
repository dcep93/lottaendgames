import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeMateFen,
  encodeMateFen,
  formatMateShareText,
} from './share'

const ROOK_STANDARD_FEN =
  '4k3/8/8/8/8/8/8/4K2R w K - 7 12'
const ROOK_TRAIN_FEN =
  '8/8/8/8/3k4/8/1R6/3K4 w - - 0 1'
const ROTATED_ROOK_TRAIN_FEN =
  '8/8/8/8/4k2K/8/6R1/8 w - - 0 1'
const QUEEN_STANDARD_FEN =
  '8/8/8/8/4k3/8/8/3QK3 w - - 38 20'
const KNN_STANDARD_FEN =
  '4k3/p7/8/8/8/8/8/1N2K1N1 w - - 0 1'
const KNN_TRAIN_FEN =
  '7k/8/5NKN/8/8/8/p7/8 w - - 0 1'

test('encodes and round-trips one documented hash with all six FEN fields', () => {
  const hash = encodeMateFen(ROOK_STANDARD_FEN)

  assert.equal(
    hash,
    `#fen=${encodeURIComponent(ROOK_STANDARD_FEN)}`,
  )
  assert.deepEqual(decodeMateFen(hash, 'rook', 'standard'), {
    ok: true,
    fen: ROOK_STANDARD_FEN,
  })
})

test('normalizes a valid decoded FEN through chess.js', () => {
  const unnormalized = ROOK_STANDARD_FEN.replace(' w ', '   w   ')

  assert.deepEqual(
    decodeMateFen(encodeMateFen(unnormalized), 'rook', 'standard'),
    { ok: true, fen: ROOK_STANDARD_FEN },
  )
})

test('rejects malformed hashes and illegal FEN without throwing', () => {
  const malformedHashes = [
    '#not-a-fen',
    'fen=missing-leading-hash',
    '#fen=',
    '#fen=%E0%A4%A',
    '#fen=not%20a%20fen',
    `${encodeMateFen(ROOK_STANDARD_FEN)}&extra=true`,
  ]

  for (const hash of malformedHashes) {
    assert.deepEqual(decodeMateFen(hash, 'rook', 'standard'), {
      ok: false,
    })
  }
})

test('rejects a legal position with material for a different set', () => {
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(QUEEN_STANDARD_FEN),
      'rook',
      'standard',
    ),
    { ok: false },
  )
})

test('Standard accepts legal matching starts while Train requires a curated seed transform', () => {
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(ROOK_TRAIN_FEN),
      'rook',
      'train',
    ),
    { ok: true, fen: ROOK_TRAIN_FEN },
  )
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(ROTATED_ROOK_TRAIN_FEN),
      'rook',
      'train',
    ),
    { ok: true, fen: ROTATED_ROOK_TRAIN_FEN },
  )
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(ROOK_STANDARD_FEN),
      'rook',
      'standard',
    ),
    { ok: true, fen: ROOK_STANDARD_FEN },
  )
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(ROOK_STANDARD_FEN),
      'rook',
      'train',
    ),
    { ok: false },
  )
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(ROOK_TRAIN_FEN.replace(' 0 1', ' 1 1')),
      'rook',
      'train',
    ),
    { ok: false },
  )
})

test('Two Knights vs Pawn hashes must belong to the selected manifest mode', () => {
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(KNN_STANDARD_FEN),
      'two-knights-pawn',
      'standard',
    ),
    { ok: true, fen: KNN_STANDARD_FEN },
  )
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(KNN_TRAIN_FEN),
      'two-knights-pawn',
      'train',
    ),
    { ok: true, fen: KNN_TRAIN_FEN },
  )
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(KNN_STANDARD_FEN),
      'two-knights-pawn',
      'train',
    ),
    { ok: false },
  )
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(KNN_TRAIN_FEN),
      'two-knights-pawn',
      'standard',
    ),
    { ok: false },
  )
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(KNN_STANDARD_FEN.replace(' 0 1', ' 1 1')),
      'two-knights-pawn',
      'standard',
    ),
    { ok: false },
  )

  const unsupportedButMaterialValid =
    '5k2/p7/8/8/8/8/8/1N2K1N1 w - - 0 1'
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(unsupportedButMaterialValid),
      'two-knights-pawn',
      'standard',
    ),
    { ok: false },
  )
})

test('share text uses the terminal label and exact centisecond timer format', () => {
  assert.equal(
    formatMateShareText({
      outcome: 'checkmate',
      elapsedMs: 83_459,
      href: 'https://example.test/mate/rook#fen=exact',
    }),
    'checkmate in 01:23.45\nhttps://example.test/mate/rook#fen=exact',
  )
  assert.equal(
    formatMateShareText({
      outcome: 'fifty-move',
      elapsedMs: -1,
      href: '/mate/rook',
    }),
    'draw in 00:00.00\n/mate/rook',
  )
})
