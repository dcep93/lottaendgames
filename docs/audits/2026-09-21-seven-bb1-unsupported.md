# Declared unsupported Bb1 placement

Policy commit: `b6c5317`.

The user declared 1. Bb1 unsupported from White Kd3, Ba2, Nc4 versus Black Kd1. The resulting exact Kd3/Bb1/Nc4 versus Kd1 placement is now excluded from support, including all eight D4 transforms and independently of move counters. Nearby king placements retain their support classification. The existing exact-unsupported collection was renamed to reflect that it now contains seven- as well as three-diagonal placements. No preference or higher-priority rule is overridden.

The loaded position now selects Kd4. All 173 bishop-and-knight tests and the build passed. Regression coverage includes all symmetries, two move-counter settings and nearby positive controls.

## Exhaustive seven-stage audit

All 134,144 supported seven-diagonal post-White starts were followed through all tied best application-policy paths, including smaller and unsupported diagonals. Black return history is retained; clock/repetition claims are excluded. This is a placement census, not historical reachability or proof against arbitrary legal Black defense.

| Measure | Before | After |
|---|---:|---:|
| Supported seven starts | 134,152 | 134,144 |
| Seven boards directly on discovered cycles | 8 | 0 |
| Starts that can reach a cycle | 130,568 | 130,560 |
| Starts that can reach mate | 864 | 864 |
| Starts that can reach capture/stalemate | 2,784 | 2,784 |
| Downstream cyclic components | 5 | 4 |

The exact declaration removes eight reflected placements from the supported population and eliminates the mixed seven/unsupported cycle. All remaining reachable cyclic placements are five-diagonal positions: 64 physical boards across four cyclic components. The seven stage is not complete under the requirement to follow every path to mate: 130,560 starts still reach those downstream cycles, and 2,784 can reach capture or stalemate. Outcome counts may overlap. Reference-policy, symmetry, enumeration and graph checks passed; the loops gate correctly fails.

## Remaining minimal downstream loops

These four-ply loops replay against production best moves for three repetitions. Bishops are light-squared and nearer a8 than h1. The first is loaded with Redo available.

1. [Kd8, Ba4, Nd3 — Black Ka5](http://localhost:5173/mate/bishop-knight#fen=3K4/8/8/k7/B7/3N4/8/8_w_-_-_0_1&moves=Be8,Kb6,Ba4,Ka5&cursor=0) — Be8 Kb6 Ba4 Ka5
2. [Ke5, Bc6, Nd5 — Black Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/2B5/3NK3/8/8/8/8_w_-_-_0_1&moves=Kd6,Kd8,Ke5,Kc8&cursor=0) — Kd6 Kd8 Ke5 Kc8
3. [Kc5, Bc6, Nd5 — Black Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k1B5/2KN4/8/8/8/8_w_-_-_0_1&moves=Kd6,Ka5,Kc5,Ka6&cursor=0) — Kd6 Ka5 Kc5 Ka6
4. [Kd5, Be8, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=4B3/8/1k6/3K4/8/3N4/8/8_w_-_-_0_1&moves=Bc6,Ka5,Be8,Kb6&cursor=0) — Bc6 Ka5 Be8 Kb6
