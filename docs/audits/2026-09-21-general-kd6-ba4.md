# Generalize Kd6 support for Ba4 with Nd3

Policy commit: `6f3d9fa`.

For a knight on d3, White king on d6 can support a bishop on a4 without restricting Black to b7. This replaces the previous exact Kd6/Ba4/Nd3 versus Kb7 declaration with an ordinary placement allowance. All existing race, boundary, and bishop-safety checks apply, including reflections. The other ordinary placements remain Kc5/Kc6/Kc7 with Ba4/Bc6/Bd7; Kd6 does not allow Bc6 or Bd7.

In the loaded Kd6/Bb3/Nd3 versus Kb6 position, Ba4 becomes supported and uniquely preferred. Tests retain the Kb7 example, accept other Black placements, reject nearby White placements and other bishops with Kd6, and check all eight orientations. The earlier Kc7/Ba4/Nd3 versus Ka6 position now prefers Kd6 while Bc6 remains supported. All 180 relevant tests and the application build pass.

The exhaustive seven-stage audit starts from every supported seven-diagonal placement, follows all tied best moves under the application Black-reply policy with return history, and continues through smaller diagonals and lost support to mate, capture, stalemate, or a cycle. It does not stop at support. Physical placement counts include reflections; cyclic families are graph components rather than every simple cycle.

## Exhaustive seven-stage result

The census checked all 13,660,584 legal placements and selected 134,144 supported seven-diagonal starts. Enumeration and symmetry checks passed. The graph contains 21,984 nodes and 22,513 edges.

| Metric | Kb7-only exception | General Kd6/Ba4 allowance |
| --- | ---: | ---: |
| Seven-diagonal starts | 134,144 | 134,144 |
| Seven positions directly on any discovered cycle | 32 | 24 |
| Starts that can reach a cycle | 130,584 | 130,584 |
| Starts that can reach mate | 848 | 848 |
| Starts that can reach failure | 2,784 | 2,784 |
| Downstream cyclic families | 5 | 5 |

Seven-diagonal cyclic placements fall by eight, but five-diagonal cyclic placements rise from 40 to 48; eight unsupported placements also remain cyclic. The total cyclic placement count and eventual loop reachability are unchanged. The loaded king shuttle becomes the bishop shuttle Ba4/Ka5/Bb3/Kb6. The loop gate still fails. Outcome reachability categories overlap, and no-cycle does not imply every path mates. No new standalone five-stage census was run.

Minimal representatives, aligned with a light bishop closer to a8 than h1, verified against current best-move choices for three repetitions:

1. [Kd6, Bb3, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k1K4/8/8/1B1N4/8/8_w_-_-_0_1&moves=Ba4,Ka5,Bb3,Kb6&cursor=0) — Ba4 Ka5 Bb3 Kb6
2. [Kd5, Bb3, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/3K4/8/1B1N4/8/8_w_-_-_0_1&moves=Kd6,Kb5,Kd5,Kb6&cursor=0) — Kd6 Kb5 Kd5 Kb6
3. [Kd4, Bc6, Nd3 — Black Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/2B5/8/3K4/3N4/8/8_w_-_-_0_1&moves=Kc5,Kd8,Kd4,Kc7&cursor=0) — Kc5 Kd8 Kd4 Kc7
4. [Kc5, Bc6, Nd5 — Black Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/k1KN4/8/8/8/8_w_-_-_0_1&moves=Kd4,Ka6,Kc5,Ka5&cursor=0) — Kd4 Ka6 Kc5 Ka5
5. [Kc5, Bc6, Nd5 — Black Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k1B5/2KN4/8/8/8/8_w_-_-_0_1&moves=Kd6,Ka5,Kc5,Ka6&cursor=0) — Kd6 Ka5 Kc5 Ka6
