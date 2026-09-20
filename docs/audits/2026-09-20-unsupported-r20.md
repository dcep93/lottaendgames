# Unsupported-position audit

Policy commit: `816beb84ac6292e5958f148da5e4572672240f20`. Fingerprint: `4ef3b037b7cdf9df5c2ea6a8f093448cf6bc6c0b3fa65bdeaad5cc0f9d24671c`.

All **13,660,584** post-White KBNvK placements were enumerated, including both bishop colors and all rotations/reflections. **13,461,172** are unsupported; **199,412** are supported. Every tied best move is followed.

| Measure | Placements | % of unsupported | Previous audit |
|---|---:|---:|---:|
| Can reach an unsupported loop | 503,636 | 3.7414% | 155,420 |
| Cannot reach an unsupported loop | 12,957,536 | 96.2586% | 13,305,752 |
| On a loop with reachable history | 27,528 | 0.2045% | 824 |
| Fresh starts that can return to a loop containing themselves | 4,024 | 0.0299% | 216 |
| Only loop outcomes | 14,628 | 0.1087% | 23,132 |
| Both loop and support outcomes | 488,200 | 3.6267% | 132,288 |
| Can reach support | 10,869,768 | 80.7490% | 10,843,096 |
| Can reach mate without first entering support | 1,616 | 0.0120% | 1,616 |
| Can reach capture or stalemate | 2,809,352 | 20.8700% | 2,630,024 |

Outcome categories overlap except can-loop versus cannot-loop. “Can loop” is existential among best-move ties. Direct loop membership counts a board occurring on a history-aware cycle; a fresh load can select a different first Black reply. “Cannot loop” does not imply forced mate: the audit stops at support, mate, capture, or stalemate. Clocks and repetition claims are excluded. Black follows the app policy, not arbitrary legal defense.

## Archetypes

1,473 cyclic strongly connected components, 1,510,022 history states, 1,588,815 transitions. A component can contain several cycles. Reach counts overlap.

| Archetype | Components | Reachable unsupported starts |
|---|---:|---:|
| Knight shuttle | 1,439 | 464,136 |
| Bishop shuttle | 19 | 35,732 |
| King shuffle | 15 | 9,992 |

## Highest exposure components

Reach measures exposure, not guaranteed gains from a rule change. Exclusive reach counts starts that cannot reach any other component. Fresh-load links are checked for three repetitions.

| Rank | Archetype | Reach | Exclusive | Loop |
|---|---|---:|---:|---|
| 1 | Knight shuttle | 84,680 | 80,472 | [Na7 Kb6 Nc8+ Kc7](http://localhost:5173/mate/bishop-knight#fen=2N5/2k5/8/8/3KB3/8/8/8_w_-_-_0_1&moves=Na7,Kb6,Nc8%2B,Kc7&cursor=0) |
| 2 | Knight shuttle | 56,960 | 54,096 | [Nh5+ Kg5 Ng7 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/6N1/5k2/8/3KB3/8/8/8_w_-_-_0_1&moves=Nh5%2B,Kg5,Ng7,Kf6&cursor=0) |
| 3 | Knight shuttle | 35,344 | 31,688 | [Nc3+ Kd6 Nd5 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/8/2k5/3N4/3KB3/8/8/8_w_-_-_0_1&moves=Nc3%2B,Kd6,Nd5,Kc6&cursor=0) |
| 4 | Knight shuttle | 34,904 | 31,824 | [Na7 Kb6 Nc8+ Kc7](http://localhost:5173/mate/bishop-knight#fen=2N5/2k5/8/8/3K4/8/6B1/8_w_-_-_0_1&moves=Na7,Kb6,Nc8%2B,Kc7&cursor=0) |
| 5 | Knight shuttle | 31,264 | 23,440 | [Na7 Kb6 Nc8+ Kc7](http://localhost:5173/mate/bishop-knight#fen=2N5/2k5/8/8/3K4/8/8/7B_w_-_-_0_1&moves=Na7,Kb6,Nc8%2B,Kc7&cursor=0) |
| 6 | Knight shuttle | 27,544 | 24,512 | [Na7 Kb6 Nc8+ Kc7](http://localhost:5173/mate/bishop-knight#fen=2N5/2k5/8/8/3K4/5B2/8/8_w_-_-_0_1&moves=Na7,Kb6,Nc8%2B,Kc7&cursor=0) |
| 7 | Knight shuttle | 14,184 | 6,768 | [Ng1 Kf2 Nh3+ Kg3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/2K5/8/6kN/8/8_w_-_-_0_1&moves=Ng1,Kf2,Nh3%2B,Kg3&cursor=0) |
| 8 | Knight shuttle | 10,784 | 7,536 | [Nf1+ Kf2 Nh2 Kg3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/2K5/8/6k1/7N/8_w_-_-_0_1&moves=Nf1%2B,Kf2,Nh2,Kg3&cursor=0) |
| 9 | Bishop shuttle | 10,632 | 9,440 | [Bg2 Kg3 Bf1 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K2k1/7N/8/5B2_w_-_-_0_1&moves=Bg2,Kg3,Bf1,Kg4&cursor=0) |
| 10 | Bishop shuttle | 10,504 | 8,032 | [Bf3 Kf4 Bd1 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/5k2/3K2N1/8/8/3B4_w_-_-_0_1&moves=Bf3,Kf4,Bd1,Kf5&cursor=0) |
| 11 | Knight shuttle | 8,496 | 7,000 | [Ne8+ Ke7 Ng7 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/6N1/5k2/8/3K4/8/8/1B6_w_-_-_0_1&moves=Ne8%2B,Ke7,Ng7,Kf6&cursor=0) |
| 12 | Knight shuttle | 7,664 | 5,136 | [Nf1+ Kf2 Nh2 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/1B6/8/2K5/8/6k1/7N/8_w_-_-_0_1&moves=Nf1%2B,Kf2,Nh2,Kg3&cursor=0) |
| 13 | Bishop shuttle | 6,728 | 5,008 | [Ba2 Ke4 Bd5+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/2KBk3/8/8/8/8_w_-_-_0_1&moves=Ba2,Ke4,Bd5%2B,Ke5&cursor=0) |
| 14 | Knight shuttle | 6,200 | 5,824 | [Nf1+ Kf2 Nh2 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2K5/B7/6k1/7N/8_w_-_-_0_1&moves=Nf1%2B,Kf2,Nh2,Kg3&cursor=0) |
| 15 | Knight shuttle | 5,904 | 5,456 | [Ng7 Kf6 Nh5+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2K1k2N/8/8/8/1B6_w_-_-_0_1&moves=Ng7,Kf6,Nh5%2B,Ke5&cursor=0) |

## Selection mechanisms

Grouped by the last priority eliminating a candidate on witness moves. Descriptive, not a causal proof.

| Mechanism | Components | Reach |
|---|---:|---:|
| Knight shuttle / bishop on long diagonal + minors safe | 105 | 173,408 |
| Knight shuttle / minors safe + noncentral bishop distance from Black | 885 | 112,664 |
| Knight shuttle / minors safe | 389 | 101,784 |
| Knight shuttle / king-protected central bishop + knight distance to precage | 4 | 57,352 |
| Knight shuttle / king protection of knight + knight off bishop color | 5 | 35,480 |
| Bishop shuttle / bishop distance from Black + bishop on long diagonal | 9 | 20,464 |
| Bishop shuttle / bishop on long diagonal + minors safe | 1 | 10,632 |
| Knight shuttle / knight off bishop color + minors safe | 49 | 10,224 |
| King shuffle / king off bishop color + minors safe | 4 | 8,704 |
| Bishop shuttle / bishop distance from Black + king-protected central bishop | 2 | 2,280 |
| Bishop shuttle / knight off bishop color + noncentral bishop distance from Black | 1 | 1,592 |
| King shuffle / king center distance + r5 | 6 | 1,144 |
| Bishop shuttle / noncentral bishop distance from Black | 1 | 520 |
| Knight shuttle / bishop on long diagonal + knight distance to precage | 1 | 504 |
| Bishop shuttle / minors safe + noncentral bishop distance from Black | 5 | 252 |
| King shuffle / king center distance + king defense of knight | 1 | 56 |
| King shuffle / knight distance to precage | 2 | 48 |
| Knight shuttle / avoid next knight attack + knight distance to precage | 1 | 32 |
| King shuffle / king center distance + no stalemate | 1 | 24 |
| King shuffle / king off bishop color | 1 | 16 |

## Validation and artifacts

Deterministic samples compare the optimized worker to the unmodified production bundle and direct production calls. One thousand random placements are checked in all eight symmetries. Enumeration totals are asserted. Independent SCC analysis and sink removal must agree on loop reachability. Witnesses replay three times against production rules.

`manifest.json` identifies the exact bundled policy; `progress.json` reports progress; `census.sqlite` contains resumable roots, policies and transitions; `result.json` includes components, frames, selection traces and loop links; `root-family-membership.json` supports overlap analysis.


## Direct-cycle membership and comparison

The change from the previous audit consists of making r9.2 king-defense-only
and adding unconditional r20 at the end. This is not an isolated test of r20.
Direct loop membership rises from **824 to 27,528**; loop-reaching starts rise
from **155,420 to 503,636**. Of the unsupported placements, **13,433,644** are
not directly on any discovered cycle, and **12,957,536** cannot reach a cycle.
The scope and support denominator are unchanged.

| Archetype | Direct-cycle placements | Share of cycle positions | Components |
|---|---:|---:|---:|
| Knight shuttle | 27,056 | 98.29% | 1,439 |
| Bishop shuttle | 272 | 0.99% | 19 |
| King shuffle | 200 | 0.73% | 15 |

These are distinct post-White boards on internal cyclic edges, restored to
physical placements using symmetry weights. The broad groups do not overlap.
Fine mechanism groups overlap by 16 placements. Components with exits contain
27,064 cycle positions; closed components contain 464. These two sets do not
overlap. There are 1,440 components with exits and 33 closed components.

This is a regression in the requested loop metrics, but not every outcome
metric worsens: starts with only loop outcomes fall from 23,132 to 14,628,
and support-reaching starts rise by 26,672. Capture/stalemate-reaching starts
also rise by 179,328. Outcomes are existential over all ties and can overlap.
A lower count of starts with only loop outcomes does not mean fewer structural
loops. No forced-mate claim follows from these counts.

## Common archetype: repeated attacks on an escaping knight

Knight shuttles dominate both cycle membership and exposure: 27,056 direct
positions and 464,136 starting placements that can reach this broad class.
In **27,008 of the 27,056** post-White knight-shuttle positions, Black has a
legal next move that attacks the knight again. This is a next-move threat;
only 16 already have Black adjacent to the knight immediately after White moves.

The geometry is not limited to an edge White king or a central bishop:

- White's king is on the edge in 13,248 knight-shuttle positions (48.97%).
- The bishop is central in only 744 (2.75%).
- The knight is king-defended in only 72 (0.27%).
- No precage square exists in 26,328 (97.31%).

The last-eliminating-priority classification describes how a witness is
selected, not necessarily the cause of the loop. The largest fine group has
16,160 direct positions across 885 components, where minor safety and the
noncentral-bishop-distance priority leave knight moves tied.

### Loaded highest-exposure example

**1. Na7 Kb6 2. Nc8+ Kc7**, starting from
`2N5/2k5/8/8/3KB3/8/8/8 w - - 0 1`.
It is reachable from **84,680** unsupported starts, of which **80,472** can reach
no other cyclic component. The four-ply witness is minimal, fresh-load verified
for three repetitions, and contains no supported post-White position. It has a
light-square bishop and Black closer to h8 than a1, and is loaded in the Codex
sidebar.

After higher priorities, **Ne7 and Na7 tie** on move 1. Both permit Black to
attack the knight again, so r20 does not separate them. On move 2, **Nc6 and
Nc8+ tie**. The outward choice recreates the position. r9.2 no longer supplies
center proximity, and r20 alone cannot rank equally attackable escapes.

## Recommendation: add a final knight-center tie-breaker

> **r25 — Prefer the knight's Euclidean proximity to the center.**

Place it **after r20**. Measure distance to the board's midpoint; squared
Euclidean distance gives the same ordering. This leaves all existing priorities
intact and only removes tied choices. In the loaded example it selects **Ne7**
instead of Na7, and would select **Nc6** instead of Nc8+ at the other loop phase.

A checked deterministic continuation from the loaded start reaches a supported
seven-diagonal:

`1. Ne7 Kd7 2. Nd5 Ke6 3. Nf4+ Kf6 4. Nd3 Ke6 5. Ke3 Kd6 6. Kf4 Ke6 7. Kg5 Kd6 8. Kf6 Kd7 9. Bd5`.

This line is an example under the proposed policy, not an assertion that all
branches mate.

### Measured counterfactual

Every node in every current cyclic component was rescored. We kept only moves
surviving the proposed final tie-breaker, then checked which internal edges
still belong to a cycle. Because this is a final tie-breaker, it only deletes
existing best-move edges; it cannot introduce a new cycle into this graph.

| Final tie-breaker | Components with all cycles removed | Remaining direct-loop positions, upper bound | Loop-reaching starts, upper bound |
|---|---:|---:|---:|
| Knight closer to center | 1,438 | 488 | 45,756 |
| Knight farther from Black | 8 | 27,424 | 471,460 |

Knight centralization removes cycles from **1,438 of the 1,439 knight-shuttle
components**, a reduction of at least **98.23%** in all direct-loop positions
and **90.91%** in loop-reaching starts. These are conservative bounds, not a
second exhaustive audit: we did not recompute root reachability after pruning.
The bound unions all old roots reaching any retained cyclic component, even
if a newly pruned earlier choice would prevent reaching it. It does not
establish how many support-reaching branches remain or prove forced mate.

The retained direct-cycle set consists of 272 bishop-shuttle positions,
200 king-shuffle positions, and 16 knight-shuttle positions. The remaining
knight component is `Nd3 Kf6 Nc5 Kg7`; its moves are already uniquely preferred,
so another final tie-breaker cannot remove it. Bishop-return cycles and fixed
r5 king cycles would be the next targets after this large reduction.

No preference changes were made during this audit. The r25 text above is a
recommendation for the next implementation.

## Reproducibility and runtime

All roots were recomputed because the conservative root-code fingerprint check
rejected reuse. Enumeration and graph construction took **2,925 seconds** with
eight workers, plus validation, witness verification, and classification.
The graph has 1,510,022 history states and 1,588,815 edges.

The audit's deterministic production comparisons, 1,000-position D4 checks,
enumeration assertions, independent SCC/sink-removal comparison, and witness
replays all passed. Direct-membership postprocessing exactly reproduces the
27,528 total from stored internal edges and root weights.

The companion JSON records the manifest, counts, direct memberships, shape
counts, counterfactual results per component, and loaded witness. Full immutable
artifacts are in
`/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-r20/`.
The recommendation experiment is a local analysis script and does not alter
production code.
