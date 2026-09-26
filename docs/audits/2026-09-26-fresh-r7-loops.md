# Fresh loop discovery after f575f13 — 2026-09-26

Found 108 D4-distinct four-ply cycles involving 114 D4-distinct post-White positions. These are discovered witnesses, not a global count. All preferred White ties and legal Black replies are eligible. No production rule changed.

A 120-second search attempted 10,021 roots, began 6,901 legal nonexcluded roots and completed all outgoing four-ply checks for 6,900. It mixes shuffled former loop roots, random physical placements generated using xorshift high bits, and placements with nearby White king/knight. It found 106 cycles. Then 50 legal bishop placements around the alternate motif yielded two additional cycles. This biased sampling does not justify a population-density estimate. The full audit pointer remains unchanged.

The dominant actionable motif is r4/r6 central-16 boundary oscillation: 105 cycles, 108 positions. R4 moves the knight out of the middle 16 while routing toward an opposite-color central square. This disables r4 at the next White turn; r6 brings the knight back under king protection, re-enabling r4. Both king and bishop stay fixed. The other motif has three cycles, six positions: pieces-safe rescues a corner knight, then r6 returns it to the corner.

Every selected link is independently replay-verified for preferred White moves, legal Black replies, exact board/turn closure, and terminal/degenerate exclusion at every ply. D4 deduplication and the all-White-pieces-middle16 display filter apply. The first ten satisfy the usual bishop/Black a8 orientation; the final two necessarily have Black equidistant from a8 and h1. Examples favor larger White bounding rectangles and distinct White layouts.

1. [r4 ↔ r6: Nb6, Kc7, Nd5+, Kb8](http://localhost:5173/mate/bishop-knight#fen=Bk6/8/8/3N4/4K3/8/8/8_w_-_-_0_1&moves=Nb6,Kc7,Nd5%2B,Kb8&cursor=0)
2. [r4 ↔ r6: Nc3, Kc8, Nb5, Kb7](http://localhost:5173/mate/bishop-knight#fen=4B3/1k6/8/1N6/3K4/8/8/8_w_-_-_0_1&moves=Nc3,Kc8,Nb5,Kb7&cursor=0)
3. [r4 ↔ r6: Ne2, Kc6, Nc3, Kb6](http://localhost:5173/mate/bishop-knight#fen=8/5B2/1k6/8/3K4/2N5/8/8_w_-_-_0_1&moves=Ne2,Kc6,Nc3,Kb6&cursor=0)
4. [r4 ↔ r6: Nb5, Kb8, Nc3, Kc8](http://localhost:5173/mate/bishop-knight#fen=2k1B3/8/8/8/3K4/2N5/8/8_w_-_-_0_1&moves=Nb5,Kb8,Nc3,Kc8&cursor=0)
5. [r4 ↔ r6: Nc3, Kb7, Ne2, Kc6](http://localhost:5173/mate/bishop-knight#fen=8/5B2/2k5/8/3K4/8/4N3/8_w_-_-_0_1&moves=Nc3,Kb7,Ne2,Kc6&cursor=0)
6. [r4 ↔ r6: Nc3, Ka7, Nb5+, Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/1N6/3K4/8/B7/8_w_-_-_0_1&moves=Nc3,Ka7,Nb5%2B,Kb6&cursor=0)
7. [r4 ↔ r6: Nc3, Kf5, Ne2, Ke6](http://localhost:5173/mate/bishop-knight#fen=8/8/4k3/8/B2K4/8/4N3/8_w_-_-_0_1&moves=Nc3,Kf5,Ne2,Ke6&cursor=0)
8. [r4 ↔ r6: Ne2, Kc2, Nc3, Kb3](http://localhost:5173/mate/bishop-knight#fen=8/1B6/8/8/3K4/1kN5/8/8_w_-_-_0_1&moves=Ne2,Kc2,Nc3,Kb3&cursor=0)
9. [r4 ↔ r6: Nc3, Ka7, Ne2, Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/2B5/8/3K4/8/4N3/8_w_-_-_0_1&moves=Nc3,Ka7,Ne2,Kb8&cursor=0)
10. [r4 ↔ r6: Nc3, Ka7, Nb5+, Kb6](http://localhost:5173/mate/bishop-knight#fen=2B5/8/1k6/1N6/3K4/8/8/8_w_-_-_0_1&moves=Nc3,Ka7,Nb5%2B,Kb6&cursor=0)
11. [minors safe ↔ r6: Nb3, Kc3, Na1, Kb2](http://localhost:5173/mate/bishop-knight#fen=8/5B2/8/8/8/8/1k5K/N7_w_-_-_0_1&moves=Nb3,Kc3,Na1,Kb2&cursor=0)
12. [minors safe ↔ r6: Nb3, Kc3, Na1, Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/4B3/8/8/8/1k5K/N7_w_-_-_0_1&moves=Nb3,Kc3,Na1,Kb2&cursor=0)
