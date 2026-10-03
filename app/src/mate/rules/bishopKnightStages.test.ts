import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import bridgeData from './bishopKnightOptimalBridgeData.json';
import {canonical,code,fen} from '../../../../scripts/bishop-knight-audit/encoding.mts';
import {getChess,SQUARE_TRANSFORMS,transformFen} from '../chess';
import {bishopKnightRuleSet,getIdealKnightAndBishopWhiteMoves} from './bishopKnight';
import {bishopKnightStageMoves,bishopKnightStagePosition,bishopKnightPositionKey,r1Start} from './bishopKnightStages';
import {verifyStages} from '../../../../scripts/bishop-knight-audit/verify-stages.mts';
import {explainMove} from './selection';
import data from './bishopKnightStageData.json';

function boardForKey(key:string){const board=getChess();board.clear();for(let i=0;i<4;i++)board.put({type:(['k','b','n','k'] as const)[i]!,color:i===3?'b':'w'},key.slice(i*2,i*2+2) as Parameters<typeof board.get>[0]);return board;}

test('every r1/r2 continuation terminates, including all Black replies, White ties and D4 orientations',()=>{
 const result=verifyStages();assert.equal(result.r2Starts,82);assert.equal(result.loops,0);assert.equal(result.draws,0);
 assert.equal(result.symmetryChecks,result.whitePositionClasses*8);assert.equal(result.r1MaxPlies,41);assert.ok(result.r2MaxPlies<=105);
 assert.equal(result.r1ReachablePositions,99);assert.equal(result.r1ReachableEdges,99);assert.equal(result.outsideR1Labels,0);
});

test('r3 follows r2 and the declared r1 start is used in the guide',()=>{
 assert.equal(bishopKnightRuleSet.whiteRules[5]?.id,'r3');
 const note=bishopKnightRuleSet.help.noteBoards.find(board=>board.id==='bishop-knight-rule-r1-net')!;
 const diagrams=bishopKnightRuleSet.help.noteBoards;
 assert.deepEqual(diagrams.map(board=>board.title),['r3','r2','r1']);
 assert.equal(diagrams[0]!.animationSrc,undefined);
 assert.equal(diagrams[1]!.animationSrc,undefined);
 assert.ok(diagrams[1]!.pieces.some(p=>p.piece==='B'&&p.square==='a2'));
 assert.ok(note.pieces.some(p=>p.piece==='B'&&p.square==='c4'));
 assert.ok(note.pieces.some(p=>p.piece==='k'&&p.square==='c1'));
 assert.equal(bishopKnightStageMoves(r1Start).stage,1);
 assert.equal(bishopKnightStagePosition(r1Start)?.stage,1);
});

test('mate retains priority over r1 even for reachable mating-net edges',()=>{
 const source='8/8/8/8/1B6/8/2K5/k1N5 w - - 0 1';
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen(source,t),board=getChess(f);
  assert.equal(bishopKnightStageMoves(f).stage,1);
  const selected=getIdealKnightAndBishopWhiteMoves(f);
  assert.equal(selected.length,1);
  const scores=bishopKnightRuleSet.scoreWhiteCandidates!(f,board.moves());
  assert.equal(explainMove(scores,bishopKnightRuleSet.whiteRules,selected[0])?.id,'mate');
  board.move(selected[0]!);assert.ok(board.isCheckmate());
 }
});

test('approved r1 bishop shortcut selects Bc4 in every orientation',()=>{
 const source='8/8/8/8/5N2/1B3K2/7k/8 w - - 26 14';
 const destination=getChess(source);destination.move('Bc4');
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen(source,t),selected=getIdealKnightAndBishopWhiteMoves(f);
  assert.equal(selected.length,1);
  const b=getChess(f);b.move(selected[0]!);
  assert.equal(bishopKnightPositionKey(b.fen()),bishopKnightPositionKey(transformFen(destination.fen(),t)));
  const scores=bishopKnightRuleSet.scoreWhiteCandidates!(f,getChess(f).moves());
  assert.equal(explainMove(scores,bishopKnightRuleSet.whiteRules,selected[0])?.id,'r1');
  assert.equal(bishopKnightStagePosition(f)?.remaining,9);
  for(const reply of b.moves({verbose:true}))assert.equal(bishopKnightStageMoves(reply.after).stage,1);
 }
});

test('arbitrary source positions enter the r1 graph as r2 via every piece type',()=>{
 const entered=new Set<string>();let checked=0;
 for(const [,phase,,destinations] of data.sources){
  if(phase!==1)continue;
  for(const destination of destinations as string[]){
   const target=boardForKey(destination);const targetKey=bishopKnightPositionKey(target.fen());
   // Reverse a legal White piece move, then verify its forward arrival independently.
   for(const backward of target.moves({verbose:true})){
    if(backward.captured)continue;
    const before=backward.after.replace(' b ',' w '),board=getChess(before);
    if(board.isCheck()||board.isAttacked(destination.slice(6,8) as Parameters<typeof board.get>[0],'w'))continue;
    if(bishopKnightStagePosition(before)?.stage===1)continue;
    const forward=board.moves({verbose:true}).find(m=>m.from===backward.to&&m.to===backward.from);
    if(!forward||bishopKnightPositionKey(forward.after)!==targetKey)continue;
    const choice=bishopKnightStageMoves(before);assert.equal(choice.stage,2);
    if(!choice.moves.includes(forward.from+forward.to))continue;
    const selected=getIdealKnightAndBishopWhiteMoves(before);assert.ok(selected.length);
    const scores=bishopKnightRuleSet.scoreWhiteCandidates!(before,getChess(before).moves());
    for(const san of selected){const b=getChess(before);b.move(san);assert.equal(explainMove(scores,bishopKnightRuleSet.whiteRules,san)?.id,b.isCheckmate()?'mate':'r2');}
    entered.add(forward.piece);checked++;if(entered.size===3)break;
   }
   if(entered.size===3)break;
  }
  if(entered.size===3)break;
 }
 assert.deepEqual([...entered].sort(),['b','k','n']);assert.ok(checked>=3);
});

test('outside Nd4 entry stays r2, while the same destination belongs to an r1 edge from inside the net',()=>{
 const outside='8/8/2N5/8/k7/2K5/8/1B6 w - - 2 2';
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen(outside,t),b=getChess(f),stage=bishopKnightStageMoves(f);
  assert.equal(stage.stage,2);assert.equal(bishopKnightStagePosition(f)?.stage,2);
  const selected=getIdealKnightAndBishopWhiteMoves(f);assert.equal(selected.length,1);
  const scores=bishopKnightRuleSet.scoreWhiteCandidates!(f,b.moves());
  assert.equal(explainMove(scores,bishopKnightRuleSet.whiteRules,selected[0])?.id,'r2');
  b.move(selected[0]!);for(const reply of b.moves({verbose:true}))assert.equal(bishopKnightStageMoves(reply.after).stage,1);
 }
});

test('stage matching ignores clocks but rejects Black turns and extra material',()=>{
 for(const transform of SQUARE_TRANSFORMS){
  const source=transformFen(r1Start,transform),expected=bishopKnightStageMoves(source);
  assert.deepEqual(bishopKnightStageMoves(source.replace(/\d+ \d+$/,'99 100')),expected);
  assert.deepEqual(bishopKnightStageMoves(source.replace(' w ',' b ')),{stage:0,moves:[]});
 }
 const board=getChess(r1Start);board.put({type:'r',color:'w'},'h8');
 assert.equal(bishopKnightPositionKey(board.fen()),undefined);
 assert.deepEqual(bishopKnightStageMoves(board.fen()),{stage:0,moves:[]});
});




test('every optimal bridge edge decreases the exact minimax entry distance and freezes r1',()=>{
 assert.equal(bridgeData.r1Fingerprint,createHash('sha256').update(JSON.stringify(data.r1Edges)).digest('hex'));
 const ranks=new Map(bridgeData.rows.map(row=>[row.key,row.bridge]));
 for(const row of bridgeData.rows){
  const source=fen(row.key),stage=bishopKnightStageMoves(source),b=getChess(source);
  assert.equal(stage.stage,2);
  for(const uci of stage.moves){
  const move=b.moves({verbose:true}).find(m=>m.from+m.to===uci);
  assert.ok(move);b.move(move.san);
  const replies=b.moves({verbose:true});assert.ok(replies.length);
  const costs=replies.map(r=>{
   assert.ok(!r.captured);
   if(bishopKnightStageMoves(r.after).stage===1)return 0;
   const rank=ranks.get(canonical(code(r.after)));assert.notEqual(rank,undefined);
   assert.ok(rank!<row.bridge);return rank!;
  });
  assert.equal(row.bridge,1+Math.max(...costs));b.undo();
  }
 }
});
