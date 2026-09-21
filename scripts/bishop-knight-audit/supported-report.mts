export function supportedReport(r: any, manifest: any): string {
    const c = r.counts, num = (n: number) => n.toLocaleString('en-US');
    const pct = (n: number) => (100 * n / c.supported).toFixed(4) + '%';
    const rows = [
        ['Directly on a loop', c.directOnAnyDiscoveredLoop],
        ['Not directly on a loop', c.supported - c.directOnAnyDiscoveredLoop],
        ['Can reach a loop', c.canLoop],
        ['Cannot reach a loop', c.noLoop],
        ['Can reach mate', c.canMate],
        ['Can reach capture or stalemate', c.canFail],
    ] as const;
    let text = `# Supported-position continuation audit\n\nPolicy commit: \`${manifest.commit}\`. Fingerprint: \`${manifest.fingerprint}\`.\n\nThe full placement census classified ${num(c.legal)} positions and selected **${num(c.supported)} supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.\n\n| Supported starts | Positions | Percentage |\n|---|---:|---:|\n`;
    for (const [label, n] of rows) text += `| ${label} | ${num(n)} | ${pct(n)} |\n`;
    text += `\n${num(r.graph.cyclicFamilies)} cyclic components; ${num(r.graph.nodes)} history states and ${num(r.graph.edges)} transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.\n\n## Representative loops\n\n| Component | Supported starts reaching it | Replay |\n|---|---:|---|\n`;
    for (const f of [...r.families].sort((a: any, b: any) => b.reachablePlacements - a.reachablePlacements))
        text += `| ${f.id} | ${num(f.reachablePlacements)} | [${f.witness.moves.join(' ')}](${f.witness.url})${f.witness.freshLoadVerified ? '' : ' (requires prior history)'} |\n`;
    return text;
}
