# Rook Geometry and Guide Repair

## Goal

Repair the Rook checkmate evaluator and its training guide together. The app
must recommend moves from the actual rook wall on the board, explain those
moves with short human rules, and retain an exhaustive guarantee against loops
and fifty-move draws.

## Problems

The current implementation has five related problems:

1. `shrink the box` ranks a move by adding two board-edge distances even though
   only the active rook wall confines Black. This reverses `Rg7` and `Rf4` in
   `8/5R2/8/4K3/8/7k/8/8 w - - 0 1`: `Rg7` creates a one-file box, while `Rf4`
   leaves a two-file box.
2. `finish` says “Checkmate now,” duplicating the universal `mate` priority.
3. `force opposition` combines king approach and waiting moves in a dense
   explanation.
4. `box Black in` foregrounds rare rescue details instead of the core rook-wall
   idea.
5. The phase-2 note and diagram caption repeat terminology instead of
   reinforcing the mating method.

## Evaluator

Use `getRookBoxFromFen` as the single source of truth for the current and
resulting box. A shrinking move must create a real rook wall and reduce its
one-dimensional `size`; tied shrinking moves prefer the smallest resulting
size. Do not add the irrelevant perpendicular edge distance.

The remaining board-only priorities may retain small geometric safety
exceptions when exhaustive counterexamples require them, but those exceptions
must not contradict the displayed rule. Do not use move counters, history,
orientation-specific squares, exact mate rank, or literal FEN exceptions to
select White's move.

## Training Guide

Keep the universal rules unchanged. Present the Rook strategy with concise,
lowercase labels and explanations:

1. `set up mate` — Make a move after which every Black reply allows checkmate.
2. `shrink the box` — Use the rook to leave Black as little room as possible.
3. `force opposition` — Move the king into opposition, or use a waiting move
   that keeps the box.
4. `box black in` — Put the rook between the kings.

Keep the method note, but shorten the phase definition to:

> Phase 2: the rook is between the kings, keeping Black on one side.

Keep the phase-2 diagram. Its caption becomes:

> The kings oppose each other while the rook holds the box.

## Verification

Add literal regressions for the guide copy and for the supplied `Rg7` position.
Run the focused Rook tests, presentation tests, lint, and production build.

Then run the production Rook policy derivation and exhaustive verifier with
identity state keys, one heavy process at a time. The final policy must cover
every tied optimal White move and every legal Black reply without a loop,
stalemate, material loss, rule gap, or fifty-move draw. If the corrected box
geometry exposes a counterexample, reduce it to a minimal line and refine only
a position-based rule that a human can understand.
