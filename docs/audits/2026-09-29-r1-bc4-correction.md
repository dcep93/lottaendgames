# Corrected 9.Bc4

Supersedes the preceding 9.Nd4 declaration. Removed its full destination and added `8/8/8/8/2B5/2K5/2N5/3k4 b - - 17 9` for Bc4. D4 and counter-independent matching, regardless of incoming piece/source, remain unchanged.

The new destination ranks immediately before the original Nd4 stage, so Nd4 remains preferred from the original Ba2/Nc2/Kc3/Black Kd1 terminal. Loaded Bd5/Nc2/Kc3/Black Kd1 uniquely selects Bc4 under r1. Tests explicitly reject the rescinded Nd4 preference here and retain original mating lines.

All 40 targeted r1/r2 tests, TypeScript, and diff checks pass.

Focused traversal from all winning satisfied-r4 starts: 3,524 canonical White states, 5,980 winning board-and-turn probes. 88 D4/phase-deduplicated four-ply loops: 79 satisfy r4 throughout, 9 do not. Against the previous 91, 3 broken and 0 newly reachable. No full-board-space audit; longer cycles are not included in this four-ply count.

Artifacts: `../_codex_output/bn-r1-bc4-correction-from-satisfied-r4-2026-09-29/`.

1. [Kd4 Kd1 Ke3 Ke1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Ke1,Ke3,Kd1,Na3,Ke1,Kd4,Kd1,Ke3,Ke1&cursor=0) — 6-ply approach
2. [Kd4 Ke1 Ke3 Kf1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Ke1,Ke3,Kf1,Kd4,Ke1,Ke3,Kf1&cursor=0) — 4-ply approach
3. [Kd4 Ke1 Ke3 Kf1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Kd1,Ke3,Ke1,Bf5,Kf1,Kd4,Ke1,Ke3,Kf1&cursor=0) — 6-ply approach
4. [Nb5 Kc8 Nd4 Kb7](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Ke1,Ke3,Kd1,Na3,Ke1,Kd4,Kd2,Kc5,Kc3,Kb5,Kd4,Bh7,Ke5,Kb4,Kf6,Nc4,Kg7,Bb1,Kf6,Kc5,Ke6,Nd6,Kd7,Nb5,Kc8,Nd4,Kb7,Nb5,Kc8,Nd4,Kb7&cursor=0) — 28-ply approach
5. [Ke5 Kd1 Kf4 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Ke2,Ke5,Kd1,Kf4,Ke2,Ke5,Kd1,Kf4,Ke2&cursor=0) — 6-ply approach
6. [Kd4 Kd1 Ke3 Kc1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Kd1,Ke3,Kc1,Kd4,Kd1,Ke3,Kc1&cursor=0) — 4-ply approach
7. [Nc4 Kf2 Nd6 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Ke2,Ke5,Kf1,Nd6,Ke2,Nc4,Kf2,Nd6,Ke2&cursor=0) — 6-ply approach
8. [Nc4 Kf1 Nd6 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Ke2,Ke5,Kf1,Nd6,Ke2,Nc4,Kf1,Nd6,Ke2&cursor=0) — 6-ply approach
9. [Nc4 Ke1 Nd6 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Ke2,Ke5,Kf1,Nd6,Ke2,Nc4,Ke1,Nd6,Ke2&cursor=0) — 6-ply approach
10. [Be4 Kc1 Bd5 Kd2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3BN3/3K4/8/3k4/8_w_-_-_0_1&moves=Be4,Kc1,Bd5,Kd2&cursor=0)
