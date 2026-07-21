# Rook unsafe-shrink waiting trigger

## Goal

Choose `Ra6` from
`6k1/8/7R/5K2/8/8/8/8 w - - 0 1` by recognizing that the only
box-shrinking Rook move loses the Rook. The behavior must be geometric and
symmetry-safe, with no FEN, square, orientation, or box-size exception.

## Visible rule

Display:

> **waiting move** — If the kings are a knight's move apart, or if shrinking
> the box would lose the rook, move the rook, keeping the box, and with white's
> king between the other pieces.

## Evaluator

The waiting priority activates when an existing Rook box exists and either:

1. the kings are a knight's move apart; or
2. at least one legal Rook move strictly shrinks the current box, and every
   legal Rook move that strictly shrinks it leaves the Rook immediately
   capturable by Black.

The second trigger is false when no legal shrinking Rook move exists. A move
"loses the Rook" exactly when the existing universal `rook safe` calculation
says Black can capture it on the next move.

Once activated, the waiting-move qualifications do not change. The candidate
must be a quiet, safe Rook move; preserve or shrink the box; retain a strongest
boundary; and leave White's King strictly between the resulting Rook and
Black's King on the Rook's movement axis. Later visible priorities break ties.

In the supplied position, `Rh7` is the only legal box shrink and Black can take
the Rook. The waiting trigger therefore activates. `Ra6` keeps the rank box and
satisfies the between-pieces condition; `rook farther` selects it over the
other qualifying waiting moves.

## Verification

- Assert the exact visible rule copy.
- Pin `Ra6` as the sole best move in the supplied position and assert that
  `Kg5` is rejected by `waiting move`.
- Cover all D4 rotations and reflections of the supplied position.
- Add a negative case where a safe shrinking Rook move exists, proving the new
  trigger does not activate.
- Run focused Rook rules, the exact identity-keyed Rook verifier, session and
  presentation tests, lint, and the production build.
- If exhaustive verification still finds a cycle or 50-move draw, report one
  shortest replay from its minimal cycle or draw boundary.
