# Seven-diagonal races while the knight approaches support

Policy commit: `47629d8`.

The previous classifier checked only f6/g7 for the canonical seven diagonal even when the knight had not reached d3. It now also checks c3/d4 while the knight is off its support square, except for a square the knight already controls. White must match Black's king-step distance. All D4 reflections apply; the knight already on d3 retains the established support treatment. Support is still evaluated after White moves, and r1.5 retains priority.

For White Ke6, Bf7, Ne5 versus Black Kb5, Ke7 is now unsupported: Black reaches c3 in two steps versus White's four and d4 in two versus White's three. The preferred move becomes Kd5.

172 bishop-and-knight tests and the build passed, including the reported position in all eight symmetries and a positive control with Nd3.


## Exhaustive seven-stage audit

All supported seven-diagonal post-White starts were followed through all tied best application-policy moves, retaining Black return history and continuing through smaller and unsupported diagonals until mate, capture, stalemate or cycles. Clock/repetition claims are excluded. This is a placement census, not a claim of historical reachability or a proof against every legal Black defense.

| Measure | Before | After |
|---|---:|---:|
| Supported seven starts | 176,200 | 134,152 |
| Seven boards directly on discovered cycles | 64 | 8 |
| Starts that can reach a cycle | 168,520 | 130,568 |
| Starts that can reach mate | 864 | 864 |
| Starts that can reach capture/stalemate | 6,880 | 2,784 |
| Downstream cyclic components | 12 | 5 |

The support definition excludes 42,048 formerly supported seven starts. These are different populations; the lower loop and failure counts must not be presented as purely improved play over the old population. Reachable outcomes can overlap. The seven stage is still incomplete. Its reachable cycles contain eight seven-diagonal boards, eight unsupported boards, and 64 five-diagonal boards. One component mixes seven and unsupported placements; four contain five diagonals. Reference-policy, symmetry, enumeration and graph checks passed; the loops completion gate correctly fails.

## Remaining minimal representatives

All five four-ply witnesses replay for three repetitions with current production best moves. Bishops are light-squared and nearer a8 than h1. The first loop is loaded in the sidebar with Redo available.

1. [Kd3, Ba2, Nc4 — Black Kd1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N5/3K4/B7/3k4_w_-_-_0_1&moves=Bb1,Kc1,Ba2,Kd1&cursor=0) — Bb1 Kc1 Ba2 Kd1
2. [Kd8, Ba4, Nd3 — Black Ka5](http://localhost:5173/mate/bishop-knight#fen=3K4/8/8/k7/B7/3N4/8/8_w_-_-_0_1&moves=Be8,Kb6,Ba4,Ka5&cursor=0) — Be8 Kb6 Ba4 Ka5
3. [Kc5, Bc6, Nd5 — Black Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k1B5/2KN4/8/8/8/8_w_-_-_0_1&moves=Kd6,Ka5,Kc5,Ka6&cursor=0) — Kd6 Ka5 Kc5 Ka6
4. [Ke5, Bc6, Nd5 — Black Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/2B5/3NK3/8/8/8/8_w_-_-_0_1&moves=Kd6,Kd8,Ke5,Kc8&cursor=0) — Kd6 Kd8 Ke5 Kc8
5. [Kd5, Be8, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=4B3/8/1k6/3K4/8/3N4/8/8_w_-_-_0_1&moves=Bc6,Ka5,Be8,Kb6&cursor=0) — Bc6 Ka5 Be8 Kb6
