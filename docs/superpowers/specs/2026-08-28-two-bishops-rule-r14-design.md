# Two Bishops Rule r14 Design

## Goal

Add rule r14: when both bishops occupy their Phase 2 diagonals, use a bishop
to control the square adjacent to Black's king that would be in opposition to
White's king.

For `8/1k2B3/8/1BK5/8/8/8/8 w - - 4 3`, the target square is c7 and `Bd6`
must be uniquely preferred.

## Design

Rule r14 is ordered after r13 and before r15. It applies when the starting
bishops occupy the exact Phase 2 diagonals. Black does not need to occupy a
Phase 2 edge square.

The scorer enumerates squares adjacent to Black's king and retains those that
are on the same rank or file as White's king with exactly one square between
them. A move scores best when at least one resulting bishop has an unobstructed
diagonal attack on one of those opposition squares. Only bishops count as
controlling the target.

The implementation derives the geometry from the board, so rotations and
reflections require no orientation-specific lookup data.

## Verification

Add a regression requiring `Bd6` as the unique best move in the supplied FEN
and repeat it across every board symmetry. Run the focused Two Bishops test
suite, then the cached exhaustive early-exit loop search.
