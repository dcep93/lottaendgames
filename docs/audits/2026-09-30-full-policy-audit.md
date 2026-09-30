# Full KBN-v-K policy audit — 2026-09-30

The current rules do not yet guarantee mate from every theoretically winning start. Among winning White-to-move starts, 28,328 can loop and only 357,660 (3.305%) guarantee mate within 50 moves. All 82 completed-r4 starts still force mate; the remaining loops are in setup, before r2. No rules were changed for this audit.

## Scope and method

Exhaustive, not a sample estimate: every legal four-piece KBN-v-K placement, both bishop colors and both sides to move. A fresh halfmove clock and no repetition history are assumed. Each duration is the worst case over **every currently selected White tie and every legal Black reply**, measured in White moves. It is not tablebase-optimal distance to mate. Longer routes are measured ignoring draw claims/automatic draw termination; they cannot deliver the stated mate under the 50-move rule.

Audited snapshot: `2e25a9c` plus the 40 uncommitted r2 shortcuts 27–66. Runtime fingerprint: `05e434096e83ca47edd26e831cec7c9dd9d8527bdf255354175488e28fbdb460`. The r1 graph and priority framework were not changed.

The legal-position/Syzygy census and unaffected policy decisions were reused. A conservative dependency closure refreshed 42,278 affected White decisions, including changes to destination matching, r4.2, and protected-knight routing; 24,105 decisions changed. A separate deterministic check of 5,044 unaffected decisions matched the cache. All distances were then recomputed across 1,359,578 White position classes and 7,387,022 policy/reply edges, with every finite recurrence and unresolved continuation checked. No legal starts were missing. D4 classes are weighted by their actual orbit sizes. The decision refresh took 56.41 seconds.

## Outcomes

| Outcome | White to move | Black to move |
| --- | ---: | ---: |
| Legal starts | 10,875,504 | 13,660,584 |
| Tablebase winning for White | 10,822,184 | 11,188,168 |
| Rules force mate within 50 White moves | 357,660 | 221,664 |
| Rules force eventual mate, but need more than 50 | 10,436,196 | 10,896,208 |
| Tablebase winning, but rules permit looping | 28,328 | 70,296 |
| Theoretical draws, excluded from policy-failure counts | 53,320 | 2,472,416 |

The Black-to-move within-50 count includes 464 already-checkmated positions. Winning policy failures are 0.262% of winning White starts and 0.628% of winning Black starts. These counts concern positions, not distinct moves.

## Duration distribution

Percentages below use theoretically winning starts for the corresponding side as denominator. Durations are worst cases, not frequencies of outcomes under random play.

| White moves to mate | White to move | Black to move |
| --- | ---: | ---: |
| Already checkmated | 0 (0.00%) | 464 (0.00%) |
| 1–10 | 12,388 (0.11%) | 4,844 (0.04%) |
| 11–20 | 18,644 (0.17%) | 5,892 (0.05%) |
| 21–30 | 23,496 (0.22%) | 10,016 (0.09%) |
| 31–40 | 47,592 (0.44%) | 28,368 (0.25%) |
| 41–50 | 255,540 (2.36%) | 172,080 (1.54%) |
| 51–60 | 4,769,300 (44.07%) | 4,114,616 (36.78%) |
| 61–70 | 4,401,184 (40.67%) | 4,994,924 (44.64%) |
| 71–80 | 1,232,200 (11.39%) | 1,715,144 (15.33%) |
| 81+ | 33,512 (0.31%) | 71,524 (0.64%) |
| Winning, but policy does not force mate | 28,328 (0.26%) | 70,296 (0.63%) |

Finite routes only:

| Statistic | White to move | Black to move |
| --- | ---: | ---: |
| mean | 61.24 | 62.91 |
| median | 61.00 | 62.00 |
| p90 | 71.00 | 73.00 |
| p95 | 74.00 | 76.00 |
| p99 | 78.00 | 80.00 |
| max | 87.00 | 87.00 |

## Remaining loops

All 3,541 winning White failure classes are outside r1 and r2. Their graph contains 57 cyclic components after D4 reduction: 116 cyclic position classes (928 physical boards), with other failing starts able to reach those cycles. The largest cyclic component has three White-to-move classes. Every recommended first move at a winning failure source preserves the tablebase win, and no such node has a capture/stalemate terminal. Thus these failures are failure to make progress, not immediate loss of the theoretical win.

[Example: Na5 Kc3 Nb3 Kc2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/N7/8/8/B7/K1k5_w_-_-_0_1&moves=Nb3%2B,Kc2,Na5,Kc3,Nb3,Kc2&cursor=0). The prefix is `1. Nb3+ Kc2`; the subsequent four plies return to the same position.

## Where the longest route spends its time

The verified 87-move witness starts at `N7/3B4/8/8/8/6k1/8/7K w - - 0 1` and consists of:

- 40 White setup moves before entering r2.
- 27 White r2 moves before entering r1.
- 20 White moves within the r1 net to checkmate, including the final move whose rule attribution remains `mate`.

The first r2 position is `8/8/5k2/3BN3/3K4/8/8/8 w - - 80 41`. The first r1 position is `6k1/5N2/5K2/8/4B3/8/8/8 w - - 134 68`.

The replay is split because the app ends a session at the 50-move draw. Continuation links reset only the display halfmove clock; actual clocks are preserved in the JSON and PGN. These resets do not make the full line a valid 50-move win.

- [Moves 1–40](http://localhost:5173/mate/bishop-knight#fen=N7/3B4/8/8/8/6k1/8/7K_w_-_-_0_1&moves=Kg1,Kf3,Kf1,Ke3,Kg2,Ke4,Kg3,Ke3,Kg4,Ke4,Kg5,Ke5,Kg6,Kd5,Kf5,Kd6,Ba4,Kc5,Ke4,Kb4,Bc6,Kc5,Bb7,Kc4,Ke5,Kc5,Ke6,Kb4,Kd5,Kb5,Kd6,Kc4,Kc6,Kd4,Kc7,Ke5,Kb8,Ke6,Nc7%2B,Kf7,Kc8,Ke7,Bd5,Kd6,Kb7,Kd7,Kb6,Kd6,Be6,Ke5,Kc6,Kf4,Nd5%2B,Ke4,Kc5,Ke5,Bh3,Ke4,Bf1,Kf3,Kd4,Kg3,Ne3,Kf2,Bc4,Kf3,Nd5,Kg4,Nc3,Kf5,Ne4,Kg6,Nc5,Kg7,Nd3,Kf8,Ne5,Kg7,Bd5,Kf6&cursor=0)
- [Moves 41–80](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/3BN3/3K4/8/8/8_w_-_-_0_41&moves=Be4,Kg5,Nc6,Kf4,Kd5,Kg3,Ke5,Kf2,Nd4,Ke3,Ne6,Ke2,Kd4,Kd2,Bf5,Ke2,Kc3,Ke3,Bd3,Kf2,Kd2,Kf3,Bf5,Kg3,Ke3,Kg2,Ke2,Kg3,Be4,Kg4,Kf2,Kh3,Bf5%2B,Kh4,Kf3,Kh5,Kg3,Kh6,Kf4,Kh5,Nf8,Kh6,Ng6,Kh5,Be4,Kh6,Kf5,Kh7,Kf6,Kg8,Ne5,Kh8,Nf7%2B,Kg8,Bg6,Kf8,Bh7,Ke8,Ne5,Kd8,Ke6,Kc7,Nd7,Kb7,Bd3,Kc6,Bc4,Kc7,Bd5,Kd8,Kd6,Ke8,Be6,Kd8,Bf7,Kc8,Nc5,Kd8,Nb7%2B,Kc8&cursor=0)
- [Moves 81–87](http://localhost:5173/mate/bishop-knight#fen=2k5/1N3B2/3K4/8/8/8/8/8_w_-_-_0_81&moves=Kc6,Kb8,Kb6,Kc8,Be6%2B,Kb8,Bd7,Ka8,Nc5,Kb8,Na6%2B,Ka8,Bc6%23&cursor=0)

Across the 82 completed-r4 starts, r2→r1 has mean 13.98, median 11, maximum 28. R2→mate has mean 32.34, median 30, maximum 47. All 82 force mate. These start populations are much narrower than the all-legal audit above.

## Recommended next work, preserving r4 → r2 → r1

1. **Repair setup convergence first.** Use the 57 cyclic components as the work list. Require every chosen continuation to decrease a certified distance to the r2 boundary. Preserve the existing piece-safety and no-stalemate priorities, and confirm all legal Black replies and all retained White ties. Do not put these unrelated setup positions into r1.
2. **Optimize total worst-case mate length with r1 frozen.** Keep r2 as a bridge into the existing r1 net, but assign each r1 entry its actual fixed remaining mate cost instead of treating every entry as cost zero. A bridge that enters r1 sooner can still mate later if it enters a much slower part of the net. This changes the optimization objective, not the stage labels or r1 moves.
3. **Improve setup and bridge on the longest complete routes.** The witness spends 40 moves before r2. Rank candidate changes by the resulting worst-case total from the affected legal starts; recompute after each change. Preserve the completed-r4 boundary, and charge each setup destination its certified r2→mate suffix. Start with the 87-move witness rather than more unrelated local savings. If several branches tie for worst case, improving only one may leave the maximum unchanged.

First seek one verified improvement on this longest route, then rerun the cached census. Do not promise universal 50-move completion until the constrained policy has been checked: retaining the stage boundaries and frozen r1 may limit what is achievable. No new runtime tablebase, priority exception, r1 expansion, or shortcut was installed by this audit.

## Evidence

- [Machine-readable summary, full histograms, method, and witness positions](2026-09-30-full-policy-audit.json)
- [Full worst-case PGN, with original counters](2026-09-30-worst-policy-line.pgn)
- Local graph/cache and scripts: `.audit/all-legal-after-66-central/`, `.audit/full-audit-refresh.mts`, `.audit/classify-after-66.mts`, `.audit/loop-components-after-66.py`.
