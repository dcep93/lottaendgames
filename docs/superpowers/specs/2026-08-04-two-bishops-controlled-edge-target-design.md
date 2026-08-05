# Two Bishops Controlled-Edge Target Design

## Problem

In `4B3/8/8/8/5B2/2K5/k7/8 w - - 2 2`, the existing non-opposition king-race fallback calls `a8` the target. That makes moves allowing `...Ka3` look acceptable even though the bishop on `e8` already cuts off `a4`, geometrically identifying `a1` as the target corner.

## Design

Calculate the target after each White move as before, but add a higher-priority geometric case for the existing exact `corner diagonals` arrangement before opposition and king-race selection:

1. Match the arrangement's kings and its two diagrammed bishop controls under every D4 symmetry.
2. Treat its controlled edge square two steps from Black as the rear cutoff and select the corner in the opposite direction along Black's edge.
3. If the position is not the exact corner-diagonals arrangement, continue to the existing opposition-majority and king-race fallbacks.

For the witness, `e8` controls `a4`, so `a1` is the target. `Bd6` then controls `a3`, forces `Ka1`, and becomes uniquely correct under `sequester`.

The existing `degenerate — corner diagonals` selector must not block this squeeze. It continues to accept moves preserving both diagrammed controls, and also accepts a move that preserves the two-away edge cutoff while adding control of the intervening edge square. The rendered diagram adds that intervening square so the exception remains mechanically visible.

Within this corner-diagonals target family, `sequester` uses the raw worst Black reply distance as its final tie-break. This rejects a move such as `Bd2` that preserves the cutoff but permits Black to retreat farther without changing unrelated sequester positions.

## Alternatives

- Change only the sequester tie-break: ineffective because the wrong target remains `a8`.
- Let every one-sided two-away bishop cutoff define the target: too broad; it changes unrelated wall and king-race positions.
- Recommended: expose the cutoff meaning already inherent in the exact, visible corner-diagonals pattern.

## Verification

- The witness uniquely recommends `Bd6` and rejects `Bd2`.
- Target and move transform correctly under all D4 symmetries.
- The earlier approved `Bd2` move that establishes missing `a5` control remains correct.
- Existing opposition-majority, wall, and king-race target examples remain unchanged outside corner diagonals.
- The corner-diagonals diagram and selector both express the new cutoff-advance alternative.
- Focused Two Bishops, affected presentation, TypeScript, generated diagrams, and diff checks pass.
