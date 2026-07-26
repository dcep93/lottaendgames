# Queen knight-placement short-move tie-break

## Goal

Prefer a shorter Queen move only when choosing among multiple moves that leave
the Queen a knight's move from Black and off the edge.

## Rendered rule

**knight's move away** — Keep the queen a knight's move from Black without
moving onto the edge, preferring shorter moves.

The short-move tie-break is rendered as a clause of the same rule, not as a
separate priority.

## Selection mechanics

Within `queen a knight's move away`:

1. Prefer moves whose resulting Queen is a knight's move from Black and off the
   edge.
2. If every remaining move satisfies that placement and at least two of those
   moves move the Queen, prefer the Queen move that traverses fewer squares.
   Tied King moves remain untouched.
3. If no remaining move satisfies the placement, do not compare Queen travel
   distance. Let the later displayed rules decide.

The tie-break uses only the current board and candidate moves. It does not add a
hidden selector or a separate explanation reason.

## Verification

- Assert the exact rendered copy includes the short-move clause.
- Assert two qualifying placements prefer the shorter Queen move.
- Assert two non-qualifying Queen moves are not separated by move length.
- Assert King moves never participate in the short-Queen-move tie-break.
- Run the Queen-focused tests, D4 symmetry checks, and the bounded Queen loop
  verifier. Report any loop without adding an unapproved rule.
