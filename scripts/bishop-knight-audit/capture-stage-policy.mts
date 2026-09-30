/** One-time migration input: run against checkpoint 3a82ee1, before removing r3. */
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {getChess} from '../../app/src/mate/chess';
import {getIdealKnightAndBishopWhiteMoves as preferred,knightAndBishopWhiteRules} from '../../app/src/mate/rules/bishopKnight';
import {r1Start} from '../../app/src/mate/rules/bishopKnightMatingNetLine';
import {canonical, code, fen} from './encoding.mts';

assert.ok(knightAndBishopWhiteRules.some(rule=>rule.id==='r3'), 'Capture must run against the pre-migration checkpoint; do not overwrite the seed with the new policy.');
const starts:string[]=[];
for(const base of ['8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1','8/8/8/3BN3/3K4/8/8/6k1 w - - 0 1']) {
  for(let file=0;file<8;file++)for(let rank=0;rank<8;rank++) {
    const board=getChess(base);board.remove('g1');
    const square=`${'abcdefgh'[file]}${rank+1}` as Parameters<typeof board.get>[0];
    if(board.get(square))continue;
    board.put({color:'b',type:'k'},square);
    if(!board.isCheck()&&!board.isAttacked(square,'w'))starts.push(board.fen());
  }
}
const nodes=new Map<number,number[]>();
function visit(start:string) {
 const key=canonical(code(start));if(nodes.has(key))return;
 const source=fen(key),choices=preferred(source);assert.ok(choices.length,source);
 const destinations:number[]=[];nodes.set(key,destinations);
 assert.ok(nodes.size<10000,'Unbounded migration graph');
 for(const san of choices) {
  const board=getChess(source);board.move(san);destinations.push(code(board.fen()));
  if(board.isCheckmate())continue;
  const replies=board.moves({verbose:true});assert.ok(replies.length,`Stalemate: ${source} ${san}`);
  for(const reply of replies){assert.ok(!reply.captured,`Capture: ${source} ${san} ${reply.san}`);visit(reply.after);}
 }
}
visit(r1Start);const r1Sources=[...nodes.keys()];
for(const start of starts)visit(start);
const out={checkpoint:'3a82ee1',r1Start,r2Starts:starts,r1Sources,nodes:[...nodes].sort((a,b)=>a[0]-b[0])};
writeFileSync('scripts/bishop-knight-audit/data/stage-policy-seed.json',JSON.stringify(out,null,2)+'\n');
console.log({starts:starts.length,r1:r1Sources.length,total:nodes.size});
