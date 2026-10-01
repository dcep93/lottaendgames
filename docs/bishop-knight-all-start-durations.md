# KBN all-start mate-duration audit after optimal r2

Audited the current [globally optimal r2 bridge](bishop-knight-optimal-r2.md) at commit `05aa8ba`. **No move-policy changes were made during this audit.**

This is an exhaustive census, not random sampling: **24,536,088 legal board-and-turn starts**, including both bishop colors and all orientations. Every start has a fresh halfmove clock. Durations are the worst case over **every recommended White tie and every legal Black reply**, measured in remaining White moves. Counts weight each D4 symmetry class by its actual orbit size; they describe a uniform population of positions, not their frequency in played games.

## Results

Of **22,010,352 theoretically winning starts**:

- **0** can lose forced mate or enter a loop under the policy, ignoring the move-count draw rules.
- **15,875,920 (72.13%)** force mate within 50 moves.
- **6,134,432 (27.87%)** have a worst-case line exceeding 50 moves.

The other **2,525,736 starts are theoretical draws**, not rule failures. The population includes 464 Black-to-move starts that are already checkmate, counted at zero moves.

| Worst-case White moves to mate | Winning starts | Share |
|---|---:|---:|
| 0–20 | 158,808 | 0.72% |
| 21–30 | 243,340 | 1.11% |
| 31–40 | 3,966,708 | 18.02% |
| 41–50 | 11,507,064 | 52.28% |
| 51–60 | 5,337,768 | 24.25% |
| 61–70 | 795,176 | 3.61% |
| 71–72 | 1,488 | 0.01% |

Mean **46.45**, median **46**, 90th percentile **56**, 95th **59**, 99th **64**, maximum **72** White moves. White-to-move starts alone have mean **45.57**, median **45**, maximum **72**; Black-to-move starts have mean **47.30**, median **47**, maximum **72**.

| Winning starts | White to move | Black to move | Total |
|---|---:|---:|---:|
| Force mate within 50 | 8,195,028 | 7,680,892 | 15,875,920 |
| Worst case exceeds 50 | 2,627,156 | 3,507,276 | 6,134,432 |
| Fail to force eventual mate | 0 | 0 | 0 |

A start in the over-50 group may finish sooner against weaker resistance; the statement is that the current policy cannot guarantee the fifty-move limit. These are policy distances, not tablebase-optimal mate distances.

## Comparison with the previous full audit

| Metric | Previous policy | Optimal-r2 policy |
|---|---:|---:|
| Mean | 62.11 | 46.45 |
| Median | 62 | 46 |
| 90th percentile | 72 | 56 |
| Maximum | 87 | 72 |
| Winning starts within 50 | 579,324 (2.63%) | 15,875,920 (72.13%) |
| Winning starts without forced mate | 0 | 0 |

Per-position comparison: **21,961,528 improved**, **43,976 stayed unchanged**, and **4,848 (0.022%) became longer**. The largest increase is nine White moves. Optimizing entry to the fixed r1 net does not optimize total mate duration: a faster entry can reach an r1 position with a longer remaining route. No win was lost.

## Verified longest line

Start: `N7/3B4/8/8/8/6k1/8/7K w - - 0 1`.

The 143-ply White-to-move witness reaches checkmate on White's 72nd move. Its consecutive phases are **40 setup moves → 12 r2 moves → 20 r1/net moves**, with the final move selected by the higher-priority mate rule. The Black-to-move maximum is 144 plies, also 72 White moves.

- [Setup, moves 1–40](http://localhost:5173/mate/bishop-knight#fen=N7/3B4/8/8/8/6k1/8/7K_w_-_-_0_1&moves=Kg1,Kf3,Kf1,Ke3,Kg2,Ke4,Kg3,Ke3,Kg4,Ke4,Kg5,Ke5,Kg6,Kd5,Kf5,Kd6,Ba4,Kc5,Ke4,Kb4,Bc6,Kc5,Bb7,Kc4,Ke5,Kc5,Ke6,Kb4,Kd5,Kb5,Kd6,Kc4,Kc6,Kd4,Kc7,Ke5,Kb8,Ke6,Nc7%2B,Kf7,Kc8,Ke7,Bd5,Kd6,Kb7,Kd7,Kb6,Kd6,Be6,Ke5,Kc6,Kf4,Nd5%2B,Ke4,Kc5,Ke5,Bh3,Ke4,Bf1,Kf3,Kd4,Kg3,Ne3,Kf2,Bc4,Kf3,Nd5,Kg4,Nc3,Kf5,Ne4,Kg6,Nc5,Kg5,Nd3,Kf5,Ne5,Kf4,Bd5,Kf5&cursor=0)
- [r2 → r1 → mate, moves 41–72](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3BNk2/3K4/8/8/8_w_-_-_0_41&moves=Nc6,Kf6,Ke4,Kg5,Ke5,Kg4,Nb4,Kg5,Be4,Kh6,Nd5,Kg7,Ke6,Kf8,Kf6,Kg8,Nb6,Kh8,Nc8,Kg8,Nd6,Kh8,Nf7%2B,Kg8,Bg6,Kf8,Bh7,Ke8,Ne5,Kd8,Ke6,Kc7,Nd7,Kb7,Bd3,Kc6,Bc4,Kc7,Bd5,Kd8,Kd6,Ke8,Be6,Kd8,Bf7,Kc8,Nc5,Kd8,Nb7%2B,Kc8,Kc6,Kb8,Kb6,Kc8,Be6%2B,Kb8,Bd7,Ka8,Nc5,Kb8,Na6%2B,Ka8,Bc6%23&cursor=0)

The second viewing link resets the halfmove clock so the app can display the continuation beyond the original fifty-move limit. This is not a legal fifty-move finish from the original start. Both links were checked with the app's replay decoder and route resolver, and the full witness was replayed against the current recommendations.

## Next bottleneck

Keep r1 fixed and preserve **r4 → r2 → r1**. The largest remaining part of this worst line is the **40-move setup**. The r2 bridge already has the globally minimum worst-case entry length for its fixed target set; repeated local bridge shortcuts cannot improve that objective further for these completed-r4 starts.

The next optimization should target setup routes to valid completed-r4/r2 entry positions, while charging each entry its existing continuation cost to mate. That preserves the stages while avoiding a cheap entry with an expensive finish. Measure the global maximum and the count exceeding 50 after any change. This audit does not establish whether a universal fifty-move bound is possible with the fixed r1 net.

## Cache and verification

The cached graph contains **1,359,578 legal White-to-move symmetry classes** and **7,357,728 continuation edges**, plus the complete Black-to-move root census. Its prior worker fingerprint was checked before reuse.

The runtime change affects stage lookups and two future-position probes. The refresh covered every old/new stage source and all legal predecessors of changed probe results: **16,845 positions**, of which **13,197 changed decisions**. Every one of **5,262 unaffected cross-checks** matched. Black-root legality and geometry did not change. All distances were recomputed over the complete graph; every finite distance recurrence and unresolved-node condition was checked. The unresolved counts exactly equal the independent Syzygy-drawn counts.

Current worker SHA-256: `60fc7529e850a6c334bcc4e1da0868dcdf07323e34b5e683f8433eddd732890e`.

[Full statistics, fingerprints, comparison and replay data](audits/2026-09-30-all-start-optimal-r2.json). [Previous audit data](audits/2026-09-30-all-start-durations.json).
