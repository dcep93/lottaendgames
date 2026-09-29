# Full audit after legal attackability and king-approach corrections

Policy fingerprint: `51e00d614a0f95c638ce89a9ce9837a7c5b0ec41e6efa75056abba98dd5fe4c1`. Fresh executable snapshot; no production policy edits during the audit. No commit or push.

Fresh census: **13,660,584 physical post-White placements**, **1,707,888 D4 root orbits**. Recomputed every one of **1,359,344 discovered White policy states**. All preferred White ties and all legal Black replies; no old move-choice cache reused.

Degenerate A/B/C at every ply. Include completed r4, edge kings, central king/knight pairs, and all temporarily deferred motifs.

Positions mean post-White boards directly on a cycle, not positions that can reach a cycle. All counts below are D4-deduplicated. Four-ply cycles are also deduplicated by starting phase. Fifty-move/repetition claims are outside this structural analysis.

## Counts

| Measure | Count |
| --- | ---: |
| Positions on any loop | 2,028 |
| Physical positions on any loop | 16,224 |
| Distinct four-ply loops | 2,571 |
| Positions on four-ply loops | 2,025 |
| Positions on longer simple loops | 699 |
| Positions on both | 696 |
| Positions only on longer loops | 3 |
| Cyclic components | 639 |
| Completed-r4 positions on loops | 41 |

All-length position membership is exhaustive. The number of distinct longer simple cycles is not enumerated; longer-loop figures count positions.

## Main archetypes

The categories below partition four-ply cycles. A loop may contribute positions to multiple rows, so the participating-position counts must not be summed. The opposition/attack alternation is recognized first, then other geometry categories.

Opposition means kings two squares apart on the same rank or file; diagonal opposition is reported separately. The attack phase has Black adjacent to a knight not king-protected. Alternation tests both White-to-move phases. Full-audit exclusions are degenerates only.

| Archetype | Four-ply loops | Participating positions |
| --- | ---: | ---: |
| King shuffle — Other king-protected knight | 2,048 | 1,620 |
| King shuffle — King and knight adjacent on edge | 370 | 272 |
| Bishop shuffle — King and knight both in middle 16 | 112 | 67 |
| Knight shuffle — Black alternates opposition and attacking the knight | 22 | 42 |
| Knight shuffle — Other attacked-knight positions | 11 | 19 |
| King shuffle — King and knight both in middle 16 | 5 | 6 |
| Knight shuffle — Other king-protected knight | 2 | 3 |
| Knight shuffle — Black alternates diagonal opposition and attacking the knight | 1 | 2 |

## Central pieces and corners

Central means d4/e4/d5/e5; central-piece counts include White king, bishop, and knight. Middle-16 and Black-inclusive counts are also preserved in the JSON.

| Central White pieces | Any loop | Four-ply loops | Only longer loops |
| --- | ---: | ---: | ---: |
| 0 | 1,881 | 1,878 | 3 |
| 1 | 78 | 78 | 0 |
| 2 | 21 | 21 | 0 |
| 3 | 48 | 48 | 0 |

345 loop positions have at least one White piece in a corner, including White king; 384 have any piece in a corner, including Black king.

## Verified examples

These ten are the opposition/attacked-knight motif after applying the usual deferrals. Of the 12 four-ply cycles that remain under those deferrals, 10 have this motif and two are other king-protected-knight shuffles. These are a subset of the full audit above.

1. [Ne3+ Kd4 Nd1 Kd5](http://localhost:5173/mate/bishop-knight#fen=8/3K4/8/3k3B/8/8/8/3N4_w_-_-_0_1&moves=Ne3%2B,Kd4,Nd1,Kd5&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `8/3K4/8/3k3B/8/8/8/3N4 w - - 0 1`
2. [Nb5+ Ke5 Nc3 Kd4](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/6K1/3k4/2N5/8/8_w_-_-_0_1&moves=Nb5%2B,Ke5,Nc3,Kd4&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `4B3/8/8/6K1/3k4/2N5/8/8 w - - 0 1`
3. [Nc3 Kd4 Ne2+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/4K3/B7/4k3/8/8/4N3/8_w_-_-_0_1&moves=Nc3,Kd4,Ne2%2B,Ke5&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `8/4K3/B7/4k3/8/8/4N3/8 w - - 0 1`
4. [Nf2 Ke3 Nd1+ Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/3K4/7B/3k4/8/8/3N4_w_-_-_0_1&moves=Nf2,Ke3,Nd1%2B,Kd4&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `8/8/3K4/7B/3k4/8/8/3N4 w - - 0 1`
5. [Na4+ Kd4 Nb6 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/1N6/2k5/5K2/8/8/3B4_w_-_-_0_1&moves=Na4%2B,Kd4,Nb6,Kc5&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `8/8/1N6/2k5/5K2/8/8/3B4 w - - 0 1`
6. [Nb5+ Ke5 Nc3 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/3B4/8/6K1/3k4/2N5/8/8_w_-_-_0_1&moves=Nb5%2B,Ke5,Nc3,Kd4&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `8/3B4/8/6K1/3k4/2N5/8/8 w - - 0 1`
7. [Nc2+ Kc5 Ne3 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/2K5/8/8/B2k4/4N3/8/8_w_-_-_0_1&moves=Nc2%2B,Kc5,Ne3,Kd4&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `8/2K5/8/8/B2k4/4N3/8/8 w - - 0 1`
8. [Na6+ Kd6 Nb4 Kc5](http://localhost:5173/mate/bishop-knight#fen=2B5/8/5K2/2k5/1N6/8/8/8_w_-_-_0_1&moves=Na6%2B,Kd6,Nb4,Kc5&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `2B5/8/5K2/2k5/1N6/8/8/8 w - - 0 1`
9. [Na4 Ke4 Nc5+ Kd5](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/2Nk4/6K1/8/8/8_w_-_-_0_1&moves=Na4,Ke4,Nc5%2B,Kd5&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `4B3/8/8/2Nk4/6K1/8/8/8 w - - 0 1`
10. [Na4+ Kd4 Nb6 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/1N6/2k5/5K2/8/2B5/8_w_-_-_0_1&moves=Na4%2B,Kd4,Nb6,Kc5&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `8/8/1N6/2k5/5K2/8/2B5/8 w - - 0 1`

## Validation

- Fresh worker compared with the unoptimized production snapshot, plus D4 symmetry and root-census checks.
- Independent four-ply enumeration from the saved graph matched all 2,571 cycle signatures from production-policy replay.
- Filtered cycle membership independently verified by return reachability.
- Every displayed replay uses current preferred White moves, legal Black replies, and exact closure.
- The five-edge-prefix check establishes membership on longer simple cycles without confusing concatenated four-ply cycles with longer simple cycles.

[Manifest](/Users/danielcepeda/repos/_codex_output/bn-full-legal-attackability-2026-09-28/manifest.json) · [Summary JSON](/Users/danielcepeda/repos/_codex_output/bn-full-legal-attackability-2026-09-28-filtered/summary.json) · [Four-ply cycles](/Users/danielcepeda/repos/_codex_output/bn-full-legal-attackability-2026-09-28-filtered/four-ply-count.json) · [Longer-cycle membership](/Users/danielcepeda/repos/_codex_output/bn-full-legal-attackability-2026-09-28-filtered/long-cycle-position-membership.json)
