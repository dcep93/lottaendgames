# Seven-diagonal king target beside Black

Policy commit: `463f61b`. Snapshot fingerprint: `a0f9703db9baac91b265f8eb3bd1bcb31b568eb80a58bf2ea1d6fb2015ec8502`.

r2.5 first prefers the supported seven-diagonal bishop on b3, then king-step proximity to the square two files right of Black's king, in the same support orientation. All eight reflections apply. This is evaluated after White's candidate move, before Black replies. A nonexistent off-board target supplies no preference; it is not clamped. The preference does not apply to other bishop placements. r1.5 still outranks both r2.5 criteria.

The loaded position (Ke5, Bb3, Nd3, Black Kb6) now uniquely selects Kd6. Its distance is zero, versus one for Kd5 and two for Kd4. Tests cover all reflections and unchanged bishop priority.

## Exhaustive seven-stage audit

Every tied best continuation from all 176,200 supported seven-diagonal post-White starts is followed through smaller and unsupported diagonals. Application Black policy and return history are preserved. Clock/repetition claims are excluded; these are enumerated placements, not a proof of historical reachability or mate against every legal Black move.

| Metric | Before | After |
|---|---:|---:|
| Seven-diagonal boards directly on cycles | 128 | 56 |
| Starts that can reach a cycle | 168,536 | 168,536 |
| Starts that can reach mate | 856 | 856 |
| Starts that can reach capture/stalemate | 6,872 | 6,872 |
| Downstream cyclic components | 17 | 8 |

Direct seven-diagonal cycle membership fell 56.25%; eventual loop reachability did not improve. The largest remaining component is a five-diagonal king loop, reachable from 154,936 selected starts. Both the loop and mate gates still fail. Seven remains active; the smaller-diagonal failures are not counted as success.

## Verification

167 bishop-and-knight tests and the production build passed. Audit production/reference, symmetry, enumeration and independent graph checks passed. Exhaustive root database comparison found zero changed support classifications or weights. All linked minimal four-ply representatives were verified against production moves for three repetitions.

## Remaining representatives

Light bishops start nearer a8 than h1; cursor zero enables Redo.

1. [Kf6, Bb3, Nd3 — Black Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/5K2/8/8/1B1N4/8/8_w_-_-_0_1&moves=Kf7,Kd6,Kf6,Kd7&cursor=0) — Kf7 Kd6 Kf6 Kd7
2. [Kd3, Ba2, Nc4 — Black Kd1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N5/3K4/B7/3k4_w_-_-_0_1&moves=Bb1,Kc1,Ba2,Kd1&cursor=0) — Bb1 Kc1 Ba2 Kd1
3. [Kf5, Bb3, Nd3 — Black Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/8/5K2/8/1B1N4/8/8_w_-_-_0_1&moves=Kf6,Kd6,Kf5,Kd7&cursor=0) — Kf6 Kd6 Kf5 Kd7
4. [Kd4, Bd5, Nd3 — Black Ka4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/k2K4/3N4/8/8_w_-_-_0_1&moves=Ke5,Ka3,Kd4,Ka4&cursor=0) — Ke5 Ka3 Kd4 Ka4
5. [Kd8, Ba4, Nd3 — Black Ka5](http://localhost:5173/mate/bishop-knight#fen=3K4/8/8/k7/B7/3N4/8/8_w_-_-_0_1&moves=Be8,Kb6,Ba4,Ka5&cursor=0) — Be8 Kb6 Ba4 Ka5
6. [Kc5, Bc6, Nd5 — Black Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k1B5/2KN4/8/8/8/8_w_-_-_0_1&moves=Kd6,Ka5,Kc5,Ka6&cursor=0) — Kd6 Ka5 Kc5 Ka6
7. [Kd5, Be8, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=4B3/8/1k6/3K4/8/3N4/8/8_w_-_-_0_1&moves=Bc6,Ka5,Be8,Kb6&cursor=0) — Bc6 Ka5 Be8 Kb6
8. [Kc5, Bc6, Nd5 — Black Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/k1KN4/8/8/8/8_w_-_-_0_1&moves=Kd4,Ka6,Kc5,Ka5&cursor=0) — Kd4 Ka6 Kc5 Ka5
