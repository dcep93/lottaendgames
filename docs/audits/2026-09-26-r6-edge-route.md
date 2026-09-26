# r6 edge onward route — bounded check, 2026-09-26

Fixed Nc2 from White Kh3, Be8, Nb4 against Black Kc4. The local drift geometry already recognizes an onward route, but the edge-opposition shortcut overrode it with obstruction 2 and proximity 99. That shortcut now applies only when the geometric check finds an obstruction. The geometric result is cached and reused, with no new response search. Nc2 now wins; after Kc3, Ne1 and Ng2 connect the knight and king. Rule text unchanged.

58 focused tests and production build passed. Tests include eight-symmetry regression and preserve the old Nb8/Nc7 edge-trap rejections.

133 of 583 four-ply witnesses from the last full audit survive (450 break). Five-second mixed sampling checked 227 roots (226 completed), found 50 witnesses, including 12 additional, yielding 145 verified witnesses. Not an exhaustive count or density estimate; full-audit baseline unchanged.

Largest observed rule pair overall: r4/r4, 75 witnesses. Largest display-eligible motif: r6 knight shuffles, 65. Examples obey preferred White moves, legal Black replies, D4/phase deduplication, terminal/degenerate exclusions, middle-16 display exclusions, and orientation preferences. Only one other motif example meets these filters in the checked set.

1. [r6 ↔ r6: Nb4+ Kc4 Na6 Kd5](http://localhost:5173/mate/bishop-knight#fen=4B3/8/N7/3k4/7K/8/8/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Na6,Kd5&cursor=0)
2. [r6 ↔ r6: Nb5 Kb4 Na7 Ka5](http://localhost:5173/mate/bishop-knight#fen=4B3/N7/8/k7/8/8/8/K7_w_-_-_0_1&moves=Nb5,Kb4,Na7,Ka5&cursor=0)
3. [r6 ↔ r6: Na7 Kc5 Nb5 Kb4](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/1N6/1k6/8/8/K7_w_-_-_0_1&moves=Na7,Kc5,Nb5,Kb4&cursor=0)
4. [r6 ↔ r6: Nc7 Kd7 Nb5 Ke7](http://localhost:5173/mate/bishop-knight#fen=B6K/4k3/8/1N6/8/8/8/8_w_-_-_0_1&moves=Nc7,Kd7,Nb5,Ke7&cursor=0)
5. [r6 ↔ r6: Nb5 Kb4 Na7 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/N2B4/8/k7/8/8/8/K7_w_-_-_0_1&moves=Nb5,Kb4,Na7,Ka5&cursor=0)
6. [r6 ↔ r6: Na7 Kc5 Nb5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/3B4/8/1N6/1k6/8/8/K7_w_-_-_0_1&moves=Na7,Kc5,Nb5,Kb4&cursor=0)
7. [r6 ↔ r6: Nc7 Kd7 Nb5 Ke7](http://localhost:5173/mate/bishop-knight#fen=7K/1B2k3/8/1N6/8/8/8/8_w_-_-_0_1&moves=Nc7,Kd7,Nb5,Ke7&cursor=0)
8. [r6 ↔ r6: Nc7+ Kc5 Na6+ Kb5](http://localhost:5173/mate/bishop-knight#fen=2B5/8/N7/1k6/8/8/8/1K6_w_-_-_0_1&moves=Nc7%2B,Kc5,Na6%2B,Kb5&cursor=0)
9. [r6 ↔ r6: Nc8 Kd7 Na7 Kc7](http://localhost:5173/mate/bishop-knight#fen=7K/N1k5/B7/8/8/8/8/8_w_-_-_0_1&moves=Nc8,Kd7,Na7,Kc7&cursor=0)
10. [r6 ↔ r6: Nc8 Kd7 Na7 Kc7](http://localhost:5173/mate/bishop-knight#fen=6K1/N1k5/B7/8/8/8/8/8_w_-_-_0_1&moves=Nc8,Kd7,Na7,Kc7&cursor=0)
11. [r7 ↔ r7: Kb7 Kd6 Ka6 Kc5](http://localhost:5173/mate/bishop-knight#fen=B7/8/KN6/2k5/8/8/8/8_w_-_-_0_1&moves=Kb7,Kd6,Ka6,Kc5&cursor=0)
