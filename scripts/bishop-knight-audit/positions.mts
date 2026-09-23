import { readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import { positionMotifs, type CyclicPlacement } from './position-motifs.mts';
const dir = process.env.AUDIT_DIR!;
const result = JSON.parse(readFileSync(dir + '/result.json', 'utf8'));
const db = new DatabaseSync(dir + '/census.sqlite', {readOnly: true});
assert.ok(db.prepare("SELECT value FROM meta WHERE key='graphComplete'").get());
const node = db.prepare('SELECT payload FROM nodes WHERE id=?');
const root = db.prepare('SELECT weight,supported FROM roots WHERE key=?');
const placements = new Map<number, CyclicPlacement>();
for (const family of result.families) {
    const ids = new Set<number>(family.nodeIds);
    for (const id of ids) {
        for (const edge of JSON.parse((node.get(id) as any).payload).edges) {
            if (!ids.has(edge[0])) continue;
            const key = edge[1];
            const row = root.get(key) as any;
            assert.ok(row, 'Cyclic placement missing from exhaustive roots');
            const p: CyclicPlacement = placements.get(key) ?? {key, weight: row.weight, size: row.supported, families: []};
            if (!p.families.includes(family.id)) p.families.push(family.id);
            placements.set(key, p);
        }
    }
}
const motifs = positionMotifs([...placements.values()], result.diagonal);
const counted = result.population === 'all' ? motifs.allCyclePlacements : result.population === 'supported' ? motifs.selectedCyclePlacements : motifs.directBySize[99] ?? 0;
assert.equal(counted, result.counts.directOnAnyDiscoveredLoop);
writeFileSync(dir + '/placement-archetypes.json', JSON.stringify(motifs, null, 2));
result.placements = motifs;
writeFileSync(dir + '/result.json', JSON.stringify(result, null, 2));
db.close();
