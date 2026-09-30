import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {getChess} from '../../app/src/mate/chess';
import {canonical, code, fen, square, unpack, transform} from './encoding.mts';

const seed=JSON.parse(readFileSync(new URL('./data/stage-policy-seed.json',import.meta.url),'utf8')) as {
 checkpoint:string;r1Start:string;r2Starts:string[];r1Sources:number[];nodes:[number,number[]][];
};
const sources=new Map(seed.nodes),netPriority=new Set(seed.r1Sources),visiting=new Set<number>();
// Keep the migration snapshot immutable; apply only explicitly reviewed changes.
const improvements=JSON.parse(readFileSync(new URL('./data/stage-route-improvements.json',import.meta.url),'utf8')) as {
 source:string;destination:string;reason:string;
 entries?: {source:string;priority:1|2;destinations:string[]}[];
}[];
for(const improvement of improvements){
 // Materialize existing destination-based entrances without changing their choices.
 for(const entry of improvement.entries??[]){
  const raw=code(entry.source),key=canonical(raw);
  const orientation=Array.from({length:8},(_,i)=>i).find(i=>transform(raw,i)===key)!;
  const destinations=entry.destinations.map(d=>transform(code(d),orientation));
  assert.ok(!sources.has(key),`Duplicate recorded entrance: ${entry.source}`);
  assert.ok(destinations.length,`Empty entrance: ${entry.source}`);
  sources.set(key,destinations);if(entry.priority===1)netPriority.add(key);
 }

 const source=code(improvement.source),destination=code(improvement.destination),key=canonical(source);
 assert.ok(sources.has(key),`Unknown improvement source: ${improvement.source}`);
 assert.ok(!seed.r1Sources.includes(key),'An r2 improvement must not replace a closed r1 route');
 const orientation=Array.from({length:8},(_,i)=>i).find(i=>transform(source,i)===key)!;
 sources.set(key,[transform(destination,orientation)]);
}
// Reviewed r1 changes are separate from r2 optimizations. Keep the seed immutable.
const r1Improvements=JSON.parse(readFileSync(new URL('./data/r1-route-improvements.json',import.meta.url),'utf8')) as {
 source:string;destination:string;reason:string;
}[];
const changedR1=new Set<number>();
for(const improvement of r1Improvements){
 const source=code(improvement.source),key=canonical(source);
 assert.ok(seed.r1Sources.includes(key),'An r1 improvement must start inside the original net');
 assert.ok(!changedR1.has(key),`Duplicate r1 improvement: ${improvement.source}`);
 changedR1.add(key);
 const orientation=Array.from({length:8},(_,i)=>i).find(i=>transform(source,i)===key)!;
 sources.set(key,[transform(code(improvement.destination),orientation)]);
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
    if(seed.r1Sources.includes(source))assert.ok(seed.r1Sources.includes(child),'r1 is not closed');
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
for(const [source,choices] of sources)if(!seed.r1Sources.includes(source))for(const a of choices)if(getChess(fen(a,'b')).isCheckmate())mateBeforeR1.push(source);
console.log({r1:seed.r1Sources.length,r2:sources.size-seed.r1Sources.length,maxR1:remaining(canonical(code(seed.r1Start))),maxR2:Math.max(...seed.r2Starts.map(s=>remaining(canonical(code(s))))),mateBeforeR1:mateBeforeR1.map(source=>fen(source))});
const output={
 r1Start:seed.r1Start,r2Starts:seed.r2Starts,
 // Attribution is source-and-destination reachability, not destination preference.
 r1Edges:reachableNetEdges(),
 // One source frame per D4 orbit. Column 2 is selection priority, not rule attribution.
 sources:[...sources].map(([s,d])=>[key(s),netPriority.has(s)?1:2,bounds.get(s),d.map(key)]),
 arrivals:[...arrivals].sort((a,b)=>a[0]-b[0]).map(([a,b])=>[key(a),b]),
};
function reachableNetEdges(){
 const reached=new Set<number>();
 function visit(source:number){
  if(reached.has(source))return;reached.add(source);
  assert.ok(seed.r1Sources.includes(source),`r1 escaped its original graph: ${fen(source)}`);
  for(const destination of sources.get(source)!){
   const board=getChess(fen(destination,'b'));
   if(!board.isCheckmate())for(const reply of board.moves({verbose:true}))visit(canonical(code(reply.after)));
  }
 }
 visit(canonical(code(seed.r1Start)));
 // A shortcut can bypass old net positions. Their routes remain available as r2,
 // but only edges still reachable from the declared start receive r1 eligibility.
 return [...reached].map(source=>[key(source),sources.get(source)!.map(key)]);
}
const path=new URL('../../app/src/mate/rules/bishopKnightStageData.json',import.meta.url);
const rendered=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8'),rendered,'Regenerate stage data');else writeFileSync(path,rendered);
