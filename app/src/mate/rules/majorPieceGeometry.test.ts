import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getChess,
  SQUARE_TRANSFORMS,
  transformFen,
  transformSquare,
} from '../chess'
import {
  getQueenEdgeCageSize,
  getQueenBoxAxisSides,
  getQueenBoxCorners,
  getQueenBoxDimensions,
  getQueenBoxSafeSquareCount,
  getQueenBoxSquares,
  getMajorEndgamePhase,
  getRookBoxFromFen,
  isSquareInClosedQueenBox,
  isQueenSameCornerBoxShrink,
  isQueenTighterChannelBetween,
  type RookAxis,
  type RookEdge,
} from './majorPieceGeometry'

const MATURE_DUAL_AXIS_FEN =
  '8/8/8/8/8/7k/4R3/3K4 w - - 6 4'

function movedFen(fen: string, san: string): string {
  const chess = getChess(fen)
  assert.ok(chess.move(san), `${san} must be legal in ${fen}`)
  return chess.fen()
}

test('queen box dimensions sort the rectangle sides', () => {
  const dimensions = getQueenBoxDimensions('g4', 'e3')

  assert.deepEqual(dimensions, { shorterSide: 3, longerSide: 6 })
  assert.equal(Object.isFrozen(dimensions), true)
})

test('queen box keeps the file and rank side identities', () => {
  const sides = getQueenBoxAxisSides('b5', 'a7')

  assert.deepEqual(sides, { fileSide: 1, rankSide: 3 })
  assert.equal(Object.isFrozen(sides), true)
})

test('queen box corners preserve orientation and expose aligned alternatives', () => {
  assert.deepEqual(getQueenBoxCorners('c2', 'd4'), ['h8'])
  assert.deepEqual(getQueenBoxCorners('c6', 'd4'), ['h1'])
  assert.deepEqual(getQueenBoxCorners('c2', 'c4'), ['a8', 'h8'])
})

test('queen box shrink preserves its target corner under every board symmetry', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(
      isQueenSameCornerBoxShrink(
        transformSquare('c2', transform),
        transformSquare('c3', transform),
        transformSquare('d4', transform),
      ),
      true,
      `${transform.name}: same-corner shrink`,
    )
    assert.equal(
      isQueenSameCornerBoxShrink(
        transformSquare('c2', transform),
        transformSquare('c6', transform),
        transformSquare('d4', transform),
      ),
      false,
      `${transform.name}: corner switch`,
    )
    assert.equal(
      isQueenSameCornerBoxShrink(
        transformSquare('c6', transform),
        transformSquare('b7', transform),
        transformSquare('d8', transform),
      ),
      true,
      `${transform.name}: shorter side improves while longer side grows`,
    )
  }
})

test('queen safe-square box excludes its wall while closed containment includes it', () => {
  const squares = getQueenBoxSquares('h5', 'd6')

  assert.equal(squares.includes('g8'), true)
  assert.equal(squares.includes('h8'), false)
  assert.equal(isSquareInClosedQueenBox('g8', 'h5', 'd6'), true)
  assert.equal(isSquareInClosedQueenBox('h8', 'h5', 'd6'), true)
  assert.equal(isSquareInClosedQueenBox('h4', 'h5', 'd6'), false)
  assert.equal(isSquareInClosedQueenBox('b4', 'b5', 'a1'), true)
})

test('queen box safe squares exclude squares attacked by White', () => {
  const startFen = '8/k7/8/1QK5/8/8/8/8 w - - 0 1'
  const resultFen = movedFen(startFen, 'Qb6+')

  assert.deepEqual(getQueenBoxSquares('b6', 'a7'), ['a7', 'a8'])
  assert.equal(getQueenBoxSafeSquareCount(resultFen), 1)

  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(
      getQueenBoxSafeSquareCount(transformFen(resultFen, transform)),
      1,
      transform.name,
    )
  }
})

test('queen king channel protects only the tighter box side', () => {
  assert.equal(
    isQueenTighterChannelBetween(
      { square: 'd6' },
      { square: 'c5' },
      { square: 'a7' },
    ),
    false,
    'the wider rank channel stays open when the file side is tighter',
  )
  assert.equal(
    isQueenTighterChannelBetween(
      { square: 'b6' },
      { square: 'c5' },
      { square: 'a7' },
    ),
    true,
    'the tighter file channel stays protected',
  )
  assert.equal(
    isQueenTighterChannelBetween(
      { square: 'f4' },
      { square: 'e3' },
      { square: 'g1' },
    ),
    false,
    'the wider file channel stays open when the rank side is tighter',
  )
  assert.equal(
    isQueenTighterChannelBetween(
      { square: 'f2' },
      { square: 'e3' },
      { square: 'g1' },
    ),
    true,
    'the tighter rank channel stays protected',
  )
  assert.equal(
    isQueenTighterChannelBetween(
      { square: 'b4' },
      { square: 'c3' },
      { square: 'a1' },
    ),
    true,
    'both channels stay protected when the sides tie',
  )
})

test('queen box dimensions are symmetric across board transforms', () => {
  const fen = '8/8/3K4/5Q2/8/4k3/8/8 w - - 14 8'
  const base = getQueenBoxDimensions('f5', 'e3')

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const queen = chess.board().flat().find((piece) => piece?.type === 'q')
    const blackKing = chess
      .board()
      .flat()
      .find((piece) => piece?.type === 'k' && piece.color === 'b')

    assert.ok(queen)
    assert.ok(blackKing)
    assert.deepEqual(
      getQueenBoxDimensions(queen.square, blackKing.square),
      base,
      transform.name,
    )
  }
})

test('queen edge cages allow stable segments of any length', () => {
  assert.equal(
    getQueenEdgeCageSize('6k1/4Q3/8/8/8/5K2/8/8 b - - 0 1'),
    2,
  )
  assert.equal(
    getQueenEdgeCageSize('5k2/3Q4/8/8/8/4K3/8/8 b - - 0 1'),
    3,
  )
  assert.equal(
    getQueenEdgeCageSize('8/8/4k3/3Q4/8/4K3/8/8 b - - 0 1'),
    null,
  )
})

test('queen phase two is exactly the stable two-square corner cage', () => {
  const cornerCageFen = 'k7/3Q4/K7/8/8/8/8/8 w - - 0 1'
  const channelOnlyFen = '8/2k5/8/8/7Q/3K4/8/8 w - - 2 2'

  assert.equal(getMajorEndgamePhase(cornerCageFen, 'q'), 2)
  assert.equal(getMajorEndgamePhase(channelOnlyFen, 'q'), 1)
  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(
      getMajorEndgamePhase(transformFen(cornerCageFen, transform), 'q'),
      2,
      transform.name,
    )
  }
})

test('rook box enumerates every cut and freezes the full description', () => {
  const box = getRookBoxFromFen(MATURE_DUAL_AXIS_FEN)

  assert.deepEqual(box, {
    cuts: [
      { axis: 'rank', edge: 'north', size: 6, closest: true },
      { axis: 'file', edge: 'east', size: 3, closest: false },
    ],
    strongestCuts: [
      { axis: 'file', edge: 'east', size: 3, closest: false },
    ],
    size: 3,
  })
  assert.equal(Object.isFrozen(box), true)
  assert.equal(Object.isFrozen(box.cuts), true)
  assert.equal(Object.isFrozen(box.strongestCuts), true)
  assert.equal(box.cuts.every(Object.isFrozen), true)
})

test('rook box returns an immutable empty description when there is no cut', () => {
  const box = getRookBoxFromFen(
    '8/8/8/8/4k3/8/8/R3K3 w - - 0 1',
  )

  assert.deepEqual(box, { cuts: [], strongestCuts: [], size: null })
  assert.equal(Object.isFrozen(box), true)
  assert.equal(Object.isFrozen(box.cuts), true)
  assert.equal(Object.isFrozen(box.strongestCuts), true)
})

test('rook box geometry is symmetric across every board transform', () => {
  const base = getRookBoxFromFen(MATURE_DUAL_AXIS_FEN)
  const axisPreservingTransforms = new Set([
    'identity',
    'rotate180',
    'mirrorFile',
    'mirrorRank',
  ])

  for (const transform of SQUARE_TRANSFORMS) {
    const transformed = getRookBoxFromFen(
      transformFen(MATURE_DUAL_AXIS_FEN, transform),
    )
    const mapAxis = (axis: RookAxis): RookAxis =>
      axisPreservingTransforms.has(transform.name)
        ? axis
        : axis === 'rank'
          ? 'file'
          : 'rank'
    const edgeSquare: Record<RookEdge, 'd8' | 'h4' | 'd1' | 'a4'> = {
      north: 'd8',
      east: 'h4',
      south: 'd1',
      west: 'a4',
    }
    const edgeForSquare = (
      square: ReturnType<typeof transformSquare>,
    ): RookEdge => {
      if (square.endsWith('8')) return 'north'
      if (square.startsWith('h')) return 'east'
      if (square.endsWith('1')) return 'south'
      return 'west'
    }
    const mapEdge = (edge: RookEdge): RookEdge =>
      edgeForSquare(transformSquare(edgeSquare[edge], transform))
    const expectedCuts = base.cuts
      .map((cut) => ({
        ...cut,
        axis: mapAxis(cut.axis),
        edge: mapEdge(cut.edge),
      }))
      .sort((first, second) => first.axis.localeCompare(second.axis))
    const actualCuts = [...transformed.cuts].sort((first, second) =>
      first.axis.localeCompare(second.axis),
    )

    assert.deepEqual(actualCuts, expectedCuts, transform.name)
    assert.equal(transformed.size, base.size, transform.name)
    assert.deepEqual(
      transformed.strongestCuts.map((cut) => cut.axis),
      base.strongestCuts.map((cut) => mapAxis(cut.axis)),
      transform.name,
    )
  }
})

test('strict box geometry drops a wall shared with White king', () => {
  const before = getRookBoxFromFen(MATURE_DUAL_AXIS_FEN)
  const afterKe1 = getRookBoxFromFen(movedFen(MATURE_DUAL_AXIS_FEN, 'Ke1'))

  assert.equal(before.size, 3)
  assert.deepEqual(before.strongestCuts.map((cut) => cut.axis), ['file'])
  assert.equal(afterKe1.size, 6)
  assert.deepEqual(afterKe1.strongestCuts.map((cut) => cut.axis), ['rank'])
})

test('strongest-box geometry classifies both Ke2 moves as preservation', () => {
  for (const fen of [
    '8/8/8/6k1/8/8/5R2/3K4 w - - 4 3',
    '8/8/6k1/8/8/8/5R2/4K3 w - - 6 4',
  ]) {
    const before = getRookBoxFromFen(fen)
    const afterKe2 = getRookBoxFromFen(movedFen(fen, 'Ke2'))

    assert.equal(before.size, 2, fen)
    assert.deepEqual(
      before.strongestCuts.map((cut) => cut.axis),
      ['file'],
      fen,
    )
    assert.equal(afterKe2.size, before.size, fen)
    assert.deepEqual(
      afterKe2.strongestCuts.map((cut) => cut.axis),
      ['file'],
      fen,
    )
  }
})
