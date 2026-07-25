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
2. `finish` is a tactical mate-in-two search presented as a human strategy. It
   duplicates `mate` and hides the geometric reason the position progresses.
3. `force opposition` says White should take opposition and combines that with
   king approach. The method needs separate waiting-move and king-approach
   rules.
4. `box Black in` sometimes prefers parking the rook beside White's king. The
   strategy needs a distinct distant-rook-wall concept instead.
5. Phase 2 is a useful concept, but the current explanation and shaded diagram
   obscure it. Phase 1 establishes the first box; Phase 2 preserves and shrinks
   that box.

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

Remove the `finish` / mate-in-two priority from White's evaluator. Its
termination role must be replaced by visible, position-based geometry. When
establishing a box or choosing a waiting rook move, prefer a rook wall that is
far from both kings.

## Training Guide

Keep the universal rules unchanged. Present the Rook strategy with concise,
lowercase labels and explanations:

1. `shrink the box` — Use the rook to leave Black as little room as possible.
2. `force opposition` — When the kings are a knight's move apart, use a rook
   waiting move to make Black move.
3. `king closer` — Move White's king closer to Black without losing the box.
4. `distant rook wall` — Box Black in with the rook far from both kings.

Keep Phase 2 as a visible concept and define it precisely:

> Phase 2 begins once the rook is between the kings and Black is boxed on one
> side.

Keep the phase-2 diagram, but remove every highlighted or shaded box square.
The rook wall and opposing kings must explain the geometry without an overlay.
Its caption becomes:

> The kings are in opposition while the rook holds the box.

## Verification

Add literal regressions for the guide copy and for the supplied `Rg7` position.
Run the focused Rook tests, presentation tests, lint, and production build.

Then run the production Rook policy derivation and exhaustive verifier with
identity state keys, one heavy process at a time. The final policy must cover
every tied optimal White move and every legal Black reply without a loop,
stalemate, material loss, rule gap, or fifty-move draw. If the corrected box
geometry exposes a counterexample, reduce it to a minimal line and refine only
a position-based rule that a human can understand.
