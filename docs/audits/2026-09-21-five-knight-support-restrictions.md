# Five-knight support restrictions and continuation audit

Policy commit: `9afed08`. A five-diagonal with its five-knight is unsupported when White's king shares the bishop's color, or when the bishop is on a4 (including all board reflections). These restrictions also constrain older declared five-diagonal placements. Nd3 support and three-/seven-diagonal eligibility retain their separate conditions. All 198 relevant tests and the application build pass.

The loaded `1. Bb5+` from `8/8/k1K5/3N4/B7/8/8/8 w - - 0 1` now produces an unsupported position. Confirmed in the refreshed UI as phase 1.

## Exhaustive continuation results

Each stage independently enumerated all 13,660,584 legal placements without a reused root cache. All best-policy ties are followed through smaller diagonals and loss of support, retaining Black return history, until mate, capture, stalemate or a cycle. Counts include reflections. Outcomes can overlap; Black follows the application's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

| Starting diagonal | Supported starts | Directly on loops | Can reach loops | Can reach mate | Can reach capture/stalemate |
| --- | ---: | ---: | ---: | ---: | ---: |
| 7 | 134,144 | 0 | 130,888 (97.5728%) | 568 | 2,784 |
| 5 | 11,544 | 160 | 9,696 (83.9917%) | 1,120 | 960 |
| 3 | 2,548 | 0 | 16 (0.6279%) | 1,988 | 544 |

All three loop gates fail. The previous policy had zero reachable loops in these cohorts. The stricter support definitions alter move selection and reintroduce downstream loops; no additional preferences were changed to conceal that consequence. Zero direct seven-/three-diagonal loop membership does not mean their continuations are loop-free.

## Loaded minimal loop

[1. Kd6 Kb7 2. Ke7 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k3K3/8/1B1N4/8/8/8/8_w_-_-_0_1&moves=Kd6,Kb7,Ke7,Ka7&cursor=0)

White Ke7, Bb5, Nd5; Black Ka7. This is an a8-aligned reflection of a dominant downstream component reachable from 128,048 supported-seven starts. Every move was verified as best-policy over three repetitions from a fresh load. The four-ply cycle has no intermediate repeated placement. Loaded at cursor zero with Redo available.

## Reproduction

Policy bundles were created before the commit, so manifests record preceding HEAD `e5e2b61`. Their fingerprints identify the actual edited code:

- Stage 7: `c2156e4d77855964633ca2a8566eeb0a22bd102ead341067b315969fc96c5136`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-knight-restrictions-stage7`.
- Stage 5: `95b5001e0fa10a3f8ca780fa7c1c770b54778e0a67197adb4a2a941605a13710`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-knight-restrictions-stage5`.
- Stage 3: `baf4e391c6519301340d4d4a1b990b1503831066b497e29aae459d6e35d69d79`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-knight-restrictions-stage3`.
