import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen } from '../chess'
import { createMateSession, playWhiteMove, replaceHistoricalBlackMove } from '../session'
import { getBlackReplyChoices } from '../workspaceSupport'
import { getMateRuleSet } from './index'
import { getKnightAndBishopOpponentCandidates } from './bishopKnight'
import { isBishopKnightMatingNetReply, r1Start } from './bishopKnightStages'
import data from './bishopKnightStageData.json'

function boardForKey(key: string) {
  const board = getChess()
  board.clear()
  const squares = key.match(/../g)! as Parameters<typeof board.get>[0][]
  for (let i = 0; i < 4; i++) {
    board.put({ type: (['k', 'b', 'n', 'k'] as const)[i]!, color: i === 3 ? 'b' : 'w' }, squares[i]!)
  }
  return board
}

test('every mating-net move allows every legal Black reply in all eight orientations, even over a return preference', () => {
  let branchingPositions = 0
  for (const [source, destinations] of data.r1Edges as [string, string[]][]) {
    for (const destination of destinations) {
      const result = boardForKey(destination).fen().replace(' w ', ' b ')
      for (const transform of SQUARE_TRANSFORMS) {
        const before = transformFen(boardForKey(source).fen(), transform)
        const after = transformFen(result, transform)
        const replies = getChess(after).moves({ verbose: true })
        assert.equal(isBishopKnightMatingNetReply(after, before), true)
        assert.equal(isBishopKnightMatingNetReply(after), true, 'loaded result without history')
        const candidates = getKnightAndBishopOpponentCandidates(after, replies[0]?.after, before)
        assert.deepEqual(candidates.idealMoves, candidates.moves)
        assert.deepEqual(candidates.moves, replies.map(move => move.san))
        if (replies.length > 1) branchingPositions++
      }
    }
  }
  assert.ok(branchingPositions > 0)
})

test('entering the same board from outside the mating net does not activate the move exception', () => {
  const before = 'B7/8/8/8/8/2K5/2N5/2k5 w - - 0 1'
  const board = getChess(before)
  board.move('Bd5')
  assert.equal(isBishopKnightMatingNetReply(board.fen()), true)
  assert.equal(isBishopKnightMatingNetReply(board.fen(), before), false)
  const replies = board.moves({ verbose: true })
  assert.ok(replies.length > 1)
  assert.deepEqual(getKnightAndBishopOpponentCandidates(board.fen(), replies[0]!.after, before).idealMoves, [replies[0]!.san])
  const deviation = getChess(r1Start)
  deviation.move('Kb3')
  assert.equal(isBishopKnightMatingNetReply(deviation.fen(), r1Start), false)
})

test('live sessions sample mating-net replies equally and expose them for historical cycling', () => {
  const after = getChess(r1Start)
  after.move('Bd5')
  const replies = after.moves()
  assert.ok(replies.length > 1)
  const observed = new Map<string, number>()
  for (let i = 0; i < replies.length * 4; i++) {
    const deps = { now: () => 0, random: () => (i + 0.5) / (replies.length * 4), generatePosition: () => r1Start, getRuleSet: getMateRuleSet }
    const start = createMateSession({ mateId: 'bishop-knight', mode: 'standard', startingFen: r1Start }, deps)
    const played = playWhiteMove(start, 'Bd5', deps)
    const log = played.logs[0]!
    assert.equal(log.reasonId, 'r1')
    assert.equal(log.idealOpponentChoices, replies.length)
    assert.equal(log.legalOpponentChoices, replies.length)
    observed.set(log.opponentSan!, (observed.get(log.opponentSan!) ?? 0) + 1)
    assert.deepEqual(getBlackReplyChoices(played, 0, getMateRuleSet('bishop-knight'), true), replies)
    const other = replies.find(reply => reply !== log.opponentSan)!
    const replaced = replaceHistoricalBlackMove(played, 0, other, deps)
    assert.equal(replaced.logs[0]!.opponentSan, other)
    assert.equal(replaced.logs[0]!.idealOpponentChoices, replies.length)
  }
  assert.deepEqual([...observed.keys()].sort(), [...replies].sort())
  assert.ok([...observed.values()].every(count => count === 4))
})
