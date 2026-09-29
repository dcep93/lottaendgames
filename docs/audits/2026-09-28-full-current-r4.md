# Full bishop-and-knight audit — 2026-09-28

Current uncommitted policy fingerprint: `22e9a19ced111ab43295cb1b0325b1ea9af594441bdc318165ca224f6878e7bc`. No commit or push performed.

Fresh census and move-policy recomputation across every starting placement. All preferred White ties and every legal Black reply are included. Clocks and repetition claims are ignored. Counts below are D4-deduplicated; positions mean post-White boards directly on a cycle, never merely able to reach one.

Degenerate A/B/C positions are removed at every ply, then cyclic membership is recomputed. Completed r4 setups are included. Previous presentation exclusions are not applied.

## Results

| Measure | Count |
| --- | ---: |
| Positions directly on loops | 646 |
| Positions on four-ply loops | 641 |
| Positions on longer simple loops | 296 |
| Positions on both | 291 |
| Positions whose shortest loop exceeds four plies | 5 |
| Distinct four-ply loops | 989 |
| Cyclic components | 154 |
| Completed r4 positions on loops | 41 |
| Supported loop positions | 0 |
| Support-loss events | 0 |

Four-ply cycles are enumerated exactly. Longer-loop position membership is exact, using a simple five-edge prefix plus a return path avoiding the prefix. Distinct longer simple cycles can be numerous; the exact position-membership count above does not claim to enumerate every longer cycle.

At least 2,512,665 distinct longer simple cycles were enumerated before stopping the optional enumeration. This is a lower bound, not an exact count; all position-membership figures remain exact.

## Central pieces and corners

Central means d4/e4/d5/e5, counting White K/B/N. Categories partition positions, not cycles.

| Central White pieces | All loop positions | On four-ply loops | Shortest loop >4 |
| --- | ---: | ---: | ---: |
| 0 | 266 | 263 | 3 |
| 1 | 294 | 292 | 2 |
| 2 | 38 | 38 | 0 |
| 3 | 48 | 48 | 0 |

197 loop positions have a White piece in a corner, including White's king; 212 have any piece in a corner including Black's king. 382 four-ply cycles have a White corner piece somewhere in the cycle.

## Broad four-ply archetypes

Groups partition cycles by moving piece, stable bishop protection, whether knight king-protection persists throughout, and whether that protected knight stays central. These are geometric categories, not claims of a single cause. Position counts can overlap.

| Archetype | Four-ply cycles | Participating positions |
| --- | ---: | ---: |
| King shuffle — knight held under stable bishop protection | 737 | 343 |
| Bishop shuffle — king-protected central knight | 112 | 67 |
| King shuffle — knight not always king-protected | 55 | 87 |
| Bishop shuffle — king-protected knight | 27 | 54 |
| Bishop shuffle — knight not always king-protected | 18 | 32 |
| Knight shuffle — knight not always king-protected | 14 | 21 |
| King shuffle — king-protected knight | 13 | 25 |
| Knight shuffle — king-protected knight | 8 | 15 |
| King shuffle — king-protected central knight | 5 | 6 |

## Ten verified examples

Light-squared bishop, D4-distinct cycles, wider White-piece arrangements preferred. Every White move is currently preferred, every Black reply legal, and the physical board closes exactly. Full-audit exclusions checked at every ply.

1. [Kf4 Kd6 Ke3 Kc5](http://localhost:5173/mate/bishop-knight#fen=N7/8/8/2k5/8/4K3/8/7B_w_-_-_0_1&moves=Kf4,Kd6,Ke3,Kc5&cursor=0) — King shuffle — knight held under stable bishop protection.
2. [Kd8 Kd6 Ke8 Ke6](http://localhost:5173/mate/bishop-knight#fen=4K3/8/2N1k3/8/8/8/8/7B_w_-_-_0_1&moves=Kd8,Kd6,Ke8,Ke6&cursor=0) — King shuffle — knight held under stable bishop protection.
3. [Ka4 Kc4 Ka5 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/K1k5/8/8/6B1/7N_w_-_-_0_1&moves=Ka4,Kc4,Ka5,Kc5&cursor=0) — King shuffle — knight held under stable bishop protection.
4. [Kd8 Kd6 Ke8 Ke6](http://localhost:5173/mate/bishop-knight#fen=4K3/8/4k3/3N4/8/8/8/7B_w_-_-_0_1&moves=Kd8,Kd6,Ke8,Ke6&cursor=0) — King shuffle — knight held under stable bishop protection.
5. [Ke8 Ke6 Kd8 Kd6](http://localhost:5173/mate/bishop-knight#fen=3K4/8/3k4/8/8/5N2/8/7B_w_-_-_0_1&moves=Ke8,Ke6,Kd8,Kd6&cursor=0) — King shuffle — knight held under stable bishop protection.
6. [Ke8 Ke6 Kd8 Kd6](http://localhost:5173/mate/bishop-knight#fen=3K4/8/3k4/8/8/7N/8/5B2_w_-_-_0_1&moves=Ke8,Ke6,Kd8,Kd6&cursor=0) — King shuffle — knight held under stable bishop protection.
7. [Ka4 Kc4 Ka5 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/K1k4B/8/8/8/3N4_w_-_-_0_1&moves=Ka4,Kc4,Ka5,Kc5&cursor=0) — King shuffle — knight held under stable bishop protection.
8. [Ka5 Kc5 Ka4 Kc4](http://localhost:5173/mate/bishop-knight#fen=4N3/8/8/7B/K1k5/8/8/8_w_-_-_0_1&moves=Ka5,Kc5,Ka4,Kc4&cursor=0) — King shuffle — knight held under stable bishop protection.
9. [Be4+ Kc4 Bf5 Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3k1B2/3N4/4K3/8/8_w_-_-_0_1&moves=Be4%2B,Kc4,Bf5,Kd5&cursor=0) — Bishop shuffle — king-protected central knight.
10. [Bc4 Kc3 Be2 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3K4/1k1N4/8/4B3/8_w_-_-_0_1&moves=Bc4,Kc3,Be2,Kb4&cursor=0) — Bishop shuffle — king-protected central knight.

## Validation and data

- Production/optimized equivalence checks: 1,000 roots and 1,929 White positions passed.
- D4 symmetry validation and independent SCC membership checks passed.
- Audit harness: 38 tests passed.
- [Source graph](/Users/danielcepeda/repos/_codex_output/bn-full-current-r4-2026-09-28/manifest.json)
- [Machine-readable report](/Users/danielcepeda/repos/_codex_output/bn-full-current-r4-2026-09-28-filtered/summary.json)
- [Position membership](/Users/danielcepeda/repos/_codex_output/bn-full-current-r4-2026-09-28-filtered/cycle-position-stats.json)
- [Four-ply signatures](/Users/danielcepeda/repos/_codex_output/bn-full-current-r4-2026-09-28-filtered/four-ply-count.json)
- [Longer-loop membership](/Users/danielcepeda/repos/_codex_output/bn-full-current-r4-2026-09-28-filtered/long-cycle-position-membership.json)
