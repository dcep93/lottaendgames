# Exhaustive audit: zero unsupported loops

The updated policy has **no unsupported cycles** in the audited best-move graph. Supported positions are terminal. This is a fresh exhaustive census, not a sample or a recheck of previously known loops.

| Measure | Previous audit | Current audit | Current % of unsupported placements |
| --- | ---: | ---: | ---: |
| Directly on an unsupported loop | 56 | **0** | **0%** |
| Can eventually reach an unsupported loop | 11,936 | **0** | **0%** |
| Not directly on a loop | 13,461,116 | 13,461,172 | 100% |
| Cannot reach an unsupported loop | 13,449,236 | 13,461,172 | 100% |
| Cyclic components | 5 | **0** | — |

All 56 previously cyclic physical placements are no longer cyclic; no new cyclic placements were found. There are no remaining loop archetypes or replay links.

## Scope

The census covered **13,660,584 post-White KBNvK placements** with distinct piece squares and nonadjacent kings, including both bishop colors and all eight rotations/reflections. Of these, **13,461,172 are unsupported** and **199,412 are supported**, unchanged from the previous audit. The graph contains **1,456,731 history-aware states** and **1,441,335 transitions**.

All tied best White moves and tied best Black replies are explored. The graph retains the previous White-turn board because Black's return preference depends on history. Every supported post-White position is terminal, as are mate, stalemate, and minor capture. Clocks and repetition claims are excluded from structural cycle detection. This is a placement census, not a retrograde proof of reachability from an initial game.

Zero loops does **not** mean every position forces mate or support. Branches may end in capture or stalemate, and Black follows the app's best-move policy rather than every legal defense. The audit makes no claim about continuations after reaching support.

| Reachable terminal outcome | Unsupported starts | Share |
| --- | ---: | ---: |
| Support | 10,954,172 | 81.3761% |
| Mate before support | 1,608 | 0.0119% |
| Capture or stalemate | 2,522,112 | 18.7362% |

Outcome categories overlap across tied branches. Support reachability increased by 9,600 starts; mate and capture/stalemate counts are unchanged.

## Validation and provenance

- Optimized worker evaluation matched the unmodified production bundle and direct production history handling on deterministic samples.
- 1,000 random placements were checked under all eight board symmetries.
- Enumeration totals were asserted.
- Strongly connected component analysis and independent sink removal agreed that there are no cycles.
- Independent postprocessing confirmed zero physical and symmetry-distinct placements on cyclic edges.
- All 10 audit-scaffolding tests passed, including a regression test for producing a report when no loop exists. The reporting fix writes `null` to `display-loop.json`; it does not change chess policy.

Policy commit: `827d487823787bb8a3f0d7c14a65cc6edb1733fd`.
Reporting fix: `717d02e`.
Audit fingerprint: `52e35fa5bb8cc30a6609c359fcc2b7068e612aca7897d53a90f9d4770b624c61`.

The companion JSON preserves counts, comparison, manifest, completed-stage timestamps, and independent membership checks. The full immutable graph, executable bundles, and checkpoints remain in:

`/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-five-loop-corrections`

## Reproduction

```sh
cd app
npm run audit:unsupported -- --out /absolute/new/audit-directory --workers 8 --compare /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-r5-loop-prescriptions/result.json
```
