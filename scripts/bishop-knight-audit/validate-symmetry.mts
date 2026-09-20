import assert from 'node:assert/strict';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../../app/src/mate/chess.ts';
import { getIdealKnightAndBishopWhiteMoves as white, getKnightAndBishopOpponentCandidates as black } from '../../app/src/mate/rules/bishopKnight.ts';
import { knightAndBishopSupportedDiagonal as support } from '../../app/src/mate/rules/bishopKnightDiagonalSupport.ts';
import { pack, fen, code, rootOrbits, distance } from './encoding.mts';
let count = 0, total = 0;
for (const r of rootOrbits()) {
    count++;
    total += r.weight;
    assert.equal(code(fen(r.key)), r.key);
}
assert.equal(total, 13660584);
console.log({ orbits: count, total });
let seed = 19192026;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed >>> 26; };
function mappedMoves(f: string, moves: readonly string[], t: any) { const c = getChess(f); return moves.map(s => { const m = c.move(s); c.undo(); return transformSquare(m.from, t) + transformSquare(m.to, t); }).sort(); }
for (let i = 0; i < 1000;) {
    const a = [rnd(), rnd(), rnd(), rnd()];
    if (new Set(a).size < 4 || distance(a[0]!, a[3]!) <= 1)
        continue;
    const key = pack(...a as [
        number,
        number,
        number,
        number
    ]), bf = fen(key, 'b'), wf = fen(key);
    const cb = getChess(bf);
    const sup = support(bf), bm = black(bf).idealMoves;
    const validWhite = !cb.isAttacked(cb.findPiece({ type: 'k', color: 'b' })[0]!, 'w');
    const wm = validWhite ? white(wf) : [];
    for (const t of SQUARE_TRANSFORMS) {
        const tf = transformFen(bf, t);
        assert.deepEqual(support(tf), sup);
        assert.deepEqual(mappedMoves(tf, black(tf).idealMoves, SQUARE_TRANSFORMS[0]), mappedMoves(bf, bm, t));
        if (validWhite) {
            const tw = transformFen(wf, t);
            assert.deepEqual(mappedMoves(tw, white(tw), SQUARE_TRANSFORMS[0]), mappedMoves(wf, wm, t));
        }
    }
    i++;
    if (i % 100 === 0)
        console.log('validated', i);
}
console.log('Symmetry and enumeration checks passed');
