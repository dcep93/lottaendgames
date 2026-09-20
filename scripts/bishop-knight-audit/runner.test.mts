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
