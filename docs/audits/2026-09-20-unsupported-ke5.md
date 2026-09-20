# Unsupported-position audit

Policy commit: `75316a5220d24f62c99f7781e6bf9a60d8ec9375`. Fingerprint: `ede656ebe9cad411115a935dc7a123adc2d2ec509332713abfde0ab775b5f3f0`.

All **13,660,584** post-White KBNvK placements were enumerated, including both bishop colors and all rotations/reflections. **13,461,172** are unsupported; **199,412** are supported. Every tied best move is followed.

| Measure | Placements | % of unsupported | Previous audit |
|---|---:|---:|---:|
| Can reach an unsupported loop | 98,672 | 0.7330% | 484,724 |
| Cannot reach an unsupported loop | 13,362,500 | 99.2670% | 12,976,448 |
| On a loop with reachable history | 7,080 | 0.0526% | 7,616 |
| Fresh starts that can return to a loop containing themselves | 216 | 0.0016% | 248 |
| Only loop outcomes | 25,324 | 0.1881% | 24,964 |
| Both loop and support outcomes | 72,940 | 0.5419% | 459,352 |
| Can reach support | 10,848,648 | 80.5922% | 10,854,160 |
| Can reach mate without first entering support | 1,616 | 0.0120% | 1,616 |
| Can reach capture or stalemate | 2,623,760 | 19.4913% | 2,624,728 |

Outcome categories overlap except can-loop versus cannot-loop. “Can loop” is existential among best-move ties. Direct loop membership counts a board occurring on a history-aware cycle; a fresh load can select a different first Black reply. “Cannot loop” does not imply forced mate: the audit stops at support, mate, capture, or stalemate. Clocks and repetition claims are excluded. Black follows the app policy, not arbitrary legal defense.

## Archetypes

452 cyclic strongly connected components, 1,465,464 history states, 1,474,034 transitions. A component can contain several cycles. Reach counts overlap.

| Archetype | Components | Reachable unsupported starts |
|---|---:|---:|
| Knight shuttle | 418 | 66,460 |
| Bishop shuttle | 19 | 25,604 |
| King shuffle | 15 | 6,936 |

## Highest exposure components

Reach measures exposure, not guaranteed gains from a rule change. Exclusive reach counts starts that cannot reach any other component. Fresh-load links are checked for three repetitions.

| Rank | Archetype | Reach | Exclusive | Loop |
|---|---|---:|---:|---|
| 1 | Knight shuttle | 31,320 | 31,320 | [Nc3+ Kd6 Nd5 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/8/2k5/3N4/3KB3/8/8/8_w_-_-_0_1&moves=Nc3%2B,Kd6,Nd5,Kc6&cursor=0) |
| 2 | Knight shuttle | 10,856 | 10,784 | [Ne5 Ke6 Nd3 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/3KB3/3N4/8/8_w_-_-_0_1&moves=Ne5,Ke6,Nd3,Kf6&cursor=0) |
| 3 | Knight shuttle | 10,208 | 10,192 | [Nh5+ Kg5 Ng3 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/3KB3/6N1/8/8_w_-_-_0_1&moves=Nh5%2B,Kg5,Ng3,Kf6&cursor=0) |
| 4 | Bishop shuttle | 10,104 | 9,968 | [Ba2 Ke4 Bd5+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/2KBk3/8/8/8/8_w_-_-_0_1&moves=Ba2,Ke4,Bd5%2B,Ke5&cursor=0) |
| 5 | Bishop shuttle | 4,784 | 4,696 | [Bh1 Kf4 Be4 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4k3/3NB3/3K4/8/8_w_-_-_0_1&moves=Bh1,Kf4,Be4,Ke5&cursor=0) |
| 6 | Bishop shuttle | 3,240 | 3,232 | [Bg2 Kg3 Bf1 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K2k1/7N/8/5B2_w_-_-_0_1&moves=Bg2,Kg3,Bf1,Kg4&cursor=0) |
| 7 | Bishop shuttle | 3,080 | 3,080 | [Bf3 Kf4 Bd1 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/5k2/3K2N1/8/8/3B4_w_-_-_0_1&moves=Bf3,Kf4,Bd1,Kf5&cursor=0) |
| 8 | King shuffle | 2,664 | 2,472 | [Kd4 Ke6 Ke3 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/4B3/3NK3/8/8_w_-_-_0_1&moves=Kd4,Ke6,Ke3,Kf6&cursor=0) |
| 9 | King shuffle | 2,008 | 2,008 | [Ke3 Kh4 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K2B1/6k1/5N2/8_w_-_-_0_1&moves=Ke3,Kh4,Kd4,Kg3&cursor=0) |
| 10 | Bishop shuttle | 1,648 | 1,648 | [Bg2 Kg4 Bf1 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/5k2/3K4/7N/8/5B2_w_-_-_0_1&moves=Bg2,Kg4,Bf1,Kf5&cursor=0) |
| 11 | King shuffle | 1,240 | 1,240 | [Ke3 Kh4 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K4/6kB/5N2/8_w_-_-_0_1&moves=Ke3,Kh4,Kd4,Kg3&cursor=0) |
| 12 | Bishop shuttle | 1,008 | 1,008 | [Ba8 Kg8 Bh1 Kg7](http://localhost:5173/mate/bishop-knight#fen=5N2/4K1k1/8/8/8/8/8/7B_w_-_-_0_1&moves=Ba8,Kg8,Bh1,Kg7&cursor=0) |
| 13 | Bishop shuttle | 616 | 616 | [Bc6 Kc7 Ba4 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/8/4K3/B3N3/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kd8&cursor=0) |
| 14 | Knight shuttle | 528 | 528 | [Ne8 Ke5 Nf6 Kf5](http://localhost:5173/mate/bishop-knight#fen=B7/4K3/5N2/5k2/8/8/8/8_w_-_-_0_1&moves=Ne8,Ke5,Nf6,Kf5&cursor=0) |
| 15 | Bishop shuttle | 520 | 520 | [Bh1 Kh7 Ba8 Kg8](http://localhost:5173/mate/bishop-knight#fen=B5k1/6N1/5K2/8/8/8/8/8_w_-_-_0_1&moves=Bh1,Kh7,Ba8,Kg8&cursor=0) |

## Selection mechanisms

Grouped by the last priority eliminating a candidate on witness moves. Descriptive, not a causal proof.

| Mechanism | Components | Reach |
|---|---:|---:|
| Knight shuttle / king protection of knight + knight off bishop color | 5 | 31,456 |
| Bishop shuttle / bishop distance from Black + bishop on long diagonal | 9 | 15,808 |
| Knight shuttle / king protection of knight + knight distance to precage | 3 | 10,896 |
| Knight shuttle / knight center distance + knight distance to precage | 1 | 10,208 |
| Knight shuttle / knight center distance | 256 | 9,640 |
| Bishop shuttle / bishop distance from Black + king-protected central bishop | 2 | 4,784 |
| King shuffle / king off bishop color + minors safe | 4 | 3,952 |
| Bishop shuttle / bishop on long diagonal + minors safe | 1 | 3,240 |
| Knight shuttle / knight center distance + noncentral bishop distance from Black | 111 | 2,888 |
| King shuffle / king center distance + r5 | 6 | 2,840 |
| Bishop shuttle / knight off bishop color + noncentral bishop distance from Black | 1 | 1,008 |
| Knight shuttle / noncentral bishop distance from Black | 3 | 596 |
| Knight shuttle / knight off bishop color + noncentral bishop distance from Black | 1 | 528 |
| Bishop shuttle / noncentral bishop distance from Black | 1 | 520 |
| Knight shuttle / knight center distance + knight off bishop color | 37 | 296 |
| Bishop shuttle / minors safe + noncentral bishop distance from Black | 5 | 252 |
| King shuffle / king center distance + king defense of knight | 1 | 56 |
| King shuffle / knight distance to precage | 2 | 48 |
| King shuffle / king center distance + no stalemate | 1 | 24 |
| King shuffle / king off bishop color | 1 | 16 |
| Knight shuttle / knight off bishop color + minors safe | 1 | 8 |

## Validation and artifacts

Deterministic samples compare the optimized worker to the unmodified production bundle and direct production calls. One thousand random placements are checked in all eight symmetries. Enumeration totals are asserted. Independent SCC analysis and sink removal must agree on loop reachability. Witnesses replay three times against production rules.

`manifest.json` identifies the exact bundled policy; `progress.json` reports progress; `census.sqlite` contains resumable roots, policies and transitions; `result.json` includes components, frames, selection traces and loop links; `root-family-membership.json` supports overlap analysis.

## Comparison and next focus

This audit includes the r10 final knight-color tiebreaker, the r5 Nc4+ declaration,
and the r5 Ke5 declaration added since the previous audit. It does not isolate the
contribution of any one change.

Loop-reaching starts fell by **386,052 (79.64%)**, from 484,724 to 98,672.
Direct loop membership fell from 7,616 to 7,080. The complementary count of
unsupported placements not directly on any discovered loop is **13,454,092
(99.9474%)**. However, starts with only loop outcomes rose by 360, from 24,964 to
25,324. Starts that can reach support fell by 5,512. Thus the reduction in allowed
looping is substantial, but it is not uniform improvement in every outcome.

The largest remaining component is **Nc3+ Kd6 Nd5 Kc6**, reachable from 31,320
starts (31.74% of all loop-reaching starts). It has a tied exit leading to support.
White's king remains on d4 and the bishop on e4; the knight shuttles between d5
and c3. On the first move, Ne3+ and Nc3+ tie after the knight-color preference.
On the second, precage proximity followed by king protection selects Nd5.

The top four components together cover **62,488 distinct loop-reaching starts
(63.33%)**. The largest closed component is the bishop shuttle
**Ba2 Ke4 Bd5+ Ke5**, reachable from 10,104 starts. This is a useful complementary
focus when targeting positions that cannot escape via existing ties.

## Loaded minimal loop

The largest component's fresh-load witness puts Black on c6, equally far from
h8 and a1. Its cyclically shifted witness does not reproduce from a fresh load
without the preceding return history. To preserve the requested display
convention, the sidebar instead shows the second-ranked component:

**1. Ne5 Ke6 2. Nd3 Kf6**, from
`8/8/5k2/8/3KB3/3N4/8/8 w - - 0 1`.

It is reachable from **10,856** unsupported starts. The bishop is light-squared,
Black is nearer h8 than a1, and all moves were verified as best across three
repetitions with no supported post-White position. It is a minimal four-ply loop.
The prescribed Nc5 Ke7 Ke5 branch is fixed; this Ne5 branch still loops.

## Run provenance

Full census and graph construction took 2,673 seconds, plus validation and
analysis. Root-cache reuse was conservatively rejected because the bundled
root snapshot includes changed White-declaration initialization and a generated
module label; no cache override was used. All starting classifications and
transitions were recomputed.

Artifacts: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-ke5/`.
The application build passed. The full 646-test mate suite had one obsolete
reset expectation for the newly restored Ke5 placement; after removing that
expectation, all 17 focused preparation/reset tests passed. The new declaration
is checked in all eight board symmetries.
