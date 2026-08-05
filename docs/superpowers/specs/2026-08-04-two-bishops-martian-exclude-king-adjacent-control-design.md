# Two Bishops Martian Excludes King-Adjacent Control

## Goal

Update the visible Phase 1 rule to:

> Phase 1: When the kings are 2 steps apart, place the bishops on adjacent diagonals controlling maximum squares around the black king but not checking or adjacent to white's king.

“Adjacent to White's king” modifies the controlled squares being maximized. It
does not constrain the bishops' own squares.

## Activation and structure

Keep the current activation gate: the starting position is Phase 1 and the
starting kings are exactly two Chebyshev king steps apart. Continue evaluating
the position after White's move.

The first Martian subpriority remains unchanged. Prefer resulting bishops that
are orthogonally adjacent and a resulting position that does not check Black's
king. As before, any White move may preserve or establish that structure.

## Eligible surrounding control

Enumerate the on-board squares in Black's eight-square neighborhood after
White's move. Before counting bishop control, discard every square exactly one
Chebyshev step from White's resulting king, including diagonal adjacency.

Among the remaining squares, count the distinct squares controlled by either
bishop along a clear diagonal ray. A square controlled by both bishops counts
once, and a bishop's occupied square is not controlled. Maximize this count
among survivors whose adjacent, nonchecking structure qualifies.

Use White's resulting king square. A king move can therefore change which ring
squares are eligible during the same result-position calculation.

## Alternatives considered

Disqualifying bishops adjacent to White's king would change the formation
instead of the requested control set. Filtering relative to White's starting
king would make king-move candidates use stale geometry. Filtering the
resulting ring squares directly is the smallest interpretation that matches the
clarification.

## Presentation and diagram

Keep the exact Martian diagram FEN and arrow:

`8/4B3/4B2k/8/7K/8/8/8 w - - 0 1`

After the arrow `e6` to `f7`, only `g6` remains an eligible controlled square.
Remove highlights `g5` and `h5` because both are adjacent to White's king on
`h4`. Update the caption to say the adjacent bishops maximize eligible control
without checking or controlling White-king-adjacent squares.

## Symmetry and verification

The exclusion uses relative Chebyshev geometry and must remain invariant under
translation, rotation, and reflection. Tests must prove that the supplied
result counts only `g6`, that `g5` and `h5` are excluded, that king moves use
the resulting White king, and that the existing adjacent/nonchecking gate and
Phase 2 inactivity remain intact.

Run focused Two Bishops and presentation tests, diagram reproducibility, lint,
build, and `git diff --check`. Then find a fresh exact Phase 1 repetition under
the current policy, treating entry into Phase 2 as termination, and open and
replay it on the isolated port 5174 server.
