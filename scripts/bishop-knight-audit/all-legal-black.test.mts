import assert from 'node:assert/strict';
import test from 'node:test';
import { fork } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getChess } from '../../app/src/mate/chess.ts';
import { getIdealKnightAndBishopWhiteMoves as white, getKnightAndBishopOpponentCandidates as black } from '../../app/src/mate/rules/bishopKnight.ts';
import { BASE, NONE, canonical, code, fen, pair, sqIndex } from './encoding.mts';
import { policyEdges } from './policy-edges.mts';

test('audit follows every legal Black reply, ignores return history, and retains noncapture alternatives', async () => {
    const require = createRequire(new URL('../../app/package.json', import.meta.url));
    const { build } = require('esbuild');
    const base = fileURLToPath(new URL('../../.audit/', import.meta.url));
    mkdirSync(base, { recursive: true });
    const dir = mkdtempSync(base + 'all-legal-test-');
    await build({ entryPoints: [fileURLToPath(new URL('./worker.mts', import.meta.url))], bundle: true, platform: 'node', format: 'esm', outfile: dir + '/worker.mjs' });
    const worker = fork(dir + '/worker.mjs', { env: { ...process.env, AUDIT_SCOPE: 'all' }, stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
    async function call(kind: string, batch: unknown[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const cleanup = () => { worker.off('message', message); worker.off('error', error); worker.off('exit', exit); };
            const message = (value: any) => { cleanup(); resolve(value.result); };
            const error = (err: Error) => { cleanup(); reject(err); };
            const exit = (status: number | null) => error(new Error('Worker exited ' + status));
            worker.once('message', message); worker.once('error', error); worker.once('exit', exit);
            worker.send({ kind, batch });
        });
    }
    try {
        const roots = [
            '8/8/8/8/B6N/5k2/1K6/8 b - - 0 1',
            'K7/8/1kB5/3N4/8/8/8/8 b - - 0 1',
        ];
        for (const f of roots) {
            const ch = getChess(f), moves = ch.moves({ verbose: true });
            assert.ok(moves.length > black(f).idealMoves.length, 'Fixture must include replies outside app preferences');
            const [actual] = await call('root', [{ key: code(f), weight: 1 }]);
            const children = new Set<number>();
            for (const m of moves) {
                ch.move(m); if (!m.captured) children.add(canonical(code(ch.fen()))); ch.undo();
            }
            assert.deepEqual(actual.children.sort((a: number, b: number) => a - b), [...children].sort((a, b) => a - b));
            assert.equal(actual.flags & 4, moves.some(m => m.captured) ? 4 : 0);
            assert.ok(actual.children.length > 0);
        }
        const k = canonical(code('8/8/8/8/B5kN/8/1K6/8 w - - 0 1'));
        const [fresh] = await call('node', [{ id: 0, key: pair(k) }]);
        const [history] = await call('node', [{ id: 0, key: k * BASE + code('8/8/8/8/B7/5k2/1K4N1/8 w - - 0 1') }]);
        assert.deepEqual(fresh, history, 'Previous board must not filter Black replies');
        const expected: number[][] = [], ch = getChess(fen(k));
        for (const san of white(ch.fen())) {
            const w = ch.move(san), post = code(ch.fen());
            for (const b of ch.moves({ verbose: true })) {
                if (b.captured) continue;
                ch.move(b);
                expected.push([pair(code(ch.fen())), canonical(post), sqIndex(w.from) * 64 + sqIndex(w.to), sqIndex(b.from) * 64 + sqIndex(b.to)]);
                ch.undo();
            }
            ch.undo();
        }
        assert.deepEqual(fresh.edges, expected);
        assert.ok(expected.length > 1);
        assert.ok(fresh.edges.every((edge: number[]) => edge[0]! % BASE === NONE));
        assert.deepEqual(policyEdges(fresh.policy), fresh.edges, 'Census and worker must share identical expansion');
    } finally {
        worker.kill(); rmSync(dir, { recursive: true, force: true });
    }
});
