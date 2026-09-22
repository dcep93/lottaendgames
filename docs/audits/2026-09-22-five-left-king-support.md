# Bishop adjacency for a five-knight king left of Black

Policy commit: `a3c56c9`. With Bb5 and Nd5, White's king must be adjacent to the bishop if it is to the left of Black's king. This additional support exclusion applies under all D4 reflections and ignores move counters. Older placement declarations cannot bypass it. The exact Kd7/Bb5/Nd5 versus Kb7 color exception remains supported. All 201 relevant tests and the build pass; deployment succeeded.

From `2k5/8/1K6/1B1N4/8/8/8/8 w - - 2 2`, Ka7 now fails support because White is left of Black and not adjacent to Bb5. Kc5 remains unsupported because c5 and c8 are three king steps apart, violating the previously requested five-knight two-step limit. Bishop adjacency does not waive that limit. No Kc5 exception was added.

## Exhaustive continuation results

Each stage independently classified all 13,660,584 legal placements without reused root caches. All tied best moves are followed through smaller diagonals and loss of support, retaining Black return history, until mate, capture, stalemate or cycles. Counts include reflections; outcomes may overlap. Black follows the application policy rather than arbitrary legal defense. Clocks and repetition claims are excluded.

| Starting diagonal | Supported starts | Directly on loops | Can reach loops | Can reach mate | Can reach capture/stalemate |
| --- | ---: | ---: | ---: | ---: | ---: |
| 7 | 134,144 | 0 | 2,144 | 129,496 | 2,800 |
| 5 | 11,096 | 192 | 2,184 | 8,176 | 952 |
| 3 | 2,548 | 0 | 0 | 2,004 | 544 |

The three-diagonal loop gate still passes; seven- and five-diagonal gates fail. Seven-diagonal starts that can reach a loop remain 2,144. Five-diagonal starts that can reach a loop decrease from 2,192 to 2,184, while their directly looping count remains 192. The restriction redirects the former king shuttle into a bishop shuttle rather than eliminating that downstream component. Loop-free is not forced mate: capture/stalemate branches remain.

## Loaded minimal loop

[1. Bb5 Kc8 2. Bc6 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/1KB5/3N4/8/8/8/8_w_-_-_0_1&moves=Bb5,Kc8,Bc6,Kd8&cursor=0)

White Kb6, Bc6, Nd5; Black Kd8. The largest remaining downstream component for seven-diagonal starts, reachable from 1,696 such placements. The four-ply cycle has no intermediate repeated placement. Every move was verified as best-policy through three repetitions from a fresh load. The bishop is light-squared and closer to a8 than h1. Loaded at cursor zero with Redo available.

## Artifacts

Bundles predate the policy commit, so manifests record preceding HEAD `29c0979`. Fingerprints identify the edited code:

- Stage 7: `5dfe989bd66704a2fd82c6775564c2b881cb8202d229fc961cbc3d72fb0cfc65`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-five-left-king-stage7`.
- Stage 5: `57f06abf72fad3b9a4d1116bab65029f5bf3b2a468be52e70c45bc71b2e488b5`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-five-left-king-stage5`.
- Stage 3: `d4a931768242b16b8e0e4e9d2048d88273e356436c7364b7fb6671004c7e9089`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-five-left-king-stage3`.
