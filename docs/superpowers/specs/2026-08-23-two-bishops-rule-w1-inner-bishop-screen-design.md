# Two Bishops Rule W1 Inner-Bishop Screen Design

## Goal

Update Rule W1 to read:

> **rule w1** — Phase 2: Prefer king proximity to the square a knight's move from Black's corner, unless it screens the inner bishop.

Rule W1 must prefer proximity without placing White's king between the inner-wall bishop and the Black-side square that bishop controls.

## Screening Geometry

Rule W1 continues to evaluate the resulting position and its tightest valid Phase 2 wall. For each such wall:

- `wallBishops[0]` is the inner-wall bishop.
- `wallSquares[0]` is the Black-side square on the inner wall.
- A White king screens the inner bishop only when it lies strictly between those two squares on their shared diagonal.

A king on the same diagonal but outside that segment does not screen the bishop. The screening rule applies even if the wall remains temporarily functional because Black cannot exploit the obstruction on the current move.

## Scoring

Rule W1 compares moves in this order:

1. Prefer a resulting tightest Phase 2 wall in which White's king does not screen the inner bishop.
2. Among equally unscreened moves, retain the current squared-Euclidean distance to the square a knight's move from Black's wall corner.

If multiple tied tightest walls exist, a move is unscreened when at least one tied wall interpretation is unscreened. This avoids rejecting a position solely because of a duplicate or alternative screened interpretation.

Rule W1 remains restricted to positions that start in Phase 2.

## UI and Verification

Training Info uses the requested text exactly. Tests cover the strict between-squares test, a same-diagonal square outside the segment, distance tie-breaking among unscreened moves, Phase 1 exclusion, and rotations/reflections. After implementation, a verified loop is loaded at `cursor=0` with every White reason and Black reply classification checked.
