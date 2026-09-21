# Seven-diagonal king walk toward b2

Policy commit: `aa206cd`.

Within r2.5, after exact declarations and before the general bishop/king preferences, a supported seven diagonal with Black on or king-adjacent to a3 prefers White king opposite the bishop color, then king-step proximity to b2. All reflections apply. Support classification and r1.5 remain unchanged. The supplied Ke8/Bd5/Nd3 versus Ka4 position now selects Ke7, then Kd6 if Black remains on a4.

## Exhaustive seven-stage audit

All 176,200 supported seven-diagonal post-White starts were followed through every tied best application-policy path, including smaller and unsupported diagonals. Black return history is retained. Clock and repetition claims are excluded; this is a placement census, not historical reachability or proof against arbitrary legal Black defense.

| Measure | Before | After |
|---|---:|---:|
| Seven-diagonal boards directly on cycles | 80 | 64 |
| Starts that can reach a cycle | 168,528 | 168,520 |
| Starts that can reach mate | 864 | 864 |
| Starts that can reach capture/stalemate | 6,872 | 6,880 |
| Downstream cyclic components | 13 | 12 |

The loaded cycle is removed, but eight additional starts can reach capture/stalemate. This is not an across-the-board improvement. Reachable outcomes can overlap. Seven remains active; both completion gates remain unsatisfied. Downstream cycle boards comprise 64 seven-diagonal, 64 five-diagonal, and 64 unsupported positions.

171 bishop-and-knight tests and the build passed. Reference-policy, symmetry, enumeration, and graph checks completed. The following minimal four-ply representatives replay against production moves for three repetitions. Light bishops start nearer a8 than h1; cursor zero enables Redo.

1. [Ke6, Bg8, Nc1 — Black Kb5](http://localhost:5173/mate/bishop-knight#fen=6B1/8/4K3/1k6/8/8/8/2N5_w_-_-_0_1&moves=Ke7,Kc5,Ke6,Kb5&cursor=0) — Ke7 Kc5 Ke6 Kb5
2. [Kd3, Ba2, Nc4 — Black Kd1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N5/3K4/B7/3k4_w_-_-_0_1&moves=Bb1,Kc1,Ba2,Kd1&cursor=0) — Bb1 Kc1 Ba2 Kd1
3. [Kc4, Ba2, Ne3 — Black Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/8/8/2K5/4N3/B7/8_w_-_-_0_1&moves=Kb4,Kd6,Kc4,Kd7&cursor=0) — Kb4 Kd6 Kc4 Kd7
4. [Kc4, Bb3, Nd4 — Black Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/8/8/2KN4/1B6/8/8_w_-_-_0_1&moves=Kb4,Kd6,Kc4,Kd7&cursor=0) — Kb4 Kd6 Kc4 Kd7
5. [Kc4, Bb3, Ne3 — Black Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/8/8/2K5/1B2N3/8/8_w_-_-_0_1&moves=Kb4,Kd6,Kc4,Kd7&cursor=0) — Kb4 Kd6 Kc4 Kd7
6. [Ke6, Bf7, Nf2 — Black Kb5](http://localhost:5173/mate/bishop-knight#fen=8/5B2/4K3/1k6/8/8/5N2/8_w_-_-_0_1&moves=Ke7,Kc5,Ke6,Kb5&cursor=0) — Ke7 Kc5 Ke6 Kb5
7. [Ke6, Bf7, Nc1 — Black Kb5](http://localhost:5173/mate/bishop-knight#fen=8/5B2/4K3/1k6/8/8/8/2N5_w_-_-_0_1&moves=Ke7,Kc5,Ke6,Kb5&cursor=0) — Ke7 Kc5 Ke6 Kb5
8. [Ke6, Bf7, Ne1 — Black Kb5](http://localhost:5173/mate/bishop-knight#fen=8/5B2/4K3/1k6/8/8/8/4N3_w_-_-_0_1&moves=Ke7,Kc5,Ke6,Kb5&cursor=0) — Ke7 Kc5 Ke6 Kb5
9. [Kd8, Ba4, Nd3 — Black Ka5](http://localhost:5173/mate/bishop-knight#fen=3K4/8/8/k7/B7/3N4/8/8_w_-_-_0_1&moves=Be8,Kb6,Ba4,Ka5&cursor=0) — Be8 Kb6 Ba4 Ka5
10. [Kc5, Bc6, Nd5 — Black Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k1B5/2KN4/8/8/8/8_w_-_-_0_1&moves=Kd6,Ka5,Kc5,Ka6&cursor=0) — Kd6 Ka5 Kc5 Ka6
11. [Kd5, Be8, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=4B3/8/1k6/3K4/8/3N4/8/8_w_-_-_0_1&moves=Bc6,Ka5,Be8,Kb6&cursor=0) — Bc6 Ka5 Be8 Kb6
12. [Kc5, Bc6, Nd5 — Black Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/k1KN4/8/8/8/8_w_-_-_0_1&moves=Kd4,Ka6,Kc5,Ka5&cursor=0) — Kd4 Ka6 Kc5 Ka5
