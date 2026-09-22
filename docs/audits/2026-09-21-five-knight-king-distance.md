# Five-knight support requires kings within two steps

Policy commit: `2b98eed`. Five-bishop/five-knight support now requires the kings to be at most two king steps apart after White moves. This also constrains older declared five-knight placements, applies under all board symmetries, and ignores move counters. The existing same-color-king and a4-bishop exclusions remain. Nd3 support keeps its separate conditions.

The requested Ke7–d6 against Ka7 now counts as unsupported (three king steps), verified in the refreshed board as phase 1. Kd6 remains the best move under r10 in that position; support eligibility and move preference are distinct. All 199 relevant tests and the build pass. Policy deployment succeeded.

## Exhaustive continuation audit

Each stage independently classified all 13,660,584 legal placements, without a reused root cache. All tied best moves are followed through smaller diagonals and loss of support, retaining Black return history, to mate, capture, stalemate or cycles. Counts include reflections; outcomes may overlap. Black follows the application policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

| Starting diagonal | Supported starts | Directly on loops | Can reach loops | Can reach mate | Can reach capture/stalemate |
| --- | ---: | ---: | ---: | ---: | ---: |
| 7 | 134,144 | 0 | 130,872 | 568 | 2,800 |
| 5 | 11,104 | 216 | 9,480 | 840 | 960 |
| 3 | 2,548 | 0 | 16 | 1,988 | 544 |

All three loop gates still fail. Compared with the preceding audit, reachable-loop starts decrease from 130,888 to 130,872 for seven-diagonal starts and from 9,696 to 9,480 for five-diagonal starts; three-diagonal starts remain at 16. Direct five-diagonal loop membership increases from 160 to 216, so this change does not uniformly reduce looping.

## Loaded witness

[1. Kd6 Kb7 2. Bd7 Ka6 3. Kc5 Kb7 4. Bb5 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/8/1BKN4/8/8/8/8_w_-_-_0_1&moves=Kd6,Kb7,Bd7,Ka6,Kc5,Kb7,Bb5,Kc8&cursor=0)

White Kc5, Bb5, Nd5; Black Kc8. An eight-ply minimal cycle with no intermediate repeated placement. Each White result is supported and the kings are at most two steps apart. Every move was verified as best-policy through three repetitions from a fresh load. Loaded at cursor zero with Redo available. This witness is reachable from 5,632 supported-five starts and from the remaining looping three-diagonal starts.

## Artifacts

Bundles were created before the policy commit; manifests record preceding HEAD `b8899b2`. Fingerprints identify the edited policy:

- Stage 7: `a10fb4005a7e8da9b772d39402764f207e0d4898870bab84bcb7d4e826acdfc2`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-king-distance-stage7`.
- Stage 5: `5f560a018b73b4fe4298a9fbf29fabd2970c92f8e1e586385895e8702ae6b9b3`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-king-distance-stage5`.
- Stage 3: `d828d8295df7db81783d0c75c119f9264ef6707635c2542a9d698d481e98245b`; `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-21-five-king-distance-stage3`.
