# Quiet interior bishop: r4 correction — 2026-09-26

After `1. Bb7 Kh8` from `B5k1/8/2K5/8/8/8/8/7N w - - 0 1`, r4 previously forced `Ba8`, restarting the loop. The interior bishop is away from the action, so adjacency to White’s king alone no longer activates r4: Black’s king or the knight must also be within two king steps. The rule text is unchanged.

The position now prefers **Kc5 or Kd6**, opening Bb7’s diagonal to protect Nh1. The D4 regression also checks that all r4 scores are neutral here. Existing crowded and edge-bishop cases remain covered. A prior Bf7/Kf8 drift regression now correctly selects Nc4 under r6 instead of an r4 bishop retreat; Nb7 is still rejected.

## Saved-cycle replay

- Baseline: full audit of `eecb6a9`, 15,917 four-ply cycles.
- **7,236 survive; 8,681 break.**
- These are saved witness counts, not a new global count or a recheck of all 8,353 old cyclic positions. New cycles and longer cycles were not searched.
- Terminal/degenerate exclusions and the middle-16 display filter remain in force. Links are D4-distinct, use distinct White-piece arrangements, and have Black closer to a8 than h1.

## Surviving motifs

| Last deciding rules | Saved cycles remaining |
| --- | ---: |
| r4 ↔ r4 | 2,929 |
| r4 ↔ r6 | 2,302 |
| r20 ↔ r4 | 1,560 |
| r20 ↔ r6 | 190 |
| r20 ↔ r20 | 86 |
| r4 ↔ r5 | 77 |
| r8 ↔ r8 | 66 |
| r6.5 ↔ r8 | 8 |
| r4 ↔ r8 | 7 |
| r20 ↔ r8 | 3 |
| r7 ↔ r7 | 3 |
| r20 ↔ r6.5 | 3 |
| r20 ↔ r5 | 1 |
| r6 ↔ r8 | 1 |

## Ten examples: r4 ↔ r4

1. [Bb7 Kd8 Ba8 Ke8](http://localhost:5173/mate/bishop-knight#fen=B3k3/8/2K5/8/8/8/8/7N_w_-_-_0_1&moves=Bb7,Kd8,Ba8,Ke8&cursor=0) — `B3k3/8/2K5/8/8/8/8/7N w - - 0 1`.
2. [Bh7 Kc3 Bg8 Kb4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/5K2/8/1k6/8/8/N7_w_-_-_0_1&moves=Bh7,Kc3,Bg8,Kb4&cursor=0) — `6B1/8/5K2/8/1k6/8/8/N7 w - - 0 1`.
3. [Bb7 Ka5 Ba8 Ka4](http://localhost:5173/mate/bishop-knight#fen=B7/8/2K5/8/k7/8/8/6N1_w_-_-_0_1&moves=Bb7,Ka5,Ba8,Ka4&cursor=0) — `B7/8/2K5/8/k7/8/8/6N1 w - - 0 1`.
4. [Ba8 Ke7 Bb7 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/1B6/2K5/8/8/8/8/7N_w_-_-_0_1&moves=Ba8,Ke7,Bb7,Kd8&cursor=0) — `3k4/1B6/2K5/8/8/8/8/7N w - - 0 1`.
5. [Bb7 Kd8 Ba8 Ke8](http://localhost:5173/mate/bishop-knight#fen=B3k3/8/2K5/8/8/8/6N1/8_w_-_-_0_1&moves=Bb7,Kd8,Ba8,Ke8&cursor=0) — `B3k3/8/2K5/8/8/8/6N1/8 w - - 0 1`.
6. [Bh7 Kc4 Bg8+ Kb4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/5K2/8/1k6/8/8/1N6_w_-_-_0_1&moves=Bh7,Kc4,Bg8%2B,Kb4&cursor=0) — `6B1/8/5K2/8/1k6/8/8/1N6 w - - 0 1`.
7. [Bb7 Ka5 Ba8 Ka4](http://localhost:5173/mate/bishop-knight#fen=B7/8/2K5/8/k7/8/8/5N2_w_-_-_0_1&moves=Bb7,Ka5,Ba8,Ka4&cursor=0) — `B7/8/2K5/8/k7/8/8/5N2 w - - 0 1`.
8. [Ba8 Kb4 Bb7 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/1B6/2K5/k7/8/8/8/6N1_w_-_-_0_1&moves=Ba8,Kb4,Bb7,Ka5&cursor=0) — `8/1B6/2K5/k7/8/8/8/6N1 w - - 0 1`.
9. [Bb7 Ka5 Ba8 Ka4](http://localhost:5173/mate/bishop-knight#fen=B7/8/2K5/8/k7/8/5N2/8_w_-_-_0_1&moves=Bb7,Ka5,Ba8,Ka4&cursor=0) — `B7/8/2K5/8/k7/8/5N2/8 w - - 0 1`.
10. [Bh7 Kc3 Bg8 Kb4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/5K2/8/1k6/8/8/2N5_w_-_-_0_1&moves=Bh7,Kc3,Bg8,Kb4&cursor=0) — `6B1/8/5K2/8/1k6/8/8/2N5 w - - 0 1`.

## Two examples: r4 ↔ r6

1. [Bb3 Ka6 Bg8 Ka7](http://localhost:5173/mate/bishop-knight#fen=6B1/k7/8/8/K7/8/8/3N4_w_-_-_0_1&moves=Bb3,Ka6,Bg8,Ka7&cursor=0) — `6B1/k7/8/8/K7/8/8/3N4 w - - 0 1`.
2. [Bf3 Kd8 Ba8 Kc8](http://localhost:5173/mate/bishop-knight#fen=B1k5/8/8/8/6K1/8/8/3N4_w_-_-_0_1&moves=Bf3,Kd8,Ba8,Kc8&cursor=0) — `B1k5/8/8/8/6K1/8/8/3N4 w - - 0 1`.

## Validation

29 focused tests pass, including every D4 transform of the new position. Production build passes. The broader bishop-and-knight suite retains four previously documented failures outside this change. Replay examples are independently checked against current preferred White moves, legal Black replies, exact closure, and exclusions.
