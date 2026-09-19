import assert from 'node:assert/strict'
import test from 'node:test'
import { findPiece, getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getKnightAndBishopMatingContinuationMoves } from './bishopKnightStrategy'
import { getKnightAndBishopLookupWhiteMoves, isKnightAndBishopMatingNetWhiteTurnPosition, knightAndBishopWhiteMoveReachesLookupPath } from './index'

function storedMatingMoves(fen: string): readonly string[] {
  const mate = getChess(fen).moves().filter(move => move.endsWith('#'))
  if (mate.length) return mate
  const patterns = getKnightAndBishopMatingContinuationMoves(fen)
  if (patterns.length) return patterns
  const lookup = getKnightAndBishopLookupWhiteMoves(fen)
  return lookup.length ? lookup : getChess(fen).moves().filter(move => knightAndBishopWhiteMoveReachesLookupPath(fen, move))
}

test('every bishop placement on d7–h3 shares the recorded finishing continuation', () => {
  const destinations = ['d7', 'e6', 'f5', 'g4', 'h3'] as const
  for (const source of ['c8', ...destinations] as const) {
    const start = getChess('8/1N6/k1K5/8/8/8/8/8 w - - 0 1')
    start.put({type: 'b', color: 'w'}, source)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(start.fen(), transform)
      const moves = destinations.filter(to => to !== source).map(to => getChess(fen).move({
        from: transformSquare(source, transform), to: transformSquare(to, transform),
      }).san)
      assert.deepEqual([...getKnightAndBishopMatingContinuationMoves(fen)].sort(), [...moves].sort())
      for (const san of moves) {
        const chess = getChess(fen)
        chess.move(san)
        assert.deepEqual(chess.moves({verbose: true}).map(move => move.to), [transformSquare('a7', transform)])
        chess.move(chess.moves()[0]!)
        for (const [from, to, blackFrom, blackTo] of [
          ['b7', 'c5', 'a7', 'a8'],
          ['c6', 'b6', 'a8', 'b8'],
          ['c5', 'a6', 'b8', 'a8'],
        ] as const) {
          const move = getChess(chess.fen()).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
          assert.deepEqual(storedMatingMoves(chess.fen()), [move])
          assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(chess.fen()), true)
          chess.move(move)
          chess.move({from: transformSquare(blackFrom, transform), to: transformSquare(blackTo, transform)})
        }
        for (const mate of storedMatingMoves(chess.fen())) {
          const after = getChess(chess.fen())
          after.move(mate)
          assert.equal(after.isCheckmate(), true, mate)
        }
      }
    }
  }
})

test('Kb6 enters the mating net with the bishop anywhere on c8–h3 in all orientations', () => {
  for (const bishop of ['c8', 'd7', 'e6', 'f5', 'g4', 'h3'] as const) {
    const start = getChess('k7/1N6/2K5/8/8/8/8/8 w - - 0 1')
    start.put({type: 'b', color: 'w'}, bishop)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(start.fen(), transform)
      const move = getChess(fen).move({from: transformSquare('c6', transform), to: transformSquare('b6', transform)}).san
      assert.deepEqual(getKnightAndBishopMatingContinuationMoves(fen), [move])
      assert.deepEqual(storedMatingMoves(fen), [move])
      assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(fen), true)
    }
  }
  for (const fen of [
    'k7/1N6/2K5/4B3/8/8/8/8 w - - 0 1',
    '1k6/1N1B4/2K5/8/8/8/8/8 w - - 0 1',
    'k7/2NB4/2K5/8/8/8/8/8 w - - 0 1',
    'k7/1N1B4/3K4/8/8/8/8/8 w - - 0 1',
  ]) assert.deepEqual(getKnightAndBishopMatingContinuationMoves(fen), [])
})

test('with Black on b8 the bishop stays on a7–g1 in all orientations', () => {
  const diagonal = ['a7', 'b6', 'c5', 'd4', 'e3', 'f2', 'g1'] as const
  for (const bishop of ['b6', 'c5', 'd4', 'e3', 'f2', 'g1'] as const) {
    const start = getChess('1k6/2N5/2K5/8/8/8/8/8 w - - 0 1')
    start.put({type: 'b', color: 'w'}, bishop)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(start.fen(), transform)
      const squares = diagonal.map(square => transformSquare(square, transform))
      const expected = getChess(fen).moves({verbose: true}).filter(move => {
        if (move.piece !== 'b' || !squares.includes(move.to)) return false
        const after = getChess(fen)
        after.move(move.san)
        return !after.moves({verbose: true}).some(reply => reply.captured)
      }).map(move => move.san)
      assert.deepEqual([...getKnightAndBishopMatingContinuationMoves(fen)].sort(), expected.sort())
      for (const san of storedMatingMoves(fen)) assert.ok(expected.includes(san), san)
    }
  }
})

test('Nd5 follows Ba7 without moving the bishop back off a7 in all orientations', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('3k4/B1N5/2K5/8/8/8/8/8 w - - 2 2', transform)
    const move = getChess(fen).move({from: transformSquare('c7', transform), to: transformSquare('d5', transform)}).san
    assert.deepEqual(getKnightAndBishopMatingContinuationMoves(fen), [move])
    assert.deepEqual(storedMatingMoves(fen), [move])
    assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(fen), true)
  }
})

test('Ba7 takes precedence over Be7 for every bishop square on b6–g1 in all orientations', () => {
  for (const bishop of ['b6', 'c5', 'd4', 'e3', 'f2', 'g1'] as const) {
    const start = getChess('2k5/2N5/2K5/8/8/8/8/8 w - - 2 2')
    start.put({type: 'b', color: 'w'}, bishop)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(start.fen(), transform)
      const chess = getChess(fen)
      const move = chess.move({from: transformSquare(bishop, transform), to: transformSquare('a7', transform)}).san
      assert.deepEqual(getKnightAndBishopMatingContinuationMoves(fen), [move])
      assert.deepEqual(storedMatingMoves(fen), [move])
      assert.deepEqual(chess.moves({verbose: true}).map(reply => reply.to), [transformSquare('d8', transform)])
    }
  }
})

test('the corrected bishop setup forces Kc8, Kb8, Kc8 in all orientations', () => {
  const start = '3k4/2N5/2K5/2B5/8/8/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, transform)
    const moves = getKnightAndBishopMatingContinuationMoves(fen)
    const expected = (['a3', 'b4', 'd6', 'f8'] as const).map(to =>
      getChess(fen).move({from: transformSquare('c5', transform), to: transformSquare(to, transform)}).san)
    assert.deepEqual([...moves].sort(), expected.sort())
    assert.ok(!storedMatingMoves(fen).some(san => san.startsWith('N')))
    for (const san of moves) {
      const chess = getChess(fen)
      chess.move(san)
      for (const [replySquare, bishopDestination] of [['c8', 'e7'], ['b8', 'c5']] as const) {
        const replies = chess.moves({verbose: true})
        assert.deepEqual(replies.map(move => move.to), [transformSquare(replySquare, transform)])
        chess.move(replies[0]!.san)
        const bishop = findPiece(chess.fen(), 'w', 'b')!
        const move = getChess(chess.fen()).move({from: bishop.square, to: transformSquare(bishopDestination, transform)}).san
        assert.deepEqual(storedMatingMoves(chess.fen()), [move])
        chess.move(move)
      }
      assert.deepEqual(chess.moves({verbose: true}).map(move => move.to), [transformSquare('c8', transform)])
    }
  }
})

test('the mating continuations accept every legal bishop placement on the diagonal in all orientations', () => {
  const cases = [
    ['4k3/8/2K5/2BN4/8/8/8/8 w - - 4 3', 'c6', 'd6'],
    ['8/5k2/3K4/2BN4/8/8/8/8 w - - 6 4', 'd5', 'e7'],
    ['3k4/8/3K4/2BN4/8/8/8/8 w - - 4 3', 'd5', 'e7'],
    ['4k3/4N3/3K4/2B5/8/8/8/8 w - - 6 4', 'd6', 'e6'],
  ] as const
  for (const [start, from, to] of cases) {
    for (const bishop of ['a7', 'b6', 'c5', 'd4', 'e3', 'f2', 'g1'] as const) {
      const chess = getChess(start)
      chess.remove('c5')
      chess.put({type: 'b', color: 'w'}, bishop)
      // Black cannot already be in check at the start of White's turn.
      if (chess.isAttacked(findPiece(chess.fen(), 'b', 'k')!.square, 'w')) continue
      for (const transform of SQUARE_TRANSFORMS) {
        const fen = transformFen(chess.fen(), transform)
        const san = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
        assert.deepEqual(getKnightAndBishopMatingContinuationMoves(fen), [san])
        assert.deepEqual(storedMatingMoves(fen), [san])
        assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(fen), true)
      }
    }
  }
  for (const fen of [
    '3k4/2N5/2K5/3B4/8/8/8/8 w - - 2 2',
    '3k4/2N5/1K6/2B5/8/8/8/8 w - - 2 2',
    '3k4/8/2K5/2B5/4N3/8/8/8 w - - 2 2',
    '3k4/2N5/2K5/2B5/8/8/8/8 b - - 2 2',
  ]) assert.deepEqual(getKnightAndBishopMatingContinuationMoves(fen), [])
})

test('the Kd6 and Ne7 continuation remains accepted through Be3', () => {
  const chess = getChess('4k3/8/2K5/2BN4/8/8/8/8 w - - 0 1')
  for (const san of ['Kd6', 'Kf7', 'Ne7', 'Kf6', 'Be3', 'Kf7']) {
    if (chess.turn() === 'w') {
      assert.ok(storedMatingMoves(chess.fen()).includes(san), san)
    }
    chess.move(san)
  }
})

test('the loaded Ne7 and Ke6 branch is retained in the pattern data', () => {
  const chess = getChess('4k3/8/2K5/2BN4/8/8/8/8 w - - 0 1')
  for (const san of ['Kd6', 'Kd8', 'Ne7', 'Ke8', 'Ke6', 'Kf8']) {
    if (chess.turn() === 'w') {
      assert.deepEqual(storedMatingMoves(chess.fen()), [san])
    }
    chess.move(san)
  }
})

test('the loaded Ke6, Nc5, Nd7 sequence is retained in the pattern data in every orientation', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const chess = getChess(transformFen('4k3/8/5K2/3B4/4N3/8/8/8 w - - 0 1', transform))
    for (const [from, to] of [
      ['f6', 'e6'], ['e8', 'd8'], ['e4', 'c5'], ['d8', 'c8'], ['c5', 'd7'], ['c8', 'd8'],
    ] as const) {
      const move = getChess(chess.fen()).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      if (chess.turn() === 'w') {
        assert.deepEqual(getKnightAndBishopMatingContinuationMoves(chess.fen()), [move])
        assert.deepEqual(storedMatingMoves(chess.fen()), [move])
      }
      chess.move(move)
    }
    assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(chess.fen()), true)
  }
})





test('the loaded Nd6, Nf7, Bf3, Be4 branch is retained in the pattern data in every orientation', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const chess = getChess(transformFen('4k3/8/5K2/3B4/4N3/8/8/8 w - - 0 1', transform))
    for (const [from, to] of [
      ['f6', 'e6'], ['e8', 'f8'], ['e4', 'd6'], ['f8', 'g7'], ['d6', 'f7'],
      ['g7', 'g6'], ['d5', 'f3'], ['g6', 'g7'], ['f3', 'e4'], ['g7', 'f8'],
    ] as const) {
      const move = getChess(chess.fen()).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      if (chess.turn() === 'w') {
        assert.deepEqual(getKnightAndBishopMatingContinuationMoves(chess.fen()), [move])
        assert.deepEqual(storedMatingMoves(chess.fen()), [move])
      }
      chess.move(move)
    }
  }
})


test('the loaded Kf6, Nd6, Nf7, Be4 sequence is retained in the pattern data in every orientation', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const chess = getChess(transformFen('8/7k/8/3BK3/4N3/8/8/8 w - - 0 1', transform))
    for (const [from, to] of [
      ['e5', 'f6'], ['h7', 'h8'], ['e4', 'd6'], ['h8', 'h7'],
      ['d6', 'f7'], ['h7', 'g8'], ['d5', 'e4'], ['g8', 'f8'],
    ] as const) {
      const move = getChess(chess.fen()).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      if (chess.turn() === 'w') {
        assert.deepEqual(getKnightAndBishopMatingContinuationMoves(chess.fen()), [move])
        assert.deepEqual(storedMatingMoves(chess.fen()), [move])
      }
      chess.move(move)
    }
    assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(chess.fen()), true)
  }
})


test('the loaded Kh6 branch through Nf2, Ng4, Ne5 and Nd7 is retained in the pattern data in every orientation', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const chess = getChess(transformFen('8/7k/8/3BK3/4N3/8/8/8 w - - 0 1', transform))
    for (const [from, to] of [
      ['e5', 'f6'], ['h7', 'h6'], ['f6', 'f5'], ['h6', 'h5'],
      ['e4', 'f2'], ['h5', 'h6'], ['f2', 'g4'], ['h6', 'g7'],
      ['g4', 'e5'], ['g7', 'f8'], ['f5', 'f6'], ['f8', 'e8'],
      ['f6', 'e6'], ['e8', 'd8'], ['e5', 'd7'], ['d8', 'e8'],
    ] as const) {
      const move = getChess(chess.fen()).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      if (chess.turn() === 'w') {
        assert.deepEqual(getKnightAndBishopMatingContinuationMoves(chess.fen()), [move])
        assert.deepEqual(storedMatingMoves(chess.fen()), [move])
      }
      chess.move(move)
    }
  }
})
