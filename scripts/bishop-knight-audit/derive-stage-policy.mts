import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {getChess} from '../../app/src/mate/chess';
import {canonical, code, fen, square, unpack, transform} from './encoding.mts';

const seed=JSON.parse(readFileSync(new URL('./data/stage-policy-seed.json',import.meta.url),'utf8')) as {
 checkpoint:string;r1Start:string;r2Starts:string[];r1Sources:number[];nodes:[number,number[]][];
};
const sources=new Map(seed.nodes),r1=new Set(seed.r1Sources),visiting=new Set<number>();
// Keep the migration snapshot immutable; apply only explicitly reviewed changes.
const improvements=JSON.parse(readFileSync(new URL('./data/stage-route-improvements.json',import.meta.url),'utf8')) as {
 source:string;destination:string;reason:string;
}[];
for(const improvement of improvements){
 const source=code(improvement.source),destination=code(improvement.destination),key=canonical(source);
 assert.ok(sources.has(key),`Unknown improvement source: ${improvement.source}`);
 assert.ok(!r1.has(key),'An r2 improvement must not replace a closed r1 route');
 const orientation=Array.from({length:8},(_,i)=>i).find(i=>transform(source,i)===key)!;
 sources.set(key,[transform(destination,orientation)]);
}
const bounds=new Map<number,number>(),arrivals=new Map<number,number>();
const key=(n:number)=>unpack(n).map(square).join('');
function remaining(source:number):number {
 const cached=bounds.get(source);if(cached!==undefined)return cached;
 assert.ok(!visiting.has(source),`Cycle: ${fen(source)}`);visiting.add(source);
 const choices=sources.get(source);assert.ok(choices?.length,`Missing source: ${fen(source)}`);
 const legal=getChess(fen(source)).moves({verbose:true});
 for(const arrival of choices)assert.ok(legal.some(move=>code(move.after)===arrival),`Illegal stored destination: ${fen(source)} -> ${fen(arrival,'b')}`);
 let worst=0;
 for(const arrival of choices){
  const board=getChess(fen(arrival,'b'));let next=0;
  if(!board.isCheckmate()){
   const replies=board.moves({verbose:true});assert.ok(replies.length,`Stalemate: ${board.fen()}`);
   for(const reply of replies){assert.ok(!reply.captured,`Capture: ${board.fen()}`);
    const child=canonical(code(reply.after));
    if(r1.has(source))assert.ok(r1.has(child),'r1 is not closed');
    next=Math.max(next,1+remaining(child));
   }
  }
  const a=canonical(arrival);assert.ok(!arrivals.has(a)||arrivals.get(a)===next,'Inconsistent bound');arrivals.set(a,next);
  worst=Math.max(worst,1+next);
 }
 visiting.delete(source);bounds.set(source,worst);return worst;
}
for(const [source] of sources)remaining(source);
const mateBeforeR1:number[]=[];
for(const [source,choices] of sources)if(!r1.has(source))for(const a of choices)if(getChess(fen(a,'b')).isCheckmate())mateBeforeR1.push(source);
console.log({r1:r1.size,r2:sources.size-r1.size,maxR1:remaining(canonical(code(seed.r1Start))),maxR2:Math.max(...seed.r2Starts.map(s=>remaining(canonical(code(s))))),mateBeforeR1:mateBeforeR1.map(source=>fen(source))});
const output={
 r1Start:seed.r1Start,r2Starts:seed.r2Starts,
 // One source frame per D4 orbit; keep destinations in that same frame.
 sources:[...sources].map(([s,d])=>[key(s),r1.has(s)?1:2,bounds.get(s),d.map(key)]),
 arrivals:[...arrivals].sort((a,b)=>a[0]-b[0]).map(([a,b])=>[key(a),b]),
};
const path=new URL('../../app/src/mate/rules/bishopKnightStageData.json',import.meta.url);
const rendered=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8'),rendered,'Regenerate stage data');else writeFileSync(path,rendered);
