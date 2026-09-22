# r9.1: king defense for an attacked bishop

r9.1 now activates whenever Black attacks the bishop before White moves, including already defended bishops. It first prefers resulting king defense, with all such outcomes tied. Otherwise it maximizes the bishop's Euclidean distance from Black. Knight defense alone does not satisfy this preference. Earlier rules retain their priority.

The loaded line now selects 2. Kd3 from `8/8/8/4k3/4B3/8/2KN4/8 w - - 2 2`, rather than bishop escape. Regression coverage checks all eight board symmetries, existing defense, fallback distance, and the inactive trigger. All 211 bishop-and-knight tests passed; the production build passed.

## Exhaustive continuation audit

Command: `npm run audit:unsupported -- --scope supported --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-r91-defense --workers 4 --gate loops`.

The census classified 13,660,584 physical placements and selected 23,340 supported post-White starting placements. It followed every tied best move and Black's return history through loss of support, stopping at mate, capture, or stalemate. The policy fingerprint was `02b151e2883aef8ce44791d54ac79c6faeeaa9ea1a168e0a3599b545655bc8c5`, based on parent commit `b622a69` plus the uncommitted rule change. The explanatory r9.1 note was subsequently synchronized without changing behavior.

| Outcome | Supported starts | Percentage |
|---|---:|---:|
| Directly on a cycle | 16 | 0.0686% |
| Can reach a cycle | 32 | 0.1371% |
| Can reach mate | 22,052 | 94.4816% |
| Can reach capture or stalemate | 1,280 | 5.4841% |

There are two cyclic components, 3,833 history states and 3,887 transitions. Relative to the preceding r10 audit, reachable-loop starts remain 32, while directly cyclic supported placements increased from zero to 16. Outcomes can overlap through different tied branches. The loop gate therefore fails; this is not a zero-loop or forced-mate claim. Black follows app policy, and clocks/repetition claims are excluded.

## Loaded minimal loop

[1. Kc4 Kb6 2. Kd5 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/k2K4/1N6/8/8/8_w_-_-_0_1&moves=Kc4,Kb6,Kd5,Ka5&cursor=0).

This four-ply loop is a rotation of the largest component's witness (24 supported starts can reach it). Every move was checked against the production policy for two laps, retaining Black's return history. Replay encoding and decoding passed, and the board was loaded at cursor zero with Redo enabled.
