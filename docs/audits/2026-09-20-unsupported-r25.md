# Unsupported-position audit

Policy commit: `d47d2ac039b944151e36bd191b9107f3124fd6d1`. Fingerprint: `d5a19011bb0b1fff6d070ae596cb0b436799d33b8b9ae8bea318cf0848966ac0`.

All **13,660,584** post-White KBNvK placements were enumerated, including both bishop colors and all rotations/reflections. **13,461,172** are unsupported; **199,412** are supported. Every tied best move is followed.

| Measure | Placements | % of unsupported | Previous audit |
|---|---:|---:|---:|
| Can reach an unsupported loop | 26,572 | 0.1974% | 503,636 |
| Cannot reach an unsupported loop | 13,434,600 | 99.8026% | 12,957,536 |
| On a loop with reachable history | 488 | 0.0036% | 27,528 |
| Fresh starts that can return to a loop containing themselves | 200 | 0.0015% | 4,024 |
| Only loop outcomes | 22,036 | 0.1637% | 14,628 |
| Both loop and support outcomes | 4,536 | 0.0337% | 488,200 |
| Can reach support | 10,838,456 | 80.5164% | 10,869,768 |
| Can reach mate without first entering support | 1,608 | 0.0119% | 1,616 |
| Can reach capture or stalemate | 2,616,624 | 19.4383% | 2,809,352 |

Outcome categories overlap except can-loop versus cannot-loop. “Can loop” is existential among best-move ties. Direct loop membership counts a board occurring on a history-aware cycle; a fresh load can select a different first Black reply. “Cannot loop” does not imply forced mate: the audit stops at support, mate, capture, or stalemate. Clocks and repetition claims are excluded. Black follows the app policy, not arbitrary legal defense.

## Archetypes

35 cyclic strongly connected components, 1,456,689 history states, 1,439,055 transitions. A component can contain several cycles. Reach counts overlap.

| Archetype | Components | Reachable unsupported starts |
|---|---:|---:|
| Bishop shuttle | 19 | 21,052 |
| King shuffle | 15 | 5,488 |
| Knight shuttle | 1 | 32 |

## Highest exposure components

Reach measures exposure, not guaranteed gains from a rule change. Exclusive reach counts starts that cannot reach any other component. Fresh-load links are checked for three repetitions.

| Rank | Archetype | Reach | Exclusive | Loop |
|---|---|---:|---:|---|
| 1 | Bishop shuttle | 6,096 | 6,096 | [Ba2 Ke4 Bd5+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/2KBk3/8/8/8/8_w_-_-_0_1&moves=Ba2,Ke4,Bd5%2B,Ke5&cursor=0) |
| 2 | Bishop shuttle | 5,504 | 5,504 | [Bf3 Kf4 Bd1 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/5k2/3K2N1/8/8/3B4_w_-_-_0_1&moves=Bf3,Kf4,Bd1,Kf5&cursor=0) |
| 3 | Bishop shuttle | 3,144 | 3,136 | [Bg2 Kg3 Bf1 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K2k1/7N/8/5B2_w_-_-_0_1&moves=Bg2,Kg3,Bf1,Kg4&cursor=0) |
| 4 | Bishop shuttle | 2,256 | 2,168 | [Bh1 Kf4 Be4 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4k3/3NB3/3K4/8/8_w_-_-_0_1&moves=Bh1,Kf4,Be4,Ke5&cursor=0) |
| 5 | King shuffle | 1,896 | 1,896 | [Ke3 Kh4 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K2B1/6k1/5N2/8_w_-_-_0_1&moves=Ke3,Kh4,Kd4,Kg3&cursor=0) |
| 6 | Bishop shuttle | 1,648 | 1,648 | [Bg2 Kg4 Bf1 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/5k2/3K4/7N/8/5B2_w_-_-_0_1&moves=Bg2,Kg4,Bf1,Kf5&cursor=0) |
| 7 | King shuffle | 1,480 | 1,480 | [Ke3 Kh4 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K4/6kB/5N2/8_w_-_-_0_1&moves=Ke3,Kh4,Kd4,Kg3&cursor=0) |
| 8 | King shuffle | 968 | 968 | [Kd4 Ke6 Ke3 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/4B3/3NK3/8/8_w_-_-_0_1&moves=Kd4,Ke6,Ke3,Kf6&cursor=0) |
| 9 | Bishop shuttle | 728 | 728 | [Ba8 Kg8 Bh1 Kg7](http://localhost:5173/mate/bishop-knight#fen=5N2/4K1k1/8/8/8/8/8/7B_w_-_-_0_1&moves=Ba8,Kg8,Bh1,Kg7&cursor=0) |
| 10 | Bishop shuttle | 616 | 616 | [Bc6 Kc7 Ba4 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/8/4K3/B3N3/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kd8&cursor=0) |
| 11 | King shuffle | 568 | 568 | [Kg5 Kf8 Kf4 Kg7](http://localhost:5173/mate/bishop-knight#fen=6B1/6k1/7N/8/5K2/8/8/8_w_-_-_0_1&moves=Kg5,Kf8,Kf4,Kg7&cursor=0) |
| 12 | Bishop shuttle | 504 | 504 | [Bh1 Kh7 Ba8 Kg8](http://localhost:5173/mate/bishop-knight#fen=B5k1/6N1/5K2/8/8/8/8/8_w_-_-_0_1&moves=Bh1,Kh7,Ba8,Kg8&cursor=0) |
| 13 | King shuffle | 256 | 256 | [Kg4 Kg7 Kf4 Kh6](http://localhost:5173/mate/bishop-knight#fen=8/8/6Nk/7B/5K2/8/8/8_w_-_-_0_1&moves=Kg4,Kg7,Kf4,Kh6&cursor=0) |
| 14 | Bishop shuttle | 136 | 136 | [Bc6 Kc7 Ba4 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/3N4/8/4K3/B7/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kd8&cursor=0) |
| 15 | King shuffle | 128 | 128 | [Kf8 Kf5 Ke7 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/4K3/6k1/3B4/2N5/8/8/8_w_-_-_0_1&moves=Kf8,Kf5,Ke7,Kg6&cursor=0) |

## Selection mechanisms

Grouped by the last priority eliminating a candidate on witness moves. Descriptive, not a causal proof.

| Mechanism | Components | Reach |
|---|---:|---:|
| Bishop shuttle / bishop distance from Black + bishop on long diagonal | 9 | 14,176 |
| King shuffle / king off bishop color + minors safe | 4 | 4,200 |
| Bishop shuttle / bishop on long diagonal + minors safe | 1 | 3,144 |
| Bishop shuttle / bishop distance from Black + king-protected central bishop | 2 | 2,256 |
| King shuffle / king center distance + r5 | 6 | 1,144 |
| Bishop shuttle / knight off bishop color + noncentral bishop distance from Black | 1 | 728 |
| Bishop shuttle / noncentral bishop distance from Black | 1 | 504 |
| Bishop shuttle / minors safe + noncentral bishop distance from Black | 5 | 252 |
| King shuffle / king center distance + king defense of knight | 1 | 56 |
| King shuffle / knight distance to precage | 2 | 48 |
| Knight shuttle / avoid next knight attack + knight distance to precage | 1 | 32 |
| King shuffle / king center distance + no stalemate | 1 | 24 |
| King shuffle / king off bishop color | 1 | 16 |

## Validation and artifacts

Deterministic samples compare the optimized worker to the unmodified production bundle and direct production calls. One thousand random placements are checked in all eight symmetries. Enumeration totals are asserted. Independent SCC analysis and sink removal must agree on loop reachability. Witnesses replay three times against production rules.

`manifest.json` identifies the exact bundled policy; `progress.json` reports progress; `census.sqlite` contains resumable roots, policies and transitions; `result.json` includes components, frames, selection traces and loop links; `root-family-membership.json` supports overlap analysis.

## Implemented change and measured effect

**r25 — Prefer the knight’s Euclidean proximity to the center** is now the final
preference, after r20. It uses the existing distance-to-midpoint score (four
times squared Euclidean distance, which preserves ordering). Support, Black's
policy, and every earlier White priority are unchanged.

Direct loop membership falls **27,528 → 488 (98.23%)**. Starts that can reach a
loop fall **503,636 → 26,572 (94.72%)**. The previous counterfactual predicted
at most 488 direct-loop positions and 45,756 loop-reaching starts; the complete
new census confirms the direct count and improves on the reachability bound.
There are now **13,460,684 unsupported placements not directly on a loop** and
**13,434,600 that cannot reach a loop** under the audited policy.

The exhaustive graph contains **35** cyclic components, down from 1,473.
All 1,438 predicted removable knight-shuttle components disappear. This is an
isolated test of adding r25 to the previous r20 policy.

### Remaining direct-cycle positions

| Archetype | Direct positions | Components | Starts that can reach this class |
|---|---:|---:|---:|
| Bishop shuttle | 272 | 19 | 21,052 |
| King shuffle | 200 | 15 | 5,488 |
| Knight shuttle | 16 | 1 | 32 |

The broad classes have no overlapping direct positions. Fine mechanism groups
overlap by eight direct positions. Of the 488 direct positions, **464** belong
to 33 closed components and **24** to two components with exits.

### Outcome trade-off

The number of starts with **only looping outcomes increases from 14,628 to
22,036**. Starts with both loop and support outcomes decrease from 488,200 to
4,536. A final tie-breaker removes alternatives: it can remove a path out of a
remaining loop's basin as well as remove a looping path. The large reduction
in structural cycles is therefore not a forced-termination or forced-mate
proof. Support-reaching starts decrease by 31,312, while capture/stalemate-
reaching starts decrease by 192,728. The full overlapping outcome table above
is retained for that reason.

## Next target: bishop escape and return

The largest remaining mechanism group has **nine components, 128 direct-cycle
positions, and 14,176 loop-reaching starts (53.35% of the remaining exposure)**.
One priority sends the bishop away from Black; r10's long-diagonal preference
then sends it back. This is the recommended next archetype to address.

The newly loaded highest-exposure minimal loop is:

**1. Ba2 Ke4 2. Bd5+ Ke5**

Starting FEN: `8/8/4N3/2KBk3/8/8/8/8 w - - 0 1`.
It accounts for **6,096** loop-reaching starts, all exclusive to this component.
The source bishop on d5 is protected by Kc5, but that king is not central.
r9.3 uniquely chooses Ba2; after Ke4, r10 uniquely chooses Bd5+ to regain the
long diagonal. Black returns to e5. A further final tie-breaker cannot change
these uniquely selected moves; the conflict lies in earlier priorities.

The four-ply witness is minimal, contains no supported post-White position,
uses a light-square bishop with Black nearer h8 than a1, and replays three
complete repetitions with Black's return history. It is loaded in the Codex
sidebar. No further rule change has been made without user approval.

## Validation and reproducibility

- New regressions verify both phases of the former dominant knight shuttle in
  all eight board symmetries, preservation of r20, and equal-center-distance ties.
- The 649-test mate run had one stale expectation for an earlier tied knight
  move. The affected 24-test suite passed after updating that expectation to
  the newly preferred Ne3; all other 648 tests had passed in the full run.
- Production build and all nine audit-scaffold tests passed.
- Audit production-reference comparisons, 1,000-position D4 checks, census
  assertions, independent cycle/sink analysis, and witness replays passed.
- Direct-membership postprocessing independently reproduces all 488 positions.

Root-cache reuse was conservatively rejected, so all roots were enumerated
again. Census and graph construction took **2,335 seconds** with eight workers,
plus validation and analysis. The immutable artifacts are at
`/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-r25/`.
The companion JSON records the exact manifest, outcomes, comparisons, direct
memberships, geometry counts, and loaded witness.
