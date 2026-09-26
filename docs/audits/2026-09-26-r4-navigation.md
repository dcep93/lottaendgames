# r4 central navigation — bounded check, 2026-09-26

Removed r3 and its diagram. r4 keeps its starting central-four king/middle-16 knight condition and its earlier bishop-clearance, king-protection, and knight-target priorities. Its final navigation score sums squared Euclidean distances: bishop to a same-colored central-four square, king to an opposite-colored central-four square not occupied by the knight. This replaces the separate king-color and bishop-proximity tiebreaks. No history or cycle detection enters the policy.

35 focused tests and the production build passed. Geometry tests include all eight board symmetries.

Replayed all 583 four-ply witnesses from the last full audit: 256 survive, 327 break. Five seconds of mixed sampling checked 235 roots (234 completed) and found 82 witnesses, 11 additional to the surviving set, yielding 267 verified witnesses. These are not exhaustive current-domain counts, and mixed sampling is unsuitable for density extrapolation. The full-audit baseline pointer is unchanged.

Largest observed motif: r6/r6 knight shuffles, 99 witnesses. r4/r4 has 88, but most are hidden by the user's middle-16 display filter. The second display-eligible group is r4/r6 (35). All examples use preferred White moves and legal Black replies, are D4/phase-distinct, and exclude terminal/degenerate positions at every ply.

The loaded Ke4 Kd6 Ke3 Ke7 loop still survives: Bd5 fails the earlier bishop-clearance priority, and Ke5 is illegal against Kd6.

1. [r6 ↔ r6: Nc7 Kd6 Na6 Ke7](http://localhost:5173/mate/bishop-knight#fen=4B3/4k3/N7/8/8/8/8/7K_w_-_-_0_1&moves=Nc7,Kd6,Na6,Ke7&cursor=0)
2. [r6 ↔ r6: Nb2+ Kc3 Na4+ Kc4](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/8/N1k5/8/8/7K_w_-_-_0_1&moves=Nb2%2B,Kc3,Na4%2B,Kc4&cursor=0)
3. [r6 ↔ r6: Nc3 Kd4 Nd1 Kc5](http://localhost:5173/mate/bishop-knight#fen=7K/8/8/1Bk5/8/8/8/3N4_w_-_-_0_1&moves=Nc3,Kd4,Nd1,Kc5&cursor=0)
4. [r6 ↔ r6: Nc7 Kd6 Na6 Ke7](http://localhost:5173/mate/bishop-knight#fen=4B3/4k3/N7/8/8/8/7K/8_w_-_-_0_1&moves=Nc7,Kd6,Na6,Ke7&cursor=0)
5. [r6 ↔ r6: Nc7 Kd6 Na6 Ke7](http://localhost:5173/mate/bishop-knight#fen=4B3/4k3/N7/8/8/8/8/6K1_w_-_-_0_1&moves=Nc7,Kd6,Na6,Ke7&cursor=0)
6. [r6 ↔ r6: Nb4 Kc5 Nc2 Kb6](http://localhost:5173/mate/bishop-knight#fen=7K/8/Bk6/8/8/8/2N5/8_w_-_-_0_1&moves=Nb4,Kc5,Nc2,Kb6&cursor=0)
7. [r6 ↔ r6: Nb2+ Kc3 Na4+ Kc4](http://localhost:5173/mate/bishop-knight#fen=8/3B4/8/8/N1k5/8/8/7K_w_-_-_0_1&moves=Nb2%2B,Kc3,Na4%2B,Kc4&cursor=0)
8. [r6 ↔ r6: Nb4 Kc5 Nc2 Kb6](http://localhost:5173/mate/bishop-knight#fen=6K1/8/Bk6/8/8/8/2N5/8_w_-_-_0_1&moves=Nb4,Kc5,Nc2,Kb6&cursor=0)
9. [r6 ↔ r6: Nc3 Kd4 Nd1 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/7K/8/1Bk5/8/8/8/3N4_w_-_-_0_1&moves=Nc3,Kd4,Nd1,Kc5&cursor=0)
10. [r6 ↔ r6: Nc7 Kd6 Na6 Ke7](http://localhost:5173/mate/bishop-knight#fen=4B3/4k3/N7/8/8/8/6K1/8_w_-_-_0_1&moves=Nc7,Kd6,Na6,Ke7&cursor=0)
11. [r4 ↔ r6: Nc3 Kb4 Nb1 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2k1K3/8/8/B7/1N6_w_-_-_0_1&moves=Nc3,Kb4,Nb1,Kc5&cursor=0)
12. [r4 ↔ r6: Na6+ Kd7 Nc5+ Kc7](http://localhost:5173/mate/bishop-knight#fen=B7/2k5/8/2N5/4K3/8/8/8_w_-_-_0_1&moves=Na6%2B,Kd7,Nc5%2B,Kc7&cursor=0)
