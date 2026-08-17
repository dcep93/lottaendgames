# Two Bishops Rule W File Intersection Design

## Scope

Tighten Rule W's flank-diagonal geometry without changing its rendered text.

## Geometry

A Rule W flank diagonal for a two-diagonal-step king geometry must intersect Black's file at an on-board square. A diagonal that reaches Black's file only beyond the board is not a flank diagonal. Knight-step Rule W geometry keeps its established rotation-invariant construction.

Apply this requirement to both diagonals in every candidate two-step Rule W pair. If either diagonal misses Black's file on the board, discard the pair before scoring full or partial Rule W credit.

In the supplied position, the c4-f1 diagonal reaches the g-file below the board. Therefore the pair created by `Bc4` is invalid and `Bc4` receives no Rule W preference.

## Verification

- Assert `Bc4` does not activate or satisfy Rule W in the supplied Phase 1 position.
- Cover translations and the file-preserving rotations and reflections of the position.
- Preserve Rule W examples whose two diagonals intersect Black's file on the board.
- Keep the rendered Rule W text and diagram unchanged.
