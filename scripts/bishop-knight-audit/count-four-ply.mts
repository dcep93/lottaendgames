import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {currentPolicyFingerprints} from './current-policy-fingerprints.mts';
import {readFileSync,writeFileSync} from 'node:fs';
import {getChess} from '../../app/src/mate/chess.ts';
import {getIdealKnightAndBishopWhiteMoves as preferred} from '../../app/src/mate/rules/bishopKnight.ts';
import {loopExclusion} from './loop-exclusions.mts';
import {code,fen,transform,canonical} from './encoding.mts';
const dir=process.argv[2]!;
const result=JSON.parse(readFileSync(dir+'/result.json','utf8')),keys=new Set<number>(result.placements.boards.map((p:any)=>p.key));
assert.ok((await currentPolicyFingerprints()).includes(result.policyFingerprint),'Source policy is stale: refresh the full graph first');
assert.equal(createHash('sha256').update(readFileSync('scripts/bishop-knight-audit/loop-exclusions.mts')).digest('hex'),result.exclusionFingerprint,'Loop exclusions changed: refilter the full graph first');
const memo=new Map<string,string[]>(),nextCache=new Map<number,any[]>();
const terminal=(f:string)=>loopExclusion(f)!==null;
function next(p:number){if(nextCache.has(p))return nextCache.get(p)!;const out:any[]=[],ch=getChess(fen(p,'b'));
 for(const bm of ch.moves({verbose:true})){if(bm.captured)continue;ch.move(bm);const f=ch.fen();if(!terminal(f)){const moves=memo.get(f)??[...preferred(f)];memo.set(f,moves);for(const wm of moves){ch.move(wm);const q=code(ch.fen());if(keys.has(canonical(q))&&!terminal(ch.fen()))out.push({key:q,white:code(f),moves:[bm.san,wm]});ch.undo();}}ch.undo();}nextCache.set(p,out);return out;}
const cycles=new Set<string>();
for(const p of keys)for(const a of next(p))if(a.key!==p)for(const b of next(a.key))if(b.key===p){
 const frames=[p,a.white,a.key,b.white];
 const signature=Array.from({length:8},(_,t)=>{const f=frames.map(k=>transform(k,t));return [f.join(','),[...f.slice(2),...f.slice(0,2)].join(',')].sort()[0]!;}).sort()[0]!;
 cycles.add(signature);
}
writeFileSync(dir+'/four-ply-count.json',JSON.stringify({policyFingerprint:result.policyFingerprint,exclusionFingerprint:result.exclusionFingerprint,distinctFourPlyCycles:cycles.size,signatures:[...cycles]},null,2));console.log({distinctFourPlyCycles:cycles.size});
