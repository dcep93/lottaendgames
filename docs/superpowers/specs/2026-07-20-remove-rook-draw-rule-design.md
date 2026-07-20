# Remove the Rook draw rule and expose a loop

## Goal

Remove the visible `avoid draws` Rook priority and all runtime certificate
machinery that supports it. Keep the remaining human-facing Rook rules in
exact evaluator order, then find and report one minimal Rook loop produced by
the resulting geometric policy.

## Scope

- Remove `avoid draws` from Rook scoring, comparisons, guide copy, reasons,
  tests, and runtime imports.
- Delete the generated draw-risk key data and its generator script; neither is
  useful once the runtime rule is gone.
- Keep `rook escape` and all other geometric priorities unchanged.
- Update focused tests to describe the unguarded policy honestly. Do not claim
  exhaustive loop freedom or a sub-100-ply bound after removing the guard.

## Loop report

Run the exhaustive symmetry SCC diagnostic and select one shortest cycle at
its cycle boundary, with no irrelevant prefix. Confirm the witness in a
playable identity orientation. Return one localhost Rook URL containing:

- the cycle-boundary starting FEN; and
- every explicit White and Black move needed to return to that position.

The URL must load replay history so Undo and Redo can traverse the loop.

## Verification

- The Rook guide and evaluator contain no `avoid draws` rule.
- Runtime source contains no generated draw-certificate dependency.
- Focused rule, session, lint, and build checks pass after their expectations
  are updated for the unguarded policy.
- The exhaustive diagnostic reports at least one cycle and supplies the
  minimal witness used in the localhost URL.
