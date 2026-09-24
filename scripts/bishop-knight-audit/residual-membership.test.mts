import assert from 'node:assert/strict';
import test from 'node:test';
import {startMembershipSearch,advanceMembershipSearch} from './residual-membership.mts';
test('reaching a different cycle does not put the sampled position on a cycle',()=>{
 const s=startMembershipSearch(9,[1],new Set());
 const graph=new Map([[1,[{post:10,children:[2]}]],[2,[{post:11,children:[1]}]]]);
 while(s.status==='pending')advanceMembershipSearch(s,new Set(),n=>graph.get(n)!);
 assert.equal(s.status,'nonloop');
});
test('a long return is counted without a four-ply cutoff',()=>{
 const s=startMembershipSearch(9,[1],new Set());
 for(let i=1;i<=8;i++){advanceMembershipSearch(s,new Set(),n=>[{post:n===8?9:100+n,children:[n+1]}]);assert.equal(s.status,i===8?'loop':'pending');}
});
test('unfinished membership stays pending, and a closed non-returning branch is pruned',()=>{
 const closed=new Set([4]);const s=startMembershipSearch(9,[4,1],closed);
 assert.deepEqual(s.queue,[1]);advanceMembershipSearch(s,closed,()=>[{post:10,children:[2,4]}]);
 assert.equal(s.status,'pending');
 advanceMembershipSearch(s,closed,()=>[]);assert.equal(s.status,'nonloop');
 assert.equal(startMembershipSearch(9,[4],closed).status,'nonloop');
});
