# Optimal r2 bridge

Keep the current r1 reachable source/edge net frozen. Compute the minimum worst-case number of White moves to first reach an r1 White-to-move source, considering every legal KBN-v-K move and every legal Black reply, ignoring clocks. Checkmate remains a higher-priority rule. Captures reducing material and stalemate are failures for this reachability objective.

Use retrograde AND/OR reachability over the full board domain. White nodes use 1 + minimum successor cost; Black nodes use maximum successor cost and require every reply to succeed. Seed only the frozen r1 White sources at cost zero. Unknown states remain unreachable. Independently check the Bellman equations over the full domain.

Export a D4-reduced deterministic policy for the closure of the established r2 starts and existing stage sources/entries under optimal White choices and all Black replies. Preserve existing choices when optimal; otherwise choose a deterministic optimal move. This table takes precedence over historical r2 destinations, while exact r1 edges and higher-priority rules remain intact. Outside the covered bridge, existing setup rules still run. No online search or broad all-board r2 takeover.

Validate native move generation against chess.js, validate all exported branches and exact rank descent, and verify r1 graph/attribution unchanged. Report root bridge distributions and mate costs separately: optimal bridge cost is not optimal mate cost. Keep the old reviewed data as provenance and fallback, not as a competing higher-priority bridge policy.
