# R4 excludes the king’s occupied target — 2026-09-26

With White Kd4 and Be8, r4 now targets e5 alone. Previously the occupied d4 square was also counted, rewarding moves toward a square the knight cannot occupy. Targets are fixed before White moves, and cannot be occupied by the resulting White king. The displayed rule text is unchanged.

After 1.Nc3 Kc8 in the reported line, both 2.Nd5 and 2.Ne4 are now preferred. Thirty focused tests, including all eight D4 transforms of this example, and the production build pass.

Of the 110 saved four-ply cycles, 109 break and one survives (two D4-deduplicated post-White positions). None of the 15,917 older full-audit witnesses survive. A five-second mixed search started 223 roots, completed 222, and found no additional cycles. These are replay and bounded-search results, not global counts. No second archetype was found; only one verified example is available rather than the standing 10-plus-2 request.

The surviving r4/r6 cycle passes preferred-White/legal-Black verification, terminal/degenerate exclusions, D4 deduplication, and presentation filters:

- [Nb6, Kc7, Nd5+, Kb8](http://localhost:5173/mate/bishop-knight#fen=Bk6/8/8/3N4/4K3/8/8/8_w_-_-_0_1&moves=Nb6,Kc7,Nd5%2B,Kb8&cursor=0)
