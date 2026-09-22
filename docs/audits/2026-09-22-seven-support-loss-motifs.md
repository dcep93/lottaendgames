# Seven-diagonal first-support-loss motifs

Classification of the 20,816 seven-diagonal starting placements that can lose support in the exhaustive Kc5 snapshot (`8401b7af44361d91b137c2b129bbec43a081877a356af61b51be87fa0aa4699c`). No policy changed in this analysis.

Each start is followed along all best-policy paths only until its **first** unsupported post-White board. Later losses do not influence this classification. The arrangement is measured immediately before the White move that first loses support. Align a light bishop closer to a8 than h1, then choose the reflection putting the knight closer to a1. Include all physical symmetry copies in root counts.

“Remote” means not adjacent to White’s king. Distances are king steps. Upper bishop means e6, f7, or g8. These are piece-position groups, not categories based on which piece moves.

| Arrangement before first loss | Starting positions exposed | Share of 20,816 |
|---|---:|---:|
| Remote upper bishop, Black within two steps, Nd3 | 7,344 | 35.28% |
| Remote upper bishop, Black within two steps, knight off d3 | 6,448 | 30.98% |
| Other remote bishop, Black within two steps | 5,152 | 24.75% |
| Other remote bishop, Black farther than two steps | 760 | 3.65% |
| King-protected bishop, Black within two steps | 592 | 2.84% |
| King-protected bishop, Black farther than two steps | 568 | 2.73% |

Counts overlap: 48 starting placements can reach more than one group. The first two groups together cover **13,792 distinct starts (66.26%)**. More broadly, any bishop on e6/f7/g8 covers 14,784 starts (71.02%). These are exposure counts, not a prediction of how many starts a rule change would fix.

## Recommended first family: remote upper bishop with Nd3

7,344 starts (35.28%) reach this family, of which 7,296 have no first-loss motif outside it. Subgroups: Bg8/Nd3 3,336; Bf7/Nd3 2,152; Be6/Nd3 1,856. Black is within two king steps of the bishop and White’s king is not adjacent to it.

Verified fresh-load best-policy examples:

- [Bg8/Nd3: 1.Kd4 Ke8 2.Bd5 Ke7](http://localhost:5173/mate/bishop-knight#fen=6B1/3k4/8/8/8/2KN4/8/8_w_-_-_0_1&moves=Kd4,Ke8,Bd5,Ke7&cursor=0)
- [Bf7/Nd3: 1.Kc3 Kd7 2.Kd4 Ke7](http://localhost:5173/mate/bishop-knight#fen=8/5B2/2k5/8/8/3N4/1K6/8_w_-_-_0_1&moves=Kc3,Kd7,Kd4,Ke7&cursor=0)
- [Be6/Nd3: 1.Kc3 Kd6 2.Bh3 Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/2k1B3/8/8/3N4/1K6/8_w_-_-_0_1&moves=Kc3,Kd6,Bh3,Kd5&cursor=0)

In each example White’s first move produces supported seven; White’s second move produces unsupported. After Black’s first reply, **no legal White move produces support or mate**. These witnesses therefore need an earlier setup change or a stricter support definition, not merely a different second-move tie-breaker. In the Bg8 witness even 1.Bb3 is already unsupported; 1.Kd4 is the only legal support-preserving move under the current definition.

Across the whole population, 19,704 starts (94.66%) can reach a first-loss arrangement with no legal supported/mating alternative; 1,112 (5.34%) reach one with at least one such legal alternative. A legal supported alternative has not been asserted to survive earlier safety filters.

## Artifacts and method

Directory: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-kc5-support-loss`.

- `first-support-loss-motifs.json`: weighted start membership, 460 symmetry-normalized losing transitions, bishop/knight and full White-piece subgroups.
- `first-support-loss-options.json`: every legal supported/mating alternative at each transition.
- `loss-witnesses.json`: replayable witnesses.
- Scripts in `/Users/danielcepeda/repos/_codex_output`: `bn-classify-support-loss.mts`, `bn-loss-options.mts`, `bn-loss-witness.mts`.

Read saved White policy branches; explicitly re-evaluate terminal branches omitted from stored edges. Seed the losing White moves, then propagate their motif membership backward **only through supported post-White edges**. Weight each seven-root’s union of memberships by its symmetry multiplicity. The resulting total independently matches the previously computed 20,816 roots. Terminal mate is excluded as a loss; unsupported boards before capture/stalemate are included. The source policy remains unchanged and its audit still has zero reachable loops.
