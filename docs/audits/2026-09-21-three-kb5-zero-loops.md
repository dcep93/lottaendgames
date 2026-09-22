# Kb5 declaration eliminates the remaining supported-continuation loop

Policy commit: `aae52d2`. With White Kc6, Ba6 and Nd5 against Black Ka7, r2.5 now prescribes Kb5, including all reflections and ignoring move counters. r1.5 stays higher priority; support classification is unchanged. All 197 relevant tests and the application build pass; deployment succeeded.

## Exhaustive continuation results

Each stage independently enumerated and classified all 13,660,584 legal placements with no reused root cache. Every best-policy tie is followed through smaller diagonals and loss of support, retaining Black return history, to mate, capture, stalemate or a cycle. Counts include reflections; outcomes can overlap. Black follows the application policy rather than arbitrary legal defense; clocks and draw claims are excluded.

| Starting diagonal | Supported starts | Directly on loops | Can reach loops, before → after | Can reach mate | Can reach capture/stalemate |
| --- | ---: | ---: | ---: | ---: | ---: |
| 7 | 134,144 | 0 | 56 → 0 | 131,376 | 2,784 |
| 5 | 13,576 | 0 | 176 → 0 | 12,608 | 968 |
| 3 | 2,548 | 0 | 28 → 0 | 2,004 | 544 |

All three loop gates pass: no cycles remain reachable from any supported seven-, five- or three-diagonal start. This achieves the supported-loop elimination objective under the audited application policy. It does not establish forced mate: capture/stalemate branches remain. Unsupported starts not reachable from the supported cohorts were not audited as roots this turn.

## Loaded continuation

There is no remaining loop witness in these cohorts. The requested position instead has this verified best-policy mating line:

[Kb5 Kb8 Kb6 Ka8 Nf6 Kb8 Nd7+ Ka8 Bb7#](http://localhost:5173/mate/bishop-knight#fen=8/k7/B1K5/3N4/8/8/8/8_w_-_-_0_1&moves=Kb5,Kb8,Kb6,Ka8,Nf6,Kb8,Nd7%2B,Ka8,Bb7%23&cursor=0). Loaded on localhost at cursor zero with Redo available.

## Reproduction artifacts

Final code was bundled before the policy commit, so manifests record preceding HEAD `fabcb4e`. Fingerprints identify the audited policy bundles:

- Stage 7: `7e6bb9cc8cf192dd9161458d92f6ff3d819450ce1a131925a0a51f02a671a082`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-three-kb5-stage7`.
- Stage 5: `18faf1be8c0c108671911eea259e21edaf49f8bf55cc1dbfd4ca08a20e86d122`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-three-kb5-stage5`.
- Stage 3: `164d4635e0ab93baddd7d2ece820005c452584d97fc5ec831470bde626843954`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-three-kb5-stage3`.
