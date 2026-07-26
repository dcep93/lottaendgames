# Queen Same-Corner Shrink Design

## Goal

Make `corner cage` describe and implement one stable, board-based idea: once the
Queen defines a box toward a corner, Queen moves may only shrink that box toward
the same corner. A move must not switch the target corner merely because the
resulting rectangle is smaller.

## Rendered rule

**corner cage** — Move the queen to shrink Black’s box toward a fixed corner.
Keep White’s king outside and leave Black at least two safe squares.

“Fixed corner” means the target corner derived from the current board. It does
not introduce move history.

## Geometry

The current target corner is derived from the Queen and Black king:

- Black left or right of the Queen selects the matching file edge.
- Black below or above the Queen selects the matching rank edge.
- If the pieces share an axis, both corners on that axis are compatible until a
  later move selects one.

A Queen move satisfies `corner cage` only when:

1. its resulting box has a target corner compatible with the current box;
2. its resulting shorter side is smaller than the current shorter side; or
3. the shorter sides tie and its resulting longer side is smaller.

This lexicographic comparison permits one side to grow when the other becomes
narrower. It matches the strategic value of confining Black to fewer ranks or
files. The shorter-side-first comparison remains an implementation detail
rather than rendered teaching text.

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

From:

`3k4/8/2Q5/2K5/8/8/8/8 w - - 0 1`

the current `h8` box is `5 × 2`. `Qb7` produces a `6 × 1` box toward the same
corner, keeps White’s king outside, and leaves Black at least two safe squares.
Because the shorter side improves from two to one, `Qb7` must satisfy
`corner cage`.

## Verification

- Unit-test target-corner classification and lexicographic same-corner shrink
  under all board rotations and reflections.
- Regression-test that `Qc6` is rejected and `Qb7` is accepted at
  `corner cage`.
- Run the Queen rule, geometry, and presentation tests.
- Run the exhaustive Queen verifier at low priority only when no other verifier
  process is consuming substantial resources.
