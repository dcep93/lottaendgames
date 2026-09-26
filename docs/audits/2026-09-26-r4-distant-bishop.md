# R4 ensures a distant bishop — 2026-09-26

R4 first prefers a bishop at least two king steps from Black. This is a capped clearance check, not a distance maximization: two steps and greater score equally. It acts only within the existing starting central-four king / middle-16 knight condition. The remaining target, king protection, and bishop central proximity priorities keep their order.

In `Bk6/8/8/3N4/4K3/8/8/8 w - - 0 1`, Bc6 is now the sole preferred move. After Kc8, Nf4 and Ne3 are preferred; Ba8 receives no extra credit for retreating farther. The comparison also rejects moving back into immediate Black-king contact. All eight D4 transforms pass this regression. The displayed rule text matches the requested wording.

The last saved cycle breaks. Replay of all 110 earlier recent cycles and 15,917 older full-audit witnesses finds zero surviving cycles. Five-second mixed discovery started 230 roots, completed 229, and found zero cycles. These are not global totals or proof that no new bishop cycles exist. No verified loops are available for the standing 10-plus-2 examples request. No full audit was run.

Validation: 31 focused tests and production build pass.
