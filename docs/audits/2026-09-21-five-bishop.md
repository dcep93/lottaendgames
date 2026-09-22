# Five bishop and five knight: prefer b5 or d7

Policy commit: `4ccf797`. Audited source fingerprint: `0f28f38500620a3041f15d0d0ae0750f11a8854a051b6bd2f951aa3aa0bb4e2d`. The manifest records the preceding HEAD because the audit bundled the change before committing.

Under r2.5, a supported five-diagonal with Nd5 gives equal preference to Bb5 and Bd7, before general king targets. Reflections are included. Existing exact r2.5 declarations and r1.5 retain priority; support classification is unchanged. The requested Kd6/Ba4/Nd5 versus Kc8 position now selects Bb5, with r10 breaking the tie between the two preferred bishop placements. All 190 relevant tests and the application build pass; the policy deployment succeeded.

The fresh exhaustive seven-stage audit enumerated 13,660,584 legal placements and followed all best-move ties from all 134,144 supported seven-diagonal starts, continuing through smaller diagonals and loss of support. Black follows the app policy with return history. Mate, capture, stalemate and cycles terminate paths; arbitrary legal defense and draw claims are excluded.

| Metric | Before | After |
| --- | ---: | ---: |
| Seven-diagonal positions directly on discovered cycles | 0 | 0 |
| Five-diagonal positions on those cycles | 72 | 40 |
| Unsupported positions on those cycles | 8 | 8 |
| All downstream cyclic placements | 80 | 48 |
| Starts that can reach a cycle | 130,576 | 130,568 |
| Starts that can reach mate | 856 | 872 |
| Starts that can reach capture or stalemate | 2,784 | 2,784 |
| Cyclic components | 5 | 3 |

Physical counts include reflections; outcomes overlap. The graph has 22,018 history states and 22,561 transitions. The loop gate still fails. This is not a separate exhaustive five-stage census.

All three aligned minimal witnesses were verified for three repetitions from fresh loads, including share decoding:

1. [Kc5, Bb5, Nd5 vs Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/8/1BKN4/8/8/8/8_w_-_-_0_1&moves=Kd6,Kb7,Bd7,Ka6,Kc5,Kb7,Bb5,Kc8&cursor=0): Kd6 Kb7 Bd7 Ka6 Kc5 Kb7 Bb5 Kc8. Its component is reachable from 129,360 selected starts. Loaded on localhost with Redo available.
2. [Kd4, Bc6, Nd3 vs Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/2B5/8/3K4/3N4/8/8_w_-_-_0_1&moves=Kc5,Kd8,Kd4,Kc7&cursor=0): Kc5 Kd8 Kd4 Kc7.
3. [Kd6, Bb5, Nd5 vs Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/3K4/1B1N4/8/8/8/8_w_-_-_0_1&moves=Ke7,Kb7,Kd6,Kc8&cursor=0): Ke7 Kb7 Kd6 Kc8.

Audit artifacts: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-bishop-stage7`.
