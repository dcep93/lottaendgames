# Death Box

## Design

Add `death box` immediately before `king closer` in both phases. It applies only when at least one legal White move can complete the entire pattern: Black's king is on an edge, one bishop is in two-square orthogonal opposition to Black's king, the other bishop is a knight's move from Black's king, the bishops are adjacent, and both bishops are in the middle 16 squares (`c3–f6`). Prefer exactly the moves that complete that pattern.

Rendered text: "When possible, place a bishop in opposition with a king on the edge, next to a bishop that is a knight's move from the Black king."

## Verification

Require `Bf4` in the supplied position and all rotations and reflections, reject otherwise-complete boxes outside `c3–f6`, run focused tests, and verify a local loop at `cursor=0`.
