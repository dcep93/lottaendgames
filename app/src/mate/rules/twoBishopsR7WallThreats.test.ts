import assert from 'node:assert/strict'
import test from 'node:test'
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess'
import {scoreTwoBishopsWhiteMove,twoBishopsWhiteRules,getIdealTwoBishopsWhiteMoves} from './twoBishops'
import {compareScoresByRules} from './selection'

test('r7 rejects outer-diagonal entry and inner-bishop attacks independently across symmetries',()=>{
  const fixtures=[
    {fen:'8/7k/8/5K2/8/8/BB6/8 w - - 0 1',from:'f5',to:'e6',reply:'g8',penalty:1},
    {fen:'2B5/8/4K2k/8/8/6B1/8/8 w - - 30 16',from:'g3',to:'h4',reply:'h5',penalty:1},
    {fen:'2B5/8/8/5K1k/8/6B1/8/8 w - - 26 14',from:'c8',to:'d7',reply:'h6',penalty:0},
  ] as const
  for(const transform of SQUARE_TRANSFORMS){
    const scores=fixtures.map(fixture=>{
      const fen=transformFen(fixture.fen,transform),chess=getChess(fen)
      const move=chess.moves({verbose:true}).find(move=>move.from===transformSquare(fixture.from,transform)&&move.to===transformSquare(fixture.to,transform))!
      assert.ok(move)
      const score=scoreTwoBishopsWhiteMove(fen,move.san)
      assert.equal(score.ruleR7Penalty,fixture.penalty,`${transform.name}: ${move.san}`)
      assert.ok(score.ruleR10DiagonalCount<99)
      chess.move(move.san)
      assert.ok(chess.moves({verbose:true}).some(reply=>reply.to===transformSquare(fixture.reply,transform)))
      return score
    })
    const r7=twoBishopsWhiteRules.find(rule=>rule.id==='rule r7')!
    assert.equal(compareScoresByRules(scores[0]!,scores[1]!,[r7]),0)
    assert.ok(compareScoresByRules(scores[2]!,scores[0]!,[r7])<0)
  }
})

test('r7 gives no credit for destroying the wall and runs after r6 before r8',()=>{
  const fen='2B5/8/8/5K1k/8/6B1/8/8 w - - 26 14'
  assert.equal(scoreTwoBishopsWhiteMove(fen,'Ba6').ruleR7Penalty,1)
  assert.equal(scoreTwoBishopsWhiteMove(fen,'Ba6').ruleR10DiagonalCount,99)
  const ids=twoBishopsWhiteRules.map(rule=>rule.id)
  assert.deepEqual(ids.slice(ids.indexOf('rule r6'),ids.indexOf('rule r8')+1),['rule r6','rule r7','rule r8'])
})

test('r7 allows an inner-bishop attack when no outer-diagonal square is screened',()=>{
  for(const transform of SQUARE_TRANSFORMS){
    const fen=transformFen('2B5/4B3/7k/8/8/6K1/8/8 w - - 0 1',transform),chess=getChess(fen)
    const move=chess.moves({verbose:true}).find(move=>move.from===transformSquare('e7',transform)&&move.to===transformSquare('h4',transform))!
    const score=scoreTwoBishopsWhiteMove(fen,move.san)
    assert.equal(score.bishopSafetyPenalty,0,transform.name)
    assert.equal(score.ruleR7Penalty,0,transform.name)
    chess.move(move.san)
    assert.ok(chess.isAttacked(transformSquare('h4',transform),'w'),transform.name)
    assert.ok(chess.moves({verbose:true}).some(reply=>reply.to===transformSquare('h5',transform)),transform.name)
  }
})


test('Bf8 passes r7 and is preferred when the outer diagonal is unscreened',()=>{
  for(const transform of SQUARE_TRANSFORMS){
    const fen=transformFen('8/3k2B1/5K2/8/8/8/B7/8 w - - 2 2',transform),chess=getChess(fen)
    const move=chess.moves({verbose:true}).find(move=>move.from===transformSquare('g7',transform)&&move.to===transformSquare('f8',transform))!
    assert.equal(scoreTwoBishopsWhiteMove(fen,move.san).ruleR7Penalty,0,transform.name)
    assert.ok(getIdealTwoBishopsWhiteMoves(fen).includes(move.san),transform.name)
    chess.move(move.san)
    assert.ok(chess.moves({verbose:true}).some(reply=>reply.to===transformSquare('e8',transform)),transform.name)
  }
})


test('a remote outer screen does not activate the inner-bishop attack check',()=>{
  for(const transform of SQUARE_TRANSFORMS){
    const fen=transformFen('2B2k2/8/8/5K2/7B/8/8/8 w - - 0 1',transform),chess=getChess(fen)
    const move=chess.moves({verbose:true}).find(move=>move.from===transformSquare('h4',transform)&&move.to===transformSquare('d8',transform))!
    // Kf5 screens g4/h3 from Bc8, but neither square is adjacent to Bd8.
    assert.equal(scoreTwoBishopsWhiteMove(fen,move.san).ruleR7Penalty,0,transform.name)
    chess.move(move.san)
    assert.ok(chess.moves({verbose:true}).some(reply=>reply.to===transformSquare('e8',transform)),transform.name)
  }
})
