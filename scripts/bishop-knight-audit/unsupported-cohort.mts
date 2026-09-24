import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { getChess } from '../../app/src/mate/chess.ts';
import { code, fen, pair } from './encoding.mts';
import { cyclicEdgeLabels } from './cycle-cohort.mts';

// Seed every legal non-capturing Black reply to each cohort placement.
// Only edges inside cyclic SCCs count; merely reaching a loop does not count.
// White follows current preferences. Black is unrestricted and history-free.
const args=process.argv.slice(2), baseline=args[args.indexOf('--baseline')+1], output=args[args.indexOf('--out')+1];
assert.ok(args.includes('--baseline')&&args.includes('--out'),'--baseline cohort.json --out directory required');
const cohort=JSON.parse(readFileSync(baseline!,'utf8')) as {policyCommit:string;boards:{key:number;weight:number}[]};
const selected=new Set(cohort.boards.map(b=>b.key));
assert.equal(selected.size,cohort.boards.length,'Duplicate cohort keys');
const dir=resolve(output!), here=dirname(fileURLToPath(import.meta.url)), repo=resolve(here,'../..');
mkdirSync(dir,{recursive:true});
const require=createRequire(resolve(repo,'app/package.json'));
const {build}=require('esbuild');
const bundle=await build({entryPoints:[resolve(repo,'scripts/bishop-knight-audit/worker.mts')],bundle:true,platform:'node',format:'esm',write:false});
const bytes=bundle.outputFiles[0].contents;
const fingerprint=createHash('sha256').update(bytes).digest('hex');
const baselineFingerprint=createHash('sha256').update(readFileSync(baseline!)).digest('hex');
if(existsSync(resolve(dir,'result.json'))&&existsSync(resolve(dir,'graph.json'))){
 const cached=JSON.parse(readFileSync(resolve(dir,'result.json'),'utf8'));
 if(cached.policyFingerprint===fingerprint&&cached.baselineFingerprint===baselineFingerprint&&cached.scope==='unsupported-only'){console.log(JSON.stringify({...cached,survivors:undefined,cached:true},null,2));process.exit(0);}
 throw Error('Output contains a different or unverified policy/cohort; choose a fresh output directory');
}
writeFileSync(resolve(dir,'worker.mjs'),bytes);
const keys:number[]=[], ids=new Map<number,number>(), edges:[number,number][][]=[];
function add(key:number){let id=ids.get(key);if(id===undefined){id=keys.length;keys.push(key);ids.set(key,id);}return id;}
for(const {key} of cohort.boards){
 const black=getChess(fen(key,'b')), replies=black.moves({verbose:true});
 for(const m of replies){
  if(m.captured)continue;
  black.move(m);add(pair(code(black.fen())));black.undo();
 }
}
const seeds=keys.length;
console.log({baseline:cohort.boards.length,seeds});
const makeWorker=()=>fork(resolve(dir,'worker.mjs'),{env:{...process.env,AUDIT_SCOPE:'unsupported'},stdio:['ignore','inherit','inherit','ipc']});
const workers=[makeWorker(),makeWorker()];
const started=Date.now();let expanded=0,lastProgress=0;
try{
 while(expanded<keys.length){
  const batches=workers.map((worker,index)=>({worker,batch:keys.slice(expanded+index*128,expanded+(index+1)*128).map((key,i)=>({id:expanded+index*128+i,key}))})).filter(x=>x.batch.length);
  const results=await Promise.all(batches.map(({worker,batch})=>new Promise<any>((ok,fail)=>{
   const error=(e:Error)=>{cleanup();fail(e);};const exit=(c:number|null)=>error(new Error('Audit worker exited: '+c));
   const message=(m:any)=>{cleanup();ok(m);};
   const cleanup=()=>{worker.off('error',error);worker.off('exit',exit);worker.off('message',message);};
   worker.once('error',error);worker.once('exit',exit);worker.once('message',message);worker.send({kind:'node',batch});
  })));
  for(const result of results)for(const row of result.result){edges[row.id]=row.edges.map((e:number[])=>[add(e[0]!),e[1]!] as [number,number]);}
  expanded+=batches.reduce((n,b)=>n+b.batch.length,0);
  if(Date.now()-lastProgress>10000){console.log({expanded,nodes:keys.length,seconds:Math.round((Date.now()-started)/1000)});lastProgress=Date.now();}
 }
}finally{for(const worker of workers)worker.kill();}
writeFileSync(resolve(dir,'graph.json'),JSON.stringify({keys,edges}));
const cyclic=cyclicEdgeLabels(edges);writeFileSync(resolve(dir,'cyclic-labels.json'),JSON.stringify([...cyclic]));const survivors=cohort.boards.filter(b=>cyclic.has(b.key));
const summary={scope:"unsupported-only",baselineFingerprint,allDiscoveredCyclicPositions:cyclic.size,blackPolicy:"all-legal",baselinePolicy:cohort.policyCommit,policyFingerprint:createHash('sha256').update(bytes).digest('hex'),baselinePositions:cohort.boards.length,remainingPositions:survivors.length,removedPositions:cohort.boards.length-survivors.length,remainingPhysicalPositions:survivors.reduce((s,b)=>s+b.weight,0),seeds,expanded,seconds:Math.round((Date.now()-started)/1000),survivors};
writeFileSync(resolve(dir,'result.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({...summary,survivors:undefined},null,2));
