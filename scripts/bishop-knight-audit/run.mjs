import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { rootFingerprint } from './root-fingerprint.mjs';
const here=dirname(fileURLToPath(import.meta.url)), repo=resolve(here,'../..');
const require=createRequire(join(repo,'app/package.json'));
const {build}=require('esbuild');
const args=process.argv.slice(2);
if(args.includes('--help')) {
 console.log('npm run audit:unsupported -- --out /absolute/output [--workers 8] [--compare /previous/result.json] [--roots-from /previous/audit]\nResumes identical policy checkpoints; rejects stale ones. Node >=22.13 required.');process.exit(0);
}
const options={};
for(let i=0;i<args.length;i+=2){if(!['--out','--workers','--compare','--roots-from'].includes(args[i])||!args[i+1])throw new Error('Unknown or incomplete option: '+args[i]);options[args[i].slice(2)]=args[i+1];}
const dir=resolve(options.out??join(repo,'.audit','bishop-knight'));
const workers=Number(options.workers??Math.min(8,availableParallelism()));
if(!Number.isInteger(workers)||workers<1||workers>32)throw new Error('workers must be 1..32');
mkdirSync(dir,{recursive:true});
const memoPlugin={name:'audit-pure-placement-cache',setup(build){build.onLoad({filter:/\/mate\/chess\.ts$/},({path})=>{
 let contents=readFileSync(path,'utf8');
 const signature='export function getEndgamePiecePlacements(';
 if(!contents.includes(signature))throw new Error('Placement helper signature changed');
 contents=contents.replace(signature,'function auditUncachedEndgamePiecePlacements(');
 contents+=`\nconst auditPlacements = new Map<string, EndgamePiecePlacement[]>();
 export function getEndgamePiecePlacements(fen: string): EndgamePiecePlacement[] {
 let p=auditPlacements.get(fen);
 if(!p){p=auditUncachedEndgamePiecePlacements(fen);if(auditPlacements.size>=2048)auditPlacements.delete(auditPlacements.keys().next().value!);auditPlacements.set(fen,p)}
 return p.map(piece=>({...piece}));
 }\n`;
 return {contents,loader:'ts'};
});}};
const bundles={};
for(const stage of ['worker','reference-worker','validate','validate-symmetry','census','analyze','classify','report','reuse-roots']) {
 const result=await build({entryPoints:[join(here,(stage==='reference-worker'?'worker':stage)+'.mts')],bundle:true,platform:'node',format:'esm',write:false,plugins:stage==='worker'?[memoPlugin]:[]});
 bundles[stage]=result.outputFiles[0].contents;
}
const rootHash=await rootFingerprint(Buffer.from(bundles['reference-worker']).toString('utf8'));
const referenceHash=createHash('sha256').update(bundles['reference-worker']).digest('hex');
const rootsFrom=options['roots-from']?resolve(options['roots-from']):'';
if(rootsFrom) {
 const previousManifest=JSON.parse(readFileSync(join(rootsFrom,'manifest.json'),'utf8'));
 const reference=readFileSync(join(rootsFrom,'reference-worker.mjs'));
 if(previousManifest.referenceWorkerFingerprint!==createHash('sha256').update(reference).digest('hex'))throw new Error('Source root cache has no matching reference-worker fingerprint; run a full census.');
 const previousRootHash=await rootFingerprint(reference.toString('utf8'));
 if(previousRootHash!==rootHash)throw new Error('Support or Black root policy changed; omit --roots-from and run a full census.');
}
const fingerprint=createHash('sha256');
fingerprint.update(readFileSync(fileURLToPath(import.meta.url)));
fingerprint.update(readFileSync(join(here,'root-fingerprint.mjs')));
for(const [name,bytes] of Object.entries(bundles))fingerprint.update(name).update(bytes);
const hash=fingerprint.digest('hex'),manifestPath=join(dir,'manifest.json');
if(existsSync(manifestPath)&&JSON.parse(readFileSync(manifestPath,'utf8')).fingerprint!==hash)throw new Error('Policy or audit implementation changed. Choose a new --out directory; stale checkpoints cannot be reused.');
let commit='unknown';try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();}catch{}
if(!existsSync(manifestPath))writeFileSync(manifestPath,JSON.stringify({fingerprint:hash,referenceWorkerFingerprint:referenceHash,rootFingerprint:rootHash,rootCacheSource:rootsFrom||null,commit,startedAt:new Date().toISOString(),node:process.version,workers,scope:'All 13,660,584 post-White KBNvK placements; stop at support/mate/capture/stalemate; all best-move ties; retain Black return history.'},null,2));
for(const [name,bytes] of Object.entries(bundles))writeFileSync(join(dir,name+'.mjs'),bytes);
const env={...process.env,AUDIT_DIR:dir,AUDIT_HASH:hash,WORKERS:String(workers),AUDIT_COMPARE:options.compare?resolve(options.compare):'',AUDIT_ROOTS_FROM:rootsFrom,AUDIT_ROOT_HASH:rootHash};
for(const stage of ['validate','validate-symmetry',...(rootsFrom?['reuse-roots']:[]),'census','analyze','classify','report']) {
 const stamp=join(dir,stage+'.complete');if(stage!=='report'&&existsSync(stamp)){console.log('Already complete:',stage);continue;}
 console.log('Starting:',stage);
 await new Promise((done,fail)=>{const child=spawn(process.execPath,[join(dir,stage+'.mjs')],{env,stdio:'inherit'});child.once('error',fail);child.once('exit',code=>code===0?done():fail(new Error(stage+' failed: '+code)));});
 writeFileSync(stamp,new Date().toISOString());
}
console.log('Report:',join(dir,'report.md'));
