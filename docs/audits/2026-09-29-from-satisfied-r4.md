# Current loops reachable from satisfied r4

Scope: every tablebase-winning fully satisfied r4 formation, either turn. The 768 physical starting states (96 D4 board-and-turn classes) were independently enumerated and checked against the existing seed cohort. All current preferred White choices and all legal Black replies were followed. The former r2 terminal is expanded normally. This is not a full-board-space audit.

The complete reachable graph has 516 D4-canonical White positions. All 839 probed reachable board-and-turn placements are Syzygy White wins with reset counters.

There are **86 distinct four-ply loops**, deduplicated by D4 and cycle phase: **79** satisfy r4 throughout, **7** do not. This is a four-ply loop count, not a count of all possible longer cycles.

Ten replay examples are verified ply by ply against current production choices, legality, tablebase eligibility, and exact loop closure. All begin in a satisfied r4 formation, with the incoming path included. Bishop is light-squared and Black starts on the lower half of the board.

Artifacts: `../_codex_output/bn-current-from-satisfied-r4-2026-09-29/` contains the graph, SCC labels, tablebase probes, focus report, and `verified-path-examples.json`.

1. [Nc4 Kd1 Na3 Ke1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Kd1,Ke3,Ke1,Bf5,Kd1,Na3,Ke1,Nc4,Kd1,Na3,Ke1&cursor=0) — 8-ply approach
2. [Nc4+ Ke2 Ne5 Kd2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Ke2,Ne5,Kd2&cursor=0)
3. [Kd4 Ke1 Ke3 Kd1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Ke1,Ke3,Kd1,Kd4,Ke1,Ke3,Kd1&cursor=0) — 4-ply approach
4. [Kd4 Kc1 Ke3 Kd1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Ke1,Ke3,Kd1,Kd4,Kc1,Ke3,Kd1&cursor=0) — 4-ply approach
5. [Kd4 Ke1 Ke3 Kf1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Ke1,Ke3,Kf1,Kd4,Ke1,Ke3,Kf1&cursor=0) — 4-ply approach
6. [Kd4 Ke1 Ke3 Kf1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Kd1,Ke3,Ke1,Bf5,Kf1,Kd4,Ke1,Ke3,Kf1&cursor=0) — 6-ply approach
7. [Kd4 Kd1 Ke3 Kc1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/3KB3/8/3k4/8_w_-_-_0_1&moves=Nc4%2B,Kd1,Ke3,Kc1,Kd4,Kd1,Ke3,Kc1&cursor=0) — 4-ply approach
8. [Be4 Kg3 Bd5 Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3BN3/3K1k2/8/8/8_w_-_-_0_1&moves=Be4,Kg3,Bd5,Kf4&cursor=0)
9. [Be4+ Kc1 Bd5 Kc2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3BN3/3K4/8/2k5/8_w_-_-_0_1&moves=Be4%2B,Kc1,Bd5,Kc2&cursor=0)
10. [Be4 Kd1 Bd5 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3BN3/3K4/8/4k3/8_w_-_-_0_1&moves=Be4,Kd1,Bd5,Ke2&cursor=0)
