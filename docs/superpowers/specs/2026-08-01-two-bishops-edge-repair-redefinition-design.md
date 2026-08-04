# Two Bishops Degenerate Edge-Repair Redefinition

## Goal

Replace the existing exact edge-repair formation with the newly taught screened-bishop pattern while preserving the other degenerate families.

## Canonical Geometry

Use `h1` as the canonical corner; generate every rotation and reflection from the same relative geometry.

- White's king is on `f2`: one step along the edge and two steps inward from `h1`.
- Black's king is on `h1`, `h2`, `h3`, or `h4`: zero through three steps along the edge.
- One White bishop is on any square of the `d1–h5` diagonal: `d1`, `e2`, `f3`, `g4`, or `h5`.
- The other White bishop is on `e1`, on the edge and screened by White's king on `f2`.
- The repair is `e1-d2` (`Bd2`).

## Mechanics

- Keep the existing Phase 2, king-presence, and exactly-two-bishops prerequisites.
- Match the canonical square relationships through corner-relative coordinates, not literal FENs.
- Return the screened bishop and its exact repair target.
- Remove the old `d1-e2` repair behavior.
- Leave the corner waiting-position and bishop-behind-king degenerate detectors unchanged.
- Update the edge-repair training diagram arrow to `e1-d2`.

## Verification

- Test all four Black edge offsets and all five controlling-bishop squares.
- Test every D4 transform.
- Reject nearby nonmatching arrangements.
- Confirm only the screened bishop's exact `Bd2` repair survives the degenerate rule.
- Update generated diagram data and its rule/presentation assertions.
- Run focused degenerate, rule-order/copy, diagram, symmetry, TypeScript, and diff checks.
- Find a current local loop after the policy change.

## Scope

No changes to the other degenerate families, unrelated priorities, full mate suite, exhaustive census, commit, archive synchronization, push, or deployment.
