import {test} from 'node:test';
import assert from 'node:assert/strict';
import {code, BASE, NONE, transform, pair} from './encoding.mts';
import {precedingPostWhite, transitionOrbit, applyEncodedWhiteMove} from './transition-orbits.mts';

test('history reconstructs the last White result, not the board after Black replies', () => {
    const before = code('8/6k1/8/8/3KB3/3N4/8/8 w - - 0 1');
    const current = code('8/5k2/8/4K3/4B3/3N4/8/8 w - - 2 2');
    const post = code('8/6k1/8/4K3/4B3/3N4/8/8 b - - 1 1');
    assert.equal(precedingPostWhite(current * BASE + before), post);
    assert.equal(precedingPostWhite(current * BASE + NONE), null);
    const node = pair(current, before);
    assert.ok(Array.from({length:8}, (_,t) => transform(post,t)).includes(precedingPostWhite(node)!));
});

test('transition orbit preserves shared orientation and computes actual orbit size', () => {
    const a=code('K7/8/8/3B4/8/5N2/8/7k w - - 0 1');
    const b=code('K7/8/8/3B4/8/5N2/8/6k1 w - - 0 1');
    assert.equal(transitionOrbit([a]).weight,4); // all four labeled pieces on a8-h1
    const orbit=transitionOrbit([a,b]);
    assert.equal(orbit.weight,8);
    for(let t=0;t<8;t++) assert.equal(transitionOrbit([transform(a,t),transform(b,t)]).key,orbit.key);
    assert.notEqual(transitionOrbit([a,transform(b,1)]).key,orbit.key);
});

test('encoded moves preserve the board orientation',()=>{
    const k=code('8/8/8/8/3KB3/3N4/8/6k1 w - - 0 1');
    const next=applyEncodedWhiteMove(k,27*64+36);
    assert.equal(next,code('8/8/8/4K3/4B3/3N4/8/6k1 b - - 1 1'));
});
