/** Compile r5.1 forced-return exclusions to a policy fixed point using a cached full graph.
 * Usage: tsx scripts/bishop-knight-audit/derive-rare-returns.mts BASE_CACHE OUTPUT_CACHE
 * BASE_CACHE must describe the current policy with the generated exclusions empty.
 */
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {BASE, fen, sqIndex, code as encodePlacement} from './encoding.mts';
import {policyEdges} from './policy-edges.mts';

const [baseDir, outDir] = process.argv.slice(2);
assert(baseDir && outDir, 'Specify the baseline cache and a new output cache');
assert(!existsSync(outDir), 'Output cache must be new');
const load = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const baseline = load(baseDir + '/manifest.json');
assert(baseline.complete);
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(readFileSync(baseDir + '/worker.mjs')), baseline.fingerprint);
mkdirSync(outDir, {recursive: true});
for (const name of ['domain.bin', 'domain.json']) copyFileSync(baseDir + '/' + name, outDir + '/' + name);
execFileSync('python3', ['-c', 'import sqlite3,sys\ns=sqlite3.connect(sys.argv[1]);d=sqlite3.connect(sys.argv[2]);s.backup(d);d.close();s.close()', baseDir + '/census.sqlite', outDir + '/census.sqlite']);
const db = new DatabaseSync(outDir + '/census.sqlite');
const count = (db.prepare('SELECT count(*) n FROM nodes').get() as any).n as number;
const keys = new Uint32Array(count), ids = new Int32Array(BASE).fill(-1), children: number[][] = [];
for (const row of db.prepare('SELECT id,key,payload FROM nodes ORDER BY id').iterate() as any) {
  const key = Math.floor(row.key / BASE);
  keys[row.id] = key; ids[key] = row.id;
  children[row.id] = [...new Set<number>(JSON.parse(row.payload).edges.map((e: number[]) => e[0]!))];
}
const cycles = () => {
  const result: number[] = [];
  for (let id = 0; id < count; id++) if (children[id]!.some(child => children[child]!.includes(id))) result.push(keys[id]!);
  return result;
};
const readPolicy = db.prepare('SELECT payload FROM policies WHERE key=?');
const savePolicy = db.prepare('UPDATE policies SET payload=? WHERE key=?');
const saveNode = db.prepare('UPDATE nodes SET payload=? WHERE id=?');
const normalize = (p: any) => JSON.stringify({flags:p.flags, branches:p.branches.map((b:any) => ({...b,
  legal:[...b.legal].sort((a,b)=>a-b), base:[...b.base].sort((a,b)=>a-b)})).sort((a:any,b:any)=>a.w-b.w)});
const require = createRequire(resolve('app/package.json'));
const {build} = require('esbuild');
const exclusions = new Map<number, Set<string>>();
const data = () => ({exclusions:[...exclusions].sort(([a],[b])=>a-b).map(([key,moves])=>({fen:fen(key),moves:[...moves].sort()}))});
const plugin = () => ({name:'derived-returns',setup(b:any){b.onLoad({filter:/bishopKnightRareReturnData\.json$/},()=>({contents:JSON.stringify(data(),null,2)+'\n',loader:'json'}));}});
async function api() {
  const bundle = await build({stdin:{contents:`export {bishopKnightRuleSet as rules} from './app/src/mate/rules/bishopKnight'; export {getChess} from './app/src/mate/chess'; export {selectCandidatesByRules as select} from './app/src/mate/rules/selection';`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',write:false,plugins:[plugin()]});
  const module = {exports:{} as any};
  runInNewContext(bundle.outputFiles[0].text,{module,exports:module.exports});
  return module.exports;
}
const uci = (move:any) => move.from + move.to;
const moveCode = (move:any) => sqIndex(move.from)*64 + sqIndex(move.to);
function inspect(a:any, source:string) {
  const scores=a.rules.scoreWhiteCandidates(source,a.rules.whiteMoves(source));
  return {scores,selection:a.select(scores,a.rules.whiteRules)};
}
function policy(a:any,key:number) {
  const source=fen(key), board=a.getChess(source), {selection}=inspect(a,source);
  const out:any={flags:board.isCheckmate()?2:board.isStalemate()?4:0,branches:[]};
  for(const {san} of selection.idealCandidates){
    const move=board.move(san), placement=board.fen().split(' ')[0];
    // The encoding helper is shared with the existing full audit.
    const post=encodePlacement(placement), replies=board.moves({verbose:true});
    if(!replies.length)out.flags|=board.isCheckmate()?2:4;
    else {
      if(replies.some((r:any)=>r.captured))out.flags|=4;
      const safe=replies.filter((r:any)=>!r.captured), legal=safe.map((r:any)=>sqIndex(r.to));
      out.branches.push({post,legal,base:[...legal],w:moveCode(move),b:Object.fromEntries(safe.map((r:any)=>[sqIndex(r.to),moveCode(r)]))});
    }
    board.undo();
  }
  return out;
}
const touched=new Set<number>(), rounds:any[]=[];
let a=await api();
for(let round=1;;round++){
  assert(round<=100,'Closure did not converge; no runtime table was written');
  const cyclic=cycles(), additions:any[]=[], replyCache=new Map<string,string|undefined>();
  function forcedReturn(source:string):string|undefined {
    const key=source.split(' ').slice(0,2).join(' ');
    if(replyCache.has(key))return replyCache.get(key);
    const {scores,selection}=inspect(a,source);
    let result:string|undefined;
    if(selection.idealCandidates.length===1 && [...selection.eliminatedBy.values()].some((r:any)=>r.id==='r5.1')){
      const chosen=selection.idealCandidates[0];
      const without=a.select(scores,a.rules.whiteRules.filter((r:any)=>r.id!=='r5.1'));
      if(!without.idealCandidates.includes(chosen))result=uci(a.getChess(source).move(chosen.san));
    }
    replyCache.set(key,result);return result;
  }
  for(const key of cyclic){
    const cached=JSON.parse((readPolicy.get(key) as any).payload);
    assert.equal(normalize(policy(a,key)),normalize(cached),'Baseline policy mismatch at '+fen(key));
    const source=fen(key), board=a.getChess(source), {selection}=inspect(a,source);
    for(const candidate of selection.idealCandidates){
      if(candidate.score.rareEscapePenalty!==0)continue;
      const move=board.move(candidate.san);
      for(const reply of board.moves({verbose:true})){
        if(reply.captured)continue;
        board.move(reply);
        if(forcedReturn(board.fen())===move.to+move.from){
          board.move({from:move.to,to:move.from});
          const restores=board.moves({verbose:true}).some((back:any)=>back.to===reply.from);
          board.undo();
          if(restores)additions.push({key,fen:source,move:uci(move),san:move.san,blackReply:reply.san});
        }
        board.undo();
      }
      board.undo();
    }
  }
  if(!additions.length){rounds.push({round,cyclicSources:cyclic.length,added:0});break;}
  for(const {key,move} of additions){if(!exclusions.has(key))exclusions.set(key,new Set());exclusions.get(key)!.add(move);}
  a=await api();let changed=0;
  db.exec('BEGIN');
  for(const key of cyclic){
    const next=policy(a,key), old=JSON.parse((readPolicy.get(key) as any).payload);
    touched.add(key);if(normalize(old)!==normalize(next))changed++;
    const edges=policyEdges(next).map(([packed,...rest])=>{const id=ids[Math.floor(packed!/BASE)]!;assert(id>=0);return[id,...rest];});
    const id=ids[key]!;children[id]=[...new Set(edges.map(e=>e[0]!))];
    savePolicy.run(JSON.stringify(next),key);saveNode.run(JSON.stringify({flags:next.flags,edges}),id);
  }
  db.exec('COMMIT');rounds.push({round,cyclicSources:cyclic.length,changed,additions});
  console.log({round,changed,excludedSources:exclusions.size});
}
// Only penalties increase, and a changed selected move must be in the previous
// policy's four-ply cycles. Check independent unaffected samples as a cache guard.
let state=0x6ac321,verified=0;
for(const key of keys){state=(Math.imul(state,1664525)+1013904223)>>>0;if(touched.has(key)||state%1000!==0)continue;
 assert.equal(normalize(policy(a,key)),normalize(JSON.parse((readPolicy.get(key) as any).payload)),'Unaffected decision changed at '+fen(key));verified++;
}
const bundle=await build({entryPoints:['scripts/bishop-knight-audit/worker.mts'],bundle:true,platform:'node',format:'esm',write:false,plugins:[plugin()]});
const bytes=bundle.outputFiles[0].contents,fingerprint=hash(bytes);
writeFileSync(outDir+'/worker.mjs',bytes);
db.prepare('INSERT OR REPLACE INTO meta VALUES (?,?)').run('hash',fingerprint);db.close();
const manifest={complete:true,method:'Monotone r5.1 forced-return closure; all distances must be recomputed',source:baseDir,sourceFingerprint:baseline.fingerprint,fingerprint,nodeCount:count,refreshed:touched.size,unaffectedVerified:verified,rounds,exclusions:data().exclusions};
writeFileSync(outDir+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
writeFileSync(outDir+'/refresh-scope.json',JSON.stringify({reasons:[...touched].map(key=>({key,reasons:['forced-return closure']}))},null,2));
writeFileSync('app/src/mate/rules/bishopKnightRareReturnData.json',JSON.stringify(data(),null,2)+'\n');
console.log({fixedPoint:true,rounds:rounds.length,excludedSources:exclusions.size,unaffectedVerified:verified});
