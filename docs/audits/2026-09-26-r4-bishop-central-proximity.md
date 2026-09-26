# R4 bishop central proximity — 2026-09-26

R4 retains its pre-move central-four king and middle-16 knight gate. After minimizing knight moves to an opposite-bishop-color central square, then preferring king protection of the knight, minimize bishop Euclidean distance to the board midpoint. This replaces the long-diagonal/knight-protected bishop preference. It uses the existing integral center-distance helper; no additional search is introduced. The supplied Ba2/Ne5/Kd4/kf4 position now prefers Bd5 across D4.

Build and all 33 focused tests pass. Replaying 15,917 saved four-ply witnesses retains the same three cycles as the preceding report. The five-second discovery search checked 371 roots and found no additional cycles. These biased replay/discovery results are not global counts or a population-density estimate. No full audit was run.

Two verified examples share the r20/r20 bishop-shuffle motif, and one uses r20/r5. All examples meet preferred-White/legal-Black, closure, D4 deduplication, and terminal/degenerate exclusion checks. Examples 2 and 3 retain the bishop-nearer-h1 orientation fallback, while Black remains nearer a8. Only these three verified examples are available instead of the requested 10+2.

1. [r20 ↔ r20: Bd1, Ke5, Ba4, Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3k4/B3N3/4K3/8/8_w_-_-_0_1&moves=Bd1,Ke5,Ba4,Kd5&cursor=0)
2. [r20 ↔ r20: Bh1, Ke5, Bg2, Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3k4/4N3/4K3/6B1/8_w_-_-_0_1&moves=Bh1,Ke5,Bg2,Kd5&cursor=0)
3. [r20 ↔ r5: Bg2, Kd5, Bh1, Ke6](http://localhost:5173/mate/bishop-knight#fen=8/8/4k3/8/4NK2/8/8/7B_w_-_-_0_1&moves=Bg2,Kd5,Bh1,Ke6&cursor=0)
