# Seven-diagonal support requires its knight in place

A seven-diagonal bishop now qualifies only when the knight occupies the corresponding seven-diagonal support square: d3 for a2–g8, including all eight symmetries. A knight one move away no longer establishes support. All existing king, bishop, edge-knight, and race checks remain. Knight proximity can still guide preparation through the existing preferences.

This supersedes the narrower off-d3/a3 rejection and the approaching-knight race conditions, which were removed as redundant. No new move preferences were added. Five- and three-diagonal support rules retain their existing knight conditions.

The former Ne7+ loop is unsupported after Ne7+, as is its reflected Nb4+ placement. Occupied d3 and reflected f5 support cases remain eligible when the other conditions pass. 207 bishop-and-knight policy/phase tests pass; the production build passes. Tests that intentionally credited approaching seven-knights were updated, including the existing r5 Ke6 prescription now surviving because Nb2 no longer creates support.

## Exhaustive audit

```sh
npm run audit:unsupported -- --scope supported --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-seven-knight --workers 4 --gate loops
```

The census classified all 13,660,584 physical placements and selected **23,340 supported starts**, down from 69,956. All tied best continuations are followed through loss of support, retaining Black return history, until mate, capture, or stalemate. Clocks and repetition claims are excluded; Black follows the app’s policy rather than arbitrary legal defense.

- Zero supported placements lie directly on a loop.
- **144 supported starts (0.6170%)** can lose support and reach a loop; the loop gate correctly reports FAIL.
- Two symmetry-distinct unsupported four-ply loops remain downstream.
- 21,988 starts can reach mate; 1,280 can reach capture or stalemate. Outcome sets can overlap.
- 3,869 history states and 3,926 transitions.

The two minimal loops were normalized to a light-squared bishop nearer a8 and independently verified against production best moves for two complete laps. Their four-ply replays decode at cursor zero. All post-White boards within both loops are unsupported.

1. `8/3k4/8/3B1K2/2N5/8/8/8 w - - 0 1`: Ke5, Ke7, Kf5, Kd7. Reachable from 80 physical supported starts.
2. `8/3k4/8/3BK3/2N5/8/8/8 w - - 0 1`: Kd4, Ke7, Ke5, Kd7. Reachable from 64 physical supported starts.

Policy fingerprint: `e3c0296695c827a94a11b8a006745ae1d1232651385bb951e497b43075efa761`. The manifest records parent 8a5af03; the fingerprint includes this working policy change.
