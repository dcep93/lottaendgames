# Rule WW bishop cage and post-move Rule W

## Goal

Add Rule WW immediately before Rule W and make Rule W evaluate the position after White's candidate move. Rule WW establishes a bishop cage when the starting kings are a knight's move apart. Rule W must accept king moves and must work in Phase 2 as well as Phase 1.

## Rule WW geometry

Rule WW uses the starting king relationship. It applies when the kings are a knight's move apart. The shorter king displacement determines the side of Black's king on which the cage is built, and the longer displacement determines its forward direction.

For the canonical position with White's king on `f3` and Black's king on `g5`, the cage diagonals are `e5-f6-g7-h8` and `a2-b3-c4-d5-e6-f5-g4-h3`. A resulting position satisfies Rule WW when one White bishop occupies each of those diagonals. This definition is transformed by all eight board rotations and reflections.

Rule WW scores the resulting position after White's candidate move. It does not add a bishop-move tie-breaker; any legal move that leaves both cage diagonals controlled receives the same Rule WW score. In the supplied position `8/8/3BB3/6k1/8/5K2/8/8 w - - 14 8`, `Be5` uniquely establishes the cage.

## Rule W behavior

Rule W remains worded:

> **rule w** — When the kings are a knight's move apart or two diagonal squares apart, use bishops to control the flank diagonals.

For every legal White candidate, derive Rule W's king relationship and flank-diagonal pair from the resulting position. If at least one candidate produces valid Rule W geometry, Rule W applies to the whole candidate group. Candidates whose resulting king relationship has no Rule W geometry receive a worse score than candidates with a valid pair. Among valid candidates, prefer more of the two flank diagonals controlled by the resulting bishops.

Remove the bishop-move preference from Rule W. King moves can therefore win when they produce the best resulting flank-diagonal pair. Rule W no longer excludes Phase 2. In `8/8/8/8/k7/2KB4/3B4/8 w - - 56 29`, `Kc2` is credited for the completed pair derived from White's king on `c2` after the move.

Once the surviving candidates all have zero Rule W penalty, stop before lower priorities. Every candidate that completes both resulting flank diagonals remains correct, so `king closer` cannot remove `Kc2` merely because a bishop move also completes a pair.

## Diagram and ordering

Insert Rule WW immediately before Rule W in the priority guide. Add a Rule WW board diagram using the supplied cage position after `Be5`: White king `f3`, Black king `g5`, bishops `e5` and `e6`. Mark both complete cage diagonals with distinct existing diagonal highlight styles. Keep Rule W and its existing diagram immediately after Rule WW, followed by `king closer`.

Rendered Rule WW text:

> **rule ww** — When the kings are a knight's move apart, establish a bishop cage.

## Tests

- Assert the exact Rule WW copy, ordering, diagram metadata, and accessible board description.
- Assert that `Be5` uniquely wins the supplied Rule WW position.
- Assert Rule WW behavior under every D4 rotation and reflection.
- Assert that Rule WW is active in both phases when its starting knight geometry exists.
- Assert that Rule W credits `Kc2` in the supplied Phase 2 position.
- Assert Rule W recomputes geometry after bishop and king moves, assigns a worst penalty to results without valid geometry, and has no bishop-move tie-breaker.
- Update existing Rule W tests that encoded starting-position-only or Phase-1-only behavior.
- Run focused tests, presentation tests, diagram drift verification, lint, and build.
