# R4 bishop clearance through Black’s next step — 2026-09-26

Bf5 from the reported Bd7/Ke4/Nd4 versus Ke7 setup allows Kf6, immediately attacking the bishop. R4 now treats a bishop as distant only if Black is not adjacent now and no legal Black king reply reaches adjacency (or captures it). The implementation reuses the already-generated Black replies; it adds no new move-generation pass, history, or distance maximization. Rule text is unchanged.

Bg4 and Bb5 are now preferred. The earlier Ba8 versus Kb8 example still prefers Bc6 because Black cannot legally approach it immediately. After Kc8, Ke5 maintains this clearance; Nf4/Ne3 would vacate the knight’s control of c7 and allow Black to approach, so they no longer take precedence. The earlier occupied-d4 target stays excluded, but bishop clearance can precede that knight maneuver.

34 focused tests and build pass, including all D4 transforms of the reported failure, preserved Bc6 exception, and updated consequences of next-step clearance.

Two of the previous three displayed cycles survive (both four-ply; four D4 post-White positions). Rechecking the earlier 318 witnesses yields 54 survivors before the middle-16 presentation exclusion, and no older full-audit witnesses return. Five-second discovery completed 219 roots (220 started), finding zero additional loops. These are not global counts. There is one surviving displayed cycle in each motif, so the standing 10-plus-2 request cannot be filled.

The king-shuffle orientation permits Black to be equidistant from a8 and h1. All links independently verify legal Black replies, preferred White moves, exact closure, and exclusions.

1. **r7 ↔ r7** — [Kb4, Ke5, Kb5, Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1KN5/2Bk4/8/8/8_w_-_-_0_1&moves=Kb4,Ke5,Kb5,Kd4&cursor=0)
2. **r5 ↔ r6** — [Nb8+, Kd6, Nc6, Kd7](http://localhost:5173/mate/bishop-knight#fen=B7/1K1k4/2N5/8/8/8/8/8_w_-_-_0_1&moves=Nb8%2B,Kd6,Nc6,Kd7&cursor=0)
