import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeMateFen,
  encodeMateFen,
  formatMateShareText,
} from './share'

const ROOK_STANDARD_FEN =
  '4k3/8/8/8/8/8/8/4K2R w K - 7 12'
const ROOK_QUEENSIDE_CASTLING_FEN =
  '4k3/8/8/8/8/8/8/R3K3 w Q - 7 12'
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

test('canonicalizes safe decimal counters and then round-trips idempotently', () => {
  const paddedCounters = ROOK_STANDARD_FEN.replace(' 7 12', ' 0007 00012')
  const decoded = decodeMateFen(
    encodeMateFen(paddedCounters),
    'rook',
    'standard',
  )

  assert.deepEqual(decoded, { ok: true, fen: ROOK_STANDARD_FEN })
  assert.equal(encodeMateFen(decoded.fen), encodeMateFen(ROOK_STANDARD_FEN))
  assert.deepEqual(
    decodeMateFen(encodeMateFen(decoded.fen), 'rook', 'standard'),
    decoded,
  )

  const largestSafeFullmove = ROOK_STANDARD_FEN.replace(
    ' 7 12',
    ` 7 ${Number.MAX_SAFE_INTEGER}`,
  )
  assert.deepEqual(
    decodeMateFen(
      encodeMateFen(largestSafeFullmove),
      'rook',
      'standard',
    ),
    { ok: true, fen: largestSafeFullmove },
  )
})

test('rejects counters that are not safe decimal integers', () => {
  for (const fen of [
    ROOK_STANDARD_FEN.replace(' 7 12', ' 9007199254740992 12'),
    ROOK_STANDARD_FEN.replace(' 7 12', ' 7 9007199254740992'),
    ROOK_STANDARD_FEN.replace(' 7 12', ' 7.0 12'),
    ROOK_STANDARD_FEN.replace(' 7 12', ' 7 1e2'),
  ]) {
    assert.deepEqual(
      decodeMateFen(encodeMateFen(fen), 'rook', 'standard'),
      { ok: false },
    )
  }
})

test('accepts real Rook castling rights and rejects ghost rights', () => {
  for (const fen of [ROOK_STANDARD_FEN, ROOK_QUEENSIDE_CASTLING_FEN]) {
    assert.deepEqual(
      decodeMateFen(encodeMateFen(fen), 'rook', 'standard'),
      { ok: true, fen },
    )
  }

  const ghostRights = [
    {
      mateId: 'rook',
      fen: ROOK_STANDARD_FEN.replace(' w K ', ' w Q '),
    },
    {
      mateId: 'rook',
      fen: ROOK_QUEENSIDE_CASTLING_FEN.replace(' w Q ', ' w K '),
    },
    {
      mateId: 'rook',
      fen: '4k3/8/8/8/8/8/8/3K3R w K - 7 12',
    },
    {
      mateId: 'rook',
      fen: ROOK_STANDARD_FEN.replace(' w K ', ' w Kk '),
    },
    {
      mateId: 'queen',
      fen: QUEEN_STANDARD_FEN.replace(' w - ', ' w K '),
    },
    {
      mateId: 'queen',
      fen: QUEEN_STANDARD_FEN.replace(' w - ', ' w q '),
    },
  ] as const
  for (const { fen, mateId } of ghostRights) {
    assert.deepEqual(
      decodeMateFen(encodeMateFen(fen), mateId, 'standard'),
      { ok: false },
    )
  }
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
