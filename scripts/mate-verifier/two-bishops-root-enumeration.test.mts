import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  allSquares,
  kingDistance,
  squareColor,
  transformSquare,
} from '../../app/src/mate/chess.ts'
import { canonicalSquareOrbitRepresentative } from './production.mts'

test('early Two Bishops root pruning preserves every raw geometry orbit and its first representative', (context) => {
  const squares = allSquares()
  const transforms = SQUARE_TRANSFORMS.map((transform) =>
    squares.map((square) => squares.indexOf(transformSquare(square, transform))),
  )
  const representatives = squares.map((square) =>
    square === canonicalSquareOrbitRepresentative(square),
  )
  const colors = squares.map(squareColor)
  // Four six-bit square indices fit in a 24-bit key; bitsets keep this full
  // raw-geometry proof small enough to run as a focused test.
  const before = new Uint8Array(1 << 21)
  const after = new Uint8Array(before.length)
  let rawPlacements = 0
  let retainedPlacements = 0
  let orbits = 0

  for (let black = 0; black < 64; black += 1) {
    for (let white = 0; white < 64; white += 1) {
      if (kingDistance(squares[black]!, squares[white]!) <= 1) continue
      for (let first = 0; first < 64; first += 1) {
        if (first === black || first === white) continue
        for (let second = first + 1; second < 64; second += 1) {
          if (second === black || second === white) continue
          // The old final validation rejects same-colored bishops. Moving
          // that exact restriction before FEN construction changes no root.
          if (colors[first] === colors[second]) continue
          rawPlacements += 1
          let canonical = Number.POSITIVE_INFINITY
          for (const transform of transforms) {
            const transformedFirst = transform[first]!
            const transformedSecond = transform[second]!
            const key = (transform[black]! << 18) |
              (transform[white]! << 12) |
              (Math.min(transformedFirst, transformedSecond) << 6) |
              Math.max(transformedFirst, transformedSecond)
            canonical = Math.min(canonical, key)
          }
          const byte = canonical >>> 3
          const bit = 1 << (canonical & 7)
          if ((before[byte]! & bit) === 0) {
            // allSquares is lexicographic, so the original iterator's first
            // member must already have the earliest Black-king square.
            assert.ok(representatives[black], `First orbit member lost: ${canonical}`)
            before[byte] |= bit
            orbits += 1
          }
          if (representatives[black]) {
            after[byte] |= bit
            retainedPlacements += 1
          }
        }
      }
    }
  }

  assert.deepEqual(after, before)
  assert.equal(rawPlacements, 3_469_344)
  assert.equal(retainedPlacements, 541_725)
  assert.equal(orbits, 433_668)
  context.diagnostic(JSON.stringify({
    rawPlacements,
    retainedPlacements,
    orbits,
    orbitBitsetSha256: createHash('sha256').update(before).digest('hex'),
  }))
})
