# Two Bishops Near-Corner Target

## Objective

In Phase 2, make Black's occupied corner or immediately adjacent corner the target corner before applying any strategic target heuristic.

## Target Selection

- Calculate the target from the position after White's candidate move, as before.
- If Black is in a corner, that occupied corner is the target.
- Otherwise, if Black is one square along its edge from a corner, that adjacent corner is the sole target.
- Give this positional target a neutral strength score so every White candidate uses the same target; compare moves by their actual forced progress afterward.
- Only when Black is farther from both corners may corner-diagonals, bishop-side, and king-race selection run.

## Symmetry and State

Use only the current board. Derive adjacency from Black's edge and the board corners, making the behavior D4-symmetric without orientation-specific cases.

## Presentation

Prepend the existing target-corner note with the near-corner rule. No new visible priority or diagram is needed.

## Verification

- In `8/8/8/8/8/8/3B1K1k/3B4 w - - 2 2`, `Bg4` must be uniquely recommended by `sequester` with `h1` fixed as the target.
- Run the same assertion through all D4 transforms.
- Verify `Be1` and `Bc1` cannot switch the target to the opposite corner by creating a stronger bishop majority.
- Preserve the existing corner and more-distant target tests.
- Run focused Two Bishops and affected presentation tests, TypeScript, diagram freshness, and diff checks.
- Find and load the next loop whose entire cycle remains in Phase 2.

## Assumptions

- “Adjacent” means the single neighboring square along Black's current edge, not diagonal or inward adjacency.
- This positional target overrides all target-selection heuristics, but it does not itself choose a White move.
