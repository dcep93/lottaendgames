import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

type Family = {
    id: number;
    kind: string;
    mechanism: string;
    nodeIds: number[];
    closed: boolean;
};
type Group = { name: string; familyIds: number[]; boards: Set<number> };

// Postprocessing only: use a completed snapshot, without importing today's policy.
const dir = resolve(process.argv[2] ?? process.env.AUDIT_DIR ?? '');
if (!process.argv[2] && !process.env.AUDIT_DIR)
    throw new Error('Usage: tsx direct-membership.mts /completed/audit');
const result = JSON.parse(readFileSync(dir + '/result.json', 'utf8'));
const db = new DatabaseSync(dir + '/census.sqlite', { readOnly: true });
assert.ok(db.prepare("SELECT value FROM meta WHERE key='graphComplete'").get(), 'Graph incomplete');
const node = db.prepare('SELECT payload FROM nodes WHERE id=?');
const root = db.prepare('SELECT weight,supported FROM roots WHERE key=?');
const weights = new Map<number, number>();
const families: Family[] = result.families;
const boardsByFamily = new Map<number, Set<number>>();
const kindGroups = new Map<string, Group>();
const mechanismGroups = new Map<string, Group>();
const closureGroups = new Map<string, Group>();
function add(groups: Map<string, Group>, name: string, family: Family, boards: Set<number>) {
    let group = groups.get(name);
    if (!group) groups.set(name, group = { name, familyIds: [], boards: new Set() });
    group.familyIds.push(family.id);
    for (const board of boards) group.boards.add(board);
}
for (const family of families) {
    const nodes = new Set(family.nodeIds), boards = new Set<number>();
    for (const id of nodes) {
        const row = node.get(id) as { payload: string } | undefined;
        assert.ok(row, 'Missing cycle node ' + id);
        const payload = JSON.parse(row.payload);
        for (const edge of payload.edges as number[][])
            if (nodes.has(edge[0]!)) boards.add(edge[1]!);
    }
    boardsByFamily.set(family.id, boards);
    for (const board of boards) if (!weights.has(board)) {
        const row = root.get(board) as { weight: number; supported: number } | undefined;
        assert.ok(row, 'Missing post-White root ' + board);
        assert.equal(row.supported, 99, 'Cycle contains a supported board');
        weights.set(board, row.weight);
    }
    add(kindGroups, family.kind, family, boards);
    add(mechanismGroups, family.mechanism, family, boards);
    add(closureGroups, family.closed ? 'Closed component' : 'Component with exits', family, boards);
}
const count = (boards: Iterable<number>) => [...boards].reduce((sum, board) => sum + weights.get(board)!, 0);
const total = count(weights.keys());
assert.equal(total, result.counts.directOnAnyDiscoveredLoop, 'Direct membership does not match exhaustive analysis');
function summarize(groups: Map<string, Group>) {
    const memberships = new Map<number, number>();
    const rows = [...groups.values()].map(group => {
        for (const board of group.boards) memberships.set(board, (memberships.get(board) ?? 0) + 1);
        const positions = count(group.boards);
        return { name: group.name, positions, percent: total ? 100 * positions / total : 0, families: group.familyIds.length, familyIds: group.familyIds };
    }).sort((a, b) => b.positions - a.positions);
    return { rows, positionsInMultipleGroups: count([...memberships].filter(([, n]) => n > 1).map(([board]) => board)) };
}
const output = {
    policyFingerprint: result.policyFingerprint,
    method: 'Union canonical post-White boards on internal cyclic-component edges, then restore root orbit weights. Group totals may overlap.',
    total,
    canonicalBoards: weights.size,
    byKind: summarize(kindGroups),
    byMechanism: summarize(mechanismGroups),
    byClosure: summarize(closureGroups),
    families: families.map(f => ({ id: f.id, positions: count(boardsByFamily.get(f.id)!) })).sort((a, b) => b.positions - a.positions),
};
writeFileSync(dir + '/direct-membership.json', JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ total, byKind: output.byKind, byMechanism: output.byMechanism }, null, 2));
db.close();
