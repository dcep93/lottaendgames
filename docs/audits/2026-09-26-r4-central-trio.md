# r4 central trio — bounded check, 2026-09-26

r4 now first prefers all three White pieces on the central four squares (d4, e4, d5, e5). Its original pre-move central-king/middle-16-knight eligibility and subsequent priorities remain in place.

35 focused tests passed, including eight-symmetry regressions; production build passed. The supplied Ke4/Bd5/Nd4 against Ke7 position chooses Ke5.

Replayed all 583 four-ply cycle witnesses from the full 9a34d57 audit: 507 survive and 76 break. A five-second mixed search checked 246 roots (245 completed), finding 162 witnesses, five additional to the replay set. Combined: 512 verified D4/phase-distinct four-ply witnesses. This is not a global cycle or on-cycle-position count; the latest full audit remains the baseline. Fresh sampling mixes old roots with random placements and must not be used for density extrapolation.

Largest observed causal motif: r4/r7 king shuffles, 250 witnesses. Next: r6/r6 knight shuffles, 99. Examples exclude terminal/degenerate positions at every ply and hide loops whose two White-to-move positions have all White pieces in the middle 16. Selection prioritizes wide White-piece rectangles and distinct layouts.

1. [r4 ↔ r7: Ke4 Kf6 Ke3 Kf7](http://localhost:5173/mate/bishop-knight#fen=8/5k2/B7/8/3N4/4K3/8/8_w_-_-_0_1&moves=Ke4,Kf6,Ke3,Kf7&cursor=0)
2. [r4 ↔ r7: Kd5 Kf6 Kc5 Kf7](http://localhost:5173/mate/bishop-knight#fen=B7/5k2/8/2K5/3N4/8/8/8_w_-_-_0_1&moves=Kd5,Kf6,Kc5,Kf7&cursor=0)
3. [r4 ↔ r7: Ke4 Kf6 Ke3 Kf7](http://localhost:5173/mate/bishop-knight#fen=2B5/5k2/8/8/3N4/4K3/8/8_w_-_-_0_1&moves=Ke4,Kf6,Ke3,Kf7&cursor=0)
4. [r4 ↔ r7: Kc5 Kd7 Kd5 Kc8](http://localhost:5173/mate/bishop-knight#fen=B1k5/8/2N5/3K4/8/8/8/8_w_-_-_0_1&moves=Kc5,Kd7,Kd5,Kc8&cursor=0)
5. [r4 ↔ r7: Kd5 Kf6 Kc5 Ke7](http://localhost:5173/mate/bishop-knight#fen=8/4k3/8/2K5/3N4/8/B7/8_w_-_-_0_1&moves=Kd5,Kf6,Kc5,Ke7&cursor=0)
6. [r4 ↔ r7: Ke3 Ke7 Ke4 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/B2k4/8/3NK3/8/8/8_w_-_-_0_1&moves=Ke3,Ke7,Ke4,Kd6&cursor=0)
7. [r4 ↔ r7: Kd4 Kc6 Kc3 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/B7/8/2N5/2K5/8/8_w_-_-_0_1&moves=Kd4,Kc6,Kc3,Kc7&cursor=0)
8. [r4 ↔ r7: Kc3 Kd7 Kd4 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/8/B1k5/8/2NK4/8/8/8_w_-_-_0_1&moves=Kc3,Kd7,Kd4,Kc6&cursor=0)
9. [r4 ↔ r7: Kd5 Kd7 Kc5 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/5B2/2N5/2K5/8/8/8/8_w_-_-_0_1&moves=Kd5,Kd7,Kc5,Kc8&cursor=0)
10. [r4 ↔ r7: Kc5 Kc7 Kd5 Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k1B2/2N5/3K4/8/8/8/8_w_-_-_0_1&moves=Kc5,Kc7,Kd5,Kd7&cursor=0)
11. [r6 ↔ r6: Nc7 Kd6 Na6 Ke7](http://localhost:5173/mate/bishop-knight#fen=4B3/4k3/N7/8/8/8/8/7K_w_-_-_0_1&moves=Nc7,Kd6,Na6,Ke7&cursor=0)
12. [r6 ↔ r6: Nb2+ Kc3 Na4+ Kc4](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/8/N1k5/8/8/7K_w_-_-_0_1&moves=Nb2%2B,Kc3,Na4%2B,Kc4&cursor=0)
