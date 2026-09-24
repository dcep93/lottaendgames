import { policyEdges } from './policy-edges.mts';
import { fork } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { BASE, NONE, rootOrbits } from './encoding.mts';
const dir = process.env.AUDIT_DIR!;
if (!dir)
    throw new Error('Run via npm run audit:unsupported');
const count = Number(process.env.WORKERS ?? 6), started = Date.now();
const workerFile = 'worker.mjs';
const hash = process.env.AUDIT_HASH!;
if (!hash)
    throw new Error('Missing audit fingerprint');
const db = new DatabaseSync(dir + '/census.sqlite');
db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE IF NOT EXISTS roots(key INTEGER PRIMARY KEY,weight INTEGER,supported INTEGER,flags INTEGER,children TEXT); CREATE TABLE IF NOT EXISTS nodes(id INTEGER PRIMARY KEY,key INTEGER UNIQUE,payload TEXT);');
const getMeta = db.prepare('SELECT value FROM meta WHERE key=?'), putMeta = db.prepare('INSERT OR REPLACE INTO meta VALUES (?,?)');
const old = getMeta.get('hash') as any;
if (old && old.value !== hash)
    throw new Error('Policy checkpoint fingerprint mismatch');
putMeta.run('hash', hash);
db.exec('CREATE TABLE IF NOT EXISTS policies(key INTEGER PRIMARY KEY,payload TEXT)');
putMeta.run('workerImplementation', workerFile + ':' + createHash('sha256').update(readFileSync(dir + '/' + workerFile)).digest('hex'));
const savePolicy = db.prepare('INSERT OR REPLACE INTO policies VALUES (?,?)'), policies = new Map<number, any>(), pending = new Map<number, number[]>();
for (const r of db.prepare('SELECT * FROM policies').iterate() as any)
    policies.set(r.key, JSON.parse(r.payload));
const addRow = db.prepare('INSERT INTO nodes VALUES (?,?,NULL)'), saveNode = db.prepare('UPDATE nodes SET payload=? WHERE id=?'), saveRoot = db.prepare('INSERT INTO roots VALUES (?,?,?,?,?)');
const keys: number[] = [], ids = new Map<number, number>();
let completeNodes = 0, phase = 'roots', cursor = 0;
const done = new Set<number>();
for (const row of db.prepare('SELECT id,key,payload FROM nodes ORDER BY id').iterate() as any) {
    if (row.id !== keys.length)
        throw new Error('Noncontiguous IDs');
    keys.push(row.key);
    ids.set(row.key, row.id);
    if (row.payload !== null) {
        done.add(row.id);
        completeNodes++;
    }
}
function add(key: number) { let id = ids.get(key); if (id === undefined) {
    id = keys.length;
    keys.push(key);
    ids.set(key, id);
    addRow.run(id, key);
} return id; }
function finishNode(id: number, pol: any) {
    const edges = policyEdges(pol).map(([key, ...rest]) => [add(key!), ...rest]);
    saveNode.run(JSON.stringify({ flags: pol.flags, edges }), id);
    done.add(id); completeNodes++;
}
const completedRoots = new Set<number>();
let rawRoots = 0, unsupported = 0, rootCount = 0;
for (const row of db.prepare('SELECT key,weight,supported FROM roots').iterate() as any) {
    completedRoots.add(row.key);
    rootCount++;
    rawRoots += row.weight;
    if (row.supported === 99)
        unsupported += row.weight;
}
const iterator = rootOrbits();
let rootsExhausted = !!getMeta.get('rootsComplete');
if (rootsExhausted)
    phase = 'nodes';
function progress() { const result = { phase, seconds: Math.round((Date.now() - started) / 1000), rootOrbits: rootCount, physicalPlacements: rawRoots, unsupported, nodeCount: keys.length, expanded: completeNodes, workers: count }; writeFileSync(dir + '/progress.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result)); }
const workers: any[] = [], active = new Map<any, string>();
let settled = false;
const heartbeat = setInterval(progress, 10000);
await new Promise<void>((resolve, reject) => {
    function dispatch(w: any) {
        if (active.has(w) || settled)
            return;
        if (phase === 'roots') {
            const batch: any[] = [];
            while (batch.length < 128 && !rootsExhausted) {
                const next = iterator.next();
                if (next.done) {
                    rootsExhausted = true;
                    break;
                }
                if (!completedRoots.has(next.value.key))
                    batch.push(next.value);
            }
            if (batch.length) {
                active.set(w, 'root');
                w.send({ kind: 'root', batch });
                return;
            }
            if (rootsExhausted && active.size === 0) {
                putMeta.run('rootsComplete', 'true');
                phase = 'nodes';
                progress();
                for (const idle of workers)
                    dispatch(idle);
            }
        }
        else {
            const batch: any[] = [];
            let scanned = 0;
            db.exec('BEGIN');
            while (cursor < keys.length && batch.length < 64 && scanned++ < 2048) {
                const id = cursor++;
                if (done.has(id))
                    continue;
                const key = keys[id]!, k = Math.floor(key / BASE);
                if (policies.has(k)) {
                    finishNode(id, policies.get(k));
                    continue;
                }
                if (pending.has(k)) {
                    pending.get(k)!.push(id);
                    continue;
                }
                pending.set(k, [id]);
                batch.push({ id, key });
            }
            db.exec('COMMIT');
            if (batch.length) {
                active.set(w, 'node');
                w.send({ kind: 'node', batch });
                return;
            }
            if (cursor === keys.length && active.size === 0) {
                if (pending.size)
                    throw new Error('Orphan policy jobs');
                settled = true;
                resolve();
            }
            else if (cursor < keys.length)
                setImmediate(() => dispatch(w));
        }
    }
    for (let i = 0; i < count; i++) {
        const w = fork(dir + '/' + workerFile, [], { serialization: 'advanced', stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
        workers.push(w);
        w.on('error', reject);
        w.on('exit', (code: number) => { if (!settled)
            reject(new Error('Worker exited ' + code)); });
        w.on('message', (msg: any) => {
            try {
                db.exec('BEGIN');
                if (msg.kind === 'root')
                    for (const r of msg.result) {
                        const children = r.children.map((k: number) => add(k * BASE + NONE));
                        saveRoot.run(r.key, r.weight, r.supported, r.flags, JSON.stringify(children));
                        completedRoots.add(r.key);
                        rootCount++;
                        rawRoots += r.weight;
                        if (r.supported === 99)
                            unsupported += r.weight;
                    }
                else
                    for (const r of msg.result) {
                        const k = Math.floor(keys[r.id]! / BASE);
                        if (r.policy) {
                            policies.set(k, r.policy);
                            savePolicy.run(k, JSON.stringify(r.policy));
                            for (const id of pending.get(k) ?? [r.id])
                                finishNode(id, r.policy);
                            pending.delete(k);
                        }
                        else {
                            throw new Error('Worker omitted policy payload');
                        }
                    }
                db.exec('COMMIT');
                active.delete(w);
                for (const idle of workers)
                    dispatch(idle);
            }
            catch (e) {
                reject(e);
            }
        });
        dispatch(w);
    }
}).finally(() => { clearInterval(heartbeat); settled = true; for (const w of workers)
    w.kill(); });
if (rawRoots !== 13660584 || rootCount !== 1707888)
    throw new Error('Incomplete root census');
if (completeNodes !== keys.length)
    throw new Error('Incomplete graph');
phase = 'complete';
putMeta.run('graphComplete', 'true');
progress();
db.close();
