import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {build} from '../../app/node_modules/esbuild/lib/main.js';
import assert from 'node:assert/strict';
import {BASE, fen} from './encoding.mts';
import {loopExclusion} from './loop-exclusions.mts';
import {piecePositionMotif} from './position-motifs.mts';

// Removing terminal vertices/edges cannot introduce cycles. Every surviving
// cycle lies entirely inside a cyclic component of the complete source graph.
const [source, out] = process.argv.slice(2);
assert.ok(source && out, 'Usage: precage-terminal.mts SOURCE_AUDIT OUTPUT_DIRECTORY');
const original = JSON.parse(readFileSync(source + '/result.json', 'utf8'));
assert.equal(original.blackPolicy, 'all-legal');
assert.equal(original.population, 'all');
const bundle = await build({entryPoints:['scripts/bishop-knight-audit/worker.mts'],bundle:true,platform:'node',format:'esm',write:false});
assert.equal(createHash('sha256').update(bundle.outputFiles[0]!.contents).digest('hex'), original.policyFingerprint, 'Source policy is stale: refresh move choices first');
const db = new DatabaseSync(source + '/census.sqlite', {readOnly:true});
const terminalCache = new Map<number,boolean>();
function terminal(key:number) {
  if (!terminalCache.has(key)) terminalCache.set(key, loopExclusion(fen(key)) !== null);
  return terminalCache.get(key)!;
}
const ids:number[] = [...new Set<number>(original.families.flatMap((f:any)=>f.nodeIds))];
const index = new Map(ids.map((id,i)=>[id,i]));
const get = db.prepare('SELECT key,payload FROM nodes WHERE id=?');
const rows = ids.map(id=>get.get(id) as {key:number,payload:string});
const adjacency: {to:number;post:number}[][] = rows.map(row=>terminal(Math.floor(row.key/BASE)) ? [] : JSON.parse(row.payload).edges.filter((e:number[])=>index.has(e[0]!) && !terminal(e[1]!) && !terminal(Math.floor(rows[index.get(e[0]!)!]!.key/BASE))).map((e:number[])=>({to:index.get(e[0]!)!,post:e[1]!})));
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
const groups=new Map<string,number[]>();for(const b of boards){const m=piecePositionMotif(b.key);groups.set(m,[...(groups.get(m)??[]),b.key]);}
const motifs=[...groups].map(([motif,keys])=>({motif,count:keys.length,keys})).sort((a,b)=>b.count-a.count);
const surviving=new Set(boards.map(b=>b.key));
const report={source,policyFingerprint:original.policyFingerprint,blackPolicy:'all-legal',population:'all',terminalDefinition:'Central bishop diagonally adjacent to knight, or degenerate A/B/C; stop at either side to move. This is an audit terminal, not a support declaration.',method:'Remove terminal positions and edges from the complete source graph; recompute SCCs. Only original cyclic components need inspection because deletions cannot create cycles.',independentCycleMembershipVerified:true,sourceLoopPositions:original.placements.boards.length,remainingLoopPositions:boards.length,physicalLoopPositions:boards.reduce((a,b)=>a+b.weight,0),excludedLoopPositions:original.placements.boards.length-boards.length,sourcePositionsWithoutExclusions:original.placements.boards.filter((b:any)=>!terminal(b.key)).length,cyclicComponents:cyclic.length,whiteTurnCyclePositions:cyclic.reduce((n,c)=>n+c.length,0),motifs,placements:{boards},families:cyclic.map((c,i)=>({id:i,nodeIds:c.map(v=>ids[v])})),supportLosses:0,supportedLoops:boards.filter(b=>b.size!==99).length};
assert.ok(boards.every(b=>!terminal(b.key)&&b.size===99));
assert.ok(original.placements.boards.filter((b:any)=>surviving.has(b.key)).length===boards.length);
mkdirSync(out,{recursive:true});writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,motifs:motifs.map(({keys,...m})=>m),placements:undefined,families:undefined},null,2));db.close();
