# Two Bishops: sequester before opposite wall

## Goal

Run the complete sequester block before Phase 2 wall construction, then define the wall relative to Black's king and the target corner.

## Priority order

The affected visible priorities become:

1. **sequester**
2. **bishops away**
3. **phase 2 wall**

All other priorities keep their current relative order. `bishops away` remains immediately below `sequester` as its separately rendered bishop-move tie-break.

## Phase 2 wall

Render:

> **phase 2 wall** — Phase 2: Create or maintain a 2 square wall adjacent to Black's king and opposite the target corner, without placing a bishop on black's edge.

For Black on an edge, a candidate wall is the adjacent edge square plus its adjacent inward square. The wall opposite the target corner is the candidate whose edge square is one step farther along Black's edge from the target corner than Black's current square. When Black occupies the target corner, either wall extending away along one of the corner's two incident edges is valid. Both wall squares must be controlled by different bishops through clear lines, and neither bishop may stand on Black's edge.

The current-board target-corner definition remains unchanged and is fixed before candidate White moves are compared.

## Verification

- Assert rendered order `sequester`, `bishops away`, `phase 2 wall` and exact copy.
- Add D4 fixtures proving the valid wall is adjacent to Black, farther from the target corner, and off Black's edge.
- Reject a wall toward the target corner and any wall requiring a bishop on Black's edge.
- Run focused Two Bishops rules, directly affected presentation, TypeScript, diagram consistency, diff checks, and the small fail-fast loop search.
