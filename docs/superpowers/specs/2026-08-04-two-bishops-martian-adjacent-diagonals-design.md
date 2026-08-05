# Two Bishops Martian Adjacent-Diagonals Step

## Goal

Replace the contiguous-run version of the Phase 1 `martian conclave step` with this rule:

> Phase 1: When the kings are 2 steps apart, place the bishops on adjacent diagonals controlling maximum squares around the black king but not checking.

In the supplied position, the rule must select `Bf7`, not a checking move and not the lower-control `Bf6` arrangement.

## Activation

Martian applies only when the starting position is Phase 1 and the starting kings are exactly two Chebyshev king steps apart. Candidate scoring still uses the position after White's move.

If no surviving candidate produces the required adjacent, nonchecking bishop structure, Martian leaves the survivor set unchanged.

## Resulting bishop structure

First prefer candidates whose resulting bishops are orthogonally adjacent: same file on consecutive ranks or same rank on consecutive files. With the normal opposite-colored bishops, this places them on neighboring diagonals.

The resulting position must not check Black's king. Checking candidates do not satisfy the structure even if they control more surrounding squares.

Evaluate every White move by its result rather than requiring a bishop move. A king move may retain an already-correct structure, but it cannot beat a candidate that produces more surrounding control.

## Maximum surrounding control

Once every survivor has adjacent bishops and does not check, maximize the number of distinct on-board squares in Black king's eight-square neighborhood that are reached by at least one bishop along a clear diagonal ray.

Count the union of controlled squares, so control by both bishops counts once. Do not exclude a square merely because it is adjacent to White's king; that exclusion belonged to the replaced rule and would prevent the supplied position from distinguishing `Bf7` from the lower-control alternatives. A bishop's own occupied square does not count as controlled.

This maximum is comparative among the current survivors. There is no fixed minimum and no contiguity requirement.

## Priority and scoring

Keep `martian conclave step` after `reverse conclave step` and before `finish wall`. Replace the old run-length and bishop-distance fields with:

- a starting-position applicability flag;
- a resulting adjacent-and-nonchecking structure penalty; and
- a resulting controlled-square count.

Expose two ordered subpriorities under the one visible Martian rule: structure qualification first, then descending controlled-square count when all survivors qualify.

## Supplied diagram

Use the exact supplied starting FEN:

`8/4B3/4B2k/8/7K/8/8/8 w - - 0 1`

The generated Phase 1 diagram must draw an arrow from `e6` to `f7` and highlight `g5`, `g6`, and `h5`. Its caption must explain that the resulting adjacent bishops maximize surrounding control without checking.

## Symmetry and scope

All geometry is relative, so translation, rotation, and reflection must preserve the recommendation. Phase 2 behavior is unchanged.

## Verification

Tests must prove:

- the supplied position uniquely recommends `Bf7` with reason `martian conclave step`;
- `Bf7` has adjacent bishops, does not check, and controls three surrounding squares;
- `Bf6` controls only two surrounding squares and loses;
- checking alternatives are rejected before controlled-square maximization;
- nonadjacent alternatives do not qualify even when they control as many squares;
- White-king-adjacent controlled squares count;
- the rule gates on starting kings exactly two steps apart and remains inactive in Phase 2;
- result-position scoring, translation, and all D4 transforms remain correct;
- the generated diagram uses the supplied FEN, arrow, highlights, and Phase 1 label; and
- focused tests, diagram consistency, lint, TypeScript, and diff checks pass.

After implementation, find a fresh strict Phase 1 exact-repetition loop under the current policy. Entering Phase 2 terminates the search. Open and verify the replay on the isolated port 5174 server in the Codex browser.
