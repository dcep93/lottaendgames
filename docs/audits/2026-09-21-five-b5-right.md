# Bb5 with a five knight: king target two files right of Black

Policy commit: `ab182a9`. Audited source fingerprint: `ee4c753823204513b634952b67afd4651df4720774c106dcdaed4c5797e96548`. The audit bundled the change before committing, so its manifest records the preceding HEAD.

With a supported five diagonal, Bb5 and Nd5, r2.5 now prefers king step proximity to the square two files right of Black. This bishop-specific target precedes the general a5/b4 target; reflections follow the same geometry. Existing exact declarations, the b5/d7 bishop preference, and r1.5 retain their priority. Support classification is unchanged. After Kd6 Kb7 in the loaded line, Kd7 is uniquely preferred and has target distance zero.

The r2.5 modal sentence is restored to: “With a supported diagonal, prefer forcing Black’s king towards the target corner.” Detailed preferences are documented in Notes. The visible modal was checked. All 191 relevant tests and the build pass; policy deployment succeeded.

A fresh exhaustive seven-stage audit enumerated 13,660,584 legal placements and traced every best-move tie from all 134,144 supported seven-diagonal starts. Paths continue through smaller diagonals and loss of support. Black follows the application policy with return history. Mate, capture, stalemate and cycles terminate paths; arbitrary legal defense and draw claims are excluded.

| Metric | Before | After |
| --- | ---: | ---: |
| Seven-diagonal positions directly on discovered cycles | 0 | 0 |
| Five-diagonal positions on those cycles | 40 | 8 |
| Unsupported positions on those cycles | 8 | 8 |
| All downstream cyclic placements | 48 | 16 |
| Starts that can reach a cycle | 130,568 | 176 |
| Starts that can reach mate | 872 | 131,208 |
| Starts that can reach capture or stalemate | 2,784 | 2,784 |
| Cyclic components | 3 | 1 |

Physical counts include reflections; outcomes overlap. Only 0.1312% of selected starts can now reach a loop. The graph has 22,015 history states and 22,543 transitions. The loop gate still fails because one component remains; loss/stalemate branches also remain. This is not a separate exhaustive five-stage census.

The remaining aligned minimal representative, [Kc5 Kd8 Kd4 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/2B5/8/3K4/3N4/8/8_w_-_-_0_1&moves=Kc5,Kd8,Kd4,Kc7&cursor=0), was verified for three repetitions from a fresh load, including share decoding, and loaded on localhost with Redo available.

Audit artifacts: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-b5-right-stage7`.
