import assert from 'node:assert/strict'
import test from 'node:test'
import { Chess, type Square } from 'chess.js'
import { resolveAppRoute } from '../routing'
import {
  createKnightQueenSession, isKnightQueenSafe, KNIGHT_QUEEN_ROUTE,
  knightQueenBestMoves, knightQueenBoardInteraction, knightQueenFen,
  knightQueenMoves, knightQueenTarget, playKnightQueenMove, seekKnightQueenSession,
} from './knightQueen'

test('the snake contains exactly the safe squares in order, skipping the occupied queen square', () => {
  assert.deepEqual(KNIGHT_QUEEN_ROUTE, [
    'h8', 'f8', 'e8', 'c8', 'b8', 'a7', 'c7', 'e7', 'g7', 'h7',
    'h6', 'g6', 'f6', 'b6', 'a6', 'h4', 'g4', 'f4', 'b4', 'a4',
    'a3', 'c3', 'e3', 'g3', 'h3', 'h2', 'f2', 'e2', 'c2', 'b2',
    'a1', 'b1', 'c1', 'e1', 'f1', 'g1',
  ])
  const oracle = new Chess()
  oracle.clear()
  oracle.put({ color: 'b', type: 'q' }, 'd5')
  for (let rank = 1; rank <= 8; rank++) {
    for (const file of 'abcdefgh') {
      const square = `${file}${rank}` as Square
      assert.equal(isKnightQueenSafe(square), square !== 'd5' && !oracle.isAttacked(square, 'b'), square)
    }
  }
})

test('every Best Move is a safe knight jump and every safe square can reach every target', () => {
  for (const from of KNIGHT_QUEEN_ROUTE) {
    for (const target of KNIGHT_QUEEN_ROUTE) {
      let current = from
      let jumps = 0
      while (current !== target) {
        const choices = knightQueenBestMoves(current, target)
        assert.ok(choices.length > 0, `${current} to ${target}`)
        for (const next of choices) {
          const dx = Math.abs(next.charCodeAt(0) - current.charCodeAt(0))
          const dy = Math.abs(Number(next[1]) - Number(current[1]))
          assert.deepEqual([dx, dy].sort(), [1, 2])
          assert.equal(isKnightQueenSafe(next), true)
        }
        current = choices[0]!
        assert.ok(++jumps < 36, 'shortest paths never loop')
      }
    }
  }
})

test('Best Move completes the entire ordered route in 158 moves, and completion blocks further play', () => {
  let session = createKnightQueenSession()
  const reached = ['h8']
  while (knightQueenTarget(session.history[session.cursor]!) !== null) {
    const before = session.history[session.cursor]!
    const target = knightQueenTarget(before)!
    const destination = knightQueenBestMoves(before.knight, target)[0]!
    session = playKnightQueenMove(session, `N${destination}`, session.cursor * 1000)
    const after = session.history[session.cursor]!
    if (after.nextTargetIndex > before.nextTargetIndex) reached.push(after.knight)
    assert.ok(session.cursor <= 158)
  }
  assert.equal(session.cursor, 158)
  assert.deepEqual(reached, KNIGHT_QUEEN_ROUTE)
  const final = session.history[session.cursor]!
  assert.equal(final.knight, 'g1')
  assert.equal(final.movedAtMs, 157000)
  assert.equal(knightQueenBestMoves(final.knight, null).length, 0)
  assert.equal(playKnightQueenMove(session, `N${knightQueenMoves(final.knight)[0]}`, 160000), session)
  const undone = seekKnightQueenSession(session, -1)
  assert.equal(knightQueenTarget(undone.history[undone.cursor]!), 'g1')
  assert.deepEqual(seekKnightQueenSession(undone, 1), session)
})

test('illegal destinations are rejected and future targets do not count early', () => {
  const session = createKnightQueenSession()
  for (const move of ['Nf7', 'Nd5', 'Nh7', 'Qd4', 'Ne9', 'g6', 'Nh8']) {
    assert.equal(playKnightQueenMove(session, move, 1000), session, move)
  }
  const next = playKnightQueenMove(session, 'Ng6', 1000)
  assert.equal(next.history[1]!.knight, 'g6')
  assert.equal(knightQueenTarget(next.history[1]!), 'f8')
  assert.equal(next.startedAtMs, 1000)
  assert.equal(next.history[1]!.durationMs, 0)
})

test('undo/redo preserves timing and targets, and a new branch discards redo history', () => {
  const initial = createKnightQueenSession()
  const first = playKnightQueenMove(initial, 'Ng6', 1000)
  const second = playKnightQueenMove(first, 'Nf8', 2250)
  assert.equal(second.history[2]!.durationMs, 1250)
  assert.equal(knightQueenTarget(second.history[2]!), 'e8')
  const undone = seekKnightQueenSession(second, -1)
  assert.equal(knightQueenTarget(undone.history[undone.cursor]!), 'f8')
  assert.deepEqual(seekKnightQueenSession(undone, 1), second)
  const branch = playKnightQueenMove(undone, 'Nh8', 3000)
  assert.equal(branch.history.length, 3)
  assert.equal(knightQueenTarget(branch.history[2]!), 'f8')
  assert.equal(seekKnightQueenSession(branch, 1), branch)
  assert.equal(seekKnightQueenSession(initial, -1), initial)
  assert.equal(createKnightQueenSession().startedAtMs, undefined)
})

test('the board adapter allows only the white knight, rejects attacks and captures, and never moves the queen', () => {
  const fen = knightQueenFen('h8')
  assert.equal(fen, '7N/8/8/3q4/8/8/8/8 w - - 0 1')
  const adapter = knightQueenBoardInteraction
  assert.equal(adapter.canSelect(fen, 'h8', false), true)
  assert.equal(adapter.canSelect(fen, 'd5', false), false)
  assert.equal(adapter.canSelect(fen, 'h8', true), false)
  assert.deepEqual([...adapter.legalTargets(fen, 'h8', false).keys()], ['g6'])
  for (const targetSquare of ['f7', 'd5', 'h8', 'a9', null]) {
    assert.equal(adapter.resolveMove({ fen, sourceSquare: 'h8', targetSquare, disabled: false }), null)
  }
  assert.equal(adapter.resolveMove({ fen, sourceSquare: 'd5', targetSquare: 'g6', disabled: false }), null)
  assert.deepEqual(adapter.resolveMove({ fen, sourceSquare: 'h8', targetSquare: 'g6', disabled: false }), {
    fen: '8/8/6N1/3q4/8/8/8/8 w - - 0 1', san: 'Ng6',
  })
})

test('the exercise has one canonical route without a training variant or arbitrary starting FEN', () => {
  for (const path of ['/mate/knight-queen', '/mate/knight-queen/train']) {
    assert.deepEqual(resolveAppRoute(path, '#live=anything'), {
      href: '/mate/knight-queen',
      route: { module: 'mate', mateId: 'knight-queen', mateMode: null, sharedFen: null },
    })
  }
})
