# Three-diagonal king placement preference

Policy commit: `221924b`. Supported three diagonals now equally prefer White’s king on b6 or c7, including all reflections, under r2.5. This is an occupancy preference, not proximity. r1.5 remains higher priority and support classification is unchanged. The loaded second move Kb6 is now uniquely best in all eight orientations. All 196 relevant tests and the application build pass; deployment succeeded.

## Fresh exhaustive continuation audits

Each stage independently classified all 13,660,584 legal placements. All tied best-policy moves are followed through support changes, including loss of support, with Black return history, until mate, capture, stalemate or a cycle. No root cache was reused. Counts include reflections. Black follows the application policy rather than arbitrary legal defense; draw claims and clocks are excluded.

| Starting diagonal | Starts | Directly on a loop | Can reach a loop | Can reach mate | Can reach capture/stalemate |
| --- | ---: | ---: | ---: | ---: | ---: |
| 7 | 134,144 | 0 | 0 | 131,376 | 2,784 |
| 5 | 13,576 | 0 | 0 | 12,608 | 968 |
| 3 | 6,756 | 16 | 72 | 5,892 | 792 |

Seven- and five-stage loop gates pass. Three-stage cyclic components fell from two to one; direct loop membership fell from 32 to 16 (0.2368% of three-diagonal starts), and starts that can reach a loop fell from 192 to 72 (1.0657%). The eliminated family accounts for 120 starts, all now able to reach mate. Terminal outcomes can overlap; capture/stalemate branches remain, so zero loops would not establish forced mate.

## Remaining minimal loop

[Kd7, Ba6, Nb5 vs Kb8: Bc8 Ka8 Ba6 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/3K4/B7/1N6/8/8/8/8_w_-_-_0_1&moves=Bc8,Ka8,Ba6,Kb8&cursor=0). Verified as best-policy moves for three repetitions from a fresh load, including share decoding; loaded with Redo enabled. The light bishop is closer to a8 than h1.

## Reproduction artifacts

The audits bundled the final policy before its commit, so manifests record the preceding HEAD `8eac781`. These are the source fingerprints of the audited bundles:

- Stage 7: `0bc42e86254af9c0fa7773ec8eb29bb48a6b35b151a6960bfd5bdfc15a379469`; artifacts `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-three-king-stage7`.
- Stage 5: `e8dbd77759e254dc7220b79d1267d33b1c342a64bf12bd032e13124da86cb5aa`; artifacts `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-three-king-stage5`.
- Stage 3: `a8a5856d795155112c2371f515d7d0d974d9d25d4975759632df9ae5bd81fa41`; artifacts `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-three-king-stage3`.
