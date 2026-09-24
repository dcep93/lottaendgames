import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {performance} from 'node:perf_hooks';
import {getChess} from '../../app/src/mate/chess.ts';
import {getIdealKnightAndBishopWhiteMoves as preferred} from '../../app/src/mate/rules/bishopKnight.ts';
import {knightAndBishopSupportedDiagonal as support} from '../../app/src/mate/rules/bishopKnightDiagonalSupport.ts';
import {startMembershipSearch,advanceMembershipSearch,type MembershipSearch} from './residual-membership.mts';
import {BASE,canonical,code,fen} from './encoding.mts';

// Run after an exhaustive unsupported-only cohort graph has closed. Unknown
// samples are interleaved, never counted as noncyclic or silently dropped.
const args=process.argv.slice(2);
const arg=(name:string)=>{const i=args.indexOf(name);assert.ok(i>=0&&args[i+1],`Missing ${name}`);return args[i+1]!;};
const dir=resolve(arg('--cohort-dir')),baseline=JSON.parse(readFileSync(arg('--baseline'),'utf8'));
const population=Number(arg('--unsupported-population'));assert.ok(Number.isSafeInteger(population)&&population>0);
const result=JSON.parse(readFileSync(dir+'/result.json','utf8'));
assert.equal(result.blackPolicy,'all-legal');
assert.equal(result.baselineFingerprint,createHash('sha256').update(readFileSync(arg('--baseline'))).digest('hex'),'Baseline mismatch');
const require=createRequire(new URL('../../app/package.json',import.meta.url));
const bundle=await require('esbuild').build({entryPoints:[fileURLToPath(new URL('./worker.mts',import.meta.url))],bundle:true,platform:'node',format:'esm',write:false});
assert.equal(result.policyFingerprint,createHash('sha256').update(bundle.outputFiles[0].contents).digest('hex'),'Policy changed since cohort check');
assert.equal(result.scope,'unsupported-only','A graph that includes supported continuations cannot prove unsupported membership');
const graph=JSON.parse(readFileSync(dir+'/graph.json','utf8')) as {keys:number[];edges:[number,number][][]};
const closed=new Set(graph.keys.map(k=>Math.floor(k/BASE)));
const cyclic=new Set<number>(JSON.parse(readFileSync(dir+'/cyclic-labels.json','utf8')));
const excluded=new Set<number>(baseline.boards.map((b:{key:number})=>b.key));
const eligibleBaseline=[...excluded].filter(k=>support(fen(k,'b')).size===99).length;
const db=new DatabaseSync(arg('--census'),{readOnly:true});
const domain=Uint32Array.from(db.prepare('SELECT key FROM roots ORDER BY key').iterate(),r=>Number(r.key));db.close();
let rng=20260924;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
const seen=new Set<number>(),hits:number[]=[],misses:number[]=[],jobs:MembershipSearch[]=[];
let examined=0,rootCursor=0,nextJob=0,newTurn=true;
const childKeys=(post:number)=>{const c=getChess(fen(post,'b')),out:number[]=[];for(const m of c.moves({verbose:true})){if(m.captured)continue;c.move(m);out.push(canonical(code(c.fen())));c.undo();}return [...new Set(out)];};
const cache=new Map<number,{post:number;children:number[]}[]>();
function branches(key:number){const cached=cache.get(key);if(cached)return cached;
 const f=fen(key),c=getChess(f),out:{post:number;children:number[]}[]=[];
 for(const san of preferred(f)){c.move(san);if(support(c.fen()).size===99){const post=canonical(code(c.fen()));out.push({post,children:childKeys(post)});}c.undo();}
 cache.set(key,out);return out;
}
const budgetMs=5000,start=performance.now(),deadline=start+budgetMs;
while(performance.now()<deadline){
 if(newTurn||jobs.length===0){newTurn=false;
  if(seen.size+excluded.size>=domain.length)break;
  const root=domain[Math.floor(random()*domain.length)]!;rootCursor++;
  if(excluded.has(root)||seen.has(root))continue;seen.add(root);
  if(support(fen(root,'b')).size!==99)continue;
  examined++;
  if(cyclic.has(root)){hits.push(root);continue;}
  const job=startMembershipSearch(root,childKeys(root),closed);
  if(job.status==='nonloop'){misses.push(root);continue;}
  jobs.push(job);
 }else{
  newTurn=true;if(!jobs.length)continue;
  const job=jobs[nextJob++%jobs.length]!;if(job.status!=='pending')continue;
  const status=advanceMembershipSearch(job,closed,branches);
  if(status==='loop')hits.push(job.root);
  if(status==='nonloop')misses.push(job.root);
 }
}
const elapsedMs=performance.now()-start,unresolved=jobs.filter(j=>j.status==='pending').map(j=>j.root),remainder=population-eligibleBaseline;
assert.equal(examined,hits.length+misses.length+unresolved.length);
const x=result.remainingPositions,n=examined,k=hits.length;
const report={method:'Fixed exhaustive unsupported-cycle cohort plus five-second uniform remainder sampling',blackPolicy:'all-legal',whitePolicy:'all preferred ties',deduplication:'D4 post-White positions',cycleLengthLimit:null,baselinePositions:excluded.size,baselineCurrentlyUnsupported:eligibleBaseline,baselineSurvivors:x,remainderPopulation:remainder,seed:20260924,budgetMs,elapsedMs,sampledPositions:n,loopHits:k,nonloop:misses.length,unresolved:unresolved.length,confirmedLoopPositions:cyclic.size,rawDensityEstimate:n?x+remainder*k/n:null,estimatedPositions:n?Math.max(cyclic.size,x+remainder*k/n):cyclic.size,estimateKind:unresolved.length?'detection lower-bound estimate; unfinished samples may also be cyclic':'point estimate',densityBoundsIgnoringSamplingUncertainty:n?[k/n,(k+unresolved.length)/n]:null,estimatedBoundsIgnoringSamplingUncertainty:n?[x+remainder*k/n,x+remainder*(k+unresolved.length)/n]:null,unknownHandling:'Unresolved samples remain in the denominator and widen bounds; no cycle-length cutoff. Zero hits is not evidence of no remaining loops.',policyFingerprint:result.policyFingerprint,rootDraws:rootCursor,hits,nonloopKeys:misses,unresolvedKeys:unresolved};
writeFileSync(dir+'/estimate.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,hits:undefined,nonloopKeys:undefined,unresolvedKeys:undefined},null,2));
