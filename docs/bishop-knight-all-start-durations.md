# KBN all-start mate-duration audit

The current policy was checked against the cached complete graph after verifying its runtime fingerprint. This audit includes the 40 pending r2 shortcuts, which remain unchanged and uncommitted. No policy changes were made.

There are **24,536,088 legal board-and-turn starts**: **22,010,352 theoretically winning** and **2,525,736 theoretically drawn**. Every winning start forces eventual mate under all recommended White ties and every legal Black reply. The drawn starts are excluded from the duration distribution. Counts include all orientations and both bishop colors; they describe a uniform population of positions, not the likelihood of positions in real games. The halfmove clock starts at zero.

| Worst-case remaining White moves | Winning starts | Share |
|---|---:|---:|
| 0–50 | 579,324 | 2.63% |
| 51-60 | 8,884,676 | 40.37% |
| 61-70 | 9,542,708 | 43.36% |
| 71-80 | 2,876,800 | 13.07% |
| 81-87 | 126,844 | 0.58% |

Mean **62.11**, median **62**, 90th percentile **72**, 95th **75**, 99th **79**, maximum **87** White moves. White-to-move starts alone have mean 61.25 and median 61; Black-to-move starts have mean 62.95 and median 63. These are exact worst-case policy bounds, not tablebase-optimal mate distances. Only 2.63% of winning starts are guaranteed to finish within 50 moves.

## Where the longest line spends its time

One verified 87-move line consists of:

- **40 moves:** [Setup → r2, moves 1–40](http://localhost:5173/mate/bishop-knight#fen=8/8/7N/8/8/8/8/K1kB4_w_-_-_0_1&moves=Bh5,Kc2,Ka2,Kc3,Kb1,Kd2,Kb2,Kd3,Kc1,Kc3,Kd1,Kd3,Ke1,Kc4,Kd2,Kd4,Ke2,Ke4,Kf2,Kf4,Be8,Kg5,Ng8,Kf4,Kg2,Ke5,Kf3,Kd6,Ke4,Kc7,Kd5,Kd8,Bf7,Kd7,Ke5,Kc8,Ke6,Kc7,Kf6,Kd6,Kg7,Ke5,Nf6,Kf5,Bd5,Ke5,Kg6,Kf4,Kf7,Ke5,Ke7,Kf5,Be4%2B,Ke5,Bd3,Kf4,Ke6,Ke3,Ba6,Kd4,Nd5,Ke4,Bf1,Kf3,Ke5,Kg3,Nf4,Kf2,Ba6,Ke3,Ne6,Kd2,Nd4,Kc3,Bb5,Kb4,Bd3,Ka4,Be4,Ka5&cursor=0).
- **27 moves:** [r2 → r1, moves 41–67](http://localhost:5173/mate/bishop-knight#fen=8/8/8/k3K3/3NB3/8/8/8_w_-_-_0_41&moves=Bd5,Kb4,Nf3,Kc5,Ke4,Kb6,Kd4,Kc7,Ne5,Kd8,Nd3,Ke8,Ke5,Ke7,Bc4,Kd7,Kf6,Kd6,Be6,Kc7,Ke7,Kc6,Bc4,Kb6,Kd6,Kb7,Kd7,Kb6,Bd5,Kb5,Kc7,Ka6,Bc4%2B,Ka5,Kc6,Ka4,Kb6,Ka3,Kc5,Ka4,Nc1,Ka5,Nb3%2B,Ka4,Bd5,Ka3,Kc4,Ka2,Kc3,Kb1,Nd4,Kc1,Nc2,Kd1&cursor=0).
- **20 moves:** [r1 → mate, moves 68–87](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/8/2K5/2N5/3k4_w_-_-_0_68&moves=Bc4,Kc1,Ba2,Kd1,Nd4,Ke1,Kd3,Kf2,Ne2,Kg2,Be6,Kf3,Bf5,Kf2,Be4,Ke1,Ke3,Kf1,Bd5,Ke1,Bb3,Kf1,Nf4,Kg1,Kf3,Kh1,Be6,Kg1,Ng2,Kh1,Kf2,Kh2,Bg4,Kh1,Ne3,Kh2,Nf1%2B,Kh1,Bf3%23&cursor=0).

The links split the full line at phase boundaries and reset the halfmove clock for viewing; they are not a claim that the original line satisfies the fifty-move rule. The last phase includes the final move attributed to the higher-priority mate rule. This is one worst-case trajectory, not a sum of independently measured phase maxima.

## Recommendation

Keep the existing r1 net and its edge-attribution invariant frozen. Optimize the complete constrained route **r4 setup → r2 bridge → r1 → mate**, allowing r4 changes only within its setup task and r2 changes only within its bridge task. Retain the piece-safety, stalemate and mate priorities.

Start with setup: it consumes 40 moves on this worst line. Compute a minimax progress cost toward valid completed-r4/r2 entry positions, using each entry's existing worst-case time to mate as its terminal cost. That prices the entry and the route after it together. Then assess r2 bridge changes with the fixed r1 continuation costs. Verify each accepted change against all Black replies and every affected ancestor, and regenerate dependent loop exclusions when policy changes.

Rank proposals by the **global maximum from arbitrary winning starts**, then the number of starts above 50, then upper-tail duration. When several branches attain the maximum, evaluate a small group of changes that covers the tied worst branches. A smaller value at one position alone does not establish a smaller global maximum.

A read-only search illustrates the distinction. At move 9 of this line, **Bf3 instead of Ke2** cuts the remaining worst case at that position from **79 to 60** White moves (19 saved), following existing continuations afterward. Recomputing the affected ancestors shows that it improves **112** winning White starts, but the original starting position and the whole graph still have a worst case of **87**; all **104** White starts currently at 87 remain there. This candidate was not applied.

With 20 moves spent in r1 on the demonstrated line, a fifty-move result needs the preceding setup and bridge reduced from 67 moves to at most 30. That is a 37-move reduction on this trajectory. A phase-constrained optimization pass can establish what is attainable before we install more shortcuts; this audit does not prove that a fifty-move bound is attainable while r1 is frozen.

Full statistics and replay data: [machine-readable audit](audits/2026-09-30-all-start-durations.json).
