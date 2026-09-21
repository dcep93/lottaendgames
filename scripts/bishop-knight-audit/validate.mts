import { fork } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { BASE, NONE, code, fen, pair, pack, distance, canonical } from './encoding.mts';
import { getChess } from '../../app/src/mate/chess.ts';
import { getIdealKnightAndBishopWhiteMoves as white, getKnightAndBishopOpponentCandidates as black } from '../../app/src/mate/rules/bishopKnight.ts';
import { knightAndBishopSupportedDiagonal as support } from '../../app/src/mate/rules/bishopKnightDiagonalSupport.ts';
const dir = process.env.AUDIT_DIR!;
let seed = 20260920;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed >>> 26; };
const roots: any[] = [], nodes: any[] = [];
while (roots.length < 1000) {
    const p = [rnd(), rnd(), rnd(), rnd()] as [
        number,
        number,
        number,
        number
    ];
    if (new Set(p).size !== 4 || distance(p[0], p[3]) <= 1)
        continue;
    const k = pack(...p);
    roots.push({ key: k, weight: 1 });
    const ch = getChess(fen(k, 'b'));
    const replies = black(ch.fen()).idealMoves;
    if (!replies.length || ch.move(replies[0]!)?.captured)
        continue;
    const before = code(ch.fen());
    nodes.push({ id: nodes.length, key: pair(before) });
    const moves = white(ch.fen());
    if (!moves.length)
        continue;
    ch.move(moves[0]!);
    const reply = black(ch.fen()).idealMoves[0];
    if (reply && !ch.move(reply)?.captured)
        nodes.push({ id: nodes.length, key: pair(code(ch.fen()), before) });
}
async function call(file: string, kind: string, batch: any[]) {
    const worker = fork(dir + '/' + file, [], { serialization: 'advanced', stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
    try {
        return await new Promise<any>((resolve, reject) => {
            worker.once('message', resolve);
            worker.once('error', reject);
            worker.once('exit', code => reject(new Error('Validation worker exited ' + code)));
            worker.send({ kind, batch });
        });
    }
    finally {
        worker.kill();
    }
}
for (const [kind, batch] of [['root', roots], ['node', nodes]] as const) {
    const optimized = await call('worker.mjs', kind, batch);
    const reference = await call('reference-worker.mjs', kind, batch);
    assert.deepEqual(optimized, reference, 'Optimized worker differs from production bundle');
    if (kind === 'root') for (const r of optimized.result) {
        const ch = getChess(fen(r.key, 'b'));
        const supported = support(ch.fen()).size;
        assert.equal(r.supported, supported);
        const diagonal = Number(process.env.AUDIT_DIAGONAL ?? 0);
        const selected = process.env.AUDIT_SCOPE === 'supported'
            ? supported !== 99 && (!diagonal || supported === diagonal) : supported === 99;
        let flags = 0;
        const children = new Set<number>();
        if (selected) {
            if (ch.isCheckmate()) flags |= 2;
            else if (ch.isStalemate()) flags |= 4;
            else for (const san of black(ch.fen()).idealMoves) {
                const move = ch.move(san);
                if (move.captured) flags |= 4;
                else children.add(canonical(code(ch.fen())));
                ch.undo();
            }
        }
        assert.equal(r.flags, flags);
        assert.deepEqual([...r.children].sort((a: number, b: number) => a - b), [...children].sort((a, b) => a - b));
    }
    if (kind === 'node')
        for (const r of optimized.result) {
            const key = nodes[r.id].key, k = Math.floor(key / BASE), p = key % BASE, ch = getChess(fen(k));
            let flags = 0;
            const children: number[] = [];
            if (ch.isCheckmate())
                flags |= 2;
            else if (ch.isStalemate())
                flags |= 4;
            else
                for (const san of white(ch.fen())) {
                    ch.move(san);
                    if (ch.isCheckmate())
                        flags |= 2;
                    else if (ch.isStalemate())
                        flags |= 4;
                    else if (process.env.AUDIT_SCOPE !== 'supported' && support(ch.fen()).size !== 99)
                        flags |= 1;
                    else
                        for (const reply of black(ch.fen(), p === NONE ? undefined : fen(p)).idealMoves) {
                            const move = ch.move(reply);
                            if (move.captured)
                                flags |= 4;
                            else
                                children.push(pair(code(ch.fen()), k));
                            ch.undo();
                        }
                    ch.undo();
                }
            assert.equal(r.flags, flags);
            assert.deepEqual(r.edges.map((e: number[]) => e[0]).sort((a: number, b: number) => a - b), children.sort((a, b) => a - b), 'Compressed Black history differs from production');
        }
    console.log('Validated', kind, batch.length);
}
writeFileSync(dir + '/validation.json', JSON.stringify({ passed: true, seed: 20260920, roots: roots.length, nodes: nodes.length, fingerprint: process.env.AUDIT_HASH }, null, 2));
