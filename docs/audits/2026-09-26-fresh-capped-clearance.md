# Fresh loop search after capped bishop clearance — 2026-09-26

Policy: 76905e6. No move rules changed.

Two-minute four-ply root search completed 6,556 roots (6,557 started), enumerating preferred White moves and all legal Black replies at each root. A concurrent one-minute randomized walk search visited 33,401 plies from 1,350 starts. Combining both searches found 318 D4-distinct cycles (126 four-ply), covering 88 D4 post-White positions, before the middle-16 presentation exclusion. All exclude terminal and degenerate positions at every ply.

After hiding cycles with all White pieces in the middle 16 at every White-to-move frame: **14 cycles, 12 four-ply, 23 D4 post-White positions**. These are discovered witnesses, not global totals or an unbiased density estimate.

The largest visible four-ply motif is **r4 bishop approach/retreat**, seven cycles. The settled central king and knight leave bishop central proximity to bring the bishop toward Black; Black approaches, and the new clearance priority makes the bishop retreat. This demonstrates that saturating the distance score alone does not eliminate bishop cycles. Two representatives satisfy normal orientation and distinct-start selection; there are not ten such examples available. The second motif is r20/r4 knight shuffling (three visible cycles); two examples follow. All selected links were independently verified for preferred White moves, legal Black moves, exact closure, and exclusions.

1. **r4 ↔ r4** — [Bf5, Kf6, Bd7, Kf7](http://localhost:5173/mate/bishop-knight#fen=8/3B1k2/8/8/3NK3/8/8/8_w_-_-_0_1&moves=Bf5,Kf6,Bd7,Kf7&cursor=0)
2. **r4 ↔ r4** — [Bf5, Kf6, Bd7, Ke7](http://localhost:5173/mate/bishop-knight#fen=8/3Bk3/8/8/3NK3/8/8/8_w_-_-_0_1&moves=Bf5,Kf6,Bd7,Ke7&cursor=0)
3. **r20 ↔ r4** — [Ng4, Kb7, Ne3, Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/8/2BK4/4N3/8/8_w_-_-_0_1&moves=Ng4,Kb7,Ne3,Kb6&cursor=0)
4. **r20 ↔ r4** — [Ng4, Kc7, Ne3, Kc6](http://localhost:5173/mate/bishop-knight#fen=8/8/2k5/8/2BK4/4N3/8/8_w_-_-_0_1&moves=Ng4,Kc7,Ne3,Kc6&cursor=0)
