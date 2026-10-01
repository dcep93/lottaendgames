import assert from 'node:assert/strict'
import test from 'node:test'
import { Chess } from 'chess.js'
import { resolveAppRoute } from '../routing'
import { decodeMateReplay, encodeMateReplay, encodeMateFen } from './share'
import { createMateReplaySession } from './session'
import { getMateRuleSet } from './rules'
import fixtures from './rules/twoKnightsPawnTableFixtures.json'
import { twoKnightsPawnTableReady } from './rules/twoKnightsPawnTable'

const fen = fixtures.worstLine.fen.replace('0 1','150 80')
const board = new Chess(fen)
const moves = fixtures.worstLine.uci.map(uci => board.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4] ? {promotion:uci[4]} : {})}).san)

test('cold replay loads a full custom-mate line and preserves clocks past 100', async () => {
  assert.equal(twoKnightsPawnTableReady(),false)
  const hash=encodeMateReplay(fen,moves,0)
  const cold=resolveAppRoute('/mate/two-knights-pawn',hash)
  assert.equal(cold.href,'/mate/two-knights-pawn'+hash)
  assert.deepEqual(cold.route,{module:'mate',mateId:'two-knights-pawn',mateMode:'standard',sharedFen:fen,sharedMoves:moves,sharedReplayCursor:0})
  await import('./rules/twoKnightsPawnTestSetup')
  assert.deepEqual(resolveAppRoute('/mate/two-knights-pawn',hash),cold)
  const session=createMateReplaySession({mateId:'two-knights-pawn',mode:'standard',startingFen:fen,moves,startAtBeginning:true},{now:()=>0,random:()=>0,generatePosition:()=>fen,getRuleSet:getMateRuleSet})
  assert.equal(session.fen,fen)
  assert.equal(session.history.length,moves.length+1)
  assert.equal(session.history.at(-1)?.outcome,'checkmate')
})

test('cold restrictions reject underpromotion, capture, stationary queen moves and play after custom mate',()=>{
  const under= moves.map(san => san.replace('=Q','=R'))
  assert.equal(decodeMateReplay(encodeMateReplay(fen,under),'two-knights-pawn').ok,false)
  assert.equal(decodeMateReplay(encodeMateReplay(fen,[...moves,'Qg1']),'two-knights-pawn').ok,false)
  const capture='8/8/8/8/8/4K2p/4N1kN/8 b - - 0 1'
  assert.equal(decodeMateReplay(encodeMateReplay(capture,['Kxh2','Kf3']),'two-knights-pawn').ok,false)
  const queen=fixtures.positions.find(row=>row.fen.includes('q') && new Chess(row.fen).turn()==='b' && new Chess(row.fen).moves({verbose:true}).some(m=>m.piece==='q'))!
  const queenMove=new Chess(queen.fen).moves({verbose:true}).find(m=>m.piece==='q')!
  assert.equal(decodeMateReplay(encodeMateReplay(queen.fen,[queenMove.san]),'two-knights-pawn').ok,false)
})

test('old unsupported starts and replay links retain the URL and receive an explicit explanation',()=>{
  const old='k7/7p/8/5N2/8/4K3/8/6N1 w - - 0 1'
  const hash=encodeMateReplay(old,['Kd4','Kb8'])
  const route=resolveAppRoute('/mate/two-knights-pawn',hash)
  assert.equal(route.href,'/mate/two-knights-pawn'+hash)
  assert(route.route.module==='mate')
  assert.equal(route.route.sharedFen,old)
  assert.match(route.route.sharedError!,/Unsupported/)
  assert.equal(resolveAppRoute('/mate/two-knights-pawn',encodeMateFen(old)).href,'/mate/two-knights-pawn'+encodeMateFen(old))
})


test('Black-to-move custom links replay their initial permitted reply', () => {
  const row = fixtures.positions.find(row => new Chess(row.fen).turn() === 'b' && row.moves.length > 0)!
  const chess = new Chess(row.fen)
  const move = row.moves[0]!.uci
  const san = chess.move({from:move.slice(0,2),to:move.slice(2,4),...(move[4] ? {promotion:move[4]} : {})}).san
  assert.equal(decodeMateReplay(encodeMateReplay(row.fen,[san]),'two-knights-pawn').ok,true)
  const session = createMateReplaySession({mateId:'two-knights-pawn',mode:'standard',startingFen:row.fen,moves:[san]},{now:()=>0,random:()=>0,generatePosition:()=>row.fen,getRuleSet:getMateRuleSet})
  assert.equal(session.fen,chess.fen())
  assert.equal(session.history.length,2)
})
