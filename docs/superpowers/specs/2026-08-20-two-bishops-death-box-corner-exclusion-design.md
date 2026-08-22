# Death Box Corner Exclusion Design

## Rule

> **death box** — When possible, place a bishop in opposition with a king on the edge, next to a bishop that is a knight's move from the Black king, but not a knight's move from the corner.

The bishop placed in opposition must not be a knight's move from the corner nearest Black's king. All existing edge, opposition, Black-king knight-distance, and bishop-adjacency behavior remains unchanged.

## Verification

Add a focused corner-exclusion regression, retain the non-corner geometry regression, compile TypeScript, and load a verified local loop at `cursor=0`.
