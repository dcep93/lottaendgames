# Two Bishops Death Box Retention

## Design

When the current position already satisfies `death box`, score every legal White move by the resulting position and prefer exactly the moves that preserve the death box. When no death box exists yet, retain the existing behavior: consider bishop moves that establish one.

This makes the rule outcome-based while preserving its current construction semantics. A regression covers `8/8/5B1k/5B2/5K2/8/8/8 w - - 0 1`: `Bc2` must lose to legal moves that keep the bishops on the death-box geometry.

## Verification

- Existing death-box construction, edge, and corner-exclusion tests remain unchanged.
- The supplied loop position prefers retention and rejects `Bc2` at the death-box priority.
