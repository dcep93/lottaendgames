import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const runner=join(repo,'scripts/bishop-knight-audit/run.mjs');

test('audit command explains usage and rejects invalid worker counts',()=>{
 const help=spawnSync(process.execPath,[runner,'--help'],{encoding:'utf8'});
 assert.equal(help.status,0);assert.match(help.stdout,/Resumes identical policy checkpoints/);
 const bad=spawnSync(process.execPath,[runner,'--workers','0'],{encoding:'utf8'});
 assert.notEqual(bad.status,0);assert.match(bad.stderr,/workers must be 1..32/);
 const scope=spawnSync(process.execPath,[runner,'--scope','unknown'],{encoding:'utf8'});
 assert.notEqual(scope.status,0);assert.match(scope.stderr,/scope must be unsupported or supported/);
 const reuse=spawnSync(process.execPath,[runner,'--scope','supported','--roots-from','/unused'],{encoding:'utf8'});
 assert.notEqual(reuse.status,0);assert.match(reuse.stderr,/Supported and full audits require a fresh root census/);
 const fullReuse=spawnSync(process.execPath,[runner,'--scope','all','--roots-from','/unused'],{encoding:'utf8'});
 assert.notEqual(fullReuse.status,0);assert.match(fullReuse.stderr,/Supported and full audits require a fresh root census/);
});

test('a stale fingerprint cannot overwrite a checkpoint or start workers',()=>{
 const base=join(repo,'.audit');mkdirSync(base,{recursive:true});
 const dir=mkdtempSync(join(base,'fingerprint-test-'));
 const original=JSON.stringify({fingerprint:'stale-policy'});
 try {
  writeFileSync(join(dir,'manifest.json'),original);
  writeFileSync(join(dir,'census.sqlite'),'checkpoint sentinel');
  const result=spawnSync(process.execPath,[runner,'--out',dir],{cwd:repo,encoding:'utf8'});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/stale checkpoints cannot be reused/);
  assert.doesNotMatch(result.stdout,/Starting:/);
  assert.equal(readFileSync(join(dir,'manifest.json'),'utf8'),original);
  assert.equal(readFileSync(join(dir,'census.sqlite'),'utf8'),'checkpoint sentinel');
 } finally {rmSync(dir,{recursive:true,force:true});}
});

test('root reuse rejects a modified reference snapshot before importing data',()=>{
 const base=join(repo,'.audit');mkdirSync(base,{recursive:true});
 const dir=mkdtempSync(join(base,'root-integrity-test-'));
 try {
  const source=join(dir,'source');mkdirSync(source);
  writeFileSync(join(source,'manifest.json'),JSON.stringify({referenceWorkerFingerprint:'original-reference'}));
  writeFileSync(join(source,'reference-worker.mjs'),'changed reference');
  const result=spawnSync(process.execPath,[runner,'--out',join(dir,'new'),'--roots-from',source],{cwd:repo,encoding:'utf8'});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/matching reference-worker fingerprint/);
  assert.doesNotMatch(result.stdout,/Starting:/);
 } finally {rmSync(dir,{recursive:true,force:true});}
});

test('stage and gate options fail closed for invalid or unsupported combinations',()=>{
 for(const args of [['--diagonal','7'],['--scope','supported','--diagonal','4'],['--scope','supported','--gate','win']]) {
  const result=spawnSync(process.execPath,[runner,...args],{encoding:'utf8'});
  assert.notEqual(result.status,0);
  assert.doesNotMatch(result.stdout,/Starting:/);
  assert.match(result.stderr,/diagonal must be|gate must be/);
 }
});

test('gate writes evidence and exits two for loops or non-mating terminal outcomes',()=>{
 const base=join(repo,'.audit');mkdirSync(base,{recursive:true});
 const dir=mkdtempSync(join(base,'gate-test-'));
 try {
  for(const [gate,canLoop,canFail,canMate,status] of [
   ['loops',8,0,0,2],['loops',0,8,0,0],['mate',0,8,0,2],['mate',0,0,8,0],
  ] as const) {
   writeFileSync(join(dir,'result.json'),JSON.stringify({diagonal:7,policyFingerprint:'fixture',counts:{audited:8,canLoop,canFail,canMate}}));
   const result=spawnSync(process.execPath,[join(repo,'scripts/bishop-knight-audit/gate.mts')],{
    encoding:'utf8',env:{...process.env,AUDIT_DIR:dir,AUDIT_GATE:gate},
   });
   assert.equal(result.status,status,result.stderr);
   const evidence=JSON.parse(readFileSync(join(dir,'gate.json'),'utf8'));
   assert.equal(evidence.passed,status===0);
   assert.equal(evidence.diagonal,7);
   assert.equal(evidence.policyFingerprint,'fixture');
  }
 } finally {rmSync(dir,{recursive:true,force:true});}
});
