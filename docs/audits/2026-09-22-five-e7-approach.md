# Five-diagonal approach to e7

Policy commit: `22ee0c1`. The exact Kc5/Bb5/Nd5 versus Kc8 placement is supported as a narrow exception to the two-step king-distance limit, including all D4 reflections. Other support checks remain intact. With a supported five-diagonal and its five-knight, Black on or adjacent to d8 now triggers opposite-bishop-color king placement followed by king-step proximity to e7, before bishop-placement preferences. Reflections include Black near a5 approaching b4. The short r2.5 modal description is unchanged.

All 203 relevant tests and the production build pass. The narrowed geometry test was rerun after removing unasserted cases. Deployment succeeded. The former loop now plays 1. Bb5 Kc8 2. Kc5 Kd8 3. Kd6 Kc8 4. Ke7 Kb7 5. Kd7 Ka7 6. Kc7 Ka8 7. Ba6 Ka7 8. Bc8 Ka8 9. Nc3 Ka7 10. Nb5+ Ka8 11. Bb7#.

## Exhaustive continuation results

Each cohort independently classified all 13,660,584 legal placements without reused root caches. All tied best moves and Black return history are followed through smaller diagonals and loss of support, stopping at mate, capture, stalemate or cycles. Counts include reflections. Outcomes overlap; Black follows the app policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

| Starting diagonal | Supported starts | Directly on loops | Can reach loops | Can reach mate | Can reach capture/stalemate |
| --- | ---: | ---: | ---: | ---: | ---: |
| 7 | 134,144 | 0 | 127,552 | 4,648 | 2,800 |
| 5 | 11,104 | 176 | 5,456 | 5,040 | 952 |
| 3 | 2,548 | 0 | 16 | 1,988 | 544 |

This change fixes the requested example but substantially increases downstream loop reachability: seven-diagonal starts increase from 2,144 to 127,552; five-diagonal starts from 2,184 to 5,456; three-diagonal starts from zero to 16. All three loop gates now fail. These results are retained for review rather than changing the user-declared rule without direction. Loop-free would still not imply forced mate because capture/stalemate branches remain.

## Loaded minimal loop

[1. Kd6 Kc8 2. Ke7 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/4K3/2B5/3N4/8/8/8/8_w_-_-_0_1&moves=Kd6,Kc8,Ke7,Kb8&cursor=0)

White Ke7 Bc6 Nd5, Black Kb8. This downstream five-diagonal cycle is reachable from 127,176 seven-diagonal starts. Its four plies have no intermediate repeated placement. Every move was verified as best-policy through three repetitions from a fresh load, including Black return history. The bishop is light-squared and closer to a8 than h1. Loaded at cursor zero with Redo available.

## Artifacts

Bundles were produced before committing and record preceding HEAD `98d56be`; the fingerprints identify the changed code.

- Stage 7: `838e3fb52c65304992c56975f1ca5305bc1b9474b3deccf457758e155d98da89`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-five-e7-stage7`.
- Stage 5: `9ac0b8253e4471e6f77c5a1cbaaee238ea015ebea885401a5ce9e224efea2523`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-five-e7-stage5`.
- Stage 3: `dc0521d2e501de47873756fdeb98e9cb7223a9db0128b5e83427e7580c2c8dd4`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-five-e7-stage3`.
