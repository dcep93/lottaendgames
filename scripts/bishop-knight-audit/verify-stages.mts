import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../../app/src/mate/chess';
import {bishopKnightRuleSet,getIdealKnightAndBishopWhiteMoves as preferred} from '../../app/src/mate/rules/bishopKnight';
import {bishopKnightStageMoves,bishopKnightStagePosition,r1Start,r2Starts} from '../../app/src/mate/rules/bishopKnightStages';
import {explainMove} from '../../app/src/mate/rules/selection';
import data from '../../app/src/mate/rules/bishopKnightStageData.json';
import bridgeData from '../../app/src/mate/rules/bishopKnightOptimalBridgeData.json';
import baseline from './data/optimal-r2-baseline.json';
import {canonical,code,fen} from './encoding.mts';

export function verifyStages(symmetries=true){
 const nodes:number[]=[],ids=new Map<number,number>(),edges:number[][]=[],phases:number[]=[];
 const add=(source:string)=>{const key=canonical(code(source));if(!ids.has(key)){ids.set(key,nodes.length);nodes.push(key);}return ids.get(key)!;};
 const r1Root=add(r1Start),roots=r2Starts.map(add);
 for (const row of bridgeData.rows) add(fen(row.key));
 // Verify every admitted destination, including ones not reached after a shortcut.
 for(const [key] of baseline.arrivals){
  const s=key as string,board=getChess();board.clear();
  for(let i=0;i<4;i++)board.put({type:(['k','b','n','k'] as const)[i]!,color:i===3?'b':'w'},s.slice(i*2,i*2+2) as Parameters<typeof board.get>[0]);
  const black=getChess(board.fen().replace(' w ',' b '));
  assert.ok(!black.isStalemate(),`Stalemate destination ${s}`);
  for(const reply of black.moves({verbose:true})){assert.ok(!reply.captured,`Unsafe entry ${s}`);add(reply.after);}
 }
 let replies=0,mates=0,checks=0,shortcuts=0;
 for(let i=0;i<nodes.length;i++){
  assert.ok(nodes.length<100000,'Certificate escaped');const source=fen(nodes[i]!),board=getChess(source);
  const stage=bishopKnightStageMoves(source),moves=preferred(source);phases[i]=stage.stage;
  assert.ok(stage.stage>0,`No certified stage: ${source}`);assert.ok(moves.length,source);
  const policy=board.moves({verbose:true}).filter(m=>stage.moves.includes(m.from+m.to)).map(m=>m.san).sort();
  if (!moves.every(san => { const b=getChess(source); b.move(san); return b.isCheckmate(); }))
    assert.ok(moves.every(m=>policy.includes(m)),`Rule selected a nonoptimal stage move: ${source}`);
  const baseline=bishopKnightStagePosition(source)!;if(baseline.stage===2&&stage.stage===1)shortcuts++;
  edges[i]=[];
  for(const t of symmetries?SQUARE_TRANSFORMS:[SQUARE_TRANSFORMS[0]!]){
   const reflected=transformFen(source,t);
   const transformedStage=bishopKnightStageMoves(reflected);
   const actualUci=transformedStage.moves;
   const actual=moves;
   assert.deepEqual([...actualUci].sort(),policy.map(san=>{const m=getChess(source).move(san);return transformSquare(m.from,t)+transformSquare(m.to,t);}).sort(),`D4: ${source}`);
   assert.equal(transformedStage.stage,stage.stage);
   if(t!==SQUARE_TRANSFORMS[0]){checks++;continue;}
   const scores=bishopKnightRuleSet.scoreWhiteCandidates!(reflected,getChess(reflected).moves());
   for(const san of actual){const b=getChess(reflected);b.move(san);const reason=explainMove(scores,bishopKnightRuleSet.whiteRules,san)?.id;
    if(b.isCheckmate())assert.equal(reason,'mate',`Mate attribution ${reflected}`);
    else assert.ok(reason===`r${stage.stage}`||reason==='minors safe'||reason==='no stalemate'||(stage.stage===2&&policy.length>1),`Attribution ${reflected} ${san}: ${reason}`);
   }checks++;
  }
  for(const san of moves){const b=getChess(source);b.move(san);if(b.isCheckmate()){mates++;continue;}
   const legal=b.moves({verbose:true});assert.ok(legal.length,`Stalemate ${source} ${san}`);
   for(const reply of legal){assert.ok(!reply.captured,`Capture ${source} ${san}`);
    const child=add(reply.after),next=bishopKnightStagePosition(reply.after);assert.ok(next,`Uncovered reply ${reply.after}`);
    assert.ok(next.stage < baseline.stage || next.remaining<baseline.remaining,`Nondecreasing route ${source} ${san} ${reply.san}`);
    if(stage.stage===1)assert.equal(next.stage,1,`r1 escaped ${source} ${san}`);
    edges[i]!.push(child);replies++;
   }
  }
 }
 const reachableR1=new Set<number>();
 function traceR1(i:number){if(reachableR1.has(i))return;reachableR1.add(i);assert.equal(phases[i],1,`r1 escaped ${fen(nodes[i]!)}`);edges[i]!.forEach(traceR1);}
 traceR1(r1Root);
 for(let i=0;i<nodes.length;i++)assert.equal(phases[i]===1,reachableR1.has(i),`r1 label outside its reachable graph: ${fen(nodes[i]!)}`);
 assert.equal(reachableR1.size,data.r1Edges.length,'r1 edge index contains unreachable sources');
 const visiting=new Set<number>(),lengths=new Map<number,number>();
 function distance(i:number):number{const cached=lengths.get(i);if(cached!==undefined)return cached;assert.ok(!visiting.has(i),`Cycle ${fen(nodes[i]!)}`);visiting.add(i);let n=1;for(const to of edges[i]!)n=Math.max(n,2+distance(to));visiting.delete(i);lengths.set(i,n);return n;}
 nodes.forEach((_,i)=>distance(i));
 return {complete:true,r1Start,r2Starts:r2Starts.length,whitePositionClasses:nodes.length,blackReplies:replies,symmetryChecks:checks,mateChoices:mates,r1ReachablePositions:reachableR1.size,r1ReachableEdges:data.r1Edges.reduce((n,row)=>n+(row[1] as string[]).length,0),outsideR1Labels:shortcuts,r1MaxPlies:distance(r1Root),r2MaxPlies:Math.max(...roots.map(distance)),loops:0,draws:0,scope:'All stage destinations, all selected White ties, all legal Black replies; r1 eligibility iff reachable from r1 start; higher-priority mate preserved; D4; clocks ignored. Does not establish arbitrary-board r4+ convergence.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const result=verifyStages(!process.argv.includes('--quick'));console.log(result);const out=process.argv.find(a=>a.endsWith('.json'));if(out)writeFileSync(out,JSON.stringify(result,null,2)+'\n');}
