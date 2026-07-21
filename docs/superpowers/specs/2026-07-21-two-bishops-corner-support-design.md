# Two Bishops Corner Support

## Goal

Replace the reversible corner-waiting preference with a position-only rule that
selects `Kf7` in the `Be6 Kh7 Bd5 Kh8` loop position. The rule must not remember
the previously selected corner or any earlier move.

## Rule

**corner support** — When Black is in a corner or one edge-square beside it,
place White's king a knight's move from that corner.

The evaluator identifies a corner only when Black occupies it or one of its two
adjacent edge squares. This makes the nearby corner unique. It derives the two
on-board knight-move support squares for that corner and minimizes White's
king-move distance to either square after the candidate move.

Universal mate, stalemate, and piece-safety priorities remain earlier. A support
distance of zero is best, so later priorities cannot select a move that abandons
support in the same position. Nothing is stored between turns.

## Priority Interaction

The old corner-waiting selector is removed. The existing line-pattern waiting
move and the new adjacent-bishops/knight-distance waiting move remain ahead of
corner support. This preserves `Bf3` in the original `Kb3 Kc1 Kc3 Kb1` loop
while allowing `Kf7` in the new corner loop.

## Verification

Focused tests cover all four corners, their adjacent edge squares, positions
outside the corner area, the two known loops, and all board symmetries. The
exhaustive verifier must then explore every legal KBBK start and every legal
Black response. If another loop exists, return its shortest cycle as a validated
localhost replay.
