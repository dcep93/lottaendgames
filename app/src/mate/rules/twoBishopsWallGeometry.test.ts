import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  getChess,
  transformFen,
  transformSquare,
} from '../chess'
import {
  getIdealTwoBishopsWhiteMoves,
  scoreTwoBishopsWhiteMove,
} from './twoBishops'
import {
  getRuleNPreferredMoves,
  getSmallestTwoBishopsWallArea,
  getTwoBishopsWalls,
} from './twoBishopsWallGeometry'

const LOADED_WALL_FEN =
  '2B5/8/6k1/8/3K3B/8/8/8 w - - 18 10'
const RULE_N_FEN = '8/8/8/8/8/2BB4/k7/2K5 w - - 0 1'
const RULE_N_DISTANCE_TWO_FEN =
  '8/8/8/8/5K2/7k/4BB2/8 w - - 0 1'
const RULE_N_DISTANCE_THREE_FEN =
  '8/8/8/5K2/7k/4BB2/8/8 w - - 0 1'
const RULE_O_OCCUPIED_WALL_FEN =
  '8/8/7B/8/5K1k/8/4B3/8 w - - 0 1'

test('wall area is measured from the nearer diagonal position', () => {
  const wall = getTwoBishopsWalls(LOADED_WALL_FEN).find(
    ({ corner, escapeSquare, wallSquares }) =>
      corner === 'h8' &&
      escapeSquare === 'f5' &&
      wallSquares.includes('g5'),
  )
  assert.ok(wall)
  assert.deepEqual(wall.nearerDiagonal, { axis: 'sum', index: 10 })
  assert.deepEqual(wall.fartherDiagonal, { axis: 'sum', index: 9 })
  assert.equal(wall.areaSquares.length, 10)
  assert.ok(wall.wallSquares.includes('g5'))
  assert.ok(wall.wallSquares.includes('f5'))
})

test('a safely screened farther diagonal remains a wall', () => {
  const safeScreen = '2B5/8/4K1k1/8/7B/8/8/8 w - - 0 1'
  const exploitableScreen = '2B5/3K4/6k1/8/7B/8/8/8 w - - 0 1'

  assert.ok(
    getTwoBishopsWalls(safeScreen).some(
      ({ corner, escapeSquare }) => corner === 'h8' && escapeSquare === 'f5',
    ),
  )
  assert.equal(getTwoBishopsWalls(exploitableScreen).length, 0)
})

test('Rule O ignores corner areas smaller than four squares', () => {
  const tinyWall = '5B1k/7B/8/8/3K4/8/8/8 w - - 0 1'
  assert.equal(getSmallestTwoBishopsWallArea(tinyWall, 1), 1)
  assert.equal(getSmallestTwoBishopsWallArea(tinyWall), null)
  assert.equal(getSmallestTwoBishopsWallArea(LOADED_WALL_FEN), 10)
})

test('Rule N recognizes the forced checking shrink', () => {
  assert.deepEqual(getRuleNPreferredMoves(RULE_N_FEN), ['Bc4+'])
})

test('Rule N requires Manhattan distance 3 from the wall corner', () => {
  assert.deepEqual(getRuleNPreferredMoves(RULE_N_DISTANCE_TWO_FEN), [])
  assert.deepEqual(getRuleNPreferredMoves(RULE_N_DISTANCE_THREE_FEN), [
    'Bf2+',
  ])

  const acceptedMove = getChess(RULE_N_DISTANCE_THREE_FEN).move('Bf2+')
  assert.ok(acceptedMove)
  for (const transform of SQUARE_TRANSFORMS) {
    assert.deepEqual(
      getRuleNPreferredMoves(
        transformFen(RULE_N_DISTANCE_TWO_FEN, transform),
      ),
      [],
      transform.name,
    )
    const transformedFen = transformFen(
      RULE_N_DISTANCE_THREE_FEN,
      transform,
    )
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(acceptedMove.from, transform) &&
          to === transformSquare(acceptedMove.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    assert.ok(
      getRuleNPreferredMoves(transformedFen).includes(transformedMove.san),
      transform.name,
    )
  }
})

test('wall and Rule N geometry rotate and reflect', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const wallFen = transformFen(LOADED_WALL_FEN, transform)
    assert.ok(
      getTwoBishopsWalls(wallFen).some(
        ({ areaSquares, corner, escapeSquare }) =>
          areaSquares.length === 10 &&
          corner === transformSquare('h8', transform) &&
          escapeSquare === transformSquare('f5', transform),
      ),
      transform.name,
    )

    const ruleNFen = transformFen(RULE_N_FEN, transform)
    const expectedMove = getChess(ruleNFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare('d3', transform) &&
          to === transformSquare('c4', transform),
      )
    assert.ok(expectedMove, transform.name)
    assert.ok(
      getRuleNPreferredMoves(ruleNFen).includes(expectedMove.san),
      transform.name,
    )
  }
})

test('Rule W counts the post-move bishop distances at the threshold', () => {
  assert.equal(scoreTwoBishopsWhiteMove(LOADED_WALL_FEN, 'Be6').ruleWPenalty, 2)
  assert.equal(scoreTwoBishopsWhiteMove(LOADED_WALL_FEN, 'Bd8').ruleWPenalty, 0)
})

test('Rule O recognizes Bh4 without using White king location for wall existence', () => {
  const fen = '8/4B3/8/8/8/5K2/8/3B2k1 w - - 0 1'
  const result = getChess(fen)
  result.move('Bh4')
  assert.equal(getSmallestTwoBishopsWallArea(result.fen()), 6)
  const score = scoreTwoBishopsWhiteMove(fen, 'Bh4')
  assert.equal(score.ruleOApplies, true)
  assert.equal(score.ruleOPenalty, 6)
})

test('Rule O recognizes a bishop occupying its wall square', () => {
  const result = getChess(RULE_O_OCCUPIED_WALL_FEN)
  result.move('Bg5+')

  assert.equal(getSmallestTwoBishopsWallArea(result.fen()), 10)
  assert.ok(
    getTwoBishopsWalls(result.fen()).some(
      ({ fartherDiagonal, nearerDiagonal, wallBishops }) =>
        fartherDiagonal.axis === 'difference' &&
        fartherDiagonal.index === 2 &&
        nearerDiagonal.axis === 'difference' &&
        nearerDiagonal.index === 3 &&
        wallBishops.includes('g5'),
    ),
  )
})

test('Rule WW keeps the resulting outer-wall bishop off the edge', () => {
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(RULE_O_OCCUPIED_WALL_FEN), [
    'Bg5+',
  ])
  assert.equal(
    scoreTwoBishopsWhiteMove(RULE_O_OCCUPIED_WALL_FEN, 'Bg5+')
      .ruleWWPenalty,
    0,
  )

  const reply = getChess(RULE_O_OCCUPIED_WALL_FEN)
  reply.move('Bg5+')
  reply.move('Kh3')
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(reply.fen()), ['Bd1'])
  assert.equal(
    scoreTwoBishopsWhiteMove(reply.fen(), 'Bd1')
      .ruleWWPenalty,
    0,
  )
  assert.equal(
    scoreTwoBishopsWhiteMove(reply.fen(), 'Bh6')
      .ruleWWPenalty,
    1,
  )
})

test('occupied Rule O wall geometry rotates and reflects', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(RULE_O_OCCUPIED_WALL_FEN, transform)
    const firstMove = getChess(fen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare('h6', transform) &&
          to === transformSquare('g5', transform),
      )
    assert.ok(firstMove, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [firstMove.san])

    const reply = getChess(fen)
    reply.move(firstMove.san)
    const blackMove = reply
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare('h4', transform) &&
          to === transformSquare('h3', transform),
      )
    assert.ok(blackMove, transform.name)
    reply.move(blackMove.san)

    const returnMove = reply
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare('e2', transform) &&
          to === transformSquare('d1', transform),
      )
    assert.ok(returnMove, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(reply.fen()), [
      returnMove.san,
    ])
  }
})
