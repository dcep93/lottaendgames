# R8 central shuffle control — 2026-09-26

Add r8 after r7 and before r20, with the user's requested help text. Eligibility is frozen before White moves: kings in orthogonal opposition or a knight's move apart, Black strictly more central by Euclidean midpoint distance, and the knight directly in front of White between the kings. Inspect only Black's current and neighboring squares that retain this geometry; target those nearest the center. Prefer bishop control of a target, respecting ray blockers. No legal-response search or position-specific exception is introduced.

The supplied Ba4/Ne4/Ke3/kd5 position prefers Bb3+, controlling d5. The other equally central shuffle square is e5, which is the opposite color and cannot be controlled by this bishop. Tests cover the requested move and ranking, opposition, inactive shapes/centrality, blocking pieces, and all D4 transforms. Build and 18 focused tests pass.

One of the prior three verified four-ply cycles breaks. Replaying all 15,917 old saved witnesses leaves two, one r20/r20 and one r20/r5 bishop shuttle. Five seconds of biased discovery checked 413 roots and found no additional cycles. This is not a global count or density estimate; the full audit pointer is unchanged.

Both verified examples below exclude terminal and degenerate positions. Black is nearer a8; the bishop-nearer-h1 orientation fallback is necessary. Only two verified examples are available, rather than 10+2.

1. [r20 ↔ r20: Bh1, Ke5, Bg2, Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3k4/4N3/4K3/6B1/8_w_-_-_0_1&moves=Bh1,Ke5,Bg2,Kd5&cursor=0)
2. [r20 ↔ r5: Bg2, Kd5, Bh1, Ke6](http://localhost:5173/mate/bishop-knight#fen=8/8/4k3/8/4NK2/8/8/7B_w_-_-_0_1&moves=Bg2,Kd5,Bh1,Ke6&cursor=0)
