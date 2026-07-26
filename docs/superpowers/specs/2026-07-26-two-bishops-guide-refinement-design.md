# Two Bishops guide refinement

## Goal

Make the Two Bishops training guide logical, terse, and legible. Replace vague chess prose with board predicates a technical reader can apply, and make both diagrams consistent full-board examples.

## White-rule copy

- **corner check** — If Black is in a corner and a bishop can check from beside White’s king, play that check.
- **waiting move** — Make a safe, nonchecking bishop move that does not increase the number of squares Black can reach. Near a corner, move the bishop that controls it.
- **corner finish** — Keep Black on the edge. Move White’s king a knight’s move from the target corner, then take direct opposition.
- **bishop wall** — Keep White’s king out of the bishops’ lines. Place the bishops side by side, then reduce the number of squares Black can reach.

The existing rule titles, ordering, evaluator behavior, and internal proof filter remain unchanged. The new wording explains the measurable board properties used by those rules without exposing implementation-only branches.

## Diagrams

Both Two Bishops diagrams use an ordinary 8×8 board. Neither diagram highlights squares.

### Bishop wall

- White king: b1
- White bishops: c2 and d2
- Black king: f6
- Caption: “Side-by-side bishops form a wall. Move the wall to reduce the number of squares Black can reach.”

### Corner finish

- White to move
- White king: b3
- White bishops: c2 and d2
- Black king: a1
- Caption: “White to move: Bc3#.”

The corner-finish position is legal and has exactly one mate in one, `Bc3#`.

## Verification

- Assert the exact four descriptions and their existing guide order.
- Assert both boards use 8 files and 8 ranks and have no highlights.
- Reconstruct the corner-finish position as FEN and prove that `Bc3#` is its sole mating move.
- Render the guide and verify both boards receive the full-board presentation.
- Run the focused Two Bishops and presentation tests, lint, and the production build.
