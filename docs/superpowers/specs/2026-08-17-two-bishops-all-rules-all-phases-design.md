# Two Bishops All Rules, All Phases Design

## Scope

Make the general Two Bishops strategy priorities evaluate in both Phase 1 and Phase 2. Preserve phase detection and the structural mechanics whose definitions inherently refer to a phase.

## Phase-neutral strategy stack

Rules S, U, and V are the only remaining lettered priorities with explicit Phase 2 exclusions. Remove those exclusions so their existing geometric conditions alone determine applicability. Rule T, Rule WW, Rule W, `central king`, `edge flank`, `king closer`, `unscreen bishops`, and `bishop distance` already evaluate in both phases and remain unchanged.

Do not change rule order, scoring, diagrams, or rendered English. In `8/6B1/8/8/5K1k/3B4/8/8 w - - 30 16`, Rule V evaluates the Phase 2 opposition geometry: the g7 bishop controls the secondary squeeze diagonal and `Bg6` places the other bishop on the matching primary squeeze diagonal, making `Bg6` uniquely correct under Rule V.

## Preserved phase mechanics

Keep phase detection and inherently phase-specific structural rules unchanged. This includes Phase 2 wall construction, shepherding, sequestering, force-Phase-2 scoring, and phase-specific degenerate repairs. “All rules, all phases” applies to the general ordered strategy stack, not to removing the semantic distinction between Phase 1 and Phase 2.

## Verification

- Add the supplied Phase 2 Rule V regression and D4 symmetry coverage.
- Add Phase 2 positive coverage for Rules S and U.
- Replace obsolete assertions that Rules S, U, and V are inactive in Phase 2.
- Preserve existing Phase 1 behavior and prepared-batch equivalence.
- Run the focused rules and presentation suites, lint, build, and diagram consistency check.
- Find and open a strict Phase 1 loop, treating entry into Phase 2 as termination.
