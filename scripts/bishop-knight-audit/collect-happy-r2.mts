import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {getChess} from '../../app/src/mate/chess';
import {sevenCageDeclaredDestinationMoves as allDeclaredMoves} from '../../app/src/mate/rules/bishopKnightSevenCage';
import {sevenCageHeuristicMoves as sevenCageMoves} from '../../app/src/mate/rules/bishopKnightSevenCage';
import {matingNetMoves} from '../../app/src/mate/rules/bishopKnightMatingNet';
import {getIdealKnightAndBishopWhiteMoves as preferred} from '../../app/src/mate/rules/bishopKnight';
import {code,fen,canonical} from './encoding.mts';
import {fullySatisfiesR4} from './loop-exclusions.mts';
// Collect -> derive-happy-r2.mts -> verify-happy-r2.mts. Unknown frontiers never count as wins.
const output=process.argv[2];
if(!output)throw new Error('Supply the output candidate-graph JSON path');
const limit=Number(process.argv[3]??20000);
assert.ok(Number.isInteger(limit)&&limit>0);
const starts:string[]=[];
for(const base of ['8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1','8/8/8/3BN3/3K4/8/8/6k1 w - - 0 1']) {
 for(let f=0;f<8;f++)for(let r=0;r<8;r++){
  if(Math.abs(f-r)<3)continue;
  const b=getChess(base);b.remove('g1');const sq=('abcdefgh'[f]+(r+1)) as any;
  if(b.get(sq))continue;b.put({type:'k',color:'b'},sq);
  if(b.isAttacked(sq,'w')||b.isCheck())continue;assert.ok(fullySatisfiesR4(b.fen()));starts.push(b.fen());
 }
}
const nodes:number[]=[],ids=new Map<number,number>();
function add(key:number){key=canonical(key);if(!ids.has(key)){ids.set(key,nodes.length);nodes.push(key);}return ids.get(key)!;}
starts.forEach(s=>add(code(s)));
type Move={san:string,uci:string,next:number[],mate:boolean,kind:string};
const graph:Move[][]=[];const r1Nodes=new Set<number>();
for(let i=0;i<nodes.length && i<limit;i++) {
 const b=getChess(fen(nodes[i]));const legal=b.moves({verbose:true});
 const mate=legal.filter(m=>m.san.endsWith('#'));
 const net=matingNetMoves(b.fen());if(net.length)r1Nodes.add(i);
 // Keep the current r1 policy, including its accepted r3 tie-breaks. For r2,
 // consider every declared destination instead of its hand-assigned priority.
 const declared=allDeclaredMoves(b.fen()),existing=sevenCageMoves(b.fen());
 const safeR2 = existing.some(u=>{const m=legal.find(m=>m.from+m.to===u);if(!m)return false;b.move(m);const r=b.moves({verbose:true});const safe=r.length>0&&!r.some(m=>m.captured);b.undo();return safe;});
 // Heuristic r2 choices are already candidates. Consult the current lower-rule
 // policy only when no safe heuristic move exists; r1 always stays fixed.
 const current=net.length||!safeR2 ? preferred(b.fen()).map(s=>{const m=getChess(b.fen()).move(s);return m.from+m.to;}) : [];
 const candidates=new Set(net.length?current:[...declared,...existing,...current]);
 const moves=mate.length?mate:legal.filter(m=>candidates.has(m.from+m.to));const row:Move[]=[];
 for(const m of moves){b.move(m);const replies=b.moves({verbose:true});
  if(!m.san.endsWith('#')&&(!replies.length||replies.some(r=>r.captured))){b.undo();continue;}
  const next:number[]=[];for(const r of replies){b.move(r);next.push(add(code(b.fen())));b.undo();}b.undo();
  row.push({san:m.san,uci:m.from+m.to,next,mate:m.san.endsWith('#'),kind:net.length?'r1':declared.includes(m.from+m.to)||existing.includes(m.from+m.to)?'r2':'other'});
 }
 graph.push(row);if(i&&i%500===0)console.log({expanded:i,queued:nodes.length});
}
writeFileSync(output,JSON.stringify({nodes,graph,starts,r1Nodes:[...r1Nodes]}));
console.log({nodes:nodes.length,expanded:graph.length,complete:graph.length===nodes.length});
