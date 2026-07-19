import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen } from '../chess'
import {
  getQueenBoxDimensions,
  getRookBoxFromFen,
  type RookAxis,
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

test('rook box enumerates every cut and freezes the full description', () => {
  const box = getRookBoxFromFen(MATURE_DUAL_AXIS_FEN)

  assert.deepEqual(box, {
    cuts: [
      { axis: 'rank', size: 6, closest: true },
      { axis: 'file', size: 3, closest: false },
    ],
    strongestCuts: [{ axis: 'file', size: 3, closest: false }],
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
    const expectedCuts = base.cuts
      .map((cut) => ({ ...cut, axis: mapAxis(cut.axis) }))
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

test('strongest-box geometry classifies Ke1 as enlargement', () => {
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
