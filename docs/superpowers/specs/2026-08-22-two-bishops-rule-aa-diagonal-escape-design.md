# Two Bishops Rule AA diagonal escape

## Goal

Add this visible priority immediately before Rule A:

> **rule aa** — With the Black king one edge move from the corner, White king on edge a knight's move away, Bishop controls Black king's diagonal escape square, control the diagonal adjacent to Black's king directed away from White's king.

## Geometry

Derive the rule from the board and support every rotation and reflection.

In the canonical lower-right position:

- Black's king is on `g1`, one edge move from corner `h1`;
- White's king is on `h3`, on the edge and a knight's move from Black;
- a White bishop controls Black's inward diagonal escape square `f2`;
- the edge-adjacent square directed away from White is `f1`;
- the target diagonal through that square is `a6–f1`.

A legal White bishop move satisfies Rule AA when its resulting square lies on the derived target diagonal. In the supplied position, `Be2` is uniquely correct. `Bb5` would establish the same diagonal geometrically but is not legal from the supplied bishop squares.

The rule requires the stated starting geometry. It does not award credit merely because a bishop already occupies an unrelated parallel diagonal.

## Integration

Implement the evaluator in a focused module. Add applicability and penalty fields to the Two Bishops score and insert Rule AA immediately before Rule A in active scoring and rendered order. Earlier mandatory mate and safety priorities remain unchanged.

## Diagram

Render the canonical pieces `Kg1`, `Kh3`, `Bh4`, and `Bd1`. Highlight escape square `f2`, highlight target diagonal `a6–f1`, and draw `Bd1–e2`. The diagram represents every rotation and reflection.

## Verification

- Prove the supplied position uniquely selects `Be2`.
- Prove the target diagonal and move transform under every rotation and reflection.
- Prove the rule rejects positions missing the corner relationship, knight-distance edge king, or controlled escape square.
- Verify visible order and exact diagram contents.
- Run focused Rule AA, Rule A, Rule B, minimal-policy, Phase 2, diagram, and build checks.
- Run the fast loop verifier and load the verified loop at `cursor=0`.
