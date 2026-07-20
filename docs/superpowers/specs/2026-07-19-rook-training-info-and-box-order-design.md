# Rook training info and box order

## Goal

Make Rook training information as brief and clear as Queen training information, and make White establish a safe box in distant boxless positions before using exact mate distance as a tie-break.

## White priorities

Keep the universal priorities first. Order the Rook-specific priorities as:

1. `waiting move` — When White needs a tempo, move the Rook without losing the box.
2. `establish box` — When the kings line up far apart, establish the smallest safe box; then preserve or shrink it.
3. `shortest mate` — Finish with the shortest forced mate when the box rule does not apply.
4. `push with check` — Check when every reply pushes Black farther from White's king.
5. `king closer` — Move White's king closer to Black's king.
6. `rook farther` — Keep the Rook farther from Black's king.

The internal rule IDs and score fields remain stable. The guide uses the human sequence above. Internally, exact mate progress remains the safety net near the finish and in positions where no safe box can be established; this preserves the proven termination behavior.

In a boxless position, defer exact mate progress to the box rule when all of the following hold:

- the close-pieces finishing geometry is not active;
- the kings are at least four king moves apart;
- the kings share a rank or file;
- at least one legal move establishes a box; and
- that move leaves the Rook safe.

This is a symmetric geometric condition, not a FEN or square exception.

At `8/8/8/8/8/8/2k4K/7R w - - 0 1`, `Re1` must be the sole best move. It establishes the smallest safe box; the geometrically smaller `Rd1` is rejected because Black can capture the Rook.

## Phase 2

Use the same precise pattern as Queen:

> Phase 2 means the Rook's rank or file is strictly between the two kings on that axis.

## Black resistance

Use the Queen introduction. Make the first two priorities identical across Queen and Rook:

1. Return to the previous board position when a legal reply can recreate it.
2. Take a piece if White isn't looking.

Keep the remaining Rook resistance rules in their actual evaluator order, with concise wording.

## Verification

- Add the exact `Re1` regression and copy/order assertions.
- Run focused Rook and presentation tests, lint, and build.
- Run exhaustive Rook verification with symmetry and identity keys.
- Run the independent identity-rank proof and require a maximum White rank below 100 plies.
