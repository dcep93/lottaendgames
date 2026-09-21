import test from 'node:test';
import assert from 'node:assert/strict';
import { includesRoot, auditGate } from './population.mts';
import { positionMotifs } from './position-motifs.mts';
import { pack } from './encoding.mts';

test('stages select only their starting diagonal; original populations remain available', () => {
    const sizes = [3,5,7,99];
    for (const stage of [7,5,3]) assert.deepEqual(sizes.filter(s=>includesRoot(s,'supported',stage)),[stage]);
    assert.deepEqual(sizes.filter(s=>includesRoot(s,'supported')),[3,5,7]);
    assert.deepEqual(sizes.filter(s=>includesRoot(s,'unsupported')),[99]);
});

test('zero-loop and all-branches-mate gates distinguish terminal failure and empty audits', () => {
    const c = {audited: 8, canLoop: 0, canFail: 0, canMate: 8};
    assert.ok(auditGate(c,'loops'));
    assert.ok(auditGate(c,'mate'));
    assert.ok(auditGate({...c,canFail:8},'loops'));
    assert.equal(auditGate({...c,canFail:8},'mate'),false);
    assert.equal(auditGate({...c,canLoop:1},'loops'),false);
    assert.equal(auditGate({...c,canMate:7},'mate'),false);
    assert.equal(auditGate({audited:0,canLoop:0,canFail:0,canMate:0},'loops'),false);
});

test('placement motifs include smaller and unsupported downstream boards with distinct stage counts', () => {
    const result=positionMotifs([
        {key:pack(27,28,19,63),weight:8,size:7,families:[1,2]},
        {key:pack(45,14,20,15),weight:8,size:3,families:[2]},
        {key:pack(44,14,20,15),weight:8,size:99,families:[2]},
    ],7);
    assert.equal(result.allCyclePlacements,24);
    assert.equal(result.selectedCyclePlacements,8);
    assert.deepEqual(result.directBySize,{3:8,7:8,99:8});
    assert.equal(result.motifs.reduce((n,m)=>n+m.positions,0),24);
    assert.ok(result.motifs.some(m=>m.motif.includes('central king; central bishop; bishop king-protected')));
    assert.ok(result.motifs.every(m=>!/shuttle|shuffle/.test(m.motif)));
});
