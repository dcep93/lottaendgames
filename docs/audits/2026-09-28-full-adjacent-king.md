# Full audit after adjacent-king r4.5 guard

Policy fingerprint: `ee449f754d77b025bbeedd80669daadf27c99ded326bd818647cee865d96e020`. Fresh executable snapshot; no production policy edits during the audit. No commit or push.

Fresh census: **13,660,584 physical post-White placements**, **1,707,888 D4 root orbits**. Recomputed every one of **1,359,344 discovered White policy states**. All preferred White ties and all legal Black replies; no old move-choice cache reused.

Exclude degenerate A/B/C at every ply. Include completed r4, edge kings, central king/knight pairs, and all temporarily deferred motifs.

Positions mean post-White boards directly on a cycle, not positions that can reach a cycle. All counts below are D4-deduplicated. Four-ply cycles are also deduplicated by starting phase. Fifty-move/repetition claims are outside this structural analysis.

## Counts

| Measure | Count |
| --- | ---: |
| Positions on any loop | 200 |
| Physical positions on any loop | 1,600 |
| Distinct four-ply loops | 186 |
| Positions on four-ply loops | 200 |
| Positions on longer simple loops | 49 |
| Positions on both | 49 |
| Positions only on longer loops | 0 |
| Cyclic components | 65 |
| Completed-r4 positions on loops | 41 |

Compared with the previous complete audit: 1,835 old loop positions no longer loop, 37 new loop positions appear, and 163 remain. This comparison is between independently rebuilt full graphs.


Four-ply cycle comparison: **141 retained**, **2410 removed**, **45 newly introduced**, giving **186 current cycles**.

All-length position membership is exhaustive. The number of distinct longer simple cycles is not enumerated; longer-loop figures count positions.

## Main archetypes

The categories below partition four-ply cycles. A loop may contribute positions to multiple rows, so the participating-position counts must not be summed. The opposition/attack alternation is recognized first, then other geometry categories.

Opposition means kings two squares apart on the same rank or file; diagonal opposition is reported separately. The attack phase has Black adjacent to a knight not king-protected. Alternation tests both White-to-move phases. Full-audit exclusions are degenerates only.

| Archetype | Four-ply loops | Participating positions |
| --- | ---: | ---: |
| Bishop shuffle — King and knight both in middle 16 | 112 | 67 |
| Bishop shuffle — Other king-protected knight | 36 | 72 |
| King shuffle — Other king-protected knight | 17 | 33 |
| Knight shuffle — Other king-protected knight | 9 | 17 |
| Knight shuffle — Other attacked-knight positions | 5 | 10 |
| King shuffle — King and knight both in middle 16 | 5 | 6 |
| Knight shuffle — Black alternates opposition and attacking the knight | 1 | 2 |
| Knight shuffle — Black alternates diagonal opposition and attacking the knight | 1 | 2 |

## Central pieces and corners

Central means d4/e4/d5/e5; central-piece counts include White king, bishop, and knight. Middle-16 and Black-inclusive counts are also preserved in the JSON.

| Central White pieces | Any loop | Four-ply loops | Only longer loops |
| --- | ---: | ---: | ---: |
| 0 | 126 | 126 | 0 |
| 1 | 5 | 5 | 0 |
| 2 | 21 | 21 | 0 |
| 3 | 48 | 48 | 0 |

24 loop positions have at least one White piece in a corner, including White king; 27 have any piece in a corner, including Black king.

## Verified examples

Usual deferrals retain 2 four-ply cycles. The full audit includes deferred motifs; examples below identify each motif.

1. [Nc6+ Ka8 Nb4 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Ka7&cursor=0) — Knight shuffle — Other king-protected knight
2. [Nc6+ Ka8 Nb4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Kb8&cursor=0) — Knight shuffle — Other king-protected knight
3. [Be4+ Kc4 Bf5 Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3k1B2/3N4/4K3/8/8_w_-_-_0_1&moves=Be4%2B,Kc4,Bf5,Kd5&cursor=0) — Bishop shuffle — King and knight both in middle 16 (deferred in ordinary searches)
4. [Bc4 Kc3 Be2 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3K4/1k1N4/8/4B3/8_w_-_-_0_1&moves=Bc4,Kc3,Be2,Kb4&cursor=0) — Bishop shuffle — King and knight both in middle 16 (deferred in ordinary searches)
5. [Bc4 Kc3 Bb5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1B1K4/1k1N4/8/8/8_w_-_-_0_1&moves=Bc4,Kc3,Bb5,Kb4&cursor=0) — Bishop shuffle — King and knight both in middle 16 (deferred in ordinary searches)
6. [Bg4 Ke7 Bf3 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/8/3NK3/5B2/8/8_w_-_-_0_1&moves=Bg4,Ke7,Bf3,Kd6&cursor=0) — Bishop shuffle — King and knight both in middle 16 (deferred in ordinary searches)
7. [Be4 Kf6 Bf5 Ke7](http://localhost:5173/mate/bishop-knight#fen=8/4k3/8/3K1B2/3N4/8/8/8_w_-_-_0_1&moves=Be4,Kf6,Bf5,Ke7&cursor=0) — Bishop shuffle — King and knight both in middle 16 (deferred in ordinary searches)
8. [Bc4+ Ke4 Bd3+ Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3k4/3N4/2KB4/8/8_w_-_-_0_1&moves=Bc4%2B,Ke4,Bd3%2B,Kd5&cursor=0) — Bishop shuffle — King and knight both in middle 16 (deferred in ordinary searches)
9. [Bg8 Kd3 Bh7+ Kc3](http://localhost:5173/mate/bishop-knight#fen=8/7B/8/8/8/2k5/2N5/3K4_w_-_-_0_1&moves=Bg8,Kd3,Bh7%2B,Kc3&cursor=0) — Bishop shuffle — Other king-protected knight (deferred in ordinary searches)
10. [Bh3 Kc7 Bf1 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/K1k5/8/8/8/8/5B2_w_-_-_0_1&moves=Bh3,Kc7,Bf1,Kc6&cursor=0) — Bishop shuffle — Other king-protected knight (deferred in ordinary searches)

## Validation

- Fresh worker compared with the unoptimized production snapshot, plus D4 symmetry and root-census checks.
- Independent four-ply enumeration from the saved graph matched all 186 cycle signatures from production-policy replay.
- Filtered cycle membership independently verified by return reachability.
- Every displayed replay uses current preferred White moves, legal Black replies, and exact closure.
- The five-edge-prefix check establishes membership on longer simple cycles without confusing concatenated four-ply cycles with longer simple cycles.

[Manifest](/Users/danielcepeda/repos/_codex_output/bn-full-adjacent-king-2026-09-28/manifest.json) · [Summary JSON](/Users/danielcepeda/repos/_codex_output/bn-full-adjacent-king-2026-09-28-filtered/summary.json) · [Four-ply cycles](/Users/danielcepeda/repos/_codex_output/bn-full-adjacent-king-2026-09-28-filtered/four-ply-count.json) · [Longer-cycle membership](/Users/danielcepeda/repos/_codex_output/bn-full-adjacent-king-2026-09-28-filtered/long-cycle-position-membership.json)
