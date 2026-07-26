# Strict between-kings Rook walls

## Goal

Count a Rook wall as a box boundary only when the wall's rank or file lies
strictly between White's king and Black's king.

## Geometry

For each axis, require:

```text
min(White king, Black king) < Rook < max(White king, Black king)
```

A Rook sharing a rank or file coordinate with either king does not create a
wall on that axis. This is a board-only definition and applies identically to
box scoring, phase classification, waiting moves, and explanations.

Do not add move-aware exceptions. A King moving onto a Rook wall and a Rook
moving onto a King's coordinate produce the same resulting geometry.

## Expected line

From `8/8/8/6K1/6R1/7k/8/8 w - - 2 2`:

1. `Ra4` retains the strictly-between rank wall and satisfies `waiting move`.
2. After `...Kh2`, `Ra3` shrinks that rank box from size 3 to size 2.
3. `Rg4` does not create a file box because the Rook and White's king share the
   g-file.

## Verification

- Assert shared King/Rook coordinates do not produce cuts.
- Assert strict geometry is invariant under all eight board symmetries.
- Assert the exact `Ra4 Kh2 Ra3` recommendations and reasons.
- Run the focused Rook tests.
- Run the exhaustive Rook verifier and report its next minimal loop or clean
  result without adding another rule.
