# Queen Same-Corner Shrink Design

## Goal

Make `corner cage` describe and implement one stable, board-based idea: once the
Queen defines a box toward a corner, Queen moves may only shrink that box toward
the same corner. A move must not switch the target corner merely because the
resulting rectangle is smaller.

## Rendered rule

**corner cage** — Only move the queen to shrink Black’s box toward the same
corner. Keep White’s king outside and leave Black at least two safe squares.

## Geometry

The current target corner is derived from the Queen and Black king:

- Black left or right of the Queen selects the matching file edge.
- Black below or above the Queen selects the matching rank edge.
- If the pieces share an axis, both corners on that axis are compatible until a
  later move selects one.

A Queen move satisfies `corner cage` only when:

1. its resulting box has a target corner compatible with the current box;
2. neither corresponding side of the box grows; and
3. at least one corresponding side shrinks.

Among qualifying Queen moves, compare the resulting shorter side first and the
longer side second. This remains an implementation detail rather than rendered
teaching text.

King moves may preserve the current box and continue to the later rules. The
existing requirements that White’s king remain outside the box and that Black
retain at least two safe squares remain part of `corner cage`.

## Regression

From:

`8/8/8/8/K2k4/8/2Q5/8 w - - 0 1`

the current Queen box points toward `h8`. `Qc6` points toward `h1`, so it must
lose at `corner cage` even though its sorted rectangle dimensions are smaller.
A legal king move may preserve the `h8` box and be selected by the later
king-movement rule.

## Verification

- Unit-test target-corner classification and strict same-corner shrink under all
  board rotations and reflections.
- Regression-test that `Qc6` is rejected at `corner cage`.
- Run the Queen rule, geometry, and presentation tests.
- Run the exhaustive Queen verifier at low priority only when no other verifier
  process is consuming substantial resources.
