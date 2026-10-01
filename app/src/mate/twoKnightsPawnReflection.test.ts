import assert from 'node:assert/strict'
import { test } from 'node:test'
import './rules/twoKnightsPawnTestSetup'
import fixtures from './rules/twoKnightsPawnTableFixtures.json'
import { getSquareTransform, transformFen, getChess } from './chess'
import { generateMatePosition } from './positions'
import { twoKnightsPawnEntry, twoKnightsPawnPositionId } from './rules/twoKnightsPawnTable'
import { getTwoKnightsPawnPermittedMoves, getTwoKnightsPawnBoardOutcome, twoKnightsPawnMoveKey } from './rules/twoKnightsPawnMoves'
import { getIdealTwoKnightsPawnWhiteMoves, getIdealTwoKnightsPawnBlackMoves } from './rules/twoKnightsPawn'
import { getMateRuleSet } from './rules'
import { createMateSession, startOverMateSession, playWhiteMove, createMateReplaySession } from './session'
import { encodeMateReplay, decodeMateReplay } from './share'

const right = 'k7/8/8/8/7p/8/8/5KNN w - - 0 1'
const left = '7k/8/8/8/p7/8/8/NNK5 w - - 0 1'
const reflect = (fen: string) => transformFen(fen, getSquareTransform('mirrorFile'))
const deps = {now:()=>0, random:()=>0, generatePosition:generateMatePosition, getRuleSet:getMateRuleSet}

test('Standard starts on f1/g1/h1 and alternates the whole board on Start Over', () => {
  assert.equal(generateMatePosition('two-knights-pawn','standard',()=>0.999),right)
  let session = createMateSession({mateId:'two-knights-pawn',mode:'standard'},deps)
  for (const expected of [right,left,right,left]) {
    assert.equal(session.startingFen,expected)
    assert.deepEqual(twoKnightsPawnEntry(session.fen),{status:'win',plies:57})
    // Reset after play still uses the starting orientation.
    session = playWhiteMove(session,getIdealTwoKnightsPawnWhiteMoves(session.fen)[0]!,deps)
    session = startOverMateSession(session,deps)
  }
  const reloaded = createMateSession({mateId:'two-knights-pawn',mode:'standard',startingFen:left},deps)
  assert.equal(startOverMateSession(reloaded,deps).fen,right)
  assert.equal(generateMatePosition('two-knights-pawn','train',()=>0),fixtures.worstLine.fen)
})

test('file reflection preserves all sampled values, legal edges, White ties and Black best-reply sets', () => {
  let promoted=0
  for(const row of fixtures.positions) {
    const mirrored=reflect(row.fen)
    assert.equal(twoKnightsPawnPositionId(mirrored),row.id)
    assert.deepEqual(twoKnightsPawnEntry(mirrored),twoKnightsPawnEntry(row.fen))
    assert.equal(getTwoKnightsPawnBoardOutcome(mirrored),getTwoKnightsPawnBoardOutcome(row.fen))
    const moves=getTwoKnightsPawnPermittedMoves(mirrored)
    assert.deepEqual(moves.map(m=>twoKnightsPawnMoveKey(mirrored,m)).sort(),row.moves.map(m=>m.uci).sort())
    for(const move of moves) {
      const native=row.moves.find(m=>m.uci===twoKnightsPawnMoveKey(mirrored,move))!
      assert.equal(twoKnightsPawnEntry(move.after)?.plies,native.dtm)
    }
    const best=(fen:string)=>getChess(fen).turn()==='w'?getIdealTwoKnightsPawnWhiteMoves(fen):getIdealTwoKnightsPawnBlackMoves(fen)
    const keys=(fen:string)=>best(fen).map(san=>twoKnightsPawnMoveKey(fen,getChess(fen).move(san))).sort()
    assert.deepEqual(keys(mirrored),keys(row.fen))
    if(mirrored.includes('q')) { promoted++; assert(moves.every(m=>m.piece!=='q')) }
  }
  assert(promoted>0)
})

test('reflected promotion and high-clock mate replay stay supported', () => {
  const source=getChess(fixtures.worstLine.fen), mirrored=getChess(reflect(fixtures.worstLine.fen).replace('0 1','150 80'))
  const start=mirrored.fen(), moves:string[]=[]
  for(const uci of fixtures.worstLine.uci) {
    source.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4]?{promotion:uci[4]}:{})})
    const move=getTwoKnightsPawnPermittedMoves(mirrored.fen()).find(m=>twoKnightsPawnMoveKey(mirrored.fen(),m)===uci)!
    assert(move); moves.push(mirrored.move(move).san)
    assert.deepEqual(twoKnightsPawnEntry(mirrored.fen()),twoKnightsPawnEntry(source.fen()))
  }
  assert.equal(mirrored.get('a1')?.type,'q')
  assert.equal(getTwoKnightsPawnBoardOutcome(mirrored.fen()),'checkmate')
  assert.equal(decodeMateReplay(encodeMateReplay(start,moves),'two-knights-pawn').ok,true)
  const replay=createMateReplaySession({mateId:'two-knights-pawn',mode:'standard',startingFen:start,moves},deps)
  assert.equal(replay.outcome,'checkmate')
  assert.equal(replay.fen,mirrored.fen())
})
