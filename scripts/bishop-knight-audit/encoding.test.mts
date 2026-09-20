import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE, NONE, pack, unpack, code, fen, canonical, pair, transform, rootOrbits } from './encoding.mts';
test('packed placements round-trip without counters changing identity', () => {
    const f = '8/3k3N/8/3B4/3K4/8/8/8 w - - 0 1';
    const k = code(f);
    assert.equal(fen(k), f);
    assert.equal(code(f.replace('0 1', '88 45')), k);
    assert.deepEqual(unpack(pack(63, 0, 42, 17)), [63, 0, 42, 17]);
});
test('D4 transformations preserve a board and its history in the same orientation', () => {
    const current = code('8/8/8/4K3/4N3/7k/8/7B w - - 0 1');
    const previous = code('8/8/8/8/3KN1k1/8/8/7B w - - 0 1');
    const expected = pair(current, previous);
    assert.ok(Number.isSafeInteger(expected));
    for (let t = 0; t < 8; t++) {
        assert.equal(canonical(transform(current, t)), canonical(current));
        assert.equal(pair(transform(current, t), transform(previous, t)), expected);
    }
    assert.equal(pair(current), canonical(current) * BASE + NONE);
    // Canonicalizing each board separately would lose their relative orientation.
    assert.notEqual(pair(current, previous), pair(current, transform(previous, 1)));
});
test('exhaustive representative weights cover the complete placement universe', () => {
    let total = 0, count = 0;
    for (const root of rootOrbits()) {
        total += root.weight;
        count++;
    }
    assert.equal(count, 1707888);
    assert.equal(total, 13660584);
});
