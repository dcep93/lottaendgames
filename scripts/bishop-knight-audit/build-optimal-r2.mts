/** Exact shortest worst-case bridge to the frozen r1 net. Runtime graph is a subset of the full solved domain. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {getChess} from '../../app/src/mate/chess';
import data from './data/optimal-r2-baseline.json';
import {canonical,code,fen,pack,sqIndex,transform,unpack} from './encoding.mts';
process.chdir(fileURLToPath(new URL('../../',import.meta.url)));
const base='.audit/optimal-r2';mkdirSync('.audit',{recursive:true});
const fromKey=(s:string)=>pack(...s.match(/../g)!.map(sqIndex) as [number,number,number,number]);
const net=new Map((data.r1Edges as [string,string[]][]).map(([s,d])=>[fromKey(s),d.map(fromKey)]));
const goals=[...net.keys()].flatMap(k=>Array.from({length:8},(_,t)=>transform(k,t)));
const hash=createHash('sha256').update(readFileSync('scripts/bishop-knight-audit/optimal-r2.cpp')).update(JSON.stringify(goals)).digest('hex');
if(!existsSync(base+'.fingerprint')||readFileSync(base+'.fingerprint','utf8')!==hash){
 writeFileSync(base+'-targets.txt',goals.join('\n')+'\n');
 execFileSync('clang++',['-O3','-std=c++17','scripts/bishop-knight-audit/optimal-r2.cpp','-o',base],{stdio:'inherit'});
 execFileSync(base,[base+'-targets.txt',base],{stdio:'inherit'});writeFileSync(base+'.fingerprint',hash);
}
const dw=readFileSync(base+'.white.bin'),db=readFileSync(base+'.black.bin');
const counts=JSON.parse(readFileSync(base+'.json','utf8'));
assert.deepEqual(JSON.parse(readFileSync('app/src/mate/rules/bishopKnightStageData.json','utf8')).r1Edges,data.r1Edges,'r1 changed: freeze new targets before rebuilding the bridge');
const old=new Map((data.sources as [string,number,number,string[]][]).map(([s,,cost,d])=>[fromKey(s),{cost,d:d.map(fromKey)}]));
const seeds=new Set([...old.keys(),...data.r2Starts.map(f=>canonical(code(f)))]);
// Preserve and optimize every historical implicit destination-based r2 entrance,
// not just the stored sources. Reverse all legal White moves from each arrival.
let directMateOnlyEntries=0;
for(const [placement] of data.arrivals){
 const post=fromKey(placement as string);
 for(const backward of getChess(fen(post)).moves({verbose:true})){
  if(backward.captured)continue;
  const k=canonical(code(backward.after)),before=getChess(fen(k,'b'));
  if(before.isCheck())continue; // Black cannot already be in check on White's turn.
  if(dw[k]===255){
   assert.ok(getChess(fen(k)).moves({verbose:true}).some(m=>getChess(m.after).isCheckmate()),`Uncovered existing entry ${fen(k)}`);
   directMateOnlyEntries++;continue;
  }
  seeds.add(k);
 }
}
const selected=new Map<number,number[]>(),bridge=new Map<number,number>();
function expand(k:number){k=canonical(k);if(selected.has(k))return;
 const legal=getChess(fen(k)).moves({verbose:true});
 if(net.has(k)){selected.set(k,net.get(k)!);bridge.set(k,0);}
 else{
  assert.ok(dw[k]!<255,`Cannot force r1 entry: ${fen(k)}`);
  const optimal=legal.filter(m=>db[code(m.after)]!<255&&1+db[code(m.after)]! ===dw[k]);
  assert.ok(optimal.length,`Missing optimal move ${fen(k)}`);
  optimal.sort((a,b)=>Number(!old.get(k)?.d.includes(code(a.after)))-Number(!old.get(k)?.d.includes(code(b.after)))||(a.from+a.to).localeCompare(b.from+b.to));
  const post=code(optimal[0]!.after);
  // Symmetries fixing the source must preserve the entire set of selected edges.
  const choices=new Set<number>();for(let t=0;t<8;t++)if(transform(k,t)===k)choices.add(transform(post,t));
  selected.set(k,[...choices].sort((a,b)=>a-b));bridge.set(k,dw[k]!);
 }
 for(const post of selected.get(k)!){
  const move=legal.find(m=>code(m.after)===post);assert.ok(move,`Illegal ${fen(k)}`);
  const board=getChess(move.after);
  if(board.isCheckmate()){assert.ok(net.has(k),'Bridge reached mate before its r1 goal');continue;}
  const replies=board.moves({verbose:true});assert.ok(replies.length,'Stalemate');
  let worst=0;
  for(const r of replies){assert.ok(!r.captured,'Piece capture');const child=canonical(code(r.after));
   if(net.has(k))assert.ok(net.has(child),'Frozen r1 is not closed');
   else {assert.ok(dw[child]!<dw[k]!,`Rank failed ${fen(k)} ${r.san}`);worst=Math.max(worst,dw[child]!);}
   expand(child);
  }
  if(!net.has(k))assert.equal(1+worst,dw[k]);
 }
}
for(const k of seeds)expand(k);
const mate=new Map<number,number>(),active=new Set<number>();
function remaining(k:number):number{
 k=canonical(k);if(mate.has(k))return mate.get(k)!;assert.ok(!active.has(k),'Cycle');active.add(k);
 const cost=Math.max(...selected.get(k)!.map(post=>{
  const b=getChess(fen(post,'b'));return b.isCheckmate()?1:2+Math.max(...b.moves({verbose:true}).map(r=>remaining(code(r.after))));
 }));
 active.delete(k);mate.set(k,cost);return cost;
}
for(const k of selected.keys())remaining(k);
// Independent chess.js checks over the full-board cache, with deterministic random samples.
let random=938172,verified=0;
for(let i=0;i<16000;i++){
 random=(Math.imul(random,1664525)+1013904223)>>>0;const k=random&0xffffff;const [w,b,n,bk]=unpack(k);
 if(new Set([w,b,n,bk]).size!==4||Math.max(Math.abs(w!%8-bk!%8),Math.abs((w!>>3)-(bk!>>3)))<=1)continue;
 const black=getChess(fen(k,'b')),replies=black.moves({verbose:true});const worst=replies.length?Math.max(...replies.map(r=>r.captured?255:dw[code(r.after)]!)):255;assert.equal(db[k],worst,`Black legality mismatch ${black.fen()}`);
 if(!black.isCheck()){const white=getChess(fen(k));const best=net.has(canonical(k))?0:Math.min(255,...white.moves({verbose:true}).map(m=>db[code(m.after)]! ===255?255:db[code(m.after)]!+1));assert.equal(dw[k],best,`White legality mismatch ${white.fen()}`);}verified++;
}
// Compare theoretical domain: unreachable-to-net positions are distinct from drawn chess positions.
let winningWithoutNet=0;const domainPath='.audit/all-legal-r41-closure/domain.bin';
if(existsSync(domainPath)){const domain=readFileSync(domainPath);for(let i=0;i<domain.length;i+=8){const k=domain.readUInt32LE(i);if(domain[i+5]===2&&dw[k]===255){winningWithoutNet+=domain[i+4]!;assert.ok(getChess(fen(k)).moves({verbose:true}).some(m=>getChess(m.after).isCheckmate()),'Winning position without a net route or immediate mate');}}}
const rows=[...selected].filter(([k])=>!net.has(k)).sort((a,b)=>a[0]-b[0]).map(([key,posts])=>{
 const legal=getChess(fen(key)).moves({verbose:true});
 const moves=posts.map(post=>{const m=legal.find(m=>code(m.after)===post)!;return sqIndex(m.from)*64+sqIndex(m.to);});
 return {key,moves,bridge:bridge.get(key)!,mate:mate.get(key)!};
});
const roots=data.r2Starts.map(f=>({fen:f,bridge:dw[code(f)],mateMoves:Math.ceil(remaining(code(f))/2),previousMateMoves:Math.ceil(old.get(canonical(code(f)))!.cost/2)}));
const output={r1Fingerprint:createHash('sha256').update(JSON.stringify(data.r1Edges)).digest('hex'),rows};
const out='app/src/mate/rules/bishopKnightOptimalBridgeData.json';const text=JSON.stringify(output)+'\n';
if(process.argv.includes('--check'))assert.equal(readFileSync(out,'utf8'),text);else writeFileSync(out,text);
const report={...counts,nativeFingerprint:hash,r1Fingerprint:output.r1Fingerprint,independentChessJsPositions:verified,winningWithoutNet,lookupPositions:rows.length,entrySeeds:seeds.size,directMateOnlyEntries,r1Positions:net.size,roots,bridgeMax:Math.max(...roots.map(r=>r.bridge!)),mateMax:Math.max(...roots.map(r=>r.mateMoves)),previousMateMax:Math.max(...roots.map(r=>r.previousMateMoves))};
writeFileSync(base+'-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,roots:undefined},null,2));
