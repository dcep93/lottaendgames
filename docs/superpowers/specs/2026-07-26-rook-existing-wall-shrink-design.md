# Rook Existing-Wall Shrink Design

## Goal

Make `rook box` distinguish shrinking the existing edge-directed box wall from
creating a box against a different board edge.

## Priority

1. When a box exists, prefer moving its current strongest wall inward.
2. When no box exists, prefer creating one.
3. Otherwise, preserve the current strongest wall.
4. A newly created wall toward a different board edge does not count as
   shrinking an existing box.

Later visible rules decide among moves that merely preserve the box.

## Edge Identity

Every cut records the edge toward which Black is confined: north, east, south,
or west. The current box wall is each strongest cut. A direct Rook move shrinks
it only when the resulting position has a smaller cut toward the same edge.

A move preserves the wall when:

- the resulting position still has a cut toward the same edge; and
- that cut has the same size.

If equal strongest walls exist toward multiple edges, shrinking or retaining
any one qualifies. A wall on the same axis but toward the opposite edge is a
different box.

## Checking Squeeze

A checking squeeze shrinks the existing wall only when every legal Black reply
produces a smaller cut toward an edge belonging to a current strongest wall.
Its score remains the largest resulting wall size Black can choose.

## Hanging Shrink

The `waiting move` hanging-shrink trigger uses the same wall-identity test.
Adding a wall toward a different edge does not activate or suppress that
trigger.

## Supplied Position

In `8/2k5/8/4K3/8/8/8/3R4 w - - 14 8`, the d-file wall gives Black a
three-file box.

- `Rd6` retains the west-edge d-file wall and adds a two-rank box toward the
  north edge. It does not shrink the west-edge box.
- `Ke6` retains the d-file wall and wins later at `king closer`.

`Ke6` must be the unique recommendation.

## Verification

- Pin `Ke6` and prove `Rd6` receives no shrink credit.
- Preserve direct same-edge shrink and checking-squeeze fixtures.
- Preserve hanging-shrink waiting fixtures.
- Run focused Rook and geometry tests, D4 symmetry tests, TypeScript, and diff
  checks.
- Run one low-priority exhaustive Rook verifier when no other exhaustive jobs
  are active.
