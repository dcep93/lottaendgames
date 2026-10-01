/** Audit the composed r3 -> r2 -> r1 policy with cached per-position distances. */
import './load-setup.mts';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {verifyStages} from './verify-stages.mts';
import {fen,code} from './encoding.mts';
import {getChess} from '../../app/src/mate/chess';
import {bishopKnightStageMoves} from '../../app/src/mate/rules/bishopKnightStages';
import {bishopKnightSetupMoves} from '../../app/src/mate/rules/bishopKnightSetup';
import {getIdealKnightAndBishopWhiteMoves as preferred} from '../../app/src/mate/rules/bishopKnight';
import data from '../../app/src/mate/rules/bishopKnightSetupData.json';
process.chdir(fileURLToPath(new URL('../../',import.meta.url)));mkdirSync('.audit',{recursive:true});
const prefix='.audit/all-start-r3',seeds:string[]=[];
assert.ok(existsSync('.audit/r3-setup.fingerprint'), 'Run build-setup.mts --check before this audit.');
assert.equal(readFileSync('.audit/r3-setup.fingerprint','utf8'),data.sourceHash,'Setup rank cache is stale; run build-setup.mts --check.');
const fingerprint=createHash('sha256');
for(const file of readdirSync('app/src/mate/rules').filter(f=>/\.(ts|json)$/.test(f)&&!f.includes('.test.')).sort())fingerprint.update(file).update(readFileSync('app/src/mate/rules/'+file));
for(const file of ['app/src/mate/chess.ts','scripts/bishop-knight-audit/verify-stages.mts','scripts/bishop-knight-audit/load-setup.mts'])fingerprint.update(readFileSync(file));
const stageHash=fingerprint.digest('hex'),cacheFile=prefix+'.stages.json';
const cached=existsSync(cacheFile)?JSON.parse(readFileSync(cacheFile,'utf8')):undefined;
let stages;
if(cached?.stageHash===stageHash){
 stages=cached.stages;seeds.push(...cached.seeds);console.log('Reusing certified r1/r2 distances for identical policy sources.');
}else{
 console.log('Certifying unchanged r1/r2 with the loaded r3 table…');
 stages=verifyStages(true,(key,plies)=>seeds.push(`${key} ${plies}`));
 writeFileSync(cacheFile,JSON.stringify({stageHash,stages,seeds}));
}
writeFileSync(prefix+'.seeds',seeds.join('\n')+'\n');console.log(stages);
execFileSync('clang++',['-O3','-std=c++17','scripts/bishop-knight-audit/audit-setup.cpp','-o',prefix],{stdio:'inherit'});
execFileSync(prefix,['.audit/r3-setup.white.bin','app/public'+data.url,prefix+'.seeds',prefix+'.json'],{stdio:'inherit'});
const results=JSON.parse(readFileSync(prefix+'.json','utf8'));
const w=readFileSync(prefix+'.json.white.i16'),b=readFileSync(prefix+'.json.black.i16');
let tablebaseClassesChecked=0;
const domainPath=process.env.AUDIT_DOMAIN ?? '.audit/all-legal-optimal-r2/domain.bin';
if(existsSync(domainPath)){
 const domain=readFileSync(domainPath);
 for(let offset=0;offset<domain.length;offset+=8){
  const key=domain.readUInt32LE(offset);
  for(const [turn,values] of [[5,w],[6,b]] as const){
   const outcome=domain[offset+turn]!;if(!outcome)continue;
   const d=values.readInt16LE(key*2);assert.ok(d>=0);
   assert.equal(d<10000,outcome===2,`Tablebase disagreement: ${key}, turn ${turn}`);tablebaseClassesChecked++;
  }
 }
}
const distance=(source:string)=>{const f=source.split(' ');return (f[1]==='w'?w:b).readInt16LE(2*code(source));};
// Independent chess.js checks of native legality, app selection, stage priority and recurrence.
let checked=0;
function check(source:string){
 const d=distance(source);if(d<0||d>=10000||source.split(' ')[1]!=='w')return;
 const moves=preferred(source);assert.ok(moves.length);let maximum=0;
 for(const san of moves){const board=getChess(source);board.move(san);const value=board.isCheckmate()?1:1+distance(board.fen());maximum=Math.max(maximum,value);
  if(!board.isCheckmate()&&bishopKnightStageMoves(source).stage===0)assert.ok(bishopKnightSetupMoves(source)?.moves.includes(board.history({verbose:true})[0]!.from+board.history({verbose:true})[0]!.to));
  for(const reply of board.moves({verbose:true})){assert.ok(!reply.captured);assert.ok(distance(reply.after)<d);}
 }
 assert.equal(maximum,d,source);checked++;
}
let random=0x129831;for(let i=0;i<2048;i++){random=(Math.imul(random,1664525)+1013904223)>>>0;const key=random&0xffffff;if(w.readInt16LE(key*2)>=0)check(fen(key));}
function witness(key:number,turn='w'){
 const start=fen(key,turn),board=getChess(start),moves:string[]=[],phases={mate:0,r1:0,r2:0,r3:0};
 while(!board.isCheckmate()){
  assert.ok(moves.length<100);const source=board.fen(),d=distance(source);
  const candidates=board.turn()==='w'?preferred(source):board.moves();
  const move=candidates.map(san=>{const ch=getChess(source);ch.move(san);return {san,d:ch.isCheckmate()?0:distance(ch.fen())};}).sort((a,b)=>b.d-a.d||a.san.localeCompare(b.san))[0]!;
  assert.equal(move.d+1,d);
  if(board.turn()==='w'){check(source);const stage=bishopKnightStageMoves(source).stage;phases[move.d===0?'mate':stage===1?'r1':stage===2?'r2':'r3']++;}
  moves.push(move.san);board.move(move.san);
 }
 return {fen:start,plies:moves.length,whiteMoves:Math.ceil(moves.length/2),phases,moves,url:'http://localhost:5173/mate/bishop-knight#fen='+start.replaceAll(' ','_')+'&moves='+moves.map(encodeURIComponent).join(',')+'&cursor=0'};
}
const lines=[witness(results.worstWhiteKey),witness(results.worstBlackKey,'b')];
const histogram=results.whiteHistogram.map((n:number,i:number)=>n+results.blackHistogram[i]);
const wins=histogram.reduce((a:number,b:number)=>a+b,0);let cumulative=0;
const percentile=(fraction:number)=>{cumulative=0;return histogram.findIndex((n:number)=>{cumulative+=n;return cumulative>=wins*fraction;});};
const report={scope:'Every legal KBN-v-K board and turn; all selected White ties and every legal Black reply; fresh halfmove clock. D4 includes both bishop colors. Counts in White moves.',setupTableSha256:data.sha256,stages,...results,winning:wins,forcedMate: wins,winningWithoutForcedMate:0,over50:histogram.slice(51).reduce((a:number,b:number)=>a+b,0),mean:histogram.reduce((s:number,n:number,i:number)=>s+n*i,0)/wins,median:percentile(.5),p90:percentile(.9),p95:percentile(.95),p99:percentile(.99),appCrossChecks:checked,tablebaseClassesChecked,lines};
const inputHash=createHash('sha256');for(const file of ['scripts/bishop-knight-audit/audit-setup.cpp','scripts/bishop-knight-audit/kbn-geometry.hpp','scripts/bishop-knight-audit/kbn-symmetry.hpp',prefix+'.seeds'])inputHash.update(readFileSync(file));
mkdirSync('docs/audits',{recursive:true});writeFileSync('docs/audits/2026-09-30-all-start-r3.json',JSON.stringify({...report,auditInputSha256:inputHash.digest('hex')},null,2)+'\n');
console.log({winning:wins,maxMoves:lines.map(l=>l.whiteMoves),mean:report.mean,median:report.median,p90:report.p90,over50:report.over50,appCrossChecks:checked});
