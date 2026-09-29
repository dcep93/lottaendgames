# Full audit after r4/r4.5/r4.6/r4.7 changes — 2026-09-28

Policy fingerprint: `1be6e02498f1731cb48970a51b501513c72c563147635c75f13c81058da7b1d2`. Current uncommitted application policy; no production rules changed during this audit and no commit/push performed.

Fresh full census of **13,660,584 post-White placements**, **1,707,888 D4 root orbits**, and fresh recomputation of **1,359,344 White-turn states** with **6,512,955 graph transitions**. All preferred White ties and every legal Black reply are included. No prior move-policy cache is reused. Census plus policy enumeration took 1,101 seconds, excluding validation and reporting.

All counts below are D4-deduplicated unless explicitly physical. Positions mean post-White boards directly on a cycle, not boards that can reach one. Degenerate A/B/C exclusions apply at every ply; completed r4 setups are included. After deleting excluded vertices/edges, cyclic membership was recomputed and independently checked by return reachability.

## Counts

| Measure | Count |
| --- | ---: |
| Positions on any loop | 6,070 |
| Physical positions on any loop | 48,560 |
| Distinct four-ply loops | 8,637 |
| Positions on four-ply loops | 4,190 |
| Positions on longer simple loops | 5,258 |
| Positions on both | 3,378 |
| Positions only on longer loops | 1,880 |
| Cyclic components | 356 |
| Degenerate positions removed from original cyclic set | 32 |
| Completed-r4 loop positions | 41 |

Position membership at every length is exhaustive. Four-ply cycles are enumerated exactly. The total number of distinct longer simple cycles has **not** been enumerated; 5,258 is a position count, not a cycle count. The longest shortest return among cyclic positions is 38 plies. Fifty-move/repetition claims are ignored for structural loop detection.

## Position archetypes

These are disjoint categories, assigned in the order shown. Edge pair means both White king and knight occupy edge squares and are adjacent (including diagonal adjacency). Central means d4/e4/d5/e5.

| Archetype | Loop positions |
| --- | ---: |
| King and knight adjacent on edge | 876 |
| Three central White pieces, r4 complete | 41 |
| King-protected central knight | 40 |
| King and noncentral knight orthogonally adjacent | 4,713 |
| King and noncentral knight diagonally adjacent | 15 |
| King and knight separated | 385 |

## Four-ply archetypes

The named formation persists through every ply. Counts partition cycles; the participating-position counts may overlap.

| Archetype | Four-ply loops | Participating positions |
| --- | ---: | ---: |
| Bishop shuffle — King and noncentral knight orthogonally adjacent | 4,933 | 2,644 |
| King shuffle — King and noncentral knight orthogonally adjacent | 1,406 | 589 |
| King shuffle — King and knight adjacent on edge | 1,060 | 420 |
| Bishop shuffle — King and knight adjacent on edge | 894 | 646 |
| Knight shuffle — Knight not always king-protected | 227 | 384 |
| Bishop shuffle — Three central White pieces, r4 complete | 84 | 41 |
| Bishop shuffle — King-protected central knight | 28 | 26 |
| King shuffle — King-protected central knight | 5 | 6 |

## Central pieces and corners

| Central White pieces, including king | All cyclic positions | Positions on four-ply loops | Only longer loops |
| --- | ---: | ---: | ---: |
| 0 | 5,322 | 3,959 | 1,363 |
| 1 | 669 | 162 | 507 |
| 2 | 31 | 21 | 10 |
| 3 | 48 | 48 | 0 |

1,375 loop positions have a White piece in a corner (including White king). 1,643 have any piece in a corner, including Black king.

## Recommendation: stop distinguishing orthogonal and diagonal king protection in r4.7

When the knight is already king-protected, treat that as full proximity rather than preferring distance 1 over sqrt(2). Then use knight central proximity to break the tie. Keep the existing distance criterion for unprotected knights. This is a small geometric change, not a repetition rule or lookahead search.

In example 1 below, Nf3 remains king-protected and approaches the center, but current r4.7 rejects it because the knight would become diagonally adjacent instead of orthogonally adjacent. The counterfactual selects Nf3 instead of Bb7.

A read-only counterfactual reselected all legal White candidates for every recorded four-ply loop. It broke **8,292 / 8,637** existing cycles (96.0%), leaving **345** of those cycles intact. This includes **all 1,954 edge-pair cycles** and **all 4,933 bishop-shuffle cycles in the largest archetype**. This does not prove a net reduction to 345: new cycles and longer cycles require a fresh graph after implementation. Production rules have not been changed.

An alternative experiment prioritized the correct-color central king square before bishop centralization at the last r4 stage. It broke 28 existing four-ply cycles, so it is a much smaller next target than the protection-distance distinction.

## Ten current-policy examples

Examples 1–6 cover the largest bishop-shuffle archetype with varied White formations. Examples 7–10 cover king/knight edge pairs (two king shuffles and two bishop shuffles). All were replay-verified against current preferred White moves and legal Black replies, with exclusions checked at every ply.

1. [Bb7 Kc1 Ba8 Kb2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/8/1k4K1/6N1_w_-_-_0_1&moves=Bb7,Kc1,Ba8,Kb2&cursor=0) — `B7/8/8/8/8/8/1k4K1/6N1 w - - 0 1`
2. [Bh7 Kc3 Bg8 Kb4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/1k6/8/KN6/8_w_-_-_0_1&moves=Bh7,Kc3,Bg8,Kb4&cursor=0) — `6B1/8/8/8/1k6/8/KN6/8 w - - 0 1`
3. [Bg8 Ke3 Bh7 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/7B/8/8/3k4/8/1K6/1N6_w_-_-_0_1&moves=Bg8,Ke3,Bh7,Kd4&cursor=0) — `8/7B/8/8/3k4/8/1K6/1N6 w - - 0 1`
4. [Bg2 Kb5 Bh1 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/1K6/1N6/2k5/8/8/8/7B_w_-_-_0_1&moves=Bg2,Kb5,Bh1,Kc5&cursor=0) — `8/1K6/1N6/2k5/8/8/8/7B w - - 0 1`
5. [Bg2 Ke6 Bh1 Kd7](http://localhost:5173/mate/bishop-knight#fen=8/1N1k4/1K6/8/8/8/8/7B_w_-_-_0_1&moves=Bg2,Ke6,Bh1,Kd7&cursor=0) — `8/1N1k4/1K6/8/8/8/8/7B w - - 0 1`
6. [Bh7 Kb3 Bg8+ Kc3](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/8/2k5/1N6/1K6_w_-_-_0_1&moves=Bh7,Kb3,Bg8%2B,Kc3&cursor=0) — `6B1/8/8/8/8/2k5/1N6/1K6 w - - 0 1`
7. [Kh2 Kh7 Kg1 Kh8](http://localhost:5173/mate/bishop-knight#fen=B6k/8/8/8/8/8/8/6KN_w_-_-_0_1&moves=Kh2,Kh7,Kg1,Kh8&cursor=0) — `B6k/8/8/8/8/8/8/6KN w - - 0 1`
8. [Ka2 Kd4 Kb1 Kd5](http://localhost:5173/mate/bishop-knight#fen=8/7B/8/3k4/8/8/8/NK6_w_-_-_0_1&moves=Ka2,Kd4,Kb1,Kd5&cursor=0) — `8/7B/8/3k4/8/8/8/NK6 w - - 0 1`
9. [Bg2 Ka6 Bh1 Kb6](http://localhost:5173/mate/bishop-knight#fen=K7/N7/1k6/8/8/8/8/7B_w_-_-_0_1&moves=Bg2,Ka6,Bh1,Kb6&cursor=0) — `K7/N7/1k6/8/8/8/8/7B w - - 0 1`
10. [Bg2 Kd7 Bh1 Kc8](http://localhost:5173/mate/bishop-knight#fen=N1k5/K7/8/8/8/8/8/7B_w_-_-_0_1&moves=Bg2,Kd7,Bh1,Kc8&cursor=0) — `N1k5/K7/8/8/8/8/8/7B w - - 0 1`

## Validation and artifacts

- Production-versus-optimized policy: 1,000 roots and 1,928 White positions passed.
- 1,000 D4 symmetry checks and root census verification passed.
- Audit harness: 38 tests passed; TypeScript check passed.
- Independent return-reachability check agrees with filtered SCC membership.
- Four-ply counting verifies exact physical closure, then deduplicates full cycles by D4 and phase.
- Longer-cycle position membership uses simple five-edge prefixes and return reachability excluding prefix interiors.

[Source manifest](/Users/danielcepeda/repos/_codex_output/bn-full-r47-king-first-2026-09-28/manifest.json) · [Filtered summary](/Users/danielcepeda/repos/_codex_output/bn-full-r47-king-first-2026-09-28-filtered/summary.json) · [Four-ply signatures](/Users/danielcepeda/repos/_codex_output/bn-full-r47-king-first-2026-09-28-filtered/four-ply-count.json) · [Counterfactual results](/Users/danielcepeda/repos/_codex_output/bn-full-r47-king-first-2026-09-28-filtered/protected-distance-experiment.json)
