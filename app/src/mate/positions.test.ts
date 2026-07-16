import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import { MATE_CATALOG } from './catalog'
import {
  SQUARE_TRANSFORMS,
  allSquares,
  boardFenFromPlacements,
  collectionIndex,
  getChess,
  getEndgamePiecePlacements,
  getEndgamePieces,
  getSquareTransform,
  isLegalEndgameStart,
  kingDistance,
  manhattanDistance,
  materialMatchesMate,
  pieceSignature,
  randomTransformFen,
  squareColor,
  squareCoordinates,
  squareFromCoordinates,
  squaredEuclideanDistance,
  transformFen,
  transformSquare,
  validateMatePosition,
  whiteBishopsAreOppositeColored,
  type EndgamePiecePlacement,
} from './chess'
import { generateMatePosition } from './positions'

function sequenceRandom(values: readonly number[]): () => number {
  let index = 0
  return () => {
    const value = values[index]
    index += 1
    assert.notEqual(value, undefined, 'deterministic random sequence exhausted')
    return value as number
  }
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

const IMPLEMENTED_MATES = [
  { id: 'queen', signature: 'w:k,w:q,b:k' },
  { id: 'rook', signature: 'w:k,w:r,b:k' },
  { id: 'two-bishops', signature: 'w:k,w:b,w:b,b:k' },
  { id: 'bishop-knight', signature: 'w:k,w:b,w:n,b:k' },
] as const

test('all eight square transforms expose their inverse and exact mapping', () => {
  assert.deepEqual(
    SQUARE_TRANSFORMS.map(({ name, inverseName }) => ({ name, inverseName })),
    [
      { name: 'identity', inverseName: 'identity' },
      { name: 'rotate90', inverseName: 'rotate270' },
      { name: 'rotate180', inverseName: 'rotate180' },
      { name: 'rotate270', inverseName: 'rotate90' },
      { name: 'mirrorFile', inverseName: 'mirrorFile' },
      { name: 'mirrorRank', inverseName: 'mirrorRank' },
      { name: 'diagonal', inverseName: 'diagonal' },
      { name: 'antiDiagonal', inverseName: 'antiDiagonal' },
    ],
  )

  assert.deepEqual(
    Object.fromEntries(
      SQUARE_TRANSFORMS.map((transform) => [
        transform.name,
        transformSquare('b3', transform),
      ]),
    ),
    {
      antiDiagonal: 'f7',
      diagonal: 'c2',
      identity: 'b3',
      mirrorFile: 'g3',
      mirrorRank: 'b6',
      rotate180: 'g6',
      rotate270: 'c7',
      rotate90: 'f2',
    },
  )

  for (const transform of SQUARE_TRANSFORMS) {
    const inverse = getSquareTransform(transform.inverseName)
    for (const square of allSquares()) {
      assert.equal(
        transformSquare(transformSquare(square, transform), inverse),
        square,
        `${transform.name} inverse at ${square}`,
      )
    }
  }
})

test('square coordinate, color, and distance helpers use chess coordinates', () => {
  assert.deepEqual(allSquares().slice(0, 10), [
    'a1',
    'a2',
    'a3',
    'a4',
    'a5',
    'a6',
    'a7',
    'a8',
    'b1',
    'b2',
  ])
  assert.equal(allSquares().at(-1), 'h8')
  assert.deepEqual(squareCoordinates('f7'), { file: 5, rank: 6 })
  assert.equal(squareFromCoordinates(5, 6), 'f7')
  assert.equal(squareFromCoordinates(8, 6), null)
  assert.equal(squareColor('a1'), 0)
  assert.equal(squareColor('b1'), 1)
  assert.equal(kingDistance('a1', 'c4'), 3)
  assert.equal(manhattanDistance('a1', 'c4'), 5)
  assert.equal(squaredEuclideanDistance('a1', 'c4'), 13)
})

test('board FEN and piece extraction preserve exact placements', () => {
  const placements: EndgamePiecePlacement[] = [
    { color: 'b', isPawn: false, square: 'e8', type: 'k' },
    { color: 'b', isPawn: true, square: 'a7', type: 'p' },
    { color: 'w', isPawn: false, square: 'c3', type: 'b' },
    { color: 'w', isPawn: true, square: 'h2', type: 'p' },
    { color: 'w', isPawn: false, square: 'e1', type: 'k' },
  ]

  assert.equal(
    boardFenFromPlacements(placements),
    '4k3/p7/8/8/8/2B5/7P/4K3',
  )

  const fen = '4k3/p7/8/8/8/8/8/1N2K1N1 w - - 0 1'
  assert.deepEqual(getEndgamePieces(fen), [
    { color: 'b', isPawn: false, type: 'k' },
    { color: 'b', isPawn: true, type: 'p' },
    { color: 'w', isPawn: false, type: 'n' },
    { color: 'w', isPawn: false, type: 'k' },
    { color: 'w', isPawn: false, type: 'n' },
  ])
  assert.deepEqual(getEndgamePiecePlacements(fen), [
    { color: 'b', isPawn: false, square: 'e8', type: 'k' },
    { color: 'b', isPawn: true, square: 'a7', type: 'p' },
    { color: 'w', isPawn: false, square: 'b1', type: 'n' },
    { color: 'w', isPawn: false, square: 'e1', type: 'k' },
    { color: 'w', isPawn: false, square: 'g1', type: 'n' },
  ])
})

test('piece signatures are canonical by color and piece kind', () => {
  assert.equal(
    pieceSignature('8/8/8/8/4k3/8/8/R3K3 w - - 0 1'),
    'w:k,w:r,b:k',
  )
  assert.equal(
    pieceSignature('4k3/p7/8/8/8/8/8/1N2K1N1 w - - 0 1'),
    'w:k,w:n,w:n,b:k,b:p',
  )
  assert.equal(
    pieceSignature([
      { color: 'b', isPawn: false, type: 'q' },
      { color: 'w', isPawn: true, type: 'p' },
      { color: 'w', isPawn: false, type: 'k' },
    ]),
    'w:k,w:p,b:q',
  )
  assert.equal(
    materialMatchesMate(
      'rook',
      '8/8/8/8/4k3/8/8/R3K3 w - - 0 1',
    ),
    true,
  )
  assert.equal(
    materialMatchesMate(
      'rook',
      '8/8/8/8/4k3/8/8/3QK3 w - - 0 1',
    ),
    false,
  )
})

test('transformFen transforms only the board and preserves all other fields', () => {
  const fen = 'r3k2r/8/8/8/4P3/8/8/R3K2R b KQkq e3 7 12'
  assert.equal(
    transformFen(fen, getSquareTransform('mirrorFile')),
    'r2k3r/8/8/8/3P4/8/8/R2K3R b KQkq e3 7 12',
  )
  assert.equal(
    randomTransformFen(
      '8/8/8/8/3k4/1Q6/8/3K4 w - - 0 1',
      () => 0.26,
    ),
    '4K3/8/6Q1/4k3/8/8/8/8 w - - 0 1',
  )
})

test('random selection callers surface the shared RNG contract error', () => {
  const rookSeed = '8/8/8/8/3k4/8/1R6/3K4 w - - 0 1'
  const nanError = new RangeError(
    'Random value must be finite and within [0, 1); received NaN',
  )
  const upperBoundError = new RangeError(
    'Random value must be finite and within [0, 1); received 1',
  )
  const negativeError = new RangeError(
    'Random value must be finite and within [0, 1); received -0.01',
  )
  const infiniteError = new RangeError(
    'Random value must be finite and within [0, 1); received Infinity',
  )

  assert.throws(() => randomTransformFen(rookSeed, () => Number.NaN), nanError)
  assert.throws(
    () => randomTransformFen(rookSeed, () => Number.POSITIVE_INFINITY),
    infiniteError,
  )
  assert.throws(
    () => generateMatePosition('rook', 'standard', () => Number.NaN),
    nanError,
  )
  assert.throws(
    () => generateMatePosition('rook', 'train', () => 1),
    upperBoundError,
  )
  assert.throws(
    () => generateMatePosition('rook', 'train', () => -0.01),
    negativeError,
  )
})

test('collection index selection maps the RNG interval to valid indices', () => {
  assert.equal(collectionIndex(8, 0), 0)
  assert.equal(collectionIndex(8, 0.999_999), 7)
  assert.throws(
    () => collectionIndex(0, 0.5),
    new RangeError('Collection length must be a positive integer; received 0'),
  )
})

test('opposite-colored bishop detection requires exactly two white bishops', () => {
  const placement = (square: Square): EndgamePiecePlacement => ({
    color: 'w',
    isPawn: false,
    square,
    type: 'b',
  })

  assert.equal(
    whiteBishopsAreOppositeColored([placement('c1'), placement('f1')]),
    true,
  )
  assert.equal(
    whiteBishopsAreOppositeColored([placement('c1'), placement('e3')]),
    false,
  )
  assert.equal(whiteBishopsAreOppositeColored([placement('c1')]), false)
})

test('legal starts are white to move, quiet, non-terminal positions', () => {
  assert.equal(
    isLegalEndgameStart('8/8/8/8/4k3/8/8/R3K3 w - - 0 1'),
    true,
  )
  assert.equal(
    isLegalEndgameStart('8/8/8/8/4k3/8/8/R3K3 b - - 0 1'),
    false,
  )
  assert.equal(
    isLegalEndgameStart('k7/1Q6/2K5/8/8/8/8/8 w - - 0 1'),
    false,
  )
  assert.equal(
    isLegalEndgameStart('8/8/8/8/8/8/4k3/4K2R w - - 0 1'),
    false,
  )
  assert.equal(isLegalEndgameStart('not a FEN'), false)
})

test('legal start validation ignores en passant when checking the opposite turn', () => {
  const fen = '4k3/8/8/4p3/8/8/8/1N2K1N1 w - e6 0 2'

  assert.equal(isLegalEndgameStart(fen), true)
  assert.deepEqual(validateMatePosition('two-knights-pawn', fen), { ok: true })
})

test('all five mate validators accept their catalog positions', () => {
  for (const entry of MATE_CATALOG) {
    assert.deepEqual(
      validateMatePosition(entry.id, entry.standardFallbackFen),
      { ok: true },
      `${entry.id} standard fallback`,
    )
    for (const fen of entry.trainSeeds) {
      assert.deepEqual(
        validateMatePosition(entry.id, fen),
        { ok: true },
        `${entry.id} train seed: ${fen}`,
      )
    }
  }
})

test('mate validation rejects wrong material, bad bishops, edge pawns, and terminal starts', () => {
  assert.deepEqual(
    validateMatePosition(
      'rook',
      '8/8/8/8/4k3/8/8/3QK3 w - - 0 1',
    ),
    { ok: false, reason: 'Material does not match rook' },
  )
  assert.deepEqual(
    validateMatePosition(
      'two-bishops',
      '4k3/8/8/8/8/4B3/8/2B1K3 w - - 0 1',
    ),
    {
      ok: false,
      reason: 'White bishops must be on opposite-colored squares',
    },
  )
  assert.deepEqual(
    validateMatePosition(
      'two-knights-pawn',
      '4k3/8/8/8/8/8/8/pN2K1N1 w - - 0 1',
    ),
    { ok: false, reason: 'Pawns cannot be placed on ranks 1 or 8' },
  )
  assert.deepEqual(
    validateMatePosition(
      'two-knights-pawn',
      'p3k3/8/8/8/8/8/8/1N2K1N1 w - - 0 1',
    ),
    { ok: false, reason: 'Pawns cannot be placed on ranks 1 or 8' },
  )
  assert.deepEqual(
    validateMatePosition(
      'queen',
      'k7/1Q6/2K5/8/8/8/8/8 w - - 0 1',
    ),
    {
      ok: false,
      reason: 'Position is not a legal non-terminal endgame start',
    },
  )
})

test('every implemented Train seed remains valid under every transform', () => {
  for (const mate of IMPLEMENTED_MATES) {
    const catalogEntry = MATE_CATALOG.find((entry) => entry.id === mate.id)
    assert.ok(catalogEntry)
    for (const seed of catalogEntry.trainSeeds) {
      for (const transform of SQUARE_TRANSFORMS) {
        const fen = transformFen(seed, transform)
        const context = `${mate.id}: ${seed} via ${transform.name}`
        assert.doesNotThrow(() => getChess(fen), context)
        assert.equal(pieceSignature(fen), mate.signature, context)
        assert.deepEqual(
          validateMatePosition(mate.id, fen),
          { ok: true },
          context,
        )
      }
    }
  }
})

test('Standard and Train generation stay legal across all implemented sets', () => {
  for (const [mateIndex, mate] of IMPLEMENTED_MATES.entries()) {
    for (const [modeIndex, mode] of (
      ['standard', 'train'] as const
    ).entries()) {
      const seed = 1000 + mateIndex * 10 + modeIndex
      const first = generateMatePosition(mate.id, mode, seededRandom(seed))
      const second = generateMatePosition(mate.id, mode, seededRandom(seed))
      const context = `${mate.id} ${mode}`

      assert.equal(first, second, `${context} deterministic`)
      assert.equal(pieceSignature(first), mate.signature, `${context} material`)
      assert.equal(isLegalEndgameStart(first), true, `${context} legal start`)
      assert.deepEqual(
        validateMatePosition(mate.id, first),
        { ok: true },
        `${context} structural validation`,
      )
    }
  }
})

test('Standard generation is deterministic with an injected random source', () => {
  assert.equal(
    generateMatePosition(
      'queen',
      'standard',
      sequenceRandom([0.97, 0, 0.42]),
    ),
    '8/7k/8/8/3K4/8/8/Q7 w - - 0 1',
  )

  const first = generateMatePosition(
    'two-bishops',
    'standard',
    seededRandom(123),
  )
  const second = generateMatePosition(
    'two-bishops',
    'standard',
    seededRandom(123),
  )
  assert.equal(first, '8/4K2B/k7/8/8/8/5B2/8 w - - 0 1')
  assert.equal(second, '8/4K2B/k7/8/8/8/5B2/8 w - - 0 1')
  assert.deepEqual(validateMatePosition('two-bishops', first), { ok: true })
})

test('Standard generation stops after 1000 invalid attempts and uses fallback', () => {
  let randomCalls = 0
  const fen = generateMatePosition('queen', 'standard', () => {
    randomCalls += 1
    return 0
  })

  assert.equal(fen, '8/8/8/8/4k3/8/8/3QK3 w - - 0 1')
  assert.equal(randomCalls, 3000)
})

test('Train generation chooses a seed and a transform from the injected source', () => {
  assert.equal(
    generateMatePosition(
      'two-bishops',
      'train',
      sequenceRandom([0.75, 0.2]),
    ),
    '8/8/k1KB4/3B4/8/8/8/8 w - - 38 20',
  )
})

test('Train generation allows repeated FENs', () => {
  const random = () => 0
  const first = generateMatePosition('rook', 'train', random)
  const second = generateMatePosition('rook', 'train', random)

  assert.equal(first, '8/8/8/8/3k4/8/1R6/3K4 w - - 0 1')
  assert.equal(second, first)
})

test('Two Knights vs Pawn generation remains unregistered', () => {
  assert.throws(
    () => generateMatePosition('two-knights-pawn', 'standard', () => 0),
    new Error('Two Knights vs Pawn generation is not registered'),
  )
  assert.throws(
    () => generateMatePosition('two-knights-pawn', 'train', () => 0),
    new Error('Two Knights vs Pawn generation is not registered'),
  )
})
