import test from 'node:test';
import assert from 'node:assert/strict';
import { cyclicEdgeLabels } from './cycle-cohort.mts';
test('counts cycle edges, not incoming paths or exits',()=>{
 assert.deepEqual([...cyclicEdgeLabels([[[1,10]],[[2,20]],[[1,30],[3,40]],[]])].sort(),[20,30]);
});
test('handles self loops, disjoint components, and repeated placement labels',()=>{
 assert.deepEqual([...cyclicEdgeLabels([[[0,7]],[[2,8]],[[1,7]],[]])].sort(),[7,8]);
 assert.equal(cyclicEdgeLabels([[[1,5]],[[2,6]],[]]).size,0);
});
