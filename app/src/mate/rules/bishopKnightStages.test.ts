import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen} from '../chess';
import {bishopKnightRuleSet,getIdealKnightAndBishopWhiteMoves,scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {bishopKnightStageMoves,bishopKnightStagePosition,bishopKnightPositionKey,r1Start} from './bishopKnightStages';
import {verifyStages} from '../../../../scripts/bishop-knight-audit/verify-stages.mts';
import {explainMove} from './selection';
import data from './bishopKnightStageData.json';

function boardForKey(key:string){const board=getChess();board.clear();for(let i=0;i<4;i++)board.put({type:(['k','b','n','k'] as const)[i]!,color:i===3?'b':'w'},key.slice(i*2,i*2+2) as Parameters<typeof board.get>[0]);return board;}

test('every r1/r2 continuation terminates, including all Black replies, White ties and D4 orientations',()=>{
 const result=verifyStages();assert.equal(result.r2Starts,82);assert.equal(result.loops,0);assert.equal(result.draws,0);
 assert.equal(result.symmetryChecks,result.whitePositionClasses*8);assert.equal(result.r1MaxPlies,41);assert.ok(result.r2MaxPlies<=105);
});

test('r3 is absent and the new r1 start is used in the guide',()=>{
 assert.ok(!bishopKnightRuleSet.whiteRules.some(rule=>rule.id==='r3'));
 const note=bishopKnightRuleSet.help.noteBoards.find(board=>board.id==='bishop-knight-rule-r1-net')!;
 assert.ok(note.pieces.some(p=>p.piece==='k'&&p.square==='c1'));
 assert.equal(bishopKnightStageMoves(r1Start).stage,1);
 assert.equal(bishopKnightStagePosition(r1Start)?.stage,1);
});

test('arbitrary source positions can enter r1 by a full destination via every piece type',()=>{
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
    if(bishopKnightStagePosition(before))continue;
    const forward=board.moves({verbose:true}).find(m=>m.from===backward.to&&m.to===backward.from);
    if(!forward||bishopKnightPositionKey(forward.after)!==targetKey)continue;
    const choice=bishopKnightStageMoves(before);assert.equal(choice.stage,1);
    if(!choice.moves.includes(forward.from+forward.to))continue;
    const selected=getIdealKnightAndBishopWhiteMoves(before);assert.ok(selected.length);
    const scores=bishopKnightRuleSet.scoreWhiteCandidates!(before,getChess(before).moves());
    for(const san of selected){const b=getChess(before);b.move(san);assert.equal(explainMove(scores,bishopKnightRuleSet.whiteRules,san)?.id,b.isCheckmate()?'mate':'r1');}
    entered.add(forward.piece);checked++;if(entered.size===3)break;
   }
   if(entered.size===3)break;
  }
  if(entered.size===3)break;
 }
 assert.deepEqual([...entered].sort(),['b','k','n']);assert.ok(checked>=3);
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

test('r3 is not secretly retained as a global proximity preference',()=>{
 const score=scoreKnightAndBishopWhiteMove('8/8/3k4/8/8/8/3K4/N6B w - - 0 1','Kd3');
 assert.equal(score.stage,0);
 assert.ok(!bishopKnightRuleSet.whiteRules.some(rule=>rule.id==='r3'));
});
