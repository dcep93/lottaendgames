import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const script = join(repo, 'scripts/bishop-knight-audit/direct-membership.mts');

test('direct membership deduplicates internal-cycle boards and reports weighted group overlap', () => {
    const base = join(repo, '.audit');
    mkdirSync(base, { recursive: true });
    const dir = mkdtempSync(join(base, 'direct-membership-test-'));
    try {
        const db = new DatabaseSync(join(dir, 'census.sqlite'));
        db.exec("CREATE TABLE meta(key TEXT,value TEXT); INSERT INTO meta VALUES ('graphComplete','true'); CREATE TABLE nodes(id INTEGER,payload TEXT); CREATE TABLE roots(key INTEGER,weight INTEGER,supported INTEGER);");
        const insert = db.prepare('INSERT INTO nodes VALUES (?,?)');
        insert.run(0, JSON.stringify({ edges: [[1, 10], [1, 10], [2, 999]] }));
        insert.run(1, JSON.stringify({ edges: [[0, 20]] }));
        insert.run(2, JSON.stringify({ edges: [[3, 20]] }));
        insert.run(3, JSON.stringify({ edges: [[2, 30]] }));
        db.exec('INSERT INTO roots VALUES (10,8,99),(20,4,99),(30,8,99)');
        db.close();
        const result = { policyFingerprint: 'saved-policy', counts: { directOnAnyDiscoveredLoop: 20 }, families: [
            { id: 1, kind: 'Knight shuttle', mechanism: 'center', nodeIds: [0, 1], closed: false },
            { id: 2, kind: 'Bishop shuttle', mechanism: 'long diagonal', nodeIds: [2, 3], closed: true },
        ] };
        writeFileSync(join(dir, 'result.json'), JSON.stringify(result));
        const run = () => spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
        const ok = run();
        assert.equal(ok.status, 0, ok.stderr);
        const output = readFileSync(join(dir, 'direct-membership.json'), 'utf8');
        const parsed = JSON.parse(output);
        assert.equal(parsed.total, 20);
        assert.equal(parsed.canonicalBoards, 3);
        assert.equal(parsed.policyFingerprint, 'saved-policy');
        assert.deepEqual(parsed.byKind.rows.map((row: any) => row.positions), [12, 12]);
        assert.equal(parsed.byKind.positionsInMultipleGroups, 4);
        assert.equal(parsed.byClosure.positionsInMultipleGroups, 4);
        // A mismatch must fail rather than overwrite the previously verified result.
        result.counts.directOnAnyDiscoveredLoop = 21;
        writeFileSync(join(dir, 'result.json'), JSON.stringify(result));
        const bad = run();
        assert.notEqual(bad.status, 0);
        assert.match(bad.stderr, /Direct membership does not match exhaustive analysis/);
        assert.equal(readFileSync(join(dir, 'direct-membership.json'), 'utf8'), output);
    } finally { rmSync(dir, { recursive: true, force: true }); }
});
