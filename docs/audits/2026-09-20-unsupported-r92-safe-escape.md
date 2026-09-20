# Unsupported-position audit

Policy commit: `c6a5dde3cdd381b186dacd6331238c0de49c56ca`. Fingerprint: `afa27c3f0819acf848060bbba909c36c0ddd7422ae759c5b578dafc4860776fb`.

All **13,660,584** post-White KBNvK placements were enumerated, including both bishop colors and all rotations/reflections. **13,461,172** are unsupported; **199,412** are supported. Every tied best move is followed.

| Measure | Placements | % of unsupported | Previous audit |
|---|---:|---:|---:|
| Can reach an unsupported loop | 155,420 | 1.1546% | 98,672 |
| Cannot reach an unsupported loop | 13,305,752 | 98.8454% | 13,362,500 |
| On a loop with reachable history | 824 | 0.0061% | 7,080 |
| Fresh starts that can return to a loop containing themselves | 216 | 0.0016% | 216 |
| Only loop outcomes | 23,132 | 0.1718% | 25,324 |
| Both loop and support outcomes | 132,288 | 0.9827% | 72,940 |
| Can reach support | 10,843,096 | 80.5509% | 10,848,648 |
| Can reach mate without first entering support | 1,616 | 0.0120% | 1,616 |
| Can reach capture or stalemate | 2,630,024 | 19.5379% | 2,623,760 |

The starting-position census was reused from `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-ke5` after an exact root-code fingerprint match. Every White policy and history transition was recomputed.

Outcome categories overlap except can-loop versus cannot-loop. “Can loop” is existential among best-move ties. Direct loop membership counts a board occurring on a history-aware cycle; a fresh load can select a different first Black reply. “Cannot loop” does not imply forced mate: the audit stops at support, mate, capture, or stalemate. Clocks and repetition claims are excluded. Black follows the app policy, not arbitrary legal defense.

## Archetypes

60 cyclic strongly connected components, 1,463,120 history states, 1,464,555 transitions. A component can contain several cycles. Reach counts overlap.

| Archetype | Components | Reachable unsupported starts |
|---|---:|---:|
| Knight shuttle | 26 | 126,192 |
| Bishop shuttle | 19 | 23,732 |
| King shuffle | 15 | 5,496 |

## Highest exposure components

Reach measures exposure, not guaranteed gains from a rule change. Exclusive reach counts starts that cannot reach any other component. Fresh-load links are checked for three repetitions.

| Rank | Archetype | Reach | Exclusive | Loop |
|---|---|---:|---:|---|
| 1 | Knight shuttle | 34,864 | 34,856 | [Nf8 Ke7 Nh7 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/7N/3k4/8/3KB3/8/8/8_w_-_-_0_1&moves=Nf8,Ke7,Nh7,Kd6&cursor=0) |
| 2 | Knight shuttle | 29,752 | 29,448 | [Ng8 Kg4 Nh6+ Kg5](http://localhost:5173/mate/bishop-knight#fen=8/8/7N/6k1/3KB3/8/8/8_w_-_-_0_1&moves=Ng8,Kg4,Nh6%2B,Kg5&cursor=0) |
| 3 | Knight shuttle | 29,456 | 29,352 | [Nc3+ Kd6 Nd5 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/8/2k5/3N4/3KB3/8/8/8_w_-_-_0_1&moves=Nc3%2B,Kd6,Nd5,Kc6&cursor=0) |
| 4 | Knight shuttle | 9,744 | 9,744 | [Nh5+ Kg5 Ng3 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/3KB3/6N1/8/8_w_-_-_0_1&moves=Nh5%2B,Kg5,Ng3,Kf6&cursor=0) |
| 5 | Knight shuttle | 7,960 | 7,928 | [Ne5 Ke6 Nd3 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/3KB3/3N4/8/8_w_-_-_0_1&moves=Ne5,Ke6,Nd3,Kf6&cursor=0) |
| 6 | Bishop shuttle | 7,160 | 7,160 | [Ba2 Ke4 Bd5+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/2KBk3/8/8/8/8_w_-_-_0_1&moves=Ba2,Ke4,Bd5%2B,Ke5&cursor=0) |
| 7 | Knight shuttle | 7,072 | 7,064 | [Nc7+ Kd7 Nb5 Ke6](http://localhost:5173/mate/bishop-knight#fen=8/8/4k3/1N6/4BK2/8/8/8_w_-_-_0_1&moves=Nc7%2B,Kd7,Nb5,Ke6&cursor=0) |
| 8 | Bishop shuttle | 5,928 | 5,928 | [Bf3 Kf4 Bd1 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/5k2/3K2N1/8/8/3B4_w_-_-_0_1&moves=Bf3,Kf4,Bd1,Kf5&cursor=0) |
| 9 | Bishop shuttle | 3,264 | 3,256 | [Bg2 Kg3 Bf1 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K2k1/7N/8/5B2_w_-_-_0_1&moves=Bg2,Kg3,Bf1,Kg4&cursor=0) |
| 10 | Bishop shuttle | 3,024 | 2,936 | [Bh1 Kf4 Be4 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4k3/3NB3/3K4/8/8_w_-_-_0_1&moves=Bh1,Kf4,Be4,Ke5&cursor=0) |
| 11 | King shuffle | 1,904 | 1,904 | [Ke3 Kh4 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K2B1/6k1/5N2/8_w_-_-_0_1&moves=Ke3,Kh4,Kd4,Kg3&cursor=0) |
| 12 | Knight shuttle | 1,680 | 1,376 | [Nh7 Ke6 Nf8+ Ke7](http://localhost:5173/mate/bishop-knight#fen=5N2/4k3/8/8/3KB3/8/8/8_w_-_-_0_1&moves=Nh7,Ke6,Nf8%2B,Ke7&cursor=0) |
| 13 | Bishop shuttle | 1,648 | 1,648 | [Bg2 Kg4 Bf1 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/5k2/3K4/7N/8/5B2_w_-_-_0_1&moves=Bg2,Kg4,Bf1,Kf5&cursor=0) |
| 14 | King shuffle | 1,480 | 1,480 | [Ke3 Kh4 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K4/6kB/5N2/8_w_-_-_0_1&moves=Ke3,Kh4,Kd4,Kg3&cursor=0) |
| 15 | Knight shuttle | 1,376 | 1,376 | [Ng3 Kf4 Nf1 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2K1k3/8/8/8/1B3N2_w_-_-_0_1&moves=Ng3,Kf4,Nf1,Ke5&cursor=0) |

## Selection mechanisms

Grouped by the last priority eliminating a candidate on witness moves. Descriptive, not a causal proof.

| Mechanism | Components | Reach |
|---|---:|---:|
| Knight shuttle / avoid renewed knight attack + knight distance to precage | 5 | 66,048 |
| Knight shuttle / king protection of knight + knight off bishop color | 5 | 29,592 |
| Knight shuttle / knight center distance + knight distance to precage | 3 | 18,136 |
| Bishop shuttle / bishop distance from Black + bishop on long diagonal | 9 | 15,672 |
| Knight shuttle / king protection of knight + knight distance to precage | 3 | 8,000 |
| King shuffle / king off bishop color + minors safe | 4 | 4,208 |
| Knight shuttle / knight center distance + knight off bishop color | 5 | 3,360 |
| Bishop shuttle / bishop on long diagonal + minors safe | 1 | 3,264 |
| Bishop shuttle / bishop distance from Black + king-protected central bishop | 2 | 3,024 |
| King shuffle / king center distance + r5 | 6 | 1,144 |
| Bishop shuttle / knight off bishop color + noncentral bishop distance from Black | 1 | 1,008 |
| Knight shuttle / noncentral bishop distance from Black | 3 | 600 |
| Knight shuttle / knight off bishop color + noncentral bishop distance from Black | 1 | 552 |
| Bishop shuttle / noncentral bishop distance from Black | 1 | 520 |
| Bishop shuttle / minors safe + noncentral bishop distance from Black | 5 | 252 |
| King shuffle / king center distance + king defense of knight | 1 | 56 |
| King shuffle / knight distance to precage | 2 | 48 |
| King shuffle / king center distance + no stalemate | 1 | 24 |
| King shuffle / king off bishop color | 1 | 16 |
| Knight shuttle / knight off bishop color + minors safe | 1 | 8 |

## Validation and artifacts

Deterministic samples compare the optimized worker to the unmodified production bundle and direct production calls. One thousand random placements are checked in all eight symmetries. Enumeration totals are asserted. Independent SCC analysis and sink removal must agree on loop reachability. Witnesses replay three times against production rules.

`manifest.json` identifies the exact bundled policy; `progress.json` reports progress; `census.sqlite` contains resumable roots, policies and transitions; `result.json` includes components, frames, selection traces and loop links; `root-family-membership.json` supports overlap analysis.

## Direct-cycle membership and comparison

The update reduces direct loop membership from **7,080 to 824**: **6,256 fewer
placements (88.36%)**. Cyclic components fall from **452 to 60**. The number of
unsupported placements not directly on a discovered cycle is **13,460,348**.

| Archetype | Direct-cycle placements | Share | Previous |
|---|---:|---:|---:|
| Knight shuttle | 352 | 42.72% | 6,608 |
| Bishop shuttle | 272 | 33.01% | 272 |
| King shuffle | 200 | 24.27% | 200 |
| Total | 824 | 100% | 7,080 |

These are unions of post-White boards on edges internal to cyclic components,
restored to physical placements using root symmetry weights. The three broad
groups do not overlap. Fine mechanism groups overlap by eight placements.
**448** direct-cycle placements belong to closed components; **376** belong to
components with exits. Those two groups do not overlap in this run.

The largest fine mechanism by direct membership is bishop escape versus return
to the long diagonal: **128 placements across nine components**. The remaining
knight shuttles as a whole are still the largest broad class.

This is a mixed result. Loop-reaching starts rise by **56,748 (57.51%)**, from
98,672 to 155,420. Starts with only loop outcomes fall by 2,192, while starts
with both loop and support outcomes rise by 59,348. Support-reaching starts
fall by 5,552, and capture/stalemate-reaching starts rise by 6,264. Counts reflect
possible outcomes over all ties, not frequencies of simulated games.

## New dominant loop and recommended next change

Loaded in the Codex sidebar:
[1. Nf8 Ke7 2. Nh7 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/7N/3k4/8/3KB3/8/8/8_w_-_-_0_1&moves=Nf8,Ke7,Nh7,Kd6&cursor=0).
It is reachable from **34,864** unsupported starts. The witness is a minimal
four-ply cycle, verified over three repetitions; every post-White position is
unsupported. The bishop is light-squared and Black starts nearer h8 than a1.

On move 1, **Nf8, Ng5 and Nf6 are tied best moves** after r10's precage preference.
Nf8 allows Ke7 to attack the knight, after which r9.2 selects Nh7. Ng5 makes the
same precage progress without allowing an immediate attack on the knight.

Recommended proposal, not implemented:

> As a final tie-breaker, prefer a knight that is defended or cannot be attacked
> on Black's next legal move.

This applies to otherwise tied moves even when the knight is not currently
attacked. It adds no new best moves and therefore cannot introduce a new cycle
into this audited graph. It complements r9.2 by avoiding the unnecessary attack
before it occurs.

A counterfactual evaluation of every node inside the current cyclic components
removes **all cycles from 12 components**. Unioning the post-White boards on
remaining cyclic edges leaves **656 placements**. This is an upper bound on a
full re-audit because root reachability after pruning was not recomputed.
The old root-to-component memberships similarly give an upper bound of
**69,660** loop-reaching starts, down from 155,420. These are bounds for this
specific final tie-breaker, not measurements of an implemented policy.

After that, bishop-return cycles and closed components remain. A tie-breaker
alone cannot remove a closed component when it offers no alternative best-move
exit; those need a higher-priority preference adjustment. No further policy
changes were made during this audit.

## Reproducibility and runtime

Policy: `c6a5dde3cdd381b186dacd6331238c0de49c56ca`.
All root classifications and initial Black replies were reused only after an
exact extracted-code fingerprint match. All White policies and history
transitions were rebuilt. Census/graph construction took **1,762 seconds** with
eight workers, plus validation and analysis.

The new standalone `direct-membership.mts` postprocessor reproduces the prior
7,080 total and the current 824 total from their immutable graph snapshots. Its
fixture verifies duplicate internal edges, overlapping components, excluded
exit edges, symmetry weights, and refusal to overwrite a report when totals do
not match. All **nine audit-scaffold tests pass**. Application rules are unchanged
from the preceding implementation, which passed 648 mate tests and the build.

Detailed artifacts, including `direct-membership.json`,
`next-attack-tiebreak-counterfactual.json` and
`next-attack-tiebreak-cycle-pruning.json`, are under
`/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-r92-safe-escape/`.
