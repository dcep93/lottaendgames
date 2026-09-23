import { includesRoot } from './population.mts';
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { BASE, NONE, fen, code, unpack, square, transforms, transform } from './encoding.mts';
import { getChess, findPiece, kingDistance, squareColor, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../../app/src/mate/chess.ts';
import { getIdealKnightAndBishopWhiteMoves as white, getKnightAndBishopOpponentCandidates as black } from '../../app/src/mate/rules/bishopKnight.ts';
import { knightAndBishopSupportedDiagonal as support } from '../../app/src/mate/rules/bishopKnightDiagonalSupport.ts';
import { knightAndBishopKnightTargetSquares } from '../../app/src/mate/rules/bishopKnightStrategy.ts';
import { getMateRuleSet } from '../../app/src/mate/rules/index.ts';
import { encodeMateReplay } from '../../app/src/mate/share.ts';
const dir = process.env.AUDIT_DIR!;
const supportedScope = process.env.AUDIT_SCOPE === 'supported' || process.env.AUDIT_SCOPE === 'all';
if (!dir)
    throw new Error('Run via npm run audit:unsupported');
const db = new DatabaseSync(dir + '/census.sqlite', { readOnly: true });
assert.ok(db.prepare("SELECT value FROM meta WHERE key='graphComplete'").get(), 'Graph incomplete');
const n = (db.prepare('SELECT count(*) n FROM nodes').get() as any).n;
const edges = (db.prepare("SELECT sum(json_array_length(json_extract(payload,'$.edges'))) n FROM nodes").get() as any).n;
console.log({ phase: 'load', n, edges });
const keys = new Float64Array(n), off = new Uint32Array(n + 1), flags = new Uint8Array(n), child = new Uint32Array(edges), post = new Uint32Array(edges), wm = new Uint16Array(edges), bm = new Uint16Array(edges), revOff = new Uint32Array(n + 1);
let cursor = 0;
for (const r of db.prepare('SELECT * FROM nodes ORDER BY id').iterate() as any) {
    keys[r.id] = r.key;
    off[r.id] = cursor;
    const p = JSON.parse(r.payload);
    flags[r.id] = p.flags;
    for (const e of p.edges) {
        child[cursor] = e[0];
        post[cursor] = e[1];
        wm[cursor] = e[2];
        bm[cursor] = e[3];
        revOff[e[0] + 1]++;
        cursor++;
    }
}
off[n] = cursor;
assert.equal(cursor, edges);
for (let i = 0; i < n; i++)
    assert.ok(off[i] !== off[i + 1] || flags[i] !== 0, 'Unclassified graph sink ' + i);
for (let i = 1; i <= n; i++)
    revOff[i] += revOff[i - 1]!;
const rev = new Uint32Array(edges), write = revOff.slice(0, n);
for (let i = 0; i < n; i++)
    for (let e = off[i]!; e < off[i + 1]!; e++)
        rev[write[child[e]!]!++] = i;
console.log({ phase: 'scc' });
const seen = new Uint8Array(n), next = off.slice(0, n), stack = new Uint32Array(n), order = new Uint32Array(n);
let orderLen = 0;
for (let s = 0; s < n; s++) {
    if (seen[s])
        continue;
    let len = 1;
    stack[0] = s;
    seen[s] = 1;
    while (len) {
        const v = stack[len - 1]!;
        if (next[v]! < off[v + 1]!) {
            const t = child[next[v]!++]!;
            if (!seen[t]) {
                seen[t] = 1;
                stack[len++] = t;
            }
        }
        else {
            order[orderLen++] = v;
            len--;
        }
    }
}
const comp = new Int32Array(n).fill(-1), sizes: number[] = [];
for (let i = n - 1; i >= 0; i--) {
    const s = order[i]!;
    if (comp[s] !== -1)
        continue;
    const id = sizes.length;
    let len = 1, size = 0;
    stack[0] = s;
    comp[s] = id;
    while (len) {
        const v = stack[--len]!;
        size++;
        for (let e = revOff[v]!; e < revOff[v + 1]!; e++) {
            const p = rev[e]!;
            if (comp[p] === -1) {
                comp[p] = id;
                stack[len++] = p;
            }
        }
    }
    sizes.push(size);
}
const cyclic = new Uint8Array(n), cycleComps = new Map<number, number[]>();
for (let i = 0; i < n; i++) {
    let yes = sizes[comp[i]!]! > 1;
    if (!yes)
        for (let e = off[i]!; e < off[i + 1]!; e++)
            if (child[e] === i)
                yes = true;
    if (yes) {
        cyclic[i] = 1;
        if (!cycleComps.has(comp[i]!))
            cycleComps.set(comp[i]!, []);
        cycleComps.get(comp[i]!)!.push(i);
    }
}
function propagate(pred: (i: number) => boolean) { const out = new Uint8Array(n); let head = 0, tail = 0; for (let i = 0; i < n; i++)
    if (pred(i)) {
        out[i] = 1;
        stack[tail++] = i;
    } while (head < tail) {
    const v = stack[head++]!;
    for (let e = revOff[v]!; e < revOff[v + 1]!; e++) {
        const p = rev[e]!;
        if (!out[p]) {
            out[p] = 1;
            stack[tail++] = p;
        }
    }
} return out; }
const loop = propagate(i => !!cyclic[i]), hasSupport = propagate(i => !!(flags[i]! & 1)), hasMate = propagate(i => !!(flags[i]! & 2)), hasFailure = propagate(i => !!(flags[i]! & 4));
// Independent sink removal check of cycle reachability.
const degree = Uint32Array.from({ length: n }, (_, i) => off[i + 1]! - off[i]!);
let head = 0, tail = 0;
for (let i = 0; i < n; i++)
    if (!degree[i])
        stack[tail++] = i;
while (head < tail) {
    const v = stack[head++]!;
    for (let e = revOff[v]!; e < revOff[v + 1]!; e++) {
        const p = rev[e]!;
        if (--degree[p] === 0)
            stack[tail++] = p;
    }
}
for (let i = 0; i < n; i++)
    assert.equal(!!loop[i], degree[i]! > 0);
const postComps = new Map<number, Set<number>>();
for (const [cid, members] of cycleComps)
    for (const i of members)
        for (let e = off[i]!; e < off[i + 1]!; e++)
            if (comp[child[e]!] === cid) {
                const k = post[e]!;
                if (!postComps.has(k))
                    postComps.set(k, new Set());
                postComps.get(k)!.add(cid);
            }
function reachesComponent(starts: number[], targets: Set<number>) { const todo = [...starts], visited = new Set(starts); while (todo.length) {
    const v = todo.pop()!;
    if (targets.has(comp[v]!))
        return true;
    for (let e = off[v]!; e < off[v + 1]!; e++) {
        const t = child[e]!;
        if (!visited.has(t)) {
            visited.add(t);
            todo.push(t);
        }
    }
} return false; }
const counts = { legal: 0, supported: 0, unsupported: 0, canLoop: 0, noLoop: 0, directOnReachableLoop: 0, directOnAnyDiscoveredLoop: 0, onlyLoopOutcomes: 0, loopAndSupport: 0, canReachSupport: 0, canMate: 0, canFail: 0, audited: 0 };
const rootLoops: any[] = [];
for (const r of db.prepare('SELECT * FROM roots').iterate() as any) {
    counts.legal += r.weight;
    if (r.supported !== 99) counts.supported += r.weight;
    else counts.unsupported += r.weight;
    if (!includesRoot(r.supported, process.env.AUDIT_SCOPE ?? 'unsupported', Number(process.env.AUDIT_DIAGONAL ?? 0))) continue;
    counts.audited += r.weight;
    const c: number[] = JSON.parse(r.children), l = c.some(i => loop[i]), s = c.some(i => hasSupport[i]), m = !!(r.flags & 2) || c.some(i => hasMate[i]), f = !!(r.flags & 4) || c.some(i => hasFailure[i]);
    if (l)
        counts.canLoop += r.weight;
    else
        counts.noLoop += r.weight;
    if (s)
        counts.canReachSupport += r.weight;
    if (m)
        counts.canMate += r.weight;
    if (f)
        counts.canFail += r.weight;
    if (l && !s && !m && !f)
        counts.onlyLoopOutcomes += r.weight;
    if (l && s)
        counts.loopAndSupport += r.weight;
    const pc = postComps.get(r.key);
    if (pc) {
        counts.directOnAnyDiscoveredLoop += r.weight;
        if (reachesComponent(c, pc))
            counts.directOnReachableLoop += r.weight;
    }
    if (l)
        rootLoops.push({ key: r.key, weight: r.weight, children: c, support: s, mate: m, failure: f });
}
assert.equal(counts.legal, 13660584);
assert.equal(counts.canLoop + counts.noLoop, counts.audited);
console.log({ phase: 'classify', counts, components: cycleComps.size });
const rules = getMateRuleSet('bishop-knight'), families: any[] = [];
function coordMove(encoded: number, t: number) { const from = transforms[t]![encoded >>> 6]!, to = transforms[t]![encoded & 63]!; return { from: square(from), to: square(to) }; }
function verifyWitness(f: string, moves: string[]) { const ch = getChess(f), turns: string[] = []; for (const san of [...moves, ...moves, ...moves]) {
    const before = ch.fen();
    if (ch.turn() === 'w') {
        if (!white(before).includes(san))
            return false;
        turns.push(before);
    }
    else if (!black(before, turns.at(-2)).idealMoves.includes(san))
        return false;
    ch.move(san);
    if (!supportedScope && ch.turn() === 'b' && support(ch.fen()).size !== 99)
        return false;
} return code(ch.fen()) === code(f); }
function witness(start: number, chosen: number[]) {
    let current = start, actual = Math.floor(keys[start]! / BASE), actualPrev = keys[start]! % BASE;
    const initial = actual, initialPrev = actualPrev;
    const moves: string[] = [], boards: string[] = [];
    let round = 0;
    do {
        for (const edge of chosen) {
            const canonicalCurrent = Math.floor(keys[current]! / BASE), canonicalPrev = keys[current]! % BASE;
            let orient = -1;
            for (let t = 0; t < 8; t++)
                if (transform(canonicalCurrent, t) === actual && (canonicalPrev === NONE ? actualPrev === NONE : transform(canonicalPrev, t) === actualPrev)) {
                    orient = t;
                    break;
                }
            assert.notEqual(orient, -1);
            const ch = getChess(fen(actual));
            boards.push(ch.fen());
            moves.push(ch.move(coordMove(wm[edge]!, orient) as any).san);
            moves.push(ch.move(coordMove(bm[edge]!, orient) as any).san);
            actualPrev = actual;
            actual = code(ch.fen());
            current = child[edge]!;
        }
        round++;
        assert.ok(round <= 8);
    } while (actual !== initial || actualPrev !== initialPrev);
    // Try each phase and D4 orientation, preserving the user's loop display conventions.
    for (const strict of [true, false])
        for (let phase = 0; phase < moves.length; phase += 2) {
            const phaseBoard = getChess(fen(initial));
            for (const m of moves.slice(0, phase))
                phaseBoard.move(m);
            const rotated = [...moves.slice(phase), ...moves.slice(0, phase)];
            for (const t of SQUARE_TRANSFORMS) {
                const f = fen(code(transformFen(phaseBoard.fen(), t)));
                const b = findPiece(f, 'w', 'b')!, k = findPiece(f, 'b', 'k')!;
                const preferred = squareColor(b.square) === 1 && kingDistance(k.square, 'h8') < kingDistance(k.square, 'a1');
                if (strict && !preferred)
                    continue;
                const src = getChess(phaseBoard.fen()), dst = getChess(f);
                const reflected = rotated.map(san => { const m = src.move(san); return dst.move({ from: transformSquare(m.from, t), to: transformSquare(m.to, t) }).san; });
                if (verifyWitness(f, reflected))
                    return { fen: f, moves: reflected, url: 'http://localhost:5173/mate/bishop-knight' + encodeMateReplay(f, reflected, 0), freshLoadVerified: true, displayConvention: preferred };
            }
        }
    return { fen: fen(initial), moves, url: 'http://localhost:5173/mate/bishop-knight' + encodeMateReplay(fen(initial), moves, 0), freshLoadVerified: false };
}
for (const [cid, members] of cycleComps) {
    const internal: number[] = [], pieces = new Set<string>(), hints = new Set<string>();
    let exits = 0, terminal = 0;
    for (const v of members) {
        const k = Math.floor(keys[v]! / BASE), p = unpack(k);
        hints.add(rules.currentWhiteHint(fen(k))?.id ?? 'none');
        terminal |= flags[v]!;
        for (let e = off[v]!; e < off[v + 1]!; e++) {
            if (comp[child[e]!] !== cid) {
                exits++;
                continue;
            }
            internal.push(e);
            pieces.add(['K', 'B', 'N', 'k'][p.indexOf(wm[e]! >>> 6)] ?? '?');
        }
    }
    const start = members[0]!, path: number[] = [], active = new Map<number, number>();
    let v = start;
    while (!active.has(v)) {
        active.set(v, path.length);
        let e = off[v]!;
        while (e < off[v + 1]! && comp[child[e]!] !== cid)
            e++;
        assert.ok(e < off[v + 1]!);
        path.push(e);
        v = child[e]!;
    }
    const cycle = path.slice(active.get(v)!), w = witness(v, cycle);
    const kind = pieces.size > 1 ? 'Mixed-piece cycle' : pieces.has('N') ? 'Knight shuttle' : pieces.has('B') ? 'Bishop shuttle' : 'King shuffle';
    const example = getChess(w.fen), frames: any[] = [];
    for (let ply = 0; ply < w.moves.length; ply++) {
        if (example.turn() === 'w')
            frames.push({ fen: example.fen(), move: w.moves[ply], rule: rules.currentWhiteHint(example.fen())?.id ?? 'none', precageTargets: knightAndBishopKnightTargetSquares(example.fen()) });
        example.move(w.moves[ply]!);
    }
    const targetVariants = [...new Set(frames.map(f => [...f.precageTargets].sort().join(',')))];
    const bishopSquares = [...new Set(frames.map(f => findPiece(f.fen, 'w', 'b')!.square))];
    const central = new Set(['d4', 'e4', 'd5', 'e5']);
    const result = { id: families.length + 1, component: cid, nodeIds: members, kind, whitePieces: [...pieces].sort(), states: members.length, internalEdges: internal.length, exitEdges: exits, closed: exits === 0 && terminal === 0, canReachSupport: !!hasSupport[start], canMate: !!hasMate[start], canFail: !!hasFailure[start], rules: [...hints].sort(), precageTargetsSwitch: targetVariants.length > 1, stationaryCentralBishop: bishopSquares.length === 1 && central.has(bishopSquares[0]!), frames, witness: w, cyclePlies: w.moves.length };
    families.push(result);
}
// Attribute reachability to broad archetypes, allowing overlap where alternatives lead to different cycles.
const archetypes: any[] = [];
for (const kind of [...new Set(families.map(f => f.kind))]) {
    const selected = new Set(families.filter(f => f.kind === kind).map(f => f.component)), reach = propagate(i => selected.has(comp[i]!));
    let roots = 0;
    for (const r of rootLoops)
        if (r.children.some((i: number) => reach[i]))
            roots += r.weight;
    const fs = families.filter(f => f.kind === kind);
    archetypes.push({ kind, families: fs.length, closedFamilies: fs.filter(f => f.closed).length, canReachFromUnsupportedPlacements: roots, cyclePlies: [...new Set(fs.map(f => f.cyclePlies))].sort((a, b) => a - b), rules: [...new Set(fs.flatMap(f => f.rules))].sort() });
}
const result = { diagonal: Number(process.env.AUDIT_DIAGONAL ?? 0) || null, population: process.env.AUDIT_SCOPE ?? 'unsupported', counts, graph: { nodes: n, edges, cyclicNodes: cyclic.reduce((s, v) => s + v, 0), cyclicFamilies: families.length }, archetypes, families, policyFingerprint: (db.prepare("SELECT value FROM meta WHERE key='hash'").get() as any).value };
writeFileSync(dir + '/node-outcomes.bin', Uint8Array.from({ length: n }, (_, i) => Number(!!loop[i]) | Number(!!hasSupport[i]) << 1 | Number(!!hasMate[i]) << 2 | Number(!!hasFailure[i]) << 3));
writeFileSync(dir + '/result.json', JSON.stringify(result, null, 2));
writeFileSync(dir + '/loop-leading-roots.json', JSON.stringify(rootLoops));
console.log(JSON.stringify({ ...result, families: undefined }, null, 2));
db.close();
