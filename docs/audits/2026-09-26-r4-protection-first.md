# R4 protection first and king color — 2026-09-26

R4 now compares capped bishop clearance, knight protection by White king, opposite-color central knight-target distance, White king opposite bishop color, and bishop central proximity, in that order. The eligibility condition and two-step bishop-clearance threshold are unchanged. Rule help matches the requested text.

The reported Bf5/Kf6/Bd7/Kf7 loop now breaks with Ke5 instead of Bf5. Regressions across all D4 transforms establish that a protected knight move outranks a shorter unprotected route, and that changing king color outranks bishop centralization. All 33 focused tests and the production build pass.

Replay: 55 of 318 saved cycles survive before the middle-16 presentation filter; of the previously displayed 14, three survive. All three are four-ply and cover six D4-deduplicated post-White positions. None of the 15,917 older full-audit witnesses return. A five-second mixed search completed 227 roots (228 started) and found no additional cycles. These are not global counts. One cycle remains in each of three motifs, so there is no unique largest motif or ten-example group.

All links independently verify preferred White moves, legal Black replies, exact closure, and terminal/degenerate exclusions. Example 2 requires allowing Black's king to be equidistant from a8 and h1; examples 1 and 3 use the normal orientation.

1. **r4 ↔ r4** — [Bf5, Kf6, Bd7, Ke7](http://localhost:5173/mate/bishop-knight#fen=8/3Bk3/8/8/3NK3/8/8/8_w_-_-_0_1&moves=Bf5,Kf6,Bd7,Ke7&cursor=0)
2. **r7 ↔ r7** — [Kb4, Ke5, Kb5, Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1KN5/2Bk4/8/8/8_w_-_-_0_1&moves=Kb4,Ke5,Kb5,Kd4&cursor=0)
3. **r5 ↔ r6** — [Nb8+, Kd6, Nc6, Kd7](http://localhost:5173/mate/bishop-knight#fen=B7/1K1k4/2N5/8/8/8/8/8_w_-_-_0_1&moves=Nb8%2B,Kd6,Nc6,Kd7&cursor=0)
