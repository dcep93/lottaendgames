import test from 'node:test';
import assert from 'node:assert/strict';
import {rootFingerprint} from './root-fingerprint.mjs';
const source=(white:number,black:number)=>`const blackHelper=x=>x+${black}; function root(x){return blackHelper(x)} function whitePolicy(){return ${white}} process.on("message",m=>root(m)+whitePolicy());`;
test('root cache excludes White-only preferences but includes transitive Black helpers',async()=>{
 const initial=await rootFingerprint(source(1,2));
 assert.equal(await rootFingerprint(source(999,2)),initial);
 assert.notEqual(await rootFingerprint(source(1,3)),initial);
 assert.equal(await rootFingerprint(source(1,2).replaceAll(';',';\n')),initial);
});
test('root fingerprint fails closed when worker entry point cannot be extracted',async()=>{
 await assert.rejects(rootFingerprint('export function root(x){return x}'),/unique audit-worker/);
});
