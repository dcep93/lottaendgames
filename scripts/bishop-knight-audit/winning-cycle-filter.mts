import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {currentPolicyFingerprints} from './current-policy-fingerprints.mts';
import assert from 'node:assert/strict';
import {BASE, fen} from './encoding.mts';
import {loopExclusion} from './loop-exclusions.mts';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loopPositionMotif} from './position-motifs.mts';

// Removing terminal vertices/edges cannot introduce cycles. Every surviving
// cycle lies entirely inside a cyclic component of the complete source graph.
const [source, out, python, tables] = process.argv.slice(2);
assert.ok(source && out && python && tables, 'Usage: winning-cycle-filter.mts SOURCE OUTPUT PYTHON SYZYGY_DIRECTORY');
const original = JSON.parse(readFileSync(source + '/result.json', 'utf8'));
assert.equal(original.blackPolicy, 'all-legal');
assert.equal(original.population, 'all');
const manifest = JSON.parse(readFileSync(source + '/manifest.json', 'utf8'));
const policyFingerprint = manifest.referenceWorkerFingerprint;
assert.equal(createHash('sha256').update(readFileSync(source + '/reference-worker.mjs')).digest('hex'), policyFingerprint, 'Source worker fingerprint is invalid');
assert.ok((await currentPolicyFingerprints()).includes(policyFingerprint), 'Source policy is stale: refresh move choices first');
assert.ok([manifest.fingerprint, policyFingerprint].includes(original.policyFingerprint), 'Source result does not match its manifest');
const db = new DatabaseSync(source + '/census.sqlite', {readOnly:true});
const ids:number[] = [...new Set<number>(original.families.flatMap((f:any)=>f.nodeIds))];
const index = new Map(ids.map((id,i)=>[id,i]));
const get = db.prepare('SELECT key,payload FROM nodes WHERE id=?');
const rows = ids.map(id=>get.get(id) as {key:number,payload:string});
const probeKeys = new Map<number,string>();
const probeKey = (key:number, turn:'w'|'b') => key * 2 + Number(turn === 'b');
for (const row of rows) {
  const key = Math.floor(row.key / BASE);
  probeKeys.set(probeKey(key, 'w'), fen(key));
  for (const e of JSON.parse(row.payload).edges) if (index.has(e[0]))
    probeKeys.set(probeKey(e[1], 'b'), fen(e[1], 'b'));
}
const probes = JSON.parse(execFileSync(python, [fileURLToPath(new URL('./probe-winning-positions.py', import.meta.url)), tables],
  {input: JSON.stringify([...probeKeys]), encoding:'utf8', maxBuffer:128*1024*1024}));
mkdirSync(out,{recursive:true});
writeFileSync(out+'/tablebase-probes.json',JSON.stringify(probes));
const terminal = (key:number, turn:'w'|'b') => {
  const result = probes.results[probeKey(key, turn)];
  assert.ok(result, `Missing tablebase probe: ${key} ${turn}`);
  return !result.whiteWins;
};
const adjacency: {to:number;post:number}[][] = rows.map(row=>terminal(Math.floor(row.key/BASE), 'w') ? [] : JSON.parse(row.payload).edges.filter((e:number[])=>index.has(e[0]!) && !terminal(e[1]!, 'b') && !terminal(Math.floor(rows[index.get(e[0]!)!]!.key/BASE), 'w')).map((e:number[])=>({to:index.get(e[0]!)!,post:e[1]!})));
// Tarjan on the retained subgraph, including newly split source components.
let clock=0; const visited=new Int32Array(ids.length).fill(-1),low=new Int32Array(ids.length),on=new Uint8Array(ids.length),stack:number[]=[],components:number[][]=[];
function visit(v:number){visited[v]=low[v]=clock++;stack.push(v);on[v]=1;for(const {to:w} of adjacency[v]!){if(visited[w]===-1){visit(w);low[v]=Math.min(low[v]!,low[w]!);}else if(on[w])low[v]=Math.min(low[v]!,visited[w]!);}
 if(low[v]===visited[v]){const members:number[]=[];let w:number;do{w=stack.pop()!;on[w]=0;members.push(w);}while(w!==v);components.push(members);}}
for(let i=0;i<ids.length;i++)if(visited[i]===-1)visit(i);
const cyclic=components.filter(c=>c.length>1||adjacency[c[0]!]!.some(e=>e.to===c[0]));
const placements=new Map<number,any>();const root=db.prepare('SELECT weight,supported FROM roots WHERE key=?');
for(const [i,c] of cyclic.entries()){const members=new Set(c);for(const v of c)for(const e of adjacency[v]!)if(members.has(e.to)){const p=placements.get(e.post)??{key:e.post,...root.get(e.post),families:[]};if(!p.families.includes(i))p.families.push(i);placements.set(e.post,p);}}
// Independently verify every cyclic edge by reachability back to its source.
const independentlyCyclicPosts = new Set<number>();
for(let v=0;v<ids.length;v++) {
  const reaches = new Set<number>(), todo = [v];
  while(todo.length) {const w=todo.pop()!;if(reaches.has(w))continue;reaches.add(w);for(const e of adjacency[w]!)todo.push(e.to);}
  // A reverse search identifies which reachable destinations can return to v.
  const reverse = new Set<number>([v]);let changed=true;
  while(changed){changed=false;for(const w of reaches)if(!reverse.has(w)&&adjacency[w]!.some(e=>reverse.has(e.to))){reverse.add(w);changed=true;}}
  for(const e of adjacency[v]!)if(reverse.has(e.to))independentlyCyclicPosts.add(e.post);
}
assert.deepEqual([...independentlyCyclicPosts].sort((a,b)=>a-b),[...placements.keys()].sort((a,b)=>a-b));
const boards=[...placements.values()].map(p=>({...p,size:p.supported}));
const groups=new Map<string,number[]>();for(const b of boards){const m=loopPositionMotif(b.key);groups.set(m,[...(groups.get(m)??[]),b.key]);}
const motifs=[...groups].map(([motif,keys])=>({motif,count:keys.length,keys})).sort((a,b)=>b.count-a.count);
const surviving=new Set(boards.map(b=>b.key));
const report={source,exclusionFingerprint:createHash('sha256').update(readFileSync('scripts/bishop-knight-audit/loop-exclusions.mts')).digest('hex'),policyFingerprint,sourceGraphFingerprint:original.policyFingerprint,blackPolicy:'all-legal',population:'all',terminalDefinition:'Exclude invalid and non-winning positions using Syzygy at every ply, side-to-move aware. Include all degenerate labels and r4-complete formations if White can force mate. Counters reset; no repetition history.',method:'Remove terminal positions and edges from the complete source graph; recompute SCCs. Only original cyclic components need inspection because deletions cannot create cycles.',independentCycleMembershipVerified:true,sourceLoopPositions:original.placements.boards.length,remainingLoopPositions:boards.length,physicalLoopPositions:boards.reduce((a,b)=>a+b.weight,0),excludedLoopPositions:original.placements.boards.length-boards.length,tablebaseFilter:'white-forced-win',cyclicComponents:cyclic.length,whiteTurnCyclePositions:cyclic.reduce((n,c)=>n+c.length,0),motifs,placements:{boards},families:cyclic.map((c,i)=>({id:i,nodeIds:c.map(v=>ids[v])})),supportLosses:0,supportedLoops:boards.filter(b=>b.size!==99).length};
assert.ok(boards.every(b=>!terminal(b.key, 'b')&&b.size===99));
const degenerateCounts:Record<string,number>={};
for(const c of cyclic)for(const v of c){const f=fen(Math.floor(rows[v]!.key/BASE)), kind=loopExclusion(f);if(kind)degenerateCounts[kind]=(degenerateCounts[kind]??0)+1;}
Object.assign(report,{winningDegenerateWhiteNodes:degenerateCounts, tablebaseProbeCount:probeKeys.size});
assert.ok(original.placements.boards.filter((b:any)=>surviving.has(b.key)).length===boards.length);
mkdirSync(out,{recursive:true});writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,motifs:motifs.map(({keys,...m})=>m),placements:undefined,families:undefined},null,2));db.close();
