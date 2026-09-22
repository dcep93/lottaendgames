# Restored last zero-supported-loop policy

Restoration commit: `7613f22`. Application and audit code exactly match checkpoint `e5e2b61` (policy `aae52d2`). Later support restrictions and preference changes were rolled back as a new commit; their historical audit reports remain available. No Git history was rewritten.

All 197 policy/phase tests and the application build pass; hosting deployment succeeded. A fresh independent census was run for each supported-diagonal cohort, sequentially with four workers maximum. Each census classified all 13,660,584 placements. Every tied best move and Black return history was followed through smaller diagonals and loss of support, until mate, capture, stalemate, or repetition.

| Starting diagonal | Supported starts | Directly on loops | Can reach loops | Can reach mate | Can reach capture/stalemate |
| --- | ---: | ---: | ---: | ---: | ---: |
| 7 | 134,144 | 0 | 0 | 131,376 | 2,784 |
| 5 | 13,576 | 0 | 0 | 12,608 | 968 |
| 3 | 2,548 | 0 | 0 | 2,004 | 544 |

All three loop gates pass, reproducing the checkpoint. Zero loops does not mean forced mate: capture/stalemate branches remain. Outcomes may overlap across tied branches. Black follows the app policy, not arbitrary legal defense; clocks and draw claims are excluded. Unsupported starts unreachable from these supported cohorts were not included as roots in this verification.

There is no loop to load from these cohorts. Verified every move in this best-policy mating continuation, retaining Black return history:

[Kb5 Kb8 Kb6 Ka8 Nf6 Kb8 Nd7+ Ka8 Bb7#](http://localhost:5173/mate/bishop-knight#fen=8/k7/B1K5/3N4/8/8/8/8_w_-_-_0_1&moves=Kb5,Kb8,Kb6,Ka8,Nf6,Kb8,Nd7%2B,Ka8,Bb7%23&cursor=0).

## Fresh artifacts

- Stage 7: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-restored-zero-stage7`; fingerprint `7e6bb9cc8cf192dd9161458d92f6ff3d819450ce1a131925a0a51f02a671a082`.
- Stage 5: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-restored-zero-stage5`; fingerprint `18faf1be8c0c108671911eea259e21edaf49f8bf55cc1dbfd4ca08a20e86d122`.
- Stage 3: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-restored-zero-stage3`; fingerprint `164d4635e0ab93baddd7d2ece820005c452584d97fc5ec831470bde626843954`.
