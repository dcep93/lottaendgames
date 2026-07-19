import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen } from '../../app/src/mate/chess.ts'
import { MAJOR_PIECE_MATE_PROGRESS_DATA } from '../../app/src/mate/rules/majorPieceMateProgressData.ts'
import {
  decodeMajorPieceMateProgressData,
  lookupMajorPieceMateProgress,
} from '../../app/src/mate/rules/majorPieceMateProgress.ts'

test('generated major-piece rank metadata is stable and bounded', () => {
  assert.deepEqual(
    {
      entries: MAJOR_PIECE_MATE_PROGRESS_DATA.queen.entries,
      maxRank: MAJOR_PIECE_MATE_PROGRESS_DATA.queen.maxRank,
      sha256: MAJOR_PIECE_MATE_PROGRESS_DATA.queen.sha256,
      winningEntries:
        MAJOR_PIECE_MATE_PROGRESS_DATA.queen.winningEntries,
    },
    {
      entries: 46_137,
      maxRank: 20,
      sha256:
        '1644094bc1579f61c857b1799a3c6246f7c548385b05f51acc5adc31f5c87901',
      winningEntries: 43_241,
    },
  )
  assert.deepEqual(
    {
      entries: MAJOR_PIECE_MATE_PROGRESS_DATA.rook.entries,
      maxRank: MAJOR_PIECE_MATE_PROGRESS_DATA.rook.maxRank,
      sha256: MAJOR_PIECE_MATE_PROGRESS_DATA.rook.sha256,
      winningEntries: MAJOR_PIECE_MATE_PROGRESS_DATA.rook.winningEntries,
    },
    {
      entries: 50_015,
      maxRank: 32,
      sha256:
        'dfee6fec3f1dea4eee2bea6f712c34d87e2944df618089d407416a216f52ba28',
      winningEntries: 47_219,
    },
  )
  assert.ok(MAJOR_PIECE_MATE_PROGRESS_DATA.queen.maxRank < 100)
  assert.ok(MAJOR_PIECE_MATE_PROGRESS_DATA.rook.maxRank < 100)
})

test('runtime lookup distinguishes mate, winning play, loss, and unsupported material', () => {
  assert.deepEqual(
    lookupMajorPieceMateProgress(
      'rook',
      'k6R/8/1K6/8/8/8/8/8 b - - 0 1',
    ),
    { kind: 'winning', rank: 0 },
  )
  assert.deepEqual(
    lookupMajorPieceMateProgress(
      'queen',
      'k6Q/8/1K6/8/8/8/8/8 b - - 0 1',
    ),
    { kind: 'winning', rank: 0 },
  )
  assert.deepEqual(
    lookupMajorPieceMateProgress(
      'rook',
      '8/8/8/8/3k4/8/1R6/3K4 w - - 0 1',
    ),
    { kind: 'winning', rank: 27 },
  )
  assert.deepEqual(
    lookupMajorPieceMateProgress(
      'rook',
      '8/8/8/8/8/8/2K5/k1R5 b - - 0 1',
    ),
    { kind: 'winning', rank: 4 },
  )
  assert.deepEqual(
    lookupMajorPieceMateProgress(
      'queen',
      '8/8/8/8/3k4/8/Q7/3K4 w - - 0 1',
    ),
    { kind: 'winning', rank: 13 },
  )
  assert.deepEqual(
    lookupMajorPieceMateProgress(
      'rook',
      '8/8/8/8/8/8/1R6/k6K b - - 0 1',
    ),
    { kind: 'not-winning' },
  )
  assert.deepEqual(
    lookupMajorPieceMateProgress(
      'rook',
      '8/8/8/8/3k4/8/1Q6/3K4 w - - 0 1',
    ),
    { kind: 'unsupported' },
  )
})

test('runtime lookup is invariant under all board symmetries', () => {
  const fen = '8/8/8/8/3k4/8/1R6/3K4 w - - 0 1'
  const ranks = SQUARE_TRANSFORMS.map((transform) =>
    lookupMajorPieceMateProgress('rook', transformFen(fen, transform)),
  )
  assert.equal(new Set(ranks.map((result) => JSON.stringify(result))).size, 1)
})

test('exact minimax rank has a descending White move', () => {
  const fen = '8/8/8/8/3k4/8/1R6/3K4 w - - 0 1'
  const starting = lookupMajorPieceMateProgress('rook', fen)
  assert.deepEqual(starting, { kind: 'winning', rank: 27 })
  const childRanks = getChess(fen)
    .moves()
    .map((san) => {
      const chess = getChess(fen)
      chess.move(san)
      return lookupMajorPieceMateProgress('rook', chess.fen())
    })
    .filter(
      (result): result is { readonly kind: 'winning'; readonly rank: number } =>
        result.kind === 'winning',
    )
    .map(({ rank }) => rank)
  assert.equal(Math.min(...childRanks), 26)
})

test('compact decoder rejects malformed or inconsistent artifacts', () => {
  assert.deepEqual(decodeMajorPieceMateProgressData('AQE=', 1, 0), {
    keys: Uint32Array.from([1]),
    rankCodes: Uint8Array.from([1]),
  })
  assert.throws(
    () => decodeMajorPieceMateProgressData('AQEA', 1, 0),
    /trailing bytes/,
  )
  assert.throws(
    () => decodeMajorPieceMateProgressData('AQA=', 1, 1),
    /maximum rank 0 does not match 1/,
  )
  assert.throws(
    () => decodeMajorPieceMateProgressData('not base64!', 1, 0),
    /not valid base64/,
  )
})
