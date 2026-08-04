# Two Bishops Phase 2 Wall Target-Corner Exclusion

## Goal

Align `phase 2 wall` with the rendered rule:

> **phase 2 wall** — Phase 2: Create or maintain a 2 square wall not on the same side as the white king nor in the target corner, without placing a bishop on black's edge.

The supplied position must uniquely recommend `Bf7` under `phase 2 wall`. After `Bf7`, the bishops control the `g8`/`h8` wall while the board-derived target corner is `h1`.

## Design

- Continue generating wall candidates on the side of Black opposite White's king.
- Allow the wall candidate on the side away from White's king even when its edge square is a board corner.
- The target corner is on the opposite side of Black's edge from this wall. In the supplied position, the wall is `g8`/`h8`, so the target corner is `h1`.
- Continue requiring both bishops to control the two wall squares and requiring neither bishop to occupy Black's edge.
- If no candidate move creates or preserves a qualifying wall, the priority does not manufacture an edge-clearing fallback.

## Verification

- Add the supplied `Bf7` position as an exact semantic regression and check all D4 transforms.
- Retain focused coverage for Phase 1 inactivity, bishops on Black's edge, and positions with no qualifying wall.
- Replace the blanket “corner walls are invalid” regression with coverage proving that a corner wall opposite the target corner is valid.
- Run the focused Two Bishops rule tests, relevant presentation test, TypeScript check, diagram consistency check, diff check, and the fail-fast Two Bishops loop search.
