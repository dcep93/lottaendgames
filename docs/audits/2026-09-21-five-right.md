# Five-diagonal king target two files right of Black

Policy commit: `0e7a47a`. The audit bundled the change before committing; its manifest records the previous HEAD. Audited source fingerprint: `d9880d3366b8400fdf835e6438ba2b2a8bbd0deef79474cc279a0d0e60cd35c7`.

Under r2.5, a supported five-diagonal with the previous-stage knight on d3 now prefers White king step proximity to the square two files to the right of Black's king. Board symmetries transform the target offset with the bishop diagonal and knight. Existing exact r2.5 preferences and r1.5 remain higher priority. Other knights do not receive this target preference; support classification is unchanged. All 188 relevant tests and the application build pass.

From Ke6/Bd7/Nd3 versus Kb6, the target is d6: Kd6 has distance zero and Kd5 has distance one, so Kd6 wins under r2.5.

The exhaustive seven-stage audit enumerated all 13,660,584 legal placements and traced all best-move ties from 134,144 supported seven-diagonal starts through smaller diagonals and loss of support. Black follows the application policy with return history. Mate, capture, stalemate and cycles terminate paths; draw claims and arbitrary legal defense are excluded.

| Metric | Before | After |
| --- | ---: | ---: |
| Seven-diagonal positions directly on discovered cycles | 0 | 0 |
| Five-diagonal positions on those cycles | 56 | 40 |
| Unsupported positions on those cycles | 8 | 8 |
| All downstream cyclic placements | 64 | 48 |
| Starts that can reach a cycle | 130,576 | 130,576 |
| Starts that can reach mate | 856 | 856 |
| Starts that can reach capture or stalemate | 2,784 | 2,784 |
| Cyclic components | 4 | 3 |

Physical counts include reflections and outcomes overlap. The graph contains 21,996 history states and 22,525 transitions. The Ke6/Bd7/Nd3 versus Kb6 shuttle is gone, but eventual loop reachability is unchanged. The loop gate still fails. No separate five-stage census was run.

These minimal representatives were verified for three repetitions from fresh loads, including share decoding, and aligned with a light bishop closer to a8 than h1. Localhost links are the current user preference:

1. [Kd4, Bc6, Nd3 — Black Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/2B5/8/3K4/3N4/8/8_w_-_-_0_1&moves=Kc5,Kd8,Kd4,Kc7&cursor=0) — Kc5 Kd8 Kd4 Kc7
2. [Kc5, Bc6, Nd5 — Black Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k1B5/2KN4/8/8/8/8_w_-_-_0_1&moves=Kd6,Ka5,Kc5,Ka6&cursor=0) — Kd6 Ka5 Kc5 Ka6
3. [Ke5, Bc6, Nd5 — Black Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/2B5/3NK3/8/8/8/8_w_-_-_0_1&moves=Kd6,Kd8,Ke5,Kc8&cursor=0) — Kd6 Kd8 Ke5 Kc8
