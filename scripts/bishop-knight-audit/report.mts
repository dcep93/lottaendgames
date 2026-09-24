import { readFileSync, writeFileSync } from 'node:fs';
import { supportedReport } from './supported-report.mts';
const dir = process.env.AUDIT_DIR!;
const r = JSON.parse(readFileSync(dir + '/result.json', 'utf8'));
const manifest = JSON.parse(readFileSync(dir + '/manifest.json', 'utf8'));
if (process.env.AUDIT_COMPARE) {
    const prior = JSON.parse(readFileSync(process.env.AUDIT_COMPARE, 'utf8'));
    if (prior.blackPolicy !== r.blackPolicy)
        throw new Error('Cannot compare different Black policies; the all-legal audit needs a new baseline');
}
if (r.population === 'supported' || r.population === 'all') {
    let text = supportedReport(r, manifest);
    if (process.env.AUDIT_COMPARE) {
        const previous = JSON.parse(readFileSync(process.env.AUDIT_COMPARE, 'utf8'));
        if (previous.population !== r.population || (previous.diagonal ?? null) !== (r.diagonal ?? null))
            throw new Error('Comparison must use the same starting population and diagonal');
        text += '\n## Same-stage comparison\n\n| Metric | Before | After |\n|---|---:|---:|\n';
        for (const key of ['audited', 'canLoop', 'directOnAnyDiscoveredLoop', 'canMate', 'canFail'])
            text += `| ${key} | ${previous.counts[key]} | ${r.counts[key]} |\n`;
    }
    writeFileSync(dir + '/report.md', text);
    const top = [...r.families].sort((a: any, b: any) => b.reachablePlacements - a.reachablePlacements)
        .find((f: any) => f.witness.freshLoadVerified);
    writeFileSync(dir + '/display-loop.json', JSON.stringify(top ?? null, null, 2));
    console.log(JSON.stringify({ counts: r.counts, graph: r.graph, top: top?.id ?? null }, null, 2));
    process.exit(0);
}
const counts = r.counts, pct = (n: number) => ((100 * n) / counts.unsupported).toFixed(4) + '%', num = (n: number) => n.toLocaleString('en-US');
const ranked = [...r.families].sort((a: any, b: any) => b.reachablePlacements - a.reachablePlacements);
const previous = process.env.AUDIT_COMPARE ? JSON.parse(readFileSync(process.env.AUDIT_COMPARE, 'utf8')) : null;
const rows = [['Can reach an unsupported loop', 'canLoop'], ['Cannot reach an unsupported loop', 'noLoop'], ['Directly on a loop', 'directOnAnyDiscoveredLoop'], ['Fresh starts that can return to a loop containing themselves', 'directOnReachableLoop'], ['Only loop outcomes', 'onlyLoopOutcomes'], ['Both loop and support outcomes', 'loopAndSupport'], ['Can reach support', 'canReachSupport'], ['Can reach mate without first entering support', 'canMate'], ['Can reach capture or stalemate', 'canFail']];
let text = `# Unsupported-position audit\n\nPolicy commit: \`${manifest.commit}\`. Fingerprint: \`${manifest.fingerprint}\`.\n\nAll **${num(counts.legal)}** post-White KBNvK placements were enumerated, including both bishop colors and all rotations/reflections. **${num(counts.unsupported)}** are unsupported; **${num(counts.supported)}** are supported. Every tied preferred White move and every legal Black reply is followed.\n\n| Measure | Placements | % of unsupported |${previous ? ' Previous audit |' : ''}\n|---|---:|---:|${previous ? '---:|' : ''}\n`;
for (const [label, key] of rows)
    text += `| ${label} | ${num(counts[key!])} | ${pct(counts[key!])} |${previous ? ' ' + num(previous.counts[key!] ?? 0) + ' |' : ''}\n`;
if (manifest.rootCacheSource) text += `\nThe starting-position census was reused from \`${manifest.rootCacheSource}\` after an exact root-code fingerprint match. Every preferred White move and legal Black reply was recomputed.\n`;
text += '\nOutcome categories overlap except can-loop versus cannot-loop. “Can loop” is existential among preferred White ties and legal Black replies. Direct loop membership counts a board occurring on a cycle. Black return history does not affect this graph. “Cannot loop” does not imply forced mate: the audit stops at support, mate, capture, or stalemate. Clocks and repetition claims are excluded. Black may play any legal defense, independently of app reply preferences.\n';
text += `\n## Archetypes\n\n${num(r.graph.cyclicFamilies)} cyclic strongly connected components, ${num(r.graph.nodes)} board states, ${num(r.graph.edges)} transitions. A component can contain several cycles. Reach counts overlap.\n\n| Archetype | Components | Reachable unsupported starts |\n|---|---:|---:|\n`;
for (const a of r.archetypes.sort((a: any, b: any) => b.canReachFromUnsupportedPlacements - a.canReachFromUnsupportedPlacements))
    text += `| ${a.kind} | ${num(a.families)} | ${num(a.canReachFromUnsupportedPlacements)} |\n`;
text += '\n## Highest exposure components\n\nReach measures exposure, not guaranteed gains from a rule change. Exclusive reach counts starts that cannot reach any other component. Fresh-load links are checked for three repetitions.\n\n| Rank | Archetype | Reach | Exclusive | Loop |\n|---|---|---:|---:|---|\n';
for (const [i, f] of ranked.slice(0, 15).entries())
    text += `| ${i + 1} | ${f.kind} | ${num(f.reachablePlacements)} | ${num(f.exclusivePlacements)} | [${f.witness.moves.join(' ')}](${f.witness.url})${f.witness.freshLoadVerified ? '' : ' (replay validation failed)'} |\n`;
text += '\n## Selection mechanisms\n\nGrouped by the last priority eliminating a candidate on witness moves. Descriptive, not a causal proof.\n\n| Mechanism | Components | Reach |\n|---|---:|---:|\n';
for (const m of r.mechanisms.sort((a: any, b: any) => b.reachablePlacements - a.reachablePlacements))
    text += `| ${m.name} | ${m.families} | ${num(m.reachablePlacements)} |\n`;
text += '\n## Validation and artifacts\n\nDeterministic samples compare the optimized worker to the unmodified production bundle and direct production calls. One thousand random placements are checked in all eight symmetries. Enumeration totals are asserted. Independent SCC analysis and sink removal must agree on loop reachability. Witnesses replay three times against production rules.\n\n`manifest.json` identifies the exact bundled policy; `progress.json` reports progress; `census.sqlite` contains resumable roots, policies and transitions; `result.json` includes components, frames, selection traces and loop links; `root-family-membership.json` supports overlap analysis.\n';
writeFileSync(dir + '/report.md', text);
const top = ranked.find((f: any) => f.witness.freshLoadVerified && f.witness.displayConvention && f.cyclePlies === 4) ?? ranked.find((f: any) => f.witness.freshLoadVerified);
writeFileSync(dir + '/display-loop.json', JSON.stringify(top ?? null, null, 2));
console.log(JSON.stringify({ counts, archetypes: r.archetypes, top: top ? { kind: top.kind, reach: top.reachablePlacements, ...top.witness } : null }, null, 2));
