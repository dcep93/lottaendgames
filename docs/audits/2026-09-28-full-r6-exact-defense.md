# Full audit after r6 opposition and exact r4.6 Kc5 declarations

Fresh audit on 2026-09-28. No rule behavior changed during this run; no commit or push.

## Scope and completeness

Rebuilt **13,660,584 physical post-White placements**, representing **1,707,888 D4 root orbits**, then recomputed all **1,359,344 White policy states** and **7,393,561 edges**. Every preferred White tie and every legal Black reply is included. No previous-policy move cache was reused. Exclude degenerate A/B/C at every ply; include every temporarily deferred group because this is a full audit.

Positions below are post-White placements directly on cycles, D4-deduplicated. Four-ply loops are additionally deduplicated by starting phase. Repetition and fifty-move draw claims are outside this structural graph analysis.

## Results

| Measure | Count |
| --- | ---: |
| Positions on any loop | 232 |
| Physical positions on any loop | 1,856 |
| Distinct four-ply loops | 183 |
| Positions on four-ply loops | 232 |
| Positions also on longer simple loops | 41 |
| Positions only on longer loops | 0 |
| Cyclic components | 92 |
| Supported loops / support losses | 0 / 0 |

Longer-loop figures count positions, not distinct cycles. All-length cycle membership is exhaustive; distinct longer simple cycles were not enumerated.

Compared with the previous complete audit: **94 positions retained, 106 removed, 138 newly introduced** (200 → 232). Four-ply cycles: **104 retained, 82 removed, 79 newly introduced** (186 → 183). All 104 from the intervening survivor-only checks remain; those checks could not discover these 79 new cycles.

## Archetypes

The following partition the four-ply cycles. Participating positions can overlap across categories and must not be added.

| Archetype | Four-ply loops | Participating positions |
| --- | ---: | ---: |
| Bishop shuffle — Fully satisfied r4 (deferred) | 83 | 41 |
| King shuffle — Other king-protected knight | 78 | 155 |
| Knight shuffle — Knight checks; Black alternates opposition to knight and king (deferred) | 7 | 14 |
| King shuffle — King and knight both in middle 16 | 7 | 9 |
| Knight shuffle — Other attacked-knight positions | 5 | 10 |
| Knight shuffle — Black alternates opposition and attacking the knight | 1 | 2 |
| Knight shuffle — Black alternates diagonal opposition and attacking the knight | 1 | 2 |
| Bishop shuffle — Other king-protected knight | 1 | 2 |

The largest group has a fully satisfied r4 position in at least one phase. The next group is king shuffling while maintaining knight protection: **78 cycles, 75 newly introduced**. In the first linked example, r6 chooses Kb1 to take opposition; after Black's Kc3, r7 chooses Kc1 for central proximity. Black returns to b3 and repeats. When this deferred group is reopened, the r6/r7 interaction is a concrete place to investigate; no rule change was made in this audit.

## Ordinary-search deferrals

All 183 four-ply cycles fall into your deferred groups. Disjoint priority assignment: 83 fully satisfied r4; 7 alternating knight-check/opposition; 47 edge White king; 7 king and knight in middle 16; 39 protected knight with no available more-central king step retaining protection. **Zero eligible four-ply loops remain under all these filters.** All 41 positions on longer simple loops have all three White pieces in the middle 16, so those are deferred as well.

## Central pieces and corners

Central means d4/e4/d5/e5. Counts include White king, bishop and knight.

| Number of central White pieces | Any-loop positions | Positions on longer loops |
| --- | ---: | ---: |
| 0 | 178 | 0 |
| 1 | 5 | 0 |
| 2 | 9 | 1 |
| 3 | 40 | 40 |

22 positions have a White piece in a corner; 24 have any piece in a corner. Seven positions have the White king and knight adjacent with both on the edge.

## Ten verified full-audit examples

These are deliberately labeled **deferred full-audit examples**, not ordinary-search candidates. All have a light-squared bishop and White king nearer a1 than h8. Each link passed the app replay decoder, preferred-White/legal-Black replay, and exact loop closure. They illustrate the 78-cycle king-shuffle group, ordered toward wider White-piece spread.

1. [Kb1 Kc3 Kc1 Kb3](http://localhost:5173/mate/bishop-knight#fen=8/7B/8/8/8/1k6/1N6/2K5_w_-_-_0_1&moves=Kb1,Kc3,Kc1,Kb3&cursor=0) — 8/7B/8/8/8/1k6/1N6/2K5 w - - 0 1
2. [Kg1 Kf3 Kf1 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/B7/8/8/6k1/6N1/5K2_w_-_-_0_1&moves=Kg1,Kf3,Kf1,Kg3&cursor=0) — 8/8/B7/8/8/6k1/6N1/5K2 w - - 0 1
3. [Kg1 Kf3 Kf1 Kg3](http://localhost:5173/mate/bishop-knight#fen=2B5/8/8/8/8/6k1/6N1/5K2_w_-_-_0_1&moves=Kg1,Kf3,Kf1,Kg3&cursor=0) — 2B5/8/8/8/8/6k1/6N1/5K2 w - - 0 1
4. [Kd2 Kc4 Kc2 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/7B/8/8/3k4/2N5/2K5/8_w_-_-_0_1&moves=Kd2,Kc4,Kc2,Kd4&cursor=0) — 8/7B/8/8/3k4/2N5/2K5/8 w - - 0 1
5. [Kb1 Kc3 Kc1 Kb3](http://localhost:5173/mate/bishop-knight#fen=8/8/6B1/8/8/1k6/1N6/2K5_w_-_-_0_1&moves=Kb1,Kc3,Kc1,Kb3&cursor=0) — 8/8/6B1/8/8/1k6/1N6/2K5 w - - 0 1
6. [Kb1 Kc3 Kc1 Kb3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/7B/8/1k6/1N6/2K5_w_-_-_0_1&moves=Kb1,Kc3,Kc1,Kb3&cursor=0) — 8/8/8/7B/8/1k6/1N6/2K5 w - - 0 1
7. [Kb1 Kc3 Kc1 Kb3](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/8/8/1k6/1N6/2K5_w_-_-_0_1&moves=Kb1,Kc3,Kc1,Kb3&cursor=0) — 4B3/8/8/8/8/1k6/1N6/2K5 w - - 0 1
8. [Ke2 Kf4 Kf2 Ke4](http://localhost:5173/mate/bishop-knight#fen=8/8/B7/8/4k3/5N2/5K2/8_w_-_-_0_1&moves=Ke2,Kf4,Kf2,Ke4&cursor=0) — 8/8/B7/8/4k3/5N2/5K2/8 w - - 0 1
9. [Kg1 Kf3 Kf1 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1B6/8/6k1/6N1/5K2_w_-_-_0_1&moves=Kg1,Kf3,Kf1,Kg3&cursor=0) — 8/8/8/1B6/8/6k1/6N1/5K2 w - - 0 1
10. [Kb3 Kd4 Kb4 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/1K6/2Nk4/8/7B_w_-_-_0_1&moves=Kb3,Kd4,Kb4,Kd3&cursor=0) — 8/8/8/8/1K6/2Nk4/8/7B w - - 0 1

## Performance and validation

Audit-worker Black replies now use the existing lightweight legal-reply helper. Root child boards are encoded directly from legal king destinations instead of verbose Move creation and move/undo. Chess.js remains responsible for legality. On the before/after benchmark, root processing improved about 39%; White policy expansion was essentially unchanged. Full census runtime was **1,180 seconds (~19.7 minutes)**, versus ~883 seconds for the previous full audit under an older policy, so this run does not demonstrate an end-to-end speedup.

Every benchmark output matched. Fifteen targeted tests passed. Full-run validation checked 1,000 roots, 1,928 White nodes, 1,000 symmetry samples, and the exact root census. Both independent four-ply methods agreed on **all 183 signatures**, not just the count. Filtered membership was independently checked by reachability, and longer-simple-cycle membership by five-edge prefixes plus return reachability avoiding internal vertices.

[Performance notes](/Users/danielcepeda/repos/lottaendgames/docs/audits/2026-09-28-r6-audit-performance.md) · [Manifest](/Users/danielcepeda/repos/_codex_output/bn-full-r6-exact-defense-2026-09-28/manifest.json) · [Results](/Users/danielcepeda/repos/_codex_output/bn-full-r6-exact-defense-2026-09-28-filtered/result.json) · [Comparison and deferrals](/Users/danielcepeda/repos/_codex_output/bn-full-r6-exact-defense-2026-09-28-filtered/comparison-and-deferrals.json) · [Four-ply signatures](/Users/danielcepeda/repos/_codex_output/bn-full-r6-exact-defense-2026-09-28-filtered/four-ply-count.json) · [Longer-loop membership](/Users/danielcepeda/repos/_codex_output/bn-full-r6-exact-defense-2026-09-28-filtered/long-cycle-position-membership.json)
