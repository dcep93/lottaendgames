# Strict king-side condition for Nd3 five-diagonal support

The preceding work was already committed and pushed. Policy commit: `7cbde6a`. Audited source fingerprint: `65a4f8e20c6a474af50ffe479c8fc7e8f914540e53a5bfadd7ab98412f83f7ed`. The audit bundled the change before committing, so its manifest records the preceding HEAD.

With the previous-stage knight on d3, White's king must be strictly to the right of Black's king for five-diagonal support. Same-file kings fail. The condition is evaluated after White moves and transformed with the knight/diagonal orientation under all board symmetries. It also constrains earlier five-diagonal placement exceptions; all other support requirements remain. A knight on d5 is unaffected. The short r2.5 modal sentence remains unchanged; support notes document the new condition.

All 192 relevant tests and the application build pass. Deployment of the policy commit succeeded.

A fresh exhaustive seven-stage audit classified all 13,660,584 legal placements and followed all best-policy ties from 134,144 supported seven-diagonal post-White starts. Paths continue through smaller diagonals and loss of support. Black follows the application policy with return history. Mate, capture, stalemate and cycles terminate paths; arbitrary legal defense and draw claims are excluded.

| Metric | Before | After |
| --- | ---: | ---: |
| Seven-diagonal positions directly on discovered cycles | 0 | 8 |
| Five-diagonal positions on those cycles | 8 | 8 |
| Unsupported positions on those cycles | 8 | 0 |
| All downstream cyclic placements | 16 | 16 |
| Starts that can reach a cycle | 176 | 104 |
| Starts that can reach mate | 131,208 | 131,320 |
| Starts that can reach capture or stalemate | 2,784 | 2,784 |
| Cyclic components | 1 | 1 |

Physical counts include reflections; outcomes overlap. The remaining loop is different: it alternates supported five and seven diagonals. 0.0775% of selected starts can reach it. The graph has 22,010 history states and 22,538 transitions. The loop gate still fails; capture/stalemate branches also remain. This is not a separate five-stage census.

The remaining minimal representative is [Bd7 Kc7 Be6 Kb7](http://localhost:5173/mate/bishop-knight#fen=8/1k6/4B3/2K5/8/3N4/8/8_w_-_-_0_1&moves=Bd7,Kc7,Be6,Kb7&cursor=0). It was verified for three repetitions from a fresh load, including share decoding, and loaded on localhost with Redo available. The light bishop is closer to a8 than h1.

Audit artifacts: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-king-side-stage7`.
