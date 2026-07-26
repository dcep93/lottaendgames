# Keep White's king outside the Queen cage

## Goal

Do not recommend a Queen cage that encloses White's king.

## Rendered rule

**corner cage** — Confine Black in the narrowest queen-to-corner box without
enclosing White's king: shorter side first, then longer side. The box must have
at least 2 safe squares.

## Geometry

Use two aligned views of the same queen-to-corner box:

- Black's safe-square area remains the open rectangle beyond the Queen's rank
  and file.
- White-king containment uses the closed rectangle and includes the Queen's
  rank/file wall toward the corner.

White's king is enclosed when its resulting square is inside that closed
rectangle. Do not change the box dimensions, Black safe-square definition, or
corner selection.

## Selection mechanics

Within the visible `corner cage` priority:

1. Prefer resulting cages that do not enclose White's king.
2. Prefer cages with at least two safe squares.
3. Minimize the shorter side.
4. Minimize the longer side.

If every surviving move encloses White's king, they remain tied on the first
comparison and the remaining displayed comparisons still apply. This keeps the
selector total without adding a hidden override.

## Verification

- Assert the exact rendered copy.
- Assert the Queen wall counts as inside for White-king containment but not as a
  Black safe square.
- Assert a resulting White-king square in the existing cage receives the
  penalty.
- Assert `Qb5` is rejected after `Qc4 Ka1` because White's king on `b4` lies on
  the cage wall.
- Assert an otherwise competing outside-cage result is preferred.
- Preserve D4 rotation/reflection symmetry.
- Run the Queen-focused tests and exhaustive Queen verifier. Report any cycle
  without adding another rule.
