# Two Bishops exhaustive census — 8 September 2026

The complete census found positions that can avoid checkmate. All 312,286 symmetry-distinct eligible starts were enumerated, and all 312,439 reachable canonical White positions were expanded. Census runtime: **34m 39s**, using six workers. Audited policy commit: **5c97f4c**.

## Scope and outcomes

Every tied preferred White move and every legal Black reply was included. Each start has halfmove clock zero. The start set uses the app's existing validator and bishop-survival check, including train seeds. These checks exclude unavoidable bishop-loss starts and positions where Black would already be terminal if it were Black's turn. Rotations and reflections count once. The graph detects structural cycles; maximum mating ranks also detect paths exceeding the 100-ply draw limit. No history before the starting position is assumed.

| Starting-position outcome | Positions | Percentage |
| --- | ---: | ---: |
| Guaranteed mate before the draw limit | 311,842 | 99.86% |
| Can reach a structural policy loop | 420 | 0.13% |
| Can reach stalemate, excluding loop-leading starts | 2 | <0.01% |
| Structurally mating, but can exceed the draw limit | 22 | 0.01% |

The four outcome rows are disjoint. An independent SCC calculation found **65 cyclic components containing 101 cyclic states**, with at most two canonical states per component; 420 starting positions can reach those components. The census examined **312,837 preferred White choices** and **1,309,264 legal Black replies**. The maximum finite structural mating rank was **103 plies**; this measures paths before applying the draw cutoff.

## Five playable examples

Each replay starts at cursor zero and repeats the exact physical board after four legal plies. Every White move is preferred by the audited policy. Black replies are legal; the audit permits every legal reply. These five examples limit the report, not the completed search.

| Position | Replay sequence | White filtering rules |
| --- | --- | --- |
| WK g3; Be3, Bh1; BK b8 | [Bf4+ Ka7 Be3+ Kb8](http://localhost:5173/mate/two-bishops#fen=1k6/8/8/8/8/4B1K1/8/7B_w_-_-_0_1&moves=Bf4%2B,Ka7,Be3%2B,Kb8&cursor=0) | r12, r10 |
| WK h2; Be3, Bh1; BK b8 | [Bf4+ Ka7 Be3+ Kb8](http://localhost:5173/mate/two-bishops#fen=1k6/8/8/8/8/4B3/7K/7B_w_-_-_0_1&moves=Bf4%2B,Ka7,Be3%2B,Kb8&cursor=0) | r12, r10 |
| WK h2; Bf2, Bh1; BK b8 | [Bg3+ Ka7 Bf2+ Kb8](http://localhost:5173/mate/two-bishops#fen=1k6/8/8/8/8/8/5B1K/7B_w_-_-_0_1&moves=Bg3%2B,Ka7,Bf2%2B,Kb8&cursor=0) | r12, r10 |
| WK h8; Bd4, Bg8; BK g6 | [Bh7+ Kf7 Bg8+ Kg6](http://localhost:5173/mate/two-bishops#fen=6BK/8/6k1/8/3B4/8/8/8_w_-_-_0_1&moves=Bh7%2B,Kf7,Bg8%2B,Kg6&cursor=0) | r12, r12 |
| WK h8; Bc3, Bg8; BK g6 | [Bh7+ Kf7 Bg8+ Kg6](http://localhost:5173/mate/two-bishops#fen=6BK/8/6k1/8/8/2B5/8/8_w_-_-_0_1&moves=Bh7%2B,Kf7,Bg8%2B,Kg6&cursor=0) | r12, r12 |

## Rule-filter census

Counts use each expanded symmetry-canonical White position once, including reachable positions that are not eligible as fresh starts. A removed candidate is credited to the first ordered rule that eliminates it. Positions affected count where the rule removed at least one move. Cache reuse and repeated roots do not add counts.

| Rule | Moves eliminated | Positions affected |
| --- | ---: | ---: |
| mate | 9,552 | 458 |
| bishops safe | 904,655 | 229,490 |
| no stalemate | 6,878 | 4,920 |
| rule r3 | 336,105 | 68,340 |
| rule r4 | 17,047 | 909 |
| rule r5 | 41,330 | 2,041 |
| rule r6 | 682,463 | 35,576 |
| rule r8 | 43,696 | 2,336 |
| rule r10 | 4,488,421 | 255,526 |
| rule r11 | 7 | 4 |
| rule r12 | 82,606 | 23,736 |
| rule r18 | 38 | 12 |
| rule r19 | 14,271 | 7,755 |
| rule r22 | 23,005 | 5,816 |
| rule r25 | 36,903 | 18,349 |
| rule r30 | 59,328 | 21,327 |

Total: **6,746,305 moves eliminated** across **312,439 positions**. Adding retained preferred moves accounts for **7,059,142 legal White candidates**.

## Calculation findings

**R10 uses inconsistent wall eligibility across its subpriorities.** Its diagonal and target calculations allow Black on the inner wall; its bishop-edge calculation excludes that case. After the checking moves in all five examples, the edge lookup can return no target corners and therefore zero edge penalty even though a bishop remains on the relevant edge. For the first loop, Bf4+ leaves Bh1 on the h8 corner's h-file edge; Be3+ leaves it on the a1 corner's first-rank edge. Both receive penalty zero. King alternatives retain penalty one and are discarded before later priorities can help.

An isolated prototype applying the same on-wall eligibility to the edge calculation raises these penalties to one and excludes all five exact loops. It selects Bf3/Bg2 in the first example and Ba2/Bb1 in the final two examples. This prototype was not applied to the audited policy. A bounded 256-position check of one prototype root was incomplete, so the prototype has no exhaustive termination certificate.

**R12 can reward moving its reference diagonal.** In the final two examples White stays on h8 while a checking bishop move shifts the beyond-wall diagonal one step toward the king, reducing the score from two steps to one. R12 then selects the oscillating check. This observation does not establish a separate required rule change: correcting the r10 edge calculation already excludes these five cycles. Fixing r12 to the starting wall would be a further interpretation decision.

## Performance and verification

- Shared starting geometry and one piece extraction per candidate made the selector about **39% faster** in a 200-position benchmark (median 1,263ms to 774ms). Full scores, selected moves, and rule counts matched across **2,264 positions and 51,544 moves**, including all eight board symmetries.
- Early bishop-color and Black-king symmetry pruning reduced raw geometry candidates from **3,469,344 to 541,725** while preserving all **433,668 geometric symmetry orbits** and first representatives. The first 1,024 actual roots matched the old iterator exactly.
- Six workers score positions; a single parent saves prepared-statement SQLite checkpoints. The full graph is classified in linear time without retaining duplicate expansion caches. The old first-failure stopping behavior has been replaced for this command.
- Remaining measured opportunity: r4 mate lookahead rebuilds and replays moves whose generated SAN already marks mate with '#'. A temporary 51-position prototype reduced that heavy pocket from 4.39s to 1.45s, with identical choices and counts; it was not applied during this frozen run.
- The 96 policy tests, 20 graph/census tests, and TypeScript checks passed. An independent prefix-100 audit re-expanded all 265 states, matched every transition and rule counter, and matched every root's maximum rank against the existing DFS verifier. An independent full-graph SCC check then matched the cycle and terminal-failure classification, and a separate SQL aggregation matched all 16 rule totals. All five final witnesses were checked against the completed graph and replayed again.

Machine-readable results and fingerprints: [two-bishops-census-2026-09-08.json](/Users/danielcepeda/repos/lottaendgames/docs/two-bishops-census-2026-09-08.json).
