# Full support-loss and loop audit — 2026-09-22

Policy: `2767184`. No playing preferences or support definitions were changed.

## Findings

- **86 cyclic components**, after all eight D4 symmetries are deduplicated. Two contain supported positions; 84 remain unsupported. Components 47 and 51 have branching cycles; the other 84 components each have two history states.
- **164 distinct cyclic post-White position classes** (1,312 physical orientations): 3 supported classes and 161 unsupported classes.
- **0.009442% of unsupported physical placements lie on a cycle**. 1.446947% can eventually reach one under a fresh start (24,678 D4 classes / 197,376 physical placements).
- **31 nonmating support-loss transitions**, corresponding to **27 distinct White decisions**. These affect 31 supported source classes / 248 physical placements, 1.2571% of the supported census. Four mating transitions are counted separately and are not failures to fix.
- Of the 31 nonmating transitions, 20 leave a five-diagonal, 8 a seven-diagonal, and 3 a three-diagonal. Every transition has a possible mating continuation; one can also lead to a loop when Black's return history applies. None leads to capture/stalemate after the loss under this policy.
- **None of the 27 decisions has a support-preserving alternative that avoids immediate capture or stalemate.** Fixing these losses requires inspecting earlier play or the support definition, rather than merely choosing another safe move at the loss itself.

## Inspect these first

1. **Mixed three-diagonal / unsupported loop:** [Bf1 Kh3 Ba6 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/B7/8/8/8/5KNk/8_w_-_-_0_1&moves=Bf1,Kh3,Ba6,Kh2&cursor=0). Bf1 creates supported three-diagonal; Ba6 loses support. This is the sole support-loss decision with loop reachability. Loaded in the sidebar.
2. **Supported five-diagonal loop:** [Kd6 Ka6 Kc5 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/3B4/8/k1KN4/8/8/8/8_w_-_-_0_1&moves=Kd6,Ka6,Kc5,Ka5&cursor=0). Both White results remain supported; r2.5 chooses the king moves.
3. **Largest unsupported loop basin:** [Bc6 Ke4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/2KNk3/8/8/8/8_w_-_-_0_1&moves=Bc6,Ke4,Ba8,Ke5&cursor=0). White Kc5 protects Nd5, while the bishop alternates between a8 and c6. It is reachable from **5,503 D4 starting classes / 43,996 physical starts**: 22.29% of all loop-leading physical starts. The three largest components together cover 85,892 starts (43.52%).

The earlier zero-supported-loop result used a fresh Black reply at each supported starting board. Both supported components above depend on Black's previous-White-position return history; restarting at their supported post-White boards erases that history. The full graph preserves it across support changes and exposes these loops. Both linked witnesses are verified from a fresh **White-to-move** start over three laps.

## Largest piece-position motifs on cycles

Counts are D4 position classes, not numbers of components or starting basins. A component may contain several motifs.

| Placement motif | D4 positions |
|---|---:|
| Noncentral bishop not protected by king; interior king; edge knight not protected by king | 36 |
| Noncentral bishop not protected by king; interior king; knight protected by king | 25 |
| Noncentral bishop not protected by king; interior king; non-edge knight not protected by king | 18 |
| Noncentral bishop protected by king; interior king; knight protected by king | 16 |
| Noncentral bishop not protected by king; central king; knight protected by king | 12 |

## Reproduction and validation

```sh
cd app
npm run audit:unsupported -- --scope all --out /absolute/new-full-audit --workers 4
```

The root census took 537 seconds; graph construction completed at 1,790 seconds, using four workers. All 1,707,888 D4 root orbits (13,660,584 physical placements), 1,528,909 history states and 1,576,262 transitions were audited. This is a placement census, not a retrograde legality proof. All tied best White moves and app-selected Black replies are followed; clocks and repetition claims are excluded. Mate, stalemate, or a capturable minor ends a branch.

Validation: 20 harness tests; optimized/reference policy checks; enumeration and D4 checks; SCC reachability independently checked by sink removal; support-loss alternatives checked against the production classifier; every report replay decoded. All 86 representatives have valid replay links; 84 also follow fresh-start best replies for three laps. Components 3 and 52 are explicitly marked as requiring prior history. The two supported-loop witnesses and largest-basin witness were separately verified move by move.

Local immutable census and graph: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-full`. The JSON, SQLite graph, executable bundles, and fingerprints remain available for regrouping without rerunning the census. `full-analysis-manifest.json` records the later report-bundle hashes. The synthetic report smoke-test directory under `.audit/` was used only for validation and is not a source of these results.

---

# Full bishop-and-knight audit

Policy commit: `2767184b31a0471b45855e06ecd0b0245e7a21d6`. Snapshot fingerprint: `e28d0bb49e4e1e45e8233f9bdc940e5dbc6e47458869348ed75cc5cb330ec3ad`.

All 13,660,584 post-White placements, reduced to 1,707,888 actual D4 orbits. Counts below distinguish D4 orbits from physical board orientations; no blanket division by eight. Every tied best White move and app-selected Black reply is followed through changes of support. Black's previous-White-position return history is retained.

## Loops by starting support status

| Starting status | D4 positions | Physical positions | Directly on a loop, D4 / physical | Can reach a loop, D4 / physical | Direct-loop % of physical starts | Reach-loop % of physical starts |
|---|---:|---:|---:|---:|---:|---:|
| all | 1,707,888 | 13,660,584 | 164 / 1,312 | 24,678 / 197,376 | 0.0096% | 1.4449% |
| supported | 2,466 | 19,728 | 3 / 24 | 0 / 0 | 0.1217% | 0.0000% |
| unsupported | 1,705,422 | 13,640,856 | 161 / 1,288 | 24,678 / 197,376 | 0.0094% | 1.4469% |
| 7 | 1,443 | 11,544 | 0 / 0 | 0 / 0 | 0.0000% | 0.0000% |
| 5 | 723 | 5,784 | 2 / 16 | 0 / 0 | 0.2766% | 0.0000% |
| 3 | 300 | 2,400 | 1 / 8 | 0 / 0 | 0.3333% | 0.0000% |

86 cyclic components after D4 deduplication. 2 contain a supported board on the cycle; 0 are reachable from a fresh supported start; 2 are reachable after support anywhere in the history-aware graph. Direct membership means that the board occurs on a history-aware cycle; it does not necessarily mean that its history-free Black reply reenters that same cycle. The stricter count is retained as directLoopFromFreshStart in the JSON. A component may contain several simple loops; these are component counts, not a count of all possible simple cycles.

## Support-losing best White moves

A loss means the last White result was supported and the next White result is unsupported. Black's reply does not itself reclassify support. Transition deduplication applies one shared D4 transformation to the prior White result, current White-turn board, and next White result.

| Transition outcome | Distinct transitions, D4 / physical | Distinct supported source boards, D4 / physical |
|---|---:|---:|
| Nonmating support losses | 31 / 248 | 31 / 248 |
| Loss on a mating move | 4 / 32 | 4 / 32 |
| Losses with playable examples | 33 / 264 | 33 / 264 |
| Census-only examples | 2 / 16 | 2 / 16 |
| No legal move retains support (nonmating losses) | 27 / 216 | 27 / 216 |
| A legal move retains support (nonmating losses) | 4 / 32 | 4 / 32 |
| A support-preserving move avoids immediate capture/stalemate | 0 / 0 | 0 / 0 |
| No support-preserving move avoids immediate capture/stalemate | 31 / 248 | 31 / 248 |
| A loop is reachable after the loss | 1 / 8 | 1 / 8 |
| Mate is reachable after the loss | 35 / 280 | 35 / 280 |
| Capture/stalemate is reachable after the loss | 0 / 0 | 0 / 0 |

Reachable outcomes overlap when tied choices have different endings. Sources are post-White boards, so several Black replies or subsequent White moves can share one source. A source counted here can occur after earlier moves with history; it need not lose support under its fresh-start reply.

| Previous support | Nonmating loss transitions, D4 / physical | Source boards, D4 / physical |
|---|---:|---:|
| 3 | 3 / 24 | 3 / 24 |
| 5 | 20 / 160 | 20 / 160 |
| 7 | 8 / 64 | 8 / 64 |

### Support-loss piece-position motifs

These groups use the placement before Black replies. The moved piece is included to identify the action to inspect. Source counts can overlap across groups. There are 27 distinct nonmating White decisions after dropping the preceding Black-reply context. A replay starts before the support-losing White move, with a short legal lead-in where necessary; the recorded prior White result is available in `support-loss-events.json`.

| Motif | Transitions, D4 | Sources, D4 | Example loss |
|---|---:|---:|---|
| 5-diagonal; Noncentral bishop not king-protected; edge king; knight unprotected by king; K moves | 8 | 8 | [1. Ke7](http://localhost:5173/mate/bishop-knight#fen=4K3/2k5/8/1B6/8/2N5/8/8_w_-_-_0_1&moves=Ke7,Kb6&cursor=0) |
| 7-diagonal; Noncentral bishop not king-protected; interior king; knight unprotected by king; B moves | 3 | 3 | [1. Bg8](http://localhost:5173/mate/bishop-knight#fen=8/1K6/8/8/8/k2N4/B7/8_w_-_-_0_1&moves=Bg8,Ka4&cursor=0) |
| 7-diagonal; Noncentral bishop not king-protected; interior king; knight king-protected; K moves | 3 | 3 | [1. Kc3](http://localhost:5173/mate/bishop-knight#fen=8/5B2/2k5/8/8/3N4/2K5/8_w_-_-_0_1&moves=Kc3,Kd7&cursor=0) |
| 5-diagonal; Noncentral bishop not king-protected; interior king; knight unprotected by king; K moves | 3 | 3 | [1. Kc5](http://localhost:5173/mate/bishop-knight#fen=1k2B3/8/8/8/1K6/3N4/8/8_w_-_-_0_1&moves=Kc5,Kc8&cursor=0) |
| 5-diagonal; Noncentral bishop king-protected; edge king; knight king-protected; B moves | 2 | 2 | [1. Bd1](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/8/BN6/K7/8/8_w_-_-_0_1&moves=Bd1,Kc5&cursor=0) |
| 5-diagonal; Noncentral bishop king-protected; edge king; knight unprotected by king; N moves | 2 | 2 | [1. Nc4](http://localhost:5173/mate/bishop-knight#fen=4BK2/2k5/1N6/8/8/8/8/8_w_-_-_0_1&moves=Nc4,Kb7&cursor=0) |
| 5-diagonal; Noncentral bishop king-protected; edge king; knight king-protected; N moves | 2 | 2 | [1. Nd3](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/1B6/KN6/8/8/8_w_-_-_0_1&moves=Nd3,Kc7&cursor=0) |
| 7-diagonal; Noncentral bishop not king-protected; central king; knight king-protected; K moves | 2 | 2 | [1. Kd4](http://localhost:5173/mate/bishop-knight#fen=6B1/4k3/8/8/4K3/3N4/8/8_w_-_-_0_1&moves=Kd4,Kf8&cursor=0) |
| 3-diagonal; Noncentral bishop king-protected; interior king; knight king-protected; B moves | 1 | 1 | [1. Bf1](http://localhost:5173/mate/bishop-knight#fen=2k5/1N6/BK6/8/8/8/8/8_w_-_-_0_1&moves=Bf1,Kd7&cursor=0) |
| 5-diagonal; Noncentral bishop not king-protected; edge king; knight king-protected; K moves | 1 | 1 | [1. Kb5](http://localhost:5173/mate/bishop-knight#fen=1k2B3/8/8/8/KN6/8/8/8_w_-_-_0_1&moves=Kb5,Kc8&cursor=0) |
| 5-diagonal; Noncentral bishop not king-protected; interior king; knight king-protected; B moves | 1 | 1 | [1. Bc6](http://localhost:5173/mate/bishop-knight#fen=8/2K5/1N6/k7/B7/8/8/8_w_-_-_0_1&moves=Bc6,Kb4&cursor=0) |
| 5-diagonal; Noncentral bishop not king-protected; interior king; knight unprotected by king; B moves | 1 | 1 | [1. Bc6](http://localhost:5173/mate/bishop-knight#fen=8/2K5/8/k7/B7/2N5/8/8_w_-_-_0_1&moves=Bc6,Kb4&cursor=0) |
| 3-diagonal; Noncentral bishop king-protected; edge king; knight unprotected by king; N moves | 1 | 1 | [2. Nb6](http://localhost:5173/mate/bishop-knight#fen=k1B5/8/K7/3N4/8/8/8/8_w_-_-_0_1&moves=Bb7%2B,Kb8,Nb6,Kc7&cursor=0) |
| 3-diagonal; Noncentral bishop king-protected; interior king; knight king-protected; N moves | 1 | 1 | [2. Nb4](http://localhost:5173/mate/bishop-knight#fen=8/k7/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Ka7&cursor=0) |

## Piece-position motifs directly on cycles

Every cyclic post-White board is counted once, even if it belongs to multiple components. These groups describe pieces and protection, not which piece shuttles.

| Motif | D4 positions | Physical positions | Components |
|---|---:|---:|---|
| Unsupported; Noncentral bishop not king-protected; interior king; knight on edge, unprotected by king | 36 | 288 | 14, 18, 19, 20, 22, 23, 26, 28, 29, 30, 32, 36, 37, 38, 39, 40, 41, 43 |
| Unsupported; Noncentral bishop not king-protected; interior king; knight king-protected | 25 | 200 | 6, 7, 9, 10, 11, 12, 13, 42, 15, 16, 17, 24, 25, 45, 46, 51, 53, 54, 55, 60 |
| Unsupported; Noncentral bishop not king-protected; interior king; knight unprotected by king | 18 | 144 | 21, 27, 31, 33, 34, 35, 47, 48, 49, 56, 64 |
| Unsupported; Noncentral bishop king-protected; interior king; knight king-protected | 16 | 128 | 6, 8, 9, 13, 44, 50, 51, 52, 54, 55, 57, 58, 76, 59, 75, 62 |
| Unsupported; Noncentral bishop not king-protected; central king; knight king-protected | 12 | 96 | 65, 66, 67, 68, 69, 77, 70, 78 |
| Unsupported; Noncentral bishop not king-protected; central king; knight unprotected by king | 10 | 80 | 71, 72, 73, 74, 79 |
| Unsupported; Unprotected by king central bishop; knight king-protected, off precage | 8 | 64 | 2, 5, 7, 8, 24, 45, 25, 46, 44, 62 |
| Unsupported; King-protected central bishop; knight on edge, off precage | 6 | 48 | 83, 84, 86 |
| Unsupported; Noncentral bishop king-protected; central king; knight king-protected | 5 | 40 | 58, 59, 66, 75, 76 |
| Unsupported; King-protected central bishop; knight king-protected, off precage | 4 | 32 | 80, 81 |
| Unsupported; Noncentral bishop not king-protected; edge king; knight king-protected | 3 | 24 | 1, 2, 4 |
| Unsupported; Noncentral bishop king-protected; edge king; knight king-protected | 3 | 24 | 3, 5 |
| Unsupported; Unprotected by king central bishop; knight unprotected by king, off precage | 3 | 24 | 33, 49, 47, 48 |
| Unsupported; Noncentral bishop king-protected; central king; knight unprotected by king | 3 | 24 | 53, 57, 60 |
| Unsupported; Unprotected by king central bishop; knight on precage | 2 | 16 | 63, 82 |
| Unsupported; King-protected central bishop; knight on precage | 2 | 16 | 63, 82 |
| Unsupported; King-protected central bishop; knight unprotected by king, off precage | 2 | 16 | 85 |
| Unsupported; Noncentral bishop not king-protected; edge king; knight unprotected by king | 1 | 8 | 1 |
| Unsupported; Noncentral bishop king-protected; interior king; knight on edge, unprotected by king | 1 | 8 | 4 |
| Unsupported; Noncentral bishop king-protected; interior king; knight unprotected by king | 1 | 8 | 10 |
| 3-diagonal; Noncentral bishop king-protected; interior king; knight king-protected | 1 | 8 | 11 |
| 5-diagonal; Noncentral bishop not king-protected; interior king; knight king-protected | 1 | 8 | 61 |
| 5-diagonal; Noncentral bishop king-protected; interior king; knight king-protected | 1 | 8 | 61 |

## Loop representatives

| Component | Supported cycle boards, D4 | Unsupported cycle boards, D4 | Reachable after support | Replay |
|---|---:|---:|---|---|
| 1 | 0 | 2 | no | [Nb4+ Kb3 Na2 Kc2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/8/N1k5/K7_w_-_-_0_1&moves=Nb4%2B,Kb3,Na2,Kc2&cursor=0) |
| 2 | 0 | 2 | no | [Be4 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/K1k5/1N6/8_w_-_-_0_1&moves=Be4,Kd4,Ba8,Kc3&cursor=0) |
| 3 | 0 | 2 | no | [Nb5+ Kb8 Na7 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/NBk5/K7/8/8/8/8/8_w_-_-_0_1&moves=Nb5%2B,Kb8,Na7,Kc7&cursor=0) (prior history required) |
| 4 | 0 | 2 | no | [Ka6 Kc7 Kb5 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/N7/2B5/1K6/8/8/8/8_w_-_-_0_1&moves=Ka6,Kc7,Kb5,Kb8&cursor=0) |
| 5 | 0 | 2 | no | [Bd5 Kc5 Bb3 Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/8/KN6/1B6/8/8_w_-_-_0_1&moves=Bd5,Kc5,Bb3,Kb6&cursor=0) |
| 6 | 0 | 2 | no | [Bb7 Kd5 Ba8 Kc4](http://localhost:5173/mate/bishop-knight#fen=B7/8/1KN5/8/2k5/8/8/8_w_-_-_0_1&moves=Bb7,Kd5,Ba8,Kc4&cursor=0) |
| 7 | 0 | 2 | no | [Ba8 Ka1 Bd5 Kb1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/8/1K6/N7/1k6_w_-_-_0_1&moves=Ba8,Ka1,Bd5,Kb1&cursor=0) |
| 8 | 0 | 2 | no | [Bd5 Kd4 Bb3 Ke3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/1BN1k3/2K5/8_w_-_-_0_1&moves=Bd5,Kd4,Bb3,Ke3&cursor=0) |
| 9 | 0 | 2 | no | [Ba4 Kd4 Bc6 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/2k5/1N6/1K6/8/8_w_-_-_0_1&moves=Ba4,Kd4,Bc6,Kc5&cursor=0) |
| 10 | 0 | 2 | no | [Kc2 Kb4 Kd3 Ka3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2B5/k2K4/1N6/8_w_-_-_0_1&moves=Kc2,Kb4,Kd3,Ka3&cursor=0) |
| 11 | 1 | 1 | yes | [Bf1 Kh3 Ba6 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/B7/8/8/8/5KNk/8_w_-_-_0_1&moves=Bf1,Kh3,Ba6,Kh2&cursor=0) |
| 12 | 0 | 2 | no | [Bb7 Kd6 Ba8 Kd5](http://localhost:5173/mate/bishop-knight#fen=B7/8/2N5/1K1k4/8/8/8/8_w_-_-_0_1&moves=Bb7,Kd6,Ba8,Kd5&cursor=0) |
| 13 | 0 | 2 | no | [Ba6 Kd6 Bb7 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/1Bk5/2N5/1K6/8/8/8/8_w_-_-_0_1&moves=Ba6,Kd6,Bb7,Kc7&cursor=0) |
| 14 | 0 | 2 | no | [Bf3 Ke3 Ba8 Kd4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/1K1k4/8/N7/8_w_-_-_0_1&moves=Bf3,Ke3,Ba8,Kd4&cursor=0) |
| 15 | 0 | 2 | no | [Bh1 Kd4 Bc6 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/2k5/8/8/3K4/2N5_w_-_-_0_1&moves=Bh1,Kd4,Bc6,Kc5&cursor=0) |
| 16 | 0 | 2 | no | [Bh1 Kd4 Bc6 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/2k5/8/8/3K4/3N4_w_-_-_0_1&moves=Bh1,Kd4,Bc6,Kc5&cursor=0) |
| 17 | 0 | 2 | no | [Bh1 Kd4 Bc6 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/2k5/8/8/3K4/4N3_w_-_-_0_1&moves=Bh1,Kd4,Bc6,Kc5&cursor=0) |
| 18 | 0 | 2 | no | [Bh1 Kd4 Bc6 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/2k5/8/8/3K4/5N2_w_-_-_0_1&moves=Bh1,Kd4,Bc6,Kc5&cursor=0) |
| 19 | 0 | 2 | no | [Bh1 Kd4 Bc6 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/2k5/8/8/3K4/6N1_w_-_-_0_1&moves=Bh1,Kd4,Bc6,Kc5&cursor=0) |
| 20 | 0 | 2 | no | [Bf3 Ke3 Ba8 Kd4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/1K1k4/8/8/1N6_w_-_-_0_1&moves=Bf3,Ke3,Ba8,Kd4&cursor=0) |
| 21 | 0 | 2 | no | [Bf3 Ke3 Ba8 Kd4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/1K1k4/8/1N6/8_w_-_-_0_1&moves=Bf3,Ke3,Ba8,Kd4&cursor=0) |
| 22 | 0 | 2 | no | [Bh1 Ke5 Bc6 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/6K1/8/8/8/6N1_w_-_-_0_1&moves=Bh1,Ke5,Bc6,Kd6&cursor=0) |
| 23 | 0 | 2 | no | [Bf3 Ke3 Ba8 Kd4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/1K1k4/8/8/2N5_w_-_-_0_1&moves=Bf3,Ke3,Ba8,Kd4&cursor=0) |
| 24 | 0 | 2 | no | [Be4 Ke5 Ba8 Kd4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/1K1k4/2N5/8/8_w_-_-_0_1&moves=Be4,Ke5,Ba8,Kd4&cursor=0) |
| 25 | 0 | 2 | no | [Be4 Ke5 Ba8 Kd4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/2N5/1K1k4/8/8/8_w_-_-_0_1&moves=Be4,Ke5,Ba8,Kd4&cursor=0) |
| 26 | 0 | 2 | no | [Bh1 Ke5 Bc6 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/6K1/8/8/8/5N2_w_-_-_0_1&moves=Bh1,Ke5,Bc6,Kd6&cursor=0) |
| 27 | 0 | 2 | no | [Bh1 Ke5 Bc6 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/6K1/8/8/4N3/8_w_-_-_0_1&moves=Bh1,Ke5,Bc6,Kd6&cursor=0) |
| 28 | 0 | 2 | no | [Bh1 Ke5 Bc6 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/6K1/8/8/8/4N3_w_-_-_0_1&moves=Bh1,Ke5,Bc6,Kd6&cursor=0) |
| 29 | 0 | 2 | no | [Bf3 Ke3 Ba8 Kd4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/1K1k4/8/8/4N3_w_-_-_0_1&moves=Bf3,Ke3,Ba8,Kd4&cursor=0) |
| 30 | 0 | 2 | no | [Bh1 Ke5 Bc6 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/6K1/8/8/8/3N4_w_-_-_0_1&moves=Bh1,Ke5,Bc6,Kd6&cursor=0) |
| 31 | 0 | 2 | no | [Bf3 Kf4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/4K3/8/4k3/8/1N6/8/8_w_-_-_0_1&moves=Bf3,Kf4,Ba8,Ke5&cursor=0) |
| 32 | 0 | 2 | no | [Bf3 Kf4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/4K3/8/4k3/8/N7/8/8_w_-_-_0_1&moves=Bf3,Kf4,Ba8,Ke5&cursor=0) |
| 33 | 0 | 2 | no | [Be4 Kd4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/4K3/8/4k3/8/8/3N4/8_w_-_-_0_1&moves=Be4,Kd4,Ba8,Ke5&cursor=0) |
| 34 | 0 | 2 | no | [Bh1 Ke5 Bc6 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/6K1/8/1N6/8/8_w_-_-_0_1&moves=Bh1,Ke5,Bc6,Kd6&cursor=0) |
| 35 | 0 | 2 | no | [Bf3 Kf4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/4K3/8/4k3/8/8/1N6/8_w_-_-_0_1&moves=Bf3,Kf4,Ba8,Ke5&cursor=0) |
| 36 | 0 | 2 | no | [Bf3 Kf4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/4K3/8/4k3/8/8/N7/8_w_-_-_0_1&moves=Bf3,Kf4,Ba8,Ke5&cursor=0) |
| 37 | 0 | 2 | no | [Bh1 Kd4 Bc6 Kc5](http://localhost:5173/mate/bishop-knight#fen=N7/8/2B5/2k5/8/8/3K4/8_w_-_-_0_1&moves=Bh1,Kd4,Bc6,Kc5&cursor=0) |
| 38 | 0 | 2 | no | [Bh1 Ke5 Bc6 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/6K1/N7/8/8/8_w_-_-_0_1&moves=Bh1,Ke5,Bc6,Kd6&cursor=0) |
| 39 | 0 | 2 | no | [Bf3 Kf4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/4K3/8/4k3/8/8/8/2N5_w_-_-_0_1&moves=Bf3,Kf4,Ba8,Ke5&cursor=0) |
| 40 | 0 | 2 | no | [Bf3 Kf4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/4K3/8/4k3/8/8/8/1N6_w_-_-_0_1&moves=Bf3,Kf4,Ba8,Ke5&cursor=0) |
| 41 | 0 | 2 | no | [Bf3 Kf4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/4K3/8/4k3/8/8/8/N7_w_-_-_0_1&moves=Bf3,Kf4,Ba8,Ke5&cursor=0) |
| 42 | 0 | 2 | no | [Ba8 Kd6 Bb7 Kd5](http://localhost:5173/mate/bishop-knight#fen=8/1B6/2N5/1K1k4/8/8/8/8_w_-_-_0_1&moves=Ba8,Kd6,Bb7,Kd5&cursor=0) |
| 43 | 0 | 2 | no | [Bg2 Kd4 Bc6 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/2k5/8/8/3K4/7N_w_-_-_0_1&moves=Bg2,Kd4,Bc6,Kc5&cursor=0) |
| 44 | 0 | 2 | no | [Bd5 Kd4 Bc6 Kc3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/1KN5/8/2k5/8/8_w_-_-_0_1&moves=Bd5,Kd4,Bc6,Kc3&cursor=0) |
| 45 | 0 | 2 | no | [Bh1 Kd4 Bd5 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2kB4/8/2N5/3K4/8_w_-_-_0_1&moves=Bh1,Kd4,Bd5,Kc5&cursor=0) |
| 46 | 0 | 2 | no | [Bh1 Kd4 Bd5 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2kB4/8/4N3/3K4/8_w_-_-_0_1&moves=Bh1,Kd4,Bd5,Kc5&cursor=0) |
| 47 | 0 | 3 | no | [Ba8 Kd4 Bd5 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3Bk3/1N6/8/3K4/8_w_-_-_0_1&moves=Ba8,Kd4,Bd5,Ke5&cursor=0) |
| 48 | 0 | 2 | no | [Bh1 Ke5 Bd5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/3B2K1/8/4N3/8/8_w_-_-_0_1&moves=Bh1,Ke5,Bd5,Kd6&cursor=0) |
| 49 | 0 | 2 | no | [Bd5 Kd4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/4k1K1/1N6/8/8/8_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Ke5&cursor=0) |
| 50 | 0 | 2 | no | [Nd6+ Kd4 Nb5+ Kc4](http://localhost:5173/mate/bishop-knight#fen=8/1B6/2K5/1N6/2k5/8/8/8_w_-_-_0_1&moves=Nd6%2B,Kd4,Nb5%2B,Kc4&cursor=0) |
| 51 | 0 | 3 | no | [Bb5 Ke5 Bc4 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/2K5/2N5/2Bk4/8/8/8_w_-_-_0_1&moves=Bb5,Ke5,Bc4,Kd4&cursor=0) |
| 52 | 0 | 2 | no | [Nd5+ Ka5 Nb6 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/1NK5/1B6/1k6/8/8/8_w_-_-_0_1&moves=Nd5%2B,Ka5,Nb6,Kb4&cursor=0) (prior history required) |
| 53 | 0 | 2 | no | [Kc6 Kb4 Kd5 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/1N6/k2K4/2B5/8/8/8_w_-_-_0_1&moves=Kc6,Kb4,Kd5,Ka5&cursor=0) |
| 54 | 0 | 2 | no | [Bc6 Ke4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/2KNk3/8/8/8/8_w_-_-_0_1&moves=Bc6,Ke4,Ba8,Ke5&cursor=0) |
| 55 | 0 | 2 | no | [Bb5 Ke5 Bc6 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/2N5/2K5/8/8/8_w_-_-_0_1&moves=Bb5,Ke5,Bc6,Kd6&cursor=0) |
| 56 | 0 | 2 | no | [Bh3 Ke5 Bd7 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/3B4/3k4/8/8/4K3/6N1/8_w_-_-_0_1&moves=Bh3,Ke5,Bd7,Kd6&cursor=0) |
| 57 | 0 | 2 | no | [Kc5 Kd8 Kd5 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/1NB5/3K4/8/8/8/8_w_-_-_0_1&moves=Kc5,Kd8,Kd5,Kc7&cursor=0) |
| 58 | 0 | 2 | no | [Kd5 Kc7 Kc5 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/2B5/2K5/3N4/8/8/8_w_-_-_0_1&moves=Kd5,Kc7,Kc5,Kb8&cursor=0) |
| 59 | 0 | 2 | no | [Kd5 Kb6 Kd6 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/2BK4/2N5/8/8/8/8_w_-_-_0_1&moves=Kd5,Kb6,Kd6,Ka7&cursor=0) |
| 60 | 0 | 2 | no | [Kc4 Kb6 Kd5 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/k2K4/1N6/8/8/8_w_-_-_0_1&moves=Kc4,Kb6,Kd5,Ka5&cursor=0) |
| 61 | 2 | 0 | yes | [Kd6 Ka6 Kc5 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/3B4/8/k1KN4/8/8/8/8_w_-_-_0_1&moves=Kd6,Ka6,Kc5,Ka5&cursor=0) |
| 62 | 0 | 2 | no | [Bd5 Ke5 Bc4 Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2BN1k2/3K4/8/8_w_-_-_0_1&moves=Bd5,Ke5,Bc4,Kf4&cursor=0) |
| 63 | 0 | 2 | no | [Ke5 Ke7 Kf5 Kf8](http://localhost:5173/mate/bishop-knight#fen=5k2/8/8/3B1K2/2N5/8/8/8_w_-_-_0_1&moves=Ke5,Ke7,Kf5,Kf8&cursor=0) |
| 64 | 0 | 2 | no | [Bh3 Ke5 Bd7 Kd5](http://localhost:5173/mate/bishop-knight#fen=8/3B4/8/3k4/8/4K3/6N1/8_w_-_-_0_1&moves=Bh3,Ke5,Bd7,Kd5&cursor=0) |
| 65 | 0 | 2 | no | [Bb7 Kb6 Ba8 Kb5](http://localhost:5173/mate/bishop-knight#fen=B7/8/2N5/1k1K4/8/8/8/8_w_-_-_0_1&moves=Bb7,Kb6,Ba8,Kb5&cursor=0) |
| 66 | 0 | 2 | no | [Ba8 Kc3 Bc6 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/3K4/2N5/3k4/8/8_w_-_-_0_1&moves=Ba8,Kc3,Bc6,Kd3&cursor=0) |
| 67 | 0 | 2 | no | [Bc6 Kc2 Ba8 Kb2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/3N4/3K4/8/1k6/8_w_-_-_0_1&moves=Bc6,Kc2,Ba8,Kb2&cursor=0) |
| 68 | 0 | 2 | no | [Ba8 Kb3 Bc6 Kc2](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/3N4/3K4/8/2k5/8_w_-_-_0_1&moves=Ba8,Kb3,Bc6,Kc2&cursor=0) |
| 69 | 0 | 2 | no | [Bc6 Kd6 Ba8 Ke6](http://localhost:5173/mate/bishop-knight#fen=B7/8/4k3/3N4/3K4/8/8/8_w_-_-_0_1&moves=Bc6,Kd6,Ba8,Ke6&cursor=0) |
| 70 | 0 | 2 | no | [Bc6 Kg6 Ba8 Kg7](http://localhost:5173/mate/bishop-knight#fen=B7/6k1/8/3N4/3K4/8/8/8_w_-_-_0_1&moves=Bc6,Kg6,Ba8,Kg7&cursor=0) |
| 71 | 0 | 2 | no | [Ba8 Kb3 Bb7 Kc2](http://localhost:5173/mate/bishop-knight#fen=8/1B6/2N5/8/3K4/8/2k5/8_w_-_-_0_1&moves=Ba8,Kb3,Bb7,Kc2&cursor=0) |
| 72 | 0 | 2 | no | [Ba8 Ke6 Bb7 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/1B6/2N5/5k2/3K4/8/8/8_w_-_-_0_1&moves=Ba8,Ke6,Bb7,Kf5&cursor=0) |
| 73 | 0 | 2 | no | [Ba8 Kf6 Bb7 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/1B6/2N5/6k1/3K4/8/8/8_w_-_-_0_1&moves=Ba8,Kf6,Bb7,Kg5&cursor=0) |
| 74 | 0 | 2 | no | [Ba8 Kf7 Bb7 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/1B6/2N3k1/8/3K4/8/8/8_w_-_-_0_1&moves=Ba8,Kf7,Bb7,Kg6&cursor=0) |
| 75 | 0 | 2 | no | [Kd6 Ka5 Kd5 Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1kB5/2NK4/8/8/8/8_w_-_-_0_1&moves=Kd6,Ka5,Kd5,Kb6&cursor=0) |
| 76 | 0 | 2 | no | [Kc5 Kd8 Kd5 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/2B5/3K4/3N4/8/8/8_w_-_-_0_1&moves=Kc5,Kd8,Kd5,Kc7&cursor=0) |
| 77 | 0 | 2 | no | [Ba8 Ke6 Bc6 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/3N1k2/3K4/8/8/8_w_-_-_0_1&moves=Ba8,Ke6,Bc6,Kf5&cursor=0) |
| 78 | 0 | 2 | no | [Ba8 Kf7 Bc6 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/8/2B3k1/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ba8,Kf7,Bc6,Kg6&cursor=0) |
| 79 | 0 | 2 | no | [Bh3 Kf6 Bd7 Ke7](http://localhost:5173/mate/bishop-knight#fen=8/3Bk3/8/8/3K4/8/6N1/8_w_-_-_0_1&moves=Bh3,Kf6,Bd7,Ke7&cursor=0) |
| 80 | 0 | 2 | no | [Be4 Kg5 Bd5 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/2NB4/3K4/8/8/8_w_-_-_0_1&moves=Be4,Kg5,Bd5,Kf6&cursor=0) |
| 81 | 0 | 2 | no | [Ne4 Kg2 Nc5+ Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2NB4/3K4/8/7k/8_w_-_-_0_1&moves=Ne4,Kg2,Nc5%2B,Kh2&cursor=0) |
| 82 | 0 | 2 | no | [Kf6 Ke8 Ke5 Kf8](http://localhost:5173/mate/bishop-knight#fen=5k2/8/8/3BK3/2N5/8/8/8_w_-_-_0_1&moves=Kf6,Ke8,Ke5,Kf8&cursor=0) |
| 83 | 0 | 2 | no | [Be4 Kc1 Bd5 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3K4/8/1k6/5N2_w_-_-_0_1&moves=Be4,Kc1,Bd5,Kb2&cursor=0) |
| 84 | 0 | 2 | no | [Be4 Kf6 Bd5 Ke7](http://localhost:5173/mate/bishop-knight#fen=8/4k3/8/3B4/3K4/8/8/5N2_w_-_-_0_1&moves=Be4,Kf6,Bd5,Ke7&cursor=0) |
| 85 | 0 | 2 | no | [Be4 Kg5 Bd5 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/3B4/3K4/8/5N2/8_w_-_-_0_1&moves=Be4,Kg5,Bd5,Kf6&cursor=0) |
| 86 | 0 | 2 | no | [Be4 Kc1 Bd5 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3BK3/8/8/1k6/5N2_w_-_-_0_1&moves=Be4,Kc1,Bd5,Kb2&cursor=0) |

## Terminal outcomes and limits

| Starting status | Can reach mate, D4 / physical | Can reach capture/stalemate, D4 / physical |
|---|---:|---:|
| all | 1,377,495 / 11,018,280 | 319,522 / 2,555,376 |
| supported | 2,352 / 18,816 | 116 / 928 |
| unsupported | 1,375,143 / 10,999,464 | 319,406 / 2,554,448 |

This is an exhaustive placement census (distinct squares and nonadjacent kings), not retrograde reachability from the initial chess position. It follows the app’s best-move policy, not every legal Black defense, and ignores clocks and repetition claims. Mate, stalemate, or a capturable minor terminates a branch. A supported root uses the app’s fresh Black reply; later nodes preserve its return-history rule. A few census placements may have no legal preceding White move (for example an impossible double check); those are explicitly marked census-only and receive no broken replay URL. No production preferences or support definitions were changed for this audit.
