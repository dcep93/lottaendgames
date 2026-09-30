# R4.2: avoid a forced undo loop

R4.2 now penalizes a candidate White move when Black has a legal reply after which the existing r4.2 lookup requires White to reverse that exact move, and Black can legally reverse its own reply to restore the original position. The test ignores move counters.

The reply must actually be decided by r4.2 with a single selected reversal. A lookup entry alone is insufficient if an earlier rule takes precedence. Other kinds of repetition, other rules' reversals, and merely reaching another r4.2 position do not activate this preference.

The probe disables its own lookahead. R4.1's existing probe also keeps both lookaheads disabled so its behavior is unchanged and the probes cannot recursively call each other. Repeated r4.2 decisions use a bounded position cache. The preference remains at r4.2 in the ordinary priority framework, after r4.1 and before r4.5; it does not change r1 or r2 routes. If an earlier rule decides, or all survivors tie, normal priority selection still applies.

The displayed text remains **“Prevent loss of a piece.”** R4.1's text also remains unchanged.

## Examples

These former loop-entry moves are now rejected by r4.2:

- [Nc1+ Kc2 Ne2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/K7/8/3k4/B3N3/8_w_-_-_0_1&moves=Nc1%2B,Kc2,Ne2,Kd3&cursor=0): recommends Nf4+ instead of Nc1+.
- [Ka1 Kc1 Ka2 Kc2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/8/K1k1B3/5N2_w_-_-_0_1&moves=Ka1,Kc1,Ka2,Kc2&cursor=0): recommends Ne3+ instead of Ka1.
- [Nf7+ Kf6 Nh6 Kg5](http://localhost:5173/mate/bishop-knight#fen=4B3/8/7N/6k1/8/8/8/1K6_w_-_-_0_1&moves=Nf7%2B,Kf6,Nh6,Kg5&cursor=0): recommends Ng8 instead of Nf7+.

The regression checks cover all eight D4 orientations, clock independence, the existing win-preserving declarations, and preserving r4.1 attribution for its separate Nb3+ reversal case.

## Safety and full graph check

Removing the old loop-entry choices exposed six missing safety cases, in two rounds of three. Those sources were added to the existing D4-reduced r4.2 lookup, choosing among tablebase-winning alternatives with the remaining preferences. No existing lookup entry was replaced. All 9,258 entries independently preserve a Syzygy win. This adds no runtime tablebase dependency or separate safety priority.

The cached full-graph audit refreshed every potentially affected decision and recomputed convergence over all legal positions. It found 58 changed decisions, with all removed recommendations rejected at r4.2. Cyclic components fell from **58 to 3** (120 to 9 canonical positions actually on cycles). Winning White-to-move starts that can reach a loop fell from **88,164 to 63,300**; winning Black-to-move starts that can reach a loop fell from **152,812 to 91,876**. No previously convergent winning White start became non-convergent. No recommendation from a winning position immediately loses the win. These are convergence checks ignoring the move clock, not a 50-move guarantee.

The ten focused r4.1/r4.2 tests and eight stage-invariant tests passed, as did the build. Audit details and the six added source/move pairs are in [the audit record](audits/2026-09-30-r42-lookahead.json). The audit includes the existing 40 uncommitted r2 shortcuts; this change does not alter or commit those shortcuts.
