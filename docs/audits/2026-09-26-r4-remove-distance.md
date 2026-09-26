# Remove r4 bishop-distance requirement — 2026-09-26

Remove the bishop-distance condition and its unused score/context flag. R4 again requires only a starting central-four king and middle-16 knight. The three preferences are unchanged. Production bishopKnight.ts matches policy f575f13 exactly. Build and 29 focused tests pass, including explicit r4 activation with a bishop two steps from Black and all D4 transforms.

All 108 recent saved cycles survive again, restoring the 12 that the distance gate broke. None of the 15,917 older full-audit witnesses survive. A five-second search checked 198 roots (197 complete) and found five additional D4-distinct cycles. The verified collection now has 113 four-ply cycles and 120 D4 post-White positions: 110 r4/r6 boundary cycles and three pieces-safe/r6 corner cycles. No global count or density estimate is claimed; no full audit was run.

Examples below are independently verified for preferred White moves, legal Black replies, closure, and terminal/degenerate exclusions. The last two require Black equidistant from a8 and h1. Other orientation and display filters are preserved.

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
