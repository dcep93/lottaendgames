export function supportedReport(r: any, manifest: any): string {
    const c = r.counts, num = (n: number) => n.toLocaleString('en-US');
    const total = c.audited ?? c.supported;
    const pct = (n: number) => (total ? 100 * n / total : 0).toFixed(4) + '%';
    const stage = r.population === 'all' ? 'total' : r.diagonal ? `${r.diagonal}-diagonal` : 'supported';
    const rows = [
        ['Directly on a loop', c.directOnAnyDiscoveredLoop],
        ['Not directly on a loop', total - c.directOnAnyDiscoveredLoop],
        ['Can reach a loop', c.canLoop],
        ['Cannot reach a loop', c.noLoop],
        ['Can reach mate', c.canMate],
        ['Can reach capture or stalemate', c.canFail],
    ] as const;
    let text = `# ${r.population === 'all' ? 'Full-position' : 'Supported-position'} continuation audit\n\nPolicy commit: \`${manifest.commit}\`. Fingerprint: \`${manifest.fingerprint}\`.\n\nThe full placement census classified ${num(c.legal)} positions and selected **${num(total)} ${stage} post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.\n\n| Selected starts | Positions | Percentage |\n|---|---:|---:|\n`;
    for (const [label, n] of rows) text += `| ${label} | ${num(n)} | ${pct(n)} |\n`;
    text += `\n${num(r.graph.cyclicFamilies)} cyclic components; ${num(r.graph.nodes)} history states and ${num(r.graph.edges)} transitions. Terminal outcomes can overlap across tied branches. Direct membership counts selected post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.\n\n## Representative loops\n\n| Component | Selected starts reaching it | Replay |\n|---|---:|---|\n`;
    for (const f of [...r.families].sort((a: any, b: any) => b.reachablePlacements - a.reachablePlacements))
        text += `| ${f.id} | ${num(f.reachablePlacements)} | [${f.witness.moves.join(' ')}](${f.witness.url})${f.witness.freshLoadVerified ? '' : ' (requires prior history)'} |\n`;
    if (r.placements) {
        text += '\n## Actual downstream piece-position motifs\n\nThese counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.\n\n| Placement motif | Physical positions |\n|---|---:|\n';
        for (const m of r.placements.motifs) text += `| ${m.motif} | ${num(m.positions)} |\n`;
    }
    return text;
}
