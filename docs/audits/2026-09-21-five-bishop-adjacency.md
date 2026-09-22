# Nd3 five support: a4 or king-adjacent bishop

Policy commit: `eb85af0`. Audited source fingerprint: `3de814376588165d44a3c5b74eebbd5d0b8826ca5fea9d8b60f662431aae5c92`. The audit bundled the change before committing; the manifest therefore records the preceding HEAD.

The user's “five diagonal with a seven bishop” was interpreted as the loaded five-diagonal/seven-knight (Nd3) setup. With Nd3, the five-diagonal bishop must be on a4 or adjacent to White's king by edge or diagonal. Reflections are included, and the condition is evaluated after White moves. It constrains earlier placement exceptions too; the strict right-of-Black condition and every other support test remain. Actual five knights are unaffected. Thus 1. Bd7 with Kc5/Nd3 against Kb7 is unsupported. The older Kd5/Bd7/Nd3 declaration is also superseded. All 193 relevant tests and the application build pass.

The fresh exhaustive seven-stage audit classified all 13,660,584 legal placements and followed all best-policy ties from all 134,144 supported seven-diagonal starts. Paths continue through smaller diagonals and loss of support. Black follows the app policy with return history. Mate, capture, stalemate and cycles terminate paths; arbitrary legal defense and draw claims are excluded.

| Metric | Before | After |
| --- | ---: | ---: |
| Seven-diagonal positions directly on discovered cycles | 8 | 8 |
| Five-diagonal positions on those cycles | 8 | 8 |
| Unsupported positions on those cycles | 0 | 0 |
| All downstream cyclic placements | 16 | 16 |
| Starts that can reach a cycle | 104 | 560 |
| Starts that can reach mate | 131,320 | 130,944 |
| Starts that can reach capture or stalemate | 2,784 | 2,784 |
| Cyclic components | 1 | 1 |

Physical counts include reflections; outcomes overlap. The former Bd7/Be6 loop is gone, but a different Ba4/Bb3 loop is reachable from more starts (0.4175%). The graph has 22,002 history states and 22,530 transitions. The loop gate still fails; capture/stalemate branches remain. No separate exhaustive five-stage census was run.

The remaining aligned minimal representative, [Ba4 Ka5 Bb3 Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/3K4/8/1B1N4/8/8_w_-_-_0_1&moves=Ba4,Ka5,Bb3,Kb6&cursor=0), was verified for three repetitions from a fresh load, including share decoding, and loaded on localhost with Redo available.

Audit artifacts: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-bishop-adjacency-stage7`.
