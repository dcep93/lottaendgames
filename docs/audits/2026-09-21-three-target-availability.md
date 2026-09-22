# Three-diagonal knight targets require Kb6 or Kc7

Policy commit: `cc7dea7`. For the a6–c8 three-diagonal, only Kc7 exposes b5/c6 targets and Kb6 exposes c6/d7 targets, including reflections. Other king placements have no three-diagonal knight target; Nd5 can still provide previous-stage support. The older Kd7, Kb5 and recorded Kc6 targets are removed. The availability gate also applies before old exact three-diagonal declarations. Existing king-support allowances at b6/c7 and five/seven support checks remain unchanged.

The old Kd7/Ba6/Nb5 loop placements are now unsupported. The loaded starting position chooses Kd6 instead of Bc8. The simpler r2.5 modal text remains unchanged; details are in Notes. All 196 relevant tests and the application build passed, and deployment succeeded. The updated Bf1 regression follows Bf1 Kg1 Kg3 Kh1 Kf2 Kh2 Ng4+ Kh1 Bg2# using best-policy moves.

## Exhaustive continuation audits

Each stage freshly classified all 13,660,584 legal placements without cached roots, then followed all tied best-policy continuations through support changes and loss of support, retaining Black return history, until mate/capture/stalemate/cycle. Counts include reflections and outcomes can overlap. This uses the application Black policy, excludes draw claims and clocks, and is not an arbitrary-defense forced-mate proof.

| Starting diagonal | Supported starts | Directly on a loop | Can reach a loop | Can reach mate | Can reach capture/stalemate |
| --- | ---: | ---: | ---: | ---: | ---: |
| 7 | 134,144 | 0 | 56 | 131,344 | 2,784 |
| 5 | 13,576 | 0 | 176 | 12,496 | 968 |
| 3 | 2,548 | 8 | 28 | 1,976 | 544 |

The three-diagonal population shrank from 6,756 to 2,548, so its before/after percentages have different denominators. Direct loop membership is now 8 (0.3140%), and 28 starts can reach a loop (1.0989%). Five and seven starts remain the same populations, but respectively 176 and 56 starts can now reach the downstream three-diagonal cycle; both were zero before. All three loop gates fail. This tighter support classification does not establish progress to zero loops.

## Remaining minimal loop

[Kc6, Ba6, Nd5 versus Ka7: Bc8 Kb8 Ba6 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/B1K5/3N4/8/8/8/8_w_-_-_0_1&moves=Bc8,Kb8,Ba6,Ka7&cursor=0). All three stages reach this same cyclic component. Nd5 still establishes previous-stage support. The representative was aligned with a light bishop closer to a8 than h1, verified for three repetitions from a fresh load, and loaded on localhost at cursor zero with Redo enabled.

## Artifacts

The final audited bundles were created before the policy commit, so manifests show preceding HEAD `c03d600`. Earlier interrupted audit directories are superseded; only the following completed final bundles support these results.

- Stage 7: `f7ceef8ca6679df5dff49349b59032c8df4a518d21895d669dbc90c5dc520b78`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-three-target-gate-final-stage7`.
- Stage 5: `0670101074d00a10bbad8aaa75ae1a1f6fa604af9ce25c8438da223ac6867c25`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-three-target-gate-final-stage5`.
- Stage 3: `b8bb9639877a3a6e812d44fcd0c71182f817cd3ddd9912e3321b879f9ccb2f1b`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-three-target-gate-final-stage3`.
