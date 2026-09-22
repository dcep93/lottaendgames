# Bishop placement while the knight approaches five support

Policy commit: `11ea9f2`. For a five-diagonal, when the knight occupies neither the previous-stage seven-support square nor the five-support square, the bishop must occupy b5 or its D4-reflected equivalent. This additional restriction applies before older exact support declarations. Existing Nd3 and Nd5 eligibility rules remain unchanged. Obsolete help notes claiming exact Bc6/Nb4 support were removed.

The loaded Be8 from Ke6/Ba4/Ne3 versus Kc7 is now unsupported. Bd7 is uniquely preferred and supported as the reflected b5 placement. The other race/safety checks still reject Bb5 in that position. All 207 relevant tests and the production build pass; deployment succeeded. The new regression tests cover the loaded move, all reflections, ignored counters, and retained Nd3/Nd5 support.

## Seven-diagonal exhaustive continuation audit

One audit with four workers classified all 13,660,584 legal placements and selected 134,144 supported seven-diagonal post-White starts. Every tied best continuation is followed through smaller diagonals and loss of support, retaining Black return history. Only mate, capture, stalemate and cycles terminate the search. Outcomes can overlap; counts include reflections. Black follows the application policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

| Outcome | Starts |
| --- | ---: |
| Directly on a loop | 8 (0.0060%) |
| Can reach a loop | 128,208 (95.5749%) |
| Can reach mate | 3,920 |
| Can reach capture/stalemate | 2,736 |

The requested Be8 classification is fixed, but loop reachability regresses from 216 to 128,208 starts; direct loop membership rises from zero to eight. Four downstream cyclic components remain. The declared restriction is retained for user review. Five- and three-diagonal starting cohorts were not re-audited, so older results for those cohorts are stale.

## Loaded minimal loop

[1. Ba4 Ka5 2. Bc6 Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k1B5/2K5/8/3N4/8/8_w_-_-_0_1&moves=Ba4,Ka5,Bc6,Ka6&cursor=0)

White Kc5 Bc6 Nd3, Black Ka6. This component is reachable from 127,712 seven-diagonal starts. The four-ply cycle has no intermediate repeated placement. Each move is verified as best-policy through three fresh-load repetitions, including Black return history. Light-squared bishop closer to a8 than h1; loaded at cursor zero with Redo available.

Artifact: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-approaching-five-stage7`. Fingerprint: `cd476fb2c41395f1fb99aaddd569ec7551dda93e0e280ee1b839ec95592e8eae`. Manifest policy commit matches `11ea9f2`.
