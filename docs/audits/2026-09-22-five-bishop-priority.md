# Prefer the five-bishop square farther from White's king

Final policy commit: `c38411a` (building on `c8cd25f`). With a supported five-diagonal bishop and five-knight, prefer whichever of b5/d7 is farther from White's king in Euclidean distance. Equal distances tie. All D4 reflections apply. This preference precedes the five-knight king-approach preference, while r1.5 and exact declarations retain priority. Support eligibility is unchanged, and the short r2.5 modal text is unchanged.

The loaded second Bb5 from Kd6/Bc6/Nd5 versus Kc8 is now uniquely preferred. The former dominant loop plays 1. Kd6 Kc8 2. Bb5 Kb7 3. Kd7 Ka7 4. Kc7 Ka8 5. Ba6 Ka7 6. Bc8 Ka8 7. Nc3 Ka7 8. Nb5+ Ka8 9. Bb7#. All 205 relevant tests and the build pass, including symmetry, distance ties, the loaded second-move preference and support precedence. Deployment succeeded.

## Exhaustive continuation results

Each cohort independently classified all 13,660,584 legal placements without reused root caches. Every tied best continuation is followed through smaller diagonals and lost support, with Black return history, until mate, capture, stalemate or cycles. Counts include reflections. Outcomes can overlap. Black follows the app policy, not arbitrary legal defense; clocks and repetition claims are excluded.

| Starting diagonal | Supported starts | Directly on loops | Can reach loops | Can reach mate | Can reach capture/stalemate |
| --- | ---: | ---: | ---: | ---: | ---: |
| 7 | 134,144 | 0 | 448 | 131,024 | 2,800 |
| 5 | 11,104 | 176 | 1,864 | 8,504 | 952 |
| 3 | 2,548 | 0 | 0 | 2,004 | 544 |

Compared with the previous turn, seven-diagonal starts reaching loops decrease from 127,552 to 448 (0.3340% of the cohort), five-diagonal starts from 5,456 to 1,864 (16.7867%), and three-diagonal starts from 16 to zero. Direct loop membership remains 0/176/0. The three-diagonal loop gate passes; seven and five still fail. Capture/stalemate branches remain, so zero loops is not a forced-mate proof.

## Loaded minimal loop

[1. Kd6 Ka7 2. Kc5 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/2B5/2K5/1N6/8/8/8_w_-_-_0_1&moves=Kd6,Ka7,Kc5,Kb8&cursor=0)

White Kc5 Bc6 Nb4; Black Kb8. This is the largest remaining downstream component for seven-diagonal starts, reachable from 120 such placements. Every move is best-policy through three fresh-load repetitions, including Black return history. The four plies contain no shorter repeated placement. The bishop is light-squared and closer to a8 than h1. Loaded at cursor zero with Redo available.

## Artifacts

The final runs below use policy commit c38411a. Earlier intermediate `five-far-bishop` audits in the same output directory predate the priority correction and are not the results reported here.

- Stage 7: `a8e1a8977ccadcf46196b7ea0a1ea3d09e802fc5befcad7bb087f29fc9e9ff2e`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-five-bishop-priority-stage7`.
- Stage 5: `c4fab2c89f6518492eb30f81f2b7592cf41d0993c96ef0a56fc57bbf698584f7`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-five-bishop-priority-stage5`.
- Stage 3: `c4b12fc86eefa52e0c75128da73298c2b2f9e668b106942ca257fb4b14b28635`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-five-bishop-priority-stage3`.
