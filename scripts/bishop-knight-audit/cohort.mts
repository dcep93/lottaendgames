import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
const bundle=await build({entryPoints:[resolve(here,'worker.mts')],bundle:true,platform:'node',format:'esm',write:false});
const bytes=bundle.outputFiles[0].contents;
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
const worker=fork(resolve(dir,'worker.mjs'),{env:{...process.env,AUDIT_SCOPE:'all'},stdio:['ignore','inherit','inherit','ipc']});
const started=Date.now();let expanded=0,lastProgress=0;
try{
 while(expanded<keys.length){
  const batch=keys.slice(expanded,expanded+128).map((key,i)=>({id:expanded+i,key}));
  const result:any=await new Promise((ok,fail)=>{
   const error=(e:Error)=>{cleanup();fail(e);};const exit=(c:number|null)=>error(new Error('Audit worker exited: '+c));
   const message=(m:any)=>{cleanup();ok(m);};
   const cleanup=()=>{worker.off('error',error);worker.off('exit',exit);worker.off('message',message);};
   worker.once('error',error);worker.once('exit',exit);worker.once('message',message);worker.send({kind:'node',batch});
  });
  for(const row of result.result){edges[row.id]=row.edges.map((e:number[])=>[add(e[0]!),e[1]!] as [number,number]);}
  expanded+=batch.length;
  if(Date.now()-lastProgress>10000){console.log({expanded,nodes:keys.length,seconds:Math.round((Date.now()-started)/1000)});lastProgress=Date.now();}
 }
}finally{worker.kill();}
const cyclic=cyclicEdgeLabels(edges), survivors=cohort.boards.filter(b=>cyclic.has(b.key));
const summary={blackPolicy:"all-legal",baselinePolicy:cohort.policyCommit,policyFingerprint:createHash('sha256').update(bytes).digest('hex'),baselinePositions:cohort.boards.length,remainingPositions:survivors.length,removedPositions:cohort.boards.length-survivors.length,remainingPhysicalPositions:survivors.reduce((s,b)=>s+b.weight,0),seeds,expanded,seconds:Math.round((Date.now()-started)/1000),survivors};
writeFileSync(resolve(dir,'result.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({...summary,survivors:undefined},null,2));
