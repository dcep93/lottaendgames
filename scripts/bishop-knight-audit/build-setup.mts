/** Reproducible offline minimax setup policy; the browser receives only packed moves/ranks. */
import assert from 'node:assert/strict';import {readFileSync,writeFileSync,existsSync,mkdirSync,copyFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {pack,fen} from './encoding.mts';import {getChess} from '../../app/src/mate/chess';
process.chdir(fileURLToPath(new URL('../../',import.meta.url)));mkdirSync('.audit',{recursive:true});
const prefix='.audit/r3-setup',central=[27,28,35,36],color=(s:number)=>(s%8+(s>>3))%2,goals:number[]=[];
for(const w of central)for(const b of central)for(const n of central){if(w===b||w===n||b===n||color(w)===color(b)||color(n)===color(b))continue;for(let k=0;k<64;k++){if([w,b,n].includes(k)||Math.max(Math.abs(w%8-k%8),Math.abs((w>>3)-(k>>3)))<=1)continue;const p=pack(w,b,n,k);if(!getChess(fen(p,'b')).isCheck())goals.push(p);}}
goals.sort((a,b)=>a-b);assert.equal(goals.length,328);
const inputs=['optimal-r2.cpp','kbn-geometry.hpp','kbn-symmetry.hpp','export-setup.cpp'];const digest=createHash('sha256').update(JSON.stringify(goals));for(const p of inputs)digest.update(readFileSync('scripts/bishop-knight-audit/'+p));const sourceHash=digest.digest('hex');
if(!existsSync(prefix+'.fingerprint')||readFileSync(prefix+'.fingerprint','utf8')!==sourceHash){
 writeFileSync(prefix+'-targets.txt',goals.join('\n')+'\n');
 for(const [file,out] of [['optimal-r2.cpp',prefix+'-solve'],['export-setup.cpp',prefix+'-export']])execFileSync('clang++',['-O3','-std=c++17','scripts/bishop-knight-audit/'+file,'-o',out],{stdio:'inherit'});
 execFileSync(prefix+'-solve',[prefix+'-targets.txt',prefix],{stdio:'inherit'});
 const result=execFileSync(prefix+'-export',[prefix+'.white.bin',prefix+'.black.bin',prefix+'.bin'],{encoding:'utf8'});writeFileSync(prefix+'-export.json',result);writeFileSync(prefix+'.fingerprint',sourceHash);
}
const bytes=readFileSync(prefix+'.bin'),sha256=createHash('sha256').update(bytes).digest('hex'),url=`/mate/bishop-knight/setup.${sha256.slice(0,16)}.bin`;
const meta={version:1,sha256,sourceHash,bytes:bytes.length,url,maxSetupMoves:JSON.parse(readFileSync(prefix+'.json','utf8')).maxWhite,...JSON.parse(readFileSync(prefix+'-export.json','utf8'))};
const metaFile='app/src/mate/rules/bishopKnightSetupData.json';
if(process.argv.includes('--check')){assert.deepEqual(JSON.parse(readFileSync(metaFile,'utf8')),meta);assert.deepEqual(readFileSync('app/public'+url),bytes);}else{mkdirSync('app/public/mate/bishop-knight',{recursive:true});copyFileSync(prefix+'.bin','app/public'+url);writeFileSync(metaFile,JSON.stringify(meta,null,2)+'\n');}
console.log(meta);
