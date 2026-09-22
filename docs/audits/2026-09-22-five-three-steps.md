# Three-step king separation for a five-knight

Policy commit: `a481203`. Five-diagonal support with the knight on d5 now permits kings up to three king steps apart after White moves, including all D4 reflections. Four steps still fails. Other color, bishop-placement, safety and support restrictions are unchanged. The earlier exact Kc5/Bb5/Nd5 versus Kc8 distance exception is redundant and removed; it remains supported under the general rule. The Nd3 previous-stage support conditions are unchanged.

All 206 relevant tests and the production build pass; deployment succeeded. In the loaded Kc5/Bc6/Nb4 versus Kb8 position, 1. Nd5 is now supported and uniquely preferred. The preferred continuation is 1. Nd5 Kc8 2. Kd6 Kd8 3. Bb5 Kc8 4. Ke7 Kb7 5. Kd7 Ka7 6. Kc7 Ka8 7. Ba6 Ka7 8. Bc8 Ka8 9. Nc3 Ka7 10. Nb5+ Ka8 11. Bb7#.

## Seven-diagonal continuation audit

A fresh census classified all 13,660,584 legal placements and selected 134,144 supported seven-diagonal post-White starts. All tied best continuations are followed through smaller diagonals and lost support with Black return history, stopping at mate, capture, stalemate or cycles. Outcomes may overlap and counts include reflections. Black follows the application policy rather than arbitrary legal defense; clocks and repetition claims are excluded.

| Outcome | Starts |
| --- | ---: |
| Directly on a loop | 0 |
| Can reach a loop | 216 (0.1610%) |
| Can reach mate | 131,240 |
| Can reach capture/stalemate | 2,784 |

Loop reachability decreases from 448 to 216. Four downstream cyclic components remain, all five-diagonal bishop shuttles. The loop gate still fails. The five- and three-diagonal starting cohorts were not re-audited this turn; their older totals must not be treated as current.

## Loaded minimal loop

[1. Be8 Kd8 2. Ba4 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/4K3/8/B7/4N3/8/8_w_-_-_0_1&moves=Be8,Kd8,Ba4,Kc7&cursor=0)

White Ke6 Ba4 Ne3, Black Kc7. This largest remaining component is reachable from 72 seven-diagonal starts. Each move was verified as best-policy over three fresh-load repetitions, including Black return history. The four-ply loop has no shorter repeated placement. The bishop is light-squared and closer to a8 than h1. Loaded at cursor zero with Redo enabled.

Artifact directory: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-five-three-steps-stage7`. Fingerprint: `3de7dd7fc8b3f07e254669b47859d4fade350da4917003ce1ae457e15ef10b0b`. The bundle predates the policy commit and records preceding HEAD `f31cc8f`; the fingerprint identifies the edited policy.
