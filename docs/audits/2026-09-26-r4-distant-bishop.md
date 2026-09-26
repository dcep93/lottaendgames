# R4 distant bishop eligibility — 2026-09-26

Add a pre-move condition to r4: bishop at least three king steps (Chebyshev distance) from Black's king. Keep central-four White king, middle-16 knight, and all three preferences unchanged. Freeze the bishop-distance gate before White moves, like the existing central eligibility. The loaded Bc6/kc8 position disables r4 and prefers Ke5.

Build and 29 focused tests pass, including the distance-two/three boundary, gate frozen across candidate moves, and D4 transforms.

Of the last 108 freshly discovered four-ply cycles, 96 survive (99 D4 post-White positions); 12 break. The surviving motifs are 93 r4/r6 central-16 boundary shuttles and three pieces-safe/r6 corner knight shuttles. None of the older 15,917 full-audit witnesses reappear. A new five-second mixed search started 194 roots, completed 193, and found no additional cycles. These are replay/discovery counts, not a global audit or density estimate. The full-audit pointer is unchanged.

Examples are D4-distinct and independently verified for preferred White moves, all-legal-Black witnesses, closure, and terminal/degenerate exclusions. The last two have Black equidistant from a8 and h1; the first ten meet the usual orientation requirements.

1. [r4 ↔ r6: Ne2, Kc6, Nc3, Kb6](http://localhost:5173/mate/bishop-knight#fen=8/5B2/1k6/8/3K4/2N5/8/8_w_-_-_0_1&moves=Ne2,Kc6,Nc3,Kb6&cursor=0)
2. [r4 ↔ r6: Nc3, Kb7, Ne2, Kc6](http://localhost:5173/mate/bishop-knight#fen=8/5B2/2k5/8/3K4/8/4N3/8_w_-_-_0_1&moves=Nc3,Kb7,Ne2,Kc6&cursor=0)
3. [r4 ↔ r6: Nc3, Ka7, Nb5+, Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/1N6/3K4/8/B7/8_w_-_-_0_1&moves=Nc3,Ka7,Nb5%2B,Kb6&cursor=0)
4. [r4 ↔ r6: Nc3, Kf5, Ne2, Ke6](http://localhost:5173/mate/bishop-knight#fen=8/8/4k3/8/B2K4/8/4N3/8_w_-_-_0_1&moves=Nc3,Kf5,Ne2,Ke6&cursor=0)
5. [r4 ↔ r6: Ne2, Kc2, Nc3, Kb3](http://localhost:5173/mate/bishop-knight#fen=8/1B6/8/8/3K4/1kN5/8/8_w_-_-_0_1&moves=Ne2,Kc2,Nc3,Kb3&cursor=0)
6. [r4 ↔ r6: Nb5, Kb6, Nc3, Kb7](http://localhost:5173/mate/bishop-knight#fen=8/1k6/8/8/3K4/2N5/B7/8_w_-_-_0_1&moves=Nb5,Kb6,Nc3,Kb7&cursor=0)
7. [r4 ↔ r6: Nc3, Ka3, Nb5+, Kb3](http://localhost:5173/mate/bishop-knight#fen=8/3B4/8/1N6/3K4/1k6/8/8_w_-_-_0_1&moves=Nc3,Ka3,Nb5%2B,Kb3&cursor=0)
8. [r4 ↔ r6: Nc3+, Ka1, Ne2, Ka2](http://localhost:5173/mate/bishop-knight#fen=8/3B4/8/8/3K4/8/k3N3/8_w_-_-_0_1&moves=Nc3%2B,Ka1,Ne2,Ka2&cursor=0)
9. [r4 ↔ r6: Nb5, Kb3, Nc3, Kb4](http://localhost:5173/mate/bishop-knight#fen=8/3B4/8/8/1k1K4/2N5/8/8_w_-_-_0_1&moves=Nb5,Kb3,Nc3,Kb4&cursor=0)
10. [r4 ↔ r6: Nc3, Ka7, Nb5+, Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/8/1N6/3K4/1B6/8/8_w_-_-_0_1&moves=Nc3,Ka7,Nb5%2B,Kb8&cursor=0)
11. [minors safe ↔ r6: Nb3, Kc3, Na1, Kb2](http://localhost:5173/mate/bishop-knight#fen=8/5B2/8/8/8/8/1k5K/N7_w_-_-_0_1&moves=Nb3,Kc3,Na1,Kb2&cursor=0)
12. [minors safe ↔ r6: Nb3, Kc3, Na1, Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/4B3/8/8/8/1k5K/N7_w_-_-_0_1&moves=Nb3,Kc3,Na1,Kb2&cursor=0)
