import assert from 'node:assert/strict'
import './twoKnightsPawnTestSetup'
import { test } from 'node:test'
import { Chess } from 'chess.js'
import fixtures from './twoKnightsPawnTableFixtures.json'
import { twoKnightsPawnEntry, twoKnightsPawnPositionId } from './twoKnightsPawnTable'
import { getTwoKnightsPawnPermittedMoves, getTwoKnightsPawnBoardOutcome, TWO_KNIGHTS_PAWN_TABLE_ROOT_FEN } from './twoKnightsPawnMoves'
import { getIdealTwoKnightsPawnWhiteMoves, getIdealTwoKnightsPawnBlackMoves, getTwoKnightsPawnTerminalOutcome, twoKnightsPawnWhiteRules } from './twoKnightsPawn'
import { getMateRuleSet } from './index'
import { createMateSession, playWhiteMove, playBestMateMove, undoMateMove, redoMateMove, replaceHistoricalBlackMove } from '../session'
import { getLegalTargets, resolveMateBoardMove } from '../boardInteraction'
const uci = (move: {from:string;to:string;promotion?:string}) => move.from + move.to + (move.promotion ?? '')

test('runtime agrees with independent native legal successors, IDs, values and every optimal Black tie', () => {
  assert.deepEqual(twoKnightsPawnWhiteRules.map(rule => rule.id), ['tablebase'])
  let blackTies = 0, noMate = 0, promotions = 0
  for (const row of fixtures.positions) {
    assert.equal(twoKnightsPawnPositionId(row.fen), row.id, row.fen)
    assert.equal(twoKnightsPawnEntry(row.fen)?.plies, row.dtm, row.fen)
    const moves = getTwoKnightsPawnPermittedMoves(row.fen)
    assert.deepEqual(moves.map(uci).sort(), row.moves.map(m => m.uci).sort(), row.fen)
    for (const move of moves) {
      const native = row.moves.find(m => m.uci === uci(move))!
      assert.equal(twoKnightsPawnPositionId(move.after), native.id)
      assert.equal(twoKnightsPawnEntry(move.after)?.plies, native.dtm)
      assert.equal(move.captured, undefined)
      assert.notEqual(move.piece, 'q')
      if (move.promotion) { assert.equal(move.promotion, 'q'); promotions++ }
    }
    if (row.moves.length === 0) {
      const chess = new Chess(row.fen)
      assert.equal(getTwoKnightsPawnBoardOutcome(row.fen), row.dtm === 0 ? 'checkmate' : chess.isCheck() ? 'white-checkmate' : 'stalemate')
    }
    const white = new Chess(row.fen).turn() === 'w'
    const desired = row.moves.filter(m => row.dtm === null ? !white && m.dtm === null : m.dtm !== null && m.dtm + 1 === row.dtm).map(m => m.uci).sort()
    if (white) desired.splice(1)
    const best = white ? getIdealTwoKnightsPawnWhiteMoves(row.fen) : getIdealTwoKnightsPawnBlackMoves(row.fen)
    assert.deepEqual(best.map(san => uci(new Chess(row.fen).move(san))).sort(), desired, row.fen)
    assert.deepEqual(white ? getMateRuleSet('two-knights-pawn').idealWhiteMoves(row.fen) : getMateRuleSet('two-knights-pawn').blackCandidates(row.fen).idealMoves, best)
    if (!white && row.dtm !== null && best.length > 1) blackTies++
    if (row.dtm === null) noMate++
  }
  assert(blackTies > 0); assert(noMate > 0); assert(promotions > 0)
})

test('worst resistance has exactly the starting DTM, including stationary-queen custom checkmate', () => {
  const chess = new Chess(TWO_KNIGHTS_PAWN_TABLE_ROOT_FEN)
  assert.equal(twoKnightsPawnEntry(chess.fen())?.plies, fixtures.worstLine.dtm)
  for (const [i, move] of fixtures.worstLine.uci.entries()) {
    assert.equal(twoKnightsPawnEntry(chess.fen())?.plies, fixtures.worstLine.dtm - i)
    const legal = getTwoKnightsPawnPermittedMoves(chess.fen()).find(m => uci(m) === move)!
    assert(legal)
    const best = chess.turn() === 'w' ? getIdealTwoKnightsPawnWhiteMoves(chess.fen()) : getIdealTwoKnightsPawnBlackMoves(chess.fen())
    assert(best.includes(legal.san))
    chess.move(legal.san)
  }
  assert.equal(getTwoKnightsPawnTerminalOutcome(chess.fen()), 'checkmate')
  assert.equal(chess.isCheckmate(), false, 'ordinary chess has queen replies which the custom game forbids')
})

test('no-forced-mate stays playable; clocks, deviations and undo/redo preserve tablebase state', () => {
  const row = fixtures.positions.find(r => r.dtm === null && new Chess(r.fen).turn() === 'w' && r.moves.length > 0)!
  const fen = row.fen.replace('0 1', '150 80')
  const deps = {now: () => 0, random: () => 0, generatePosition: () => fen, getRuleSet: getMateRuleSet}
  const session = createMateSession({mateId: 'two-knights-pawn', mode:'standard', startingFen:fen}, deps)
  assert.equal(session.outcome, undefined)
  assert.equal(playBestMateMove(session, deps), session)
  const next = playWhiteMove(session, getTwoKnightsPawnPermittedMoves(fen)[0]!.san, deps)
  assert.notEqual(next, session)
  assert.equal(next.startingFen, fen)
  assert.equal(undoMateMove(undoMateMove(next)).fen, fen)
  assert.equal(redoMateMove(redoMateMove(undoMateMove(undoMateMove(next)))).fen, next.fen)
  const root = createMateSession({mateId:'two-knights-pawn',mode:'standard',startingFen:TWO_KNIGHTS_PAWN_TABLE_ROOT_FEN},deps)
  const deviation = getMateRuleSet('two-knights-pawn').whiteMoves(root.fen).find(m => !getIdealTwoKnightsPawnWhiteMoves(root.fen).includes(m))!
  const deviated = playWhiteMove(root, deviation, deps)
  assert.notEqual(deviated, root)
  assert.equal(deviated.logs[0]?.san, deviation)
  const black = new Chess(root.fen); black.move(deviation)
  const other = getTwoKnightsPawnPermittedMoves(black.fen()).find(m => m.san !== deviated.logs[0]?.opponentSan)
  if (other) assert.equal(replaceHistoricalBlackMove(deviated,0,other.san,deps).logs[0]?.opponentSan,other.san)
})

test('capture and queen input paths are rejected, promotion is queen-only, and unsupported stays distinct', () => {
  const whiteCapture = fixtures.positions.find(row => new Chess(row.fen).turn() === 'w' && new Chess(row.fen).moves({verbose:true}).some(m => m.captured))!
  const capture = new Chess(whiteCapture.fen).moves({verbose:true}).find(m => m.captured)!
  const deps = {now: () => 0, random: () => 0, generatePosition: () => whiteCapture.fen, getRuleSet: getMateRuleSet}
  const session = createMateSession({mateId:'two-knights-pawn', mode:'standard',startingFen:whiteCapture.fen},deps)
  assert.equal(playWhiteMove(session,capture.san,deps),session)
  const captureFen = '8/8/8/8/8/4K2p/4N1kN/8 b - - 0 1'
  assert(new Chess(captureFen).moves().includes('Kxh2'))
  assert(!getTwoKnightsPawnPermittedMoves(captureFen).some(m => m.san === 'Kxh2'))
  assert.equal(resolveMateBoardMove({fen:captureFen,mateId:'two-knights-pawn',sourceSquare:'g2',targetSquare:'h2',disabled:false}),null)
  const queen = fixtures.positions.find(r => r.fen.includes('q') && new Chess(r.fen).turn() === 'b')!
  assert.equal(getLegalTargets(queen.fen,'h1',false,'two-knights-pawn').size,0)
  const promotion = fixtures.positions.find(r => r.moves.some(m => m.uci === 'h2h1q'))!
  assert.match(resolveMateBoardMove({fen:promotion.fen,mateId:'two-knights-pawn',sourceSquare:'h2',targetSquare:'h1',disabled:false})!.san,/=Q/)
  assert.equal(getTwoKnightsPawnTerminalOutcome('k7/7p/8/8/8/8/8/1NK3N1 w - - 0 1'),'unsupported')
  assert.equal(twoKnightsPawnEntry('k7/7p/8/8/8/8/8/1NK3N1 w - - 0 1'),undefined)
  assert.equal(getTwoKnightsPawnBoardOutcome(captureFen),null)
})
