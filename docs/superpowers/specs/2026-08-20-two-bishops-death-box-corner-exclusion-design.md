# Death Box Corner Exclusion Design

## Rule

> **death box** — When possible, place a bishop in opposition with a king on the edge, next to a bishop that is a knight's move from the Black king. Unless Black is in the corner.

Death box is inactive when Black occupies a corner before White moves. All existing opposition, knight-distance, bishop-adjacency, and non-corner edge behavior remains unchanged.

## Verification

Add a focused corner-exclusion regression, retain the non-corner geometry regression, compile TypeScript, and load a verified local loop at `cursor=0`.
