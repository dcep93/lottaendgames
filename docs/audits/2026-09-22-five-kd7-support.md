# Exact Kd7 support declaration

Policy commit: `9551f2b`. Kd7/Bb5/Nd5 against Kb7 is a narrow exception to the five-knight king-color exclusion, with all D4 reflections and independent of counters. The ordinary king-distance and bishop-placement restrictions remain. Other same-color placements are still excluded. This support declaration allows the existing r2.5 preference to select Kd7 uniquely; no preference rule or priority was changed. All 200 relevant tests and the build pass; deployment succeeded. The refreshed board selects Kd7 under r2.5 and marks its result phase 2.

## Exhaustive continuation results

Each stage independently classified all 13,660,584 legal placements without a reused root cache. All tied best moves are followed through smaller diagonals and loss of support, retaining Black return history, until mate, capture, stalemate or cycles. Counts include reflections; outcomes can overlap. Black follows the application policy rather than arbitrary legal defense. Clocks and repetition claims are excluded.

| Starting diagonal | Supported starts | Directly on loops | Can reach loops | Can reach mate | Can reach capture/stalemate |
| --- | ---: | ---: | ---: | ---: | ---: |
| 7 | 134,144 | 0 | 2,144 | 129,496 | 2,800 |
| 5 | 11,112 | 192 | 2,192 | 8,176 | 960 |
| 3 | 2,548 | 0 | 0 | 2,004 | 544 |

Compared with the preceding audit, reachable-loop starts decrease from 130,872 to 2,144 for seven-diagonal starts, from 9,480 to 2,192 for five-diagonal starts, and from 16 to zero for three-diagonal starts. The three-diagonal loop gate passes; the seven- and five-diagonal gates still fail. Capture/stalemate remains possible, so loop elimination alone does not establish forced mate.

The previous loaded loop has a verified best-policy mate continuation: `Kd6 Kb7 Kd7 Ka7 Kc7 Ka8 Ba6 Ka7 Bc8 Ka8 Nc3 Ka7 Nb5+ Ka8 Bb7#` from `2k5/8/8/1BKN4/8/8/8/8 w - - 0 1`.

## Loaded remaining minimal loop

[1. Kb6 Kc8 2. Ka7 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/K7/8/1B1N4/8/8/8/8_w_-_-_0_1&moves=Kb6,Kc8,Ka7,Kd8&cursor=0)

White Ka7, Bb5, Nd5; Black Kd8. This is the largest remaining downstream component for supported-seven starts, reachable from 1,696 such placements. The four-ply cycle has no intermediate repeated placement. Every move was verified as best-policy over three repetitions from a fresh load. The bishop is light-squared and closer to a8 than h1. Loaded at cursor zero with Redo available.

## Artifacts

The run began September 21 and completed September 22. Bundles predate the policy commit, so manifests record preceding HEAD `70b13e1`; fingerprints identify the edited policy:

- Stage 7: `0445db92529aa40b5844f68b54758526a82bde00a1a554c7c221e16de4ed08f0`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-kd7-stage7`.
- Stage 5: `6abcb525f888ccb2eac623581aaa96def798c8f44983a04024dbfbf68053b382`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-kd7-stage5`.
- Stage 3: `9a7b10268f20b43e678e8e73df0c5da3216ee9222ae353c4d9140cfb31468e08`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-kd7-stage3`.
