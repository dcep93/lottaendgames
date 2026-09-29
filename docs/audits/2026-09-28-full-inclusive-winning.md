# Full bishop–knight audit — 2026-09-28

Fresh exhaustive policy-graph audit. All current preferred White ties and all legal Black replies were recomputed. No production rules were changed, committed, or pushed.

## Results

All counts below merge D4 rotations/reflections. Loop routes also merge cyclic starting phases.

| Measure | Count |
|---|---:|
| Positions on any cycle (post-White placements) | 47 |
| Physical positions before D4 deduplication | 376 |
| Cyclic strongly connected components | 4 |
| Distinct four-ply loops | 87 |
| Positions on four-ply loops | 47 |
| Positions also on longer simple cycles | 41 |
| Positions exclusively on longer cycles | 0 |
| Four-ply loops satisfying r4 at every ply | 84 |
| Four-ply loops satisfying r4 at some but not every ply | 0 |
| Four-ply loops never satisfying r4 | 3 |
| Previously known 81 loops retained | 81 |
| Newly discovered four-ply loops | 6 |

Three new loops are r4-complete bishop shuffles; three are outside that formation.

## Archetypes

| Four-ply archetype | Loops | Participating positions |
|---|---:|---:|
| Bishop shuffles through fully satisfied r4 throughout | 84 | 41 |
| Knight shuffle: Black alternates opposition and attacking the knight | 1 | 2 |
| Other bishop shuffle with a king-protected knight | 1 | 2 |
| Bishop shuffle carrying the legacy degenerate-C label, but tablebase-winning | 1 | 2 |

Every longer-cycle position belongs to the first group. The other three components only contain four-ply cycles.

The legacy degenerate-C loop is included deliberately: after Bf5 in example 3, Black Ke5 is adjacent to Nd4 and Bf5, but White Kc4 protects Nd4, and Nd4 protects Bf5. Syzygy confirms White can force a win. A geometric label alone is not a draw certificate. No winning cycle matches degenerate A/B; no four-ply cycle triggers the current r4.1 escape cases.

## Longer routes: exact membership, bounded route enumeration

The complete graph analysis proves exactly 41 D4 positions lie on simple cycles longer than four plies. This is exhaustive, not sampled. A separate five-edge-prefix/return-reachability check establishes this without enumerating every route.

A bounded native enumeration found **at least 170,984,868 distinct longer simple board-position cycles** in 120 seconds. It did not finish: this is a lower bound, not an exact total. Its traversal order found long cycles first, so the partial length histogram must not be interpreted as a complete length distribution. Independent JavaScript and C++ enumerators agreed exactly on all 33,618 cycles and the length histogram within their first 1,000,000 traversal calls.

Verified working replay examples of 8, 12, 16, and 20 plies appear below. A 148-ply graph witness also passed legal-move, current-policy, side-aware winning-position and simple-cycle checks; it is stored as data, not a replay link, because the app rejects the full line once its draw limit is reached.

## Winning-position scope and clocks

The user's clarification excludes positions where Black can force a draw. Every cyclic position, with its correct side to move, was probed in local Syzygy WDL tables. White-to-move WDL +2 and Black-to-move WDL -2 qualify; draws, cursed wins, losses and invalid positions do not. All 94 canonical board-and-turn probes in the cyclic core qualify. No source cyclic position was removed by the winning filter.

This remains a **placement-policy audit**: halfmove counters and repetition history are reset. It answers whether the current choices can cycle through individually winning placements, not whether White can keep choosing that cycle and still win. Repeating a loop can itself surrender the win through draw rules. Longer route counts likewise describe board-position topology, not a game permitted to ignore the move clock.

Tablebase data were obtained from the Lichess Syzygy mirror; hashes and probe results are saved. Three independent Lichess API queries and 24 D4 probe checks validated the integration. [Syzygy WDL semantics](https://python-chess.readthedocs.io/en/latest/syzygy.html).

## Central pieces and corners

Central means the four squares d4/e4/d5/e5; White pieces include the king, bishop and knight.

| Number of central White pieces | D4 loop positions |
|---|---:|
| 0 | 3 |
| 1 | 2 |
| 2 | 1 |
| 3 | 41 |

Four-ply loop ranges: one has 0 throughout; one varies 0–1; one varies 1–2; 84 have all three central throughout.

Two positions have a White piece in a corner (both White kings). Four have any piece in a corner (two White kings, two Black kings). The central-16 distribution for 0/1/2/3 White pieces is 2/2/0/43.

## Completeness and validation

- 13,660,584 physical root placements, 1,707,888 D4 root orbits.
- 1,359,344 White-to-move policy states freshly evaluated; 7,394,769 graph edges.
- Census runtime: 1,031 seconds; complete census/report pipeline approximately 18 minutes.
- Fresh census, symmetry and reference-worker checks passed.
- Two independent four-ply counting methods agreed on all 87 exact signatures.
- Winning-only SCC analysis agreed with independent reverse-reachability cycle membership.
- Targeted audit TypeScript check and 23 focused audit tests passed. The standalone base audit config has an existing chess.js resolution issue; the local check supplied the app dependency path.
- All ten links below passed current-policy selection, legal Black replies, exact closure, no internal repeated board-and-turn state, per-ply winning classification and the app's actual replay decoder.
- Each link starts with a light-squared bishop and White king nearer a1 than h8.

Policy fingerprint: `b9cfea3df7e4fb8fa690d6a5e164846c9bd49e3a17ef80d12720ab4f0b596b6f`.
Graph manifest fingerprint: `2b1a8de6cf6df19179daa7fb845bf5e491ab34f0dfb2f75a9f5805eb6644af2a`.

## Ten examples

1. [Knight shuffle — Black alternates opposition and attacking the knight](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/k3N3/8/KB6_w_-_-_0_1&moves=Nc2%2B,Kb3,Ne3,Ka3&cursor=0) — Nc2+ Kb3 Ne3 Ka3.
2. [Bishop shuffle — Other king-protected knight](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/8/4k3/5N2/4K3_w_-_-_0_1&moves=Bd5,Kd4,Bg8,Ke3&cursor=0) — Bd5 Kd4 Bg8 Ke3.
3. [Bishop shuffle — Tablebase-winning degenerate-c](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/5B2/2KN4/8/8/8_w_-_-_0_1&moves=Be4,Ke5,Bf5,Kd6&cursor=0) — Be4 Ke5 Bf5 Kd6.
4. [New four-ply r4-complete loop](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KBk2/8/8/8_w_-_-_0_1&moves=Bd5,Kf5,Be4%2B,Kf4&cursor=0) — Bd5 Kf5 Be4+ Kf4.
5. [New four-ply r4-complete loop](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KBk2/8/8/8_w_-_-_0_1&moves=Bd5,Kg3,Be4,Kf4&cursor=0) — Bd5 Kg3 Be4 Kf4.
6. [New four-ply r4-complete loop](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KBk2/8/8/8_w_-_-_0_1&moves=Bd5,Kg5,Be4,Kf4&cursor=0) — Bd5 Kg5 Be4 Kf4.
7. [8-ply r4-complete loop](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/8/3k4_w_-_-_0_1&moves=Bd5,Kc2,Be4%2B,Kd2,Bd5,Kc1,Be4,Kd1&cursor=0) — Bd5 Kc2 Be4+ Kd2 Bd5 Kc1 Be4 Kd1.
8. [12-ply r4-complete loop](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/1k6/8_w_-_-_0_1&moves=Bd5,Ka3,Be4,Kb3,Bd5%2B,Kb2,Be4,Ka2,Bd5%2B,Ka1,Be4,Kb2&cursor=0) — Bd5 Ka3 Be4 Kb3 Bd5+ Kb2 Be4 Ka2 Bd5+ Ka1 Be4 Kb2.
9. [16-ply r4-complete loop](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/4N3/3KB3/8/8/8_w_-_-_0_1&moves=Bd5,Ka7,Be4,Kb8,Bd5,Kc8,Be4,Kc7,Bd5,Kb6,Be4,Ka6,Bd5,Kb5,Be4,Kb6&cursor=0) — Bd5 Ka7 Be4 Kb8 Bd5 Kc8 Be4 Kc7 Bd5 Kb6 Be4 Ka6 Bd5 Kb5 Be4 Kb6.
10. [20-ply r4-complete loop](http://localhost:5173/mate/bishop-knight#fen=6k1/8/8/4N3/3KB3/8/8/8_w_-_-_0_1&moves=Bd5%2B,Kh7,Be4%2B,Kh8,Bd5,Kg7,Be4,Kh6,Bd5,Kh5,Be4,Kg5,Bd5,Kf6,Be4,Kg7,Bd5,Kh8,Be4,Kg8&cursor=0) — Bd5+ Kh7 Be4+ Kh8 Bd5 Kg7 Be4 Kh6 Bd5 Kh5 Be4 Kg5 Bd5 Kf6 Be4 Kg7 Bd5 Kh8 Be4 Kg8.

## Saved evidence

- [Fresh full census](/Users/danielcepeda/repos/_codex_output/bn-full-r41d-bd5-inclusive-2026-09-28/result.json)
- [Winning-only summary](/Users/danielcepeda/repos/_codex_output/bn-full-r41d-bd5-inclusive-2026-09-28-winning/inclusive-summary.json)
- [Per-position tablebase evidence](/Users/danielcepeda/repos/_codex_output/bn-full-r41d-bd5-inclusive-2026-09-28-winning/tablebase-probes.json)
- [Exact longer-cycle membership](/Users/danielcepeda/repos/_codex_output/bn-full-r41d-bd5-inclusive-2026-09-28-winning/long-cycle-position-membership.json)
- [Incomplete distinct-route enumeration](/Users/danielcepeda/repos/_codex_output/bn-full-r41d-bd5-inclusive-2026-09-28-winning/native-simple-cycle-count.json)
- [Verified 148-ply graph witness, not app replayable](/Users/danielcepeda/repos/_codex_output/bn-full-r41d-bd5-inclusive-2026-09-28-winning/native-longest-example.json)

The three non-r4 examples provide small concrete targets for further rule refinement. The dominant issue by count remains the fully formed central bishop shuffle; that same formation accounts for every longer cycle. No rules were changed to address either group during this audit.
