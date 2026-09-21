# Exact r2.5 Ke8 from Kf8

Policy commit: `15bae55`. Snapshot fingerprint: `dada014a1407fff76df82dc339b6c90d52852e6fa3d5de12f8f12d898745c5c1`.

The exact r2.5 declaration now also covers White Kf8, Bb3, Nd3 versus Black Kd6, selecting Ke8. It retains the earlier Kf7 version. All reflections apply, counters are ignored, nearby positions do not match, and r1.5 remains higher priority. Ke8 is already supported seven with zero knight distance, so no support exception was introduced.

## Exhaustive seven-stage audit

All 176,200 supported seven-diagonal post-White starts were followed through every tied best application-policy path, including smaller and unsupported diagonals. Black return history is retained. Clock and repetition claims are excluded; this is a placement census, not historical reachability or a proof against arbitrary legal Black defense.

| Measure | Before | After |
|---|---:|---:|
| Seven-diagonal boards directly on cycles | 96 | 80 |
| Starts that can reach a cycle | 168,528 | 168,528 |
| Starts that can reach mate | 864 | 864 |
| Starts that can reach capture/stalemate | 6,872 | 6,872 |
| Downstream cyclic components | 14 | 13 |

The prescribed cycle is removed; eventual loop reachability is unchanged. Reachable outcomes can overlap. Seven remains active and both completion gates remain unsatisfied. Downstream cycle boards comprise 80 seven-diagonal, 64 five-diagonal, and 64 unsupported positions.

170 bishop-and-knight tests and the build passed. Regression tests reconstruct Kf8 Kd6 and verify Ke8, support, reflections, counters, and nearby-position negatives. Audit reference-policy, symmetry, enumeration and independent graph checks passed. The following minimal four-ply representatives replay against production moves for three repetitions. Light bishops start nearer a8 than h1; cursor zero enables Redo.

1. [Ke8, Bd5, Nd3 — Black Ka4](http://localhost:5173/mate/bishop-knight#fen=4K3/8/8/3B4/k7/3N4/8/8_w_-_-_0_1&moves=Bg8,Ka3,Bd5,Ka4&cursor=0) — Bg8 Ka3 Bd5 Ka4
2. [Ke6, Bg8, Nc1 — Black Kb5](http://localhost:5173/mate/bishop-knight#fen=6B1/8/4K3/1k6/8/8/8/2N5_w_-_-_0_1&moves=Ke7,Kc5,Ke6,Kb5&cursor=0) — Ke7 Kc5 Ke6 Kb5
3. [Kd3, Ba2, Nc4 — Black Kd1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N5/3K4/B7/3k4_w_-_-_0_1&moves=Bb1,Kc1,Ba2,Kd1&cursor=0) — Bb1 Kc1 Ba2 Kd1
4. [Kc4, Ba2, Ne3 — Black Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/8/8/2K5/4N3/B7/8_w_-_-_0_1&moves=Kb4,Kd6,Kc4,Kd7&cursor=0) — Kb4 Kd6 Kc4 Kd7
5. [Kc4, Bb3, Ne3 — Black Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/8/8/2K5/1B2N3/8/8_w_-_-_0_1&moves=Kb4,Kd6,Kc4,Kd7&cursor=0) — Kb4 Kd6 Kc4 Kd7
6. [Kc4, Bb3, Nd4 — Black Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/8/8/2KN4/1B6/8/8_w_-_-_0_1&moves=Kb4,Kd6,Kc4,Kd7&cursor=0) — Kb4 Kd6 Kc4 Kd7
7. [Ke6, Bf7, Nf2 — Black Kb5](http://localhost:5173/mate/bishop-knight#fen=8/5B2/4K3/1k6/8/8/5N2/8_w_-_-_0_1&moves=Ke7,Kc5,Ke6,Kb5&cursor=0) — Ke7 Kc5 Ke6 Kb5
8. [Ke6, Bf7, Ne1 — Black Kb5](http://localhost:5173/mate/bishop-knight#fen=8/5B2/4K3/1k6/8/8/8/4N3_w_-_-_0_1&moves=Ke7,Kc5,Ke6,Kb5&cursor=0) — Ke7 Kc5 Ke6 Kb5
9. [Ke6, Bf7, Nc1 — Black Kb5](http://localhost:5173/mate/bishop-knight#fen=8/5B2/4K3/1k6/8/8/8/2N5_w_-_-_0_1&moves=Ke7,Kc5,Ke6,Kb5&cursor=0) — Ke7 Kc5 Ke6 Kb5
10. [Kd8, Ba4, Nd3 — Black Ka5](http://localhost:5173/mate/bishop-knight#fen=3K4/8/8/k7/B7/3N4/8/8_w_-_-_0_1&moves=Be8,Kb6,Ba4,Ka5&cursor=0) — Be8 Kb6 Ba4 Ka5
11. [Kc5, Bc6, Nd5 — Black Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k1B5/2KN4/8/8/8/8_w_-_-_0_1&moves=Kd6,Ka5,Kc5,Ka6&cursor=0) — Kd6 Ka5 Kc5 Ka6
12. [Ke5, Bc6, Nd5 — Black Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/2B5/3NK3/8/8/8/8_w_-_-_0_1&moves=Kd6,Kd8,Ke5,Kc8&cursor=0) — Kd6 Kd8 Ke5 Kc8
13. [Kd5, Be8, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=4B3/8/1k6/3K4/8/3N4/8/8_w_-_-_0_1&moves=Bc6,Ka5,Be8,Kb6&cursor=0) — Bc6 Ka5 Be8 Kb6
