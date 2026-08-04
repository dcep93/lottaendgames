# Two Bishops Phase, Edge, and Sequester Priority Order

## Goal

Make reaching or preserving Phase 2 more important than bishop placement, and make moving bishops off the edge more important than sequestering Black.

## Visible and Mechanical Order

After the universal rules and `degenerate`, the strategy order becomes:

1. `mate in 3`
2. `force phase 2`
3. `bishops off edge`
4. `sequester`

The remaining rules keep their current relative order. Reorder the actual visible rule array so selection mechanics, guide order, move reasons, and rendered copy all share this order.

## Force Phase Two Meaning

Keep the current stateless board-derived comparison: prefer moves whose legal Black replies all leave Black's king on an edge. Make the priority active in every position rather than disabling it after the Phase 2 classifier activates. This lets it both force Black to an edge and keep an already-edged Black king there. When no move can achieve edge confinement, all moves tie and the next priority proceeds.

Keep the label `force phase 2`. Update the help text to: `Force Black's king to the edge and keep it there.`

## Non-changes

- Do not alter any score formulas. Change only `force phase 2` activation so its existing edge-confinement comparison always runs.
- Do not alter `mate in 3`, `bishops off edge`, or `sequester` wording.
- Do not add weights, hidden selectors, or duplicate phase policies.
- Preserve the terminal `degenerate — long diagonal` behavior.

## Verification

- Assert the exact visible rule order and rendered help order.
- Update the semantic priority-pipeline tests to apply force Phase 2, bishops off edge, then sequester.
- Add a regression proving a Phase 2 position discards moves that let Black leave the edge before `bishops off edge` or `sequester` runs.
- Run focused Two Bishops tests, affected presentation tests, TypeScript, and diff checks.
- Run the fail-first Two Bishops loop gate and validate one refreshable localhost loop.

Do not run the full mate suite, exhaustive verification, commit, push, or deployment.
