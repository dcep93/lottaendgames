import { includesRoot } from './population.mts';
import { getChess } from '../../app/src/mate/chess.ts';
import { getIdealKnightAndBishopWhiteMoves as white, getKnightAndBishopOpponentCandidates as black } from '../../app/src/mate/rules/bishopKnight.ts';
import { knightAndBishopSupportedDiagonal as support } from '../../app/src/mate/rules/bishopKnightDiagonalSupport.ts';
import { BASE, NONE, fen, code, canonical, pair, sqIndex } from './encoding.mts';
type Branch = {
    post: number;
    legal: number[];
    base: number[];
    w: number;
    b: Record<number, number>;
};
type Policy = {
    flags: number;
    branches: Branch[];
};
const continueSupport = process.env.AUDIT_SCOPE === 'supported';
const policies = new Map<number, Policy>();
const moveCode = (m: any) => sqIndex(m.from) * 64 + sqIndex(m.to);
function root(key: number) {
    const f = fen(key, 'b'), ch = getChess(f), legal = ch.moves({ verbose: true });
    const supported = support(f, legal.map(m => m.to)).size;
    if (!includesRoot(supported, process.env.AUDIT_SCOPE ?? 'unsupported', Number(process.env.AUDIT_DIAGONAL ?? 0)))
        return { key, supported, flags: 0, children: [] };
    if (!legal.length)
        return { key, supported, flags: ch.isCheckmate() ? 2 : 4, children: [] };
    const moves = black(f).idealMoves;
    let flags = 0;
    const children: number[] = [];
    for (const san of moves) {
        const m = ch.move(san);
        if (m.captured)
            flags |= 4;
        else
            children.push(canonical(code(ch.fen())));
        ch.undo();
    }
    return { key, supported, flags, children: [...new Set(children)] };
}
function policy(k: number) {
    const found = policies.get(k);
    if (found)
        return found;
    const f = fen(k), ch = getChess(f);
    const out: Policy = { flags: 0, branches: [] };
    if (ch.isCheckmate())
        out.flags |= 2;
    else if (ch.isStalemate())
        out.flags |= 4;
    else
        for (const san of white(f)) {
            const m = ch.move(san), post = code(ch.fen()), pf = ch.fen();
            const legal = ch.moves({ verbose: true });
            if (!legal.length) {
                out.flags |= ch.isCheckmate() ? 2 : 4;
                ch.undo();
                continue;
            }
            if (!continueSupport && support(pf, legal.map(m => m.to)).size !== 99) {
                out.flags |= 1;
                ch.undo();
                continue;
            }
            if (legal.some(m => m.captured)) {
                out.flags |= 4;
                ch.undo();
                continue;
            }
            const ideal = new Set(black(pf).idealMoves), bs: Record<number, number> = {};
            for (const m of legal)
                bs[sqIndex(m.to)] = moveCode(m);
            out.branches.push({ post, legal: legal.map(m => sqIndex(m.to)), base: legal.filter(m => ideal.has(m.san)).map(m => sqIndex(m.to)), w: moveCode(m), b: bs });
            ch.undo();
        }
    policies.set(k, out);
    if (policies.size > 75000)
        policies.delete(policies.keys().next().value!);
    return out;
}
function expand(id: number, key: number) { const k = Math.floor(key / BASE), p = key % BASE, pol = policy(k); const edges: number[][] = []; for (const branch of pol.branches) {
    const returns = p !== NONE && (p >>> 6) === (branch.post >>> 6) && branch.legal.includes(p & 63);
    for (const target of returns ? [p & 63] : branch.base) {
        const next = (branch.post & ~63) | target;
        edges.push([pair(next, k), canonical(branch.post), branch.w, branch.b[target]!]);
    }
} return { id, flags: pol.flags, edges, policy: pol }; }
process.on('message', (message: any) => { try {
    const result = message.kind === 'root' ? message.batch.map((x: any) => ({ ...root(x.key), weight: x.weight })) : message.batch.map((x: any) => expand(x.id, x.key));
    process.send!({ kind: message.kind, result });
}
catch (e) {
    console.error(e);
    process.exit(1);
} });
