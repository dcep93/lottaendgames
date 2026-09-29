# Full audit after reciprocal stable-protection setup

Policy fingerprint: `f6b8ae1c73710820bb4a7ebad82d0134bf5df31b9c028240af83b15bdd75c75d`. Fresh executable snapshot; no production policy edits during the audit. No commit or push.

Fresh census: **13,660,584 physical post-White placements**, **1,707,888 D4 root orbits**. Recomputed every one of **1,359,344 discovered White policy states**. All preferred White ties and all legal Black replies; no old move-choice cache reused.

Degenerate A/B/C at every ply. Include completed r4, edge kings, central king/knight pairs, and all temporarily deferred motifs.

Positions mean post-White boards directly on a cycle, not positions that can reach a cycle. All counts below are D4-deduplicated. Four-ply cycles are also deduplicated by starting phase. Fifty-move/repetition claims are outside this structural analysis.

## Counts

| Measure | Count |
| --- | ---: |
| Positions on any loop | 1,998 |
| Physical positions on any loop | 15,984 |
| Distinct four-ply loops | 2,551 |
| Positions on four-ply loops | 1,995 |
| Positions on longer simple loops | 699 |
| Positions on both | 696 |
| Positions only on longer loops | 3 |
| Cyclic components | 629 |
| Completed-r4 positions on loops | 41 |

Compared with the previous complete audit: 42 old loop positions no longer loop, 12 new loop positions appear, and 1,986 remain. This comparison is between independently rebuilt full graphs.


All-length position membership is exhaustive. The number of distinct longer simple cycles is not enumerated; longer-loop figures count positions.

## Main archetypes

The categories below partition four-ply cycles. A loop may contribute positions to multiple rows, so the participating-position counts must not be summed. The opposition/attack alternation is recognized first, then other geometry categories.

Opposition means kings two squares apart on the same rank or file; diagonal opposition is reported separately. The attack phase has Black adjacent to a knight not king-protected. Alternation tests both White-to-move phases. Full-audit exclusions are degenerates only.

| Archetype | Four-ply loops | Participating positions |
| --- | ---: | ---: |
| King shuffle — Other king-protected knight | 2,048 | 1,620 |
| King shuffle — King and knight adjacent on edge | 370 | 272 |
| Bishop shuffle — King and knight both in middle 16 | 112 | 67 |
| Knight shuffle — Black alternates opposition and attacking the knight | 7 | 14 |
| Knight shuffle — Other attacked-knight positions | 6 | 12 |
| King shuffle — King and knight both in middle 16 | 5 | 6 |
| Knight shuffle — Other king-protected knight | 2 | 3 |
| Knight shuffle — Black alternates diagonal opposition and attacking the knight | 1 | 2 |

## Central pieces and corners

Central means d4/e4/d5/e5; central-piece counts include White king, bishop, and knight. Middle-16 and Black-inclusive counts are also preserved in the JSON.

| Central White pieces | Any loop | Four-ply loops | Only longer loops |
| --- | ---: | ---: | ---: |
| 0 | 1,853 | 1,850 | 3 |
| 1 | 76 | 76 | 0 |
| 2 | 21 | 21 | 0 |
| 3 | 48 | 48 | 0 |

347 loop positions have at least one White piece in a corner, including White king; 386 have any piece in a corner, including Black king.

## Verified examples

Usual deferrals retain 4 four-ply cycles. The full audit includes deferred motifs; examples below identify each motif.

1. [Nc6+ Ka8 Nb4 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Ka7&cursor=0) — Knight shuffle — Other king-protected knight; `8/k7/B7/1K6/1N6/8/8/8 w - - 0 1`
2. [Nc6+ Ka8 Nb4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Kb8&cursor=0) — Knight shuffle — Other king-protected knight; `1k6/8/B7/1K6/1N6/8/8/8 w - - 0 1`
3. [Nc3 Kd4 Ne2+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/4K3/8/4k3/B7/8/4N3/8_w_-_-_0_1&moves=Nc3,Kd4,Ne2%2B,Ke5&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `8/4K3/8/4k3/B7/8/4N3/8 w - - 0 1`
4. [Nf2 Ke3 Nd1+ Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/3K4/8/3k4/7B/8/3N4_w_-_-_0_1&moves=Nf2,Ke3,Nd1%2B,Kd4&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight; `8/8/3K4/8/3k4/7B/8/3N4 w - - 0 1`
5. [Kb7 Ka5 Ka7 Kb5](http://localhost:5173/mate/bishop-knight#fen=8/K7/N7/1k6/8/8/8/7B_w_-_-_0_1&moves=Kb7,Ka5,Ka7,Kb5&cursor=0) — King shuffle — Other king-protected knight (deferred in ordinary searches); `8/K7/N7/1k6/8/8/8/7B w - - 0 1`
6. [Ka7 Ka5 Kb7 Kb5](http://localhost:5173/mate/bishop-knight#fen=8/1K6/N7/1k6/8/8/8/7B_w_-_-_0_1&moves=Ka7,Ka5,Kb7,Kb5&cursor=0) — King shuffle — Other king-protected knight (deferred in ordinary searches); `8/1K6/N7/1k6/8/8/8/7B w - - 0 1`
7. [Kb1 Kc3 Kc1 Kb3](http://localhost:5173/mate/bishop-knight#fen=8/7B/8/8/8/1k6/1N6/2K5_w_-_-_0_1&moves=Kb1,Kc3,Kc1,Kb3&cursor=0) — King shuffle — Other king-protected knight (deferred in ordinary searches); `8/7B/8/8/8/1k6/1N6/2K5 w - - 0 1`
8. [Kc1 Kc3 Kb1 Kb3](http://localhost:5173/mate/bishop-knight#fen=8/7B/8/8/8/1k6/1N6/1K6_w_-_-_0_1&moves=Kc1,Kc3,Kb1,Kb3&cursor=0) — King shuffle — Other king-protected knight (deferred in ordinary searches); `8/7B/8/8/8/1k6/1N6/1K6 w - - 0 1`
9. [Kb2 Ka4 Ka2 Kb4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/1k6/N7/K7/8_w_-_-_0_1&moves=Kb2,Ka4,Ka2,Kb4&cursor=0) — King shuffle — Other king-protected knight (deferred in ordinary searches); `6B1/8/8/8/1k6/N7/K7/8 w - - 0 1`
10. [Ka2 Ka4 Kb2 Kb4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/1k6/N7/1K6/8_w_-_-_0_1&moves=Ka2,Ka4,Kb2,Kb4&cursor=0) — King shuffle — Other king-protected knight (deferred in ordinary searches); `6B1/8/8/8/1k6/N7/1K6/8 w - - 0 1`

## Validation

- Fresh worker compared with the unoptimized production snapshot, plus D4 symmetry and root-census checks.
- Independent four-ply enumeration from the saved graph matched all 2,551 cycle signatures from production-policy replay.
- Filtered cycle membership independently verified by return reachability.
- Every displayed replay uses current preferred White moves, legal Black replies, and exact closure.
- The five-edge-prefix check establishes membership on longer simple cycles without confusing concatenated four-ply cycles with longer simple cycles.

[Manifest](/Users/danielcepeda/repos/_codex_output/bn-full-protection-setup-2026-09-28/manifest.json) · [Summary JSON](/Users/danielcepeda/repos/_codex_output/bn-full-protection-setup-2026-09-28-filtered/summary.json) · [Four-ply cycles](/Users/danielcepeda/repos/_codex_output/bn-full-protection-setup-2026-09-28-filtered/four-ply-count.json) · [Longer-cycle membership](/Users/danielcepeda/repos/_codex_output/bn-full-protection-setup-2026-09-28-filtered/long-cycle-position-membership.json)
