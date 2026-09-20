import { readFileSync, writeFileSync } from 'node:fs';
import { bishopKnightRuleSet, knightAndBishopWhiteRules } from '../../app/src/mate/rules/bishopKnight.ts';
import { selectCandidatesByRules } from '../../app/src/mate/rules/selection.ts';
const dir = process.env.AUDIT_DIR!;
if (!dir)
    throw new Error('Run via npm run audit:unsupported');
const result = JSON.parse(readFileSync(dir + '/result.json', 'utf8'));
const labels: Record<string, string[]> = {
    'r1.5': ['supported diagonal size', 'knight distance to support'],
    'r9.1': ['bishop distance from Black'],
    'r9.2': ['king defense of knight'],
    'r9.3': ['central king defense of minor', 'bishop distance from Black'],
    'r10': ['king center distance', 'king off bishop color', 'bishop on long diagonal', 'king-protected central bishop', 'knight distance to precage', 'king protection of knight', 'noncentral bishop distance from Black', 'knight off bishop color'],
    'r15': ['long-diagonal intersection distance from Black'],
    'r20': ['avoid next knight attack']
};
const frequencies: Record<string, number> = {};
for (const family of result.families) {
    const mechanisms = new Set<string>();
    for (const frame of family.frames) {
        let remaining: any[] = [...bishopKnightRuleSet.scoreWhiteCandidates!(frame.fen, bishopKnightRuleSet.whiteMoves(frame.fen))];
        const trace: any[] = [];
        for (const rule of knightAndBishopWhiteRules) {
            const subs = rule.subpriorities ?? [{ compare: rule.compare! }];
            for (let i = 0; i < subs.length; i++) {
                const before = remaining.length;
                remaining = [...selectCandidatesByRules(remaining, [{ ...rule, compare: undefined, subpriorities: [subs[i]!] }]).idealCandidates];
                if (remaining.length < before)
                    trace.push({ rule: rule.id, priority: i + 1, meaning: labels[rule.id]?.[i] ?? rule.id, survivors: remaining.map(x => x.san) });
            }
        }
        if (!remaining.some(x => x.san === frame.move))
            throw new Error('Witness no longer best: ' + frame.fen + ' ' + frame.move);
        frame.selectionTrace = trace;
        frame.decidingPriority = trace.at(-1)?.meaning ?? 'all legal moves tied';
        mechanisms.add(frame.decidingPriority);
    }
    family.decidingPriorities = [...mechanisms];
    for (const m of mechanisms)
        frequencies[m] = (frequencies[m] ?? 0) + 1;
}
result.decidingPriorityFamilies = frequencies;
writeFileSync(dir + '/result.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(frequencies, null, 2));
for (const f of result.families)
    f.mechanism = f.kind + ' / ' + [...f.decidingPriorities].sort().join(' + ');
const { DatabaseSync } = await import('node:sqlite');
const db = new DatabaseSync(dir + '/census.sqlite', { readOnly: true });
const n = result.graph.nodes, rev: number[][] = Array.from({ length: n }, () => []);
for (const r of db.prepare('SELECT id,payload FROM nodes').iterate() as any)
    for (const e of JSON.parse(r.payload).edges)
        rev[e[0]]!.push(r.id);
const roots = JSON.parse(readFileSync(dir + '/loop-leading-roots.json', 'utf8'));
for (const root of roots)
    root.familyIds = [];
for (const family of result.families) {
    const seen = new Uint8Array(n), q: number[] = [...family.nodeIds];
    for (const i of q)
        seen[i] = 1;
    for (let h = 0; h < q.length; h++)
        for (const p of rev[q[h]!]!)
            if (!seen[p]) {
                seen[p] = 1;
                q.push(p);
            }
    family.reachablePlacements = roots.reduce((sum: number, r: any) => { if (!r.children.some((i: number) => seen[i]))
        return sum; r.familyIds.push(family.id); return sum + r.weight; }, 0);
}
for (const family of result.families)
    family.exclusivePlacements = roots.reduce((sum: number, r: any) => sum + (r.familyIds.length === 1 && r.familyIds[0] === family.id ? r.weight : 0), 0);
const ranked = [...result.families].sort((a: any, b: any) => b.reachablePlacements - a.reachablePlacements);
result.topCoverage = ranked.slice(0, 10).map((_: any, index: number) => { const selected = new Set(ranked.slice(0, index + 1).map((x: any) => x.id)); return { families: index + 1, placements: roots.reduce((sum: number, r: any) => sum + (r.familyIds.some((id: number) => selected.has(id)) ? r.weight : 0), 0) }; });
writeFileSync(dir + '/root-family-membership.json', JSON.stringify(roots));
result.mechanisms = [];
for (const name of [...new Set(result.families.map((f: any) => f.mechanism))]) {
    const fs = result.families.filter((f: any) => f.mechanism === name), seen = new Uint8Array(n), q: number[] = [];
    for (const f of fs)
        for (const i of f.nodeIds) {
            seen[i] = 1;
            q.push(i);
        }
    for (let h = 0; h < q.length; h++)
        for (const p of rev[q[h]!]!)
            if (!seen[p]) {
                seen[p] = 1;
                q.push(p);
            }
    const count = roots.reduce((sum: number, r: any) => sum + (r.children.some((i: number) => seen[i]) ? r.weight : 0), 0);
    result.mechanisms.push({ name, families: fs.length, closedFamilies: fs.filter((f: any) => f.closed).length, reachablePlacements: count, familyIds: fs.map((f: any) => f.id) });
}
writeFileSync(dir + '/result.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result.mechanisms, null, 2));
db.close();
