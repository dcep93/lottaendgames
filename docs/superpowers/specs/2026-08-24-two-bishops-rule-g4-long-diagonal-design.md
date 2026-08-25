# Two Bishops Rule G4: Long-Diagonal Scope

## Goal

Make rule G4 prefer only long-diagonal bishops to be at least two king-steps from a corner. A long-diagonal bishop is a bishop on `a1–h8` or `a8–h1`, meaning it controls a corner. Bishops on every other diagonal are outside G4's scope.

## Scoring

Evaluate the position after White's candidate move. For each bishop on a long corner diagonal, add one penalty when its Chebyshev distance to any corner is less than two. A bishop exactly two steps from its nearest corner has no penalty. Non-long-diagonal bishops never add a G4 penalty.

Rule G4 remains immediately before rule G. Rule G independently prefers the resulting position to have at least one bishop controlling a corner.

## Verification

Add regression coverage proving that:

- a long-diagonal bishop adjacent to or occupying a corner is penalized;
- a long-diagonal bishop two steps from every corner is not penalized;
- a non-long-diagonal bishop near a corner is ignored by G4;
- the active rule order keeps G4 immediately before G.

Run the focused Two Bishops tests, the production build, and the development verifier. Load a verified exact loop at `cursor=0`, oriented with Black's nearest corner at h1 when possible.
