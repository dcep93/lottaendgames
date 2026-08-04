# Two Bishops Squared Euclidean King Distance Design

## Goal

Define the Two Bishops `king closer` distance as squared Euclidean distance between the resulting White-king square and Black's king. Evaluate that resulting king square after every White candidate, including bishop moves.

Keep the visible wording unchanged:

> Bring White's king closer to Black's king, preferring proximity to the the middle 16 squares.

## Behavior

For a resulting White king at `(wf, wr)` and Black king at `(bf, br)`, the primary score is:

`(wf - bf)² + (wr - br)²`

Lower is better. Proximity to the inclusive `c3`–`f6` middle sixteen remains the secondary comparison and is evaluated from the same resulting White-king square.

This definition is global to the Two Bishops policy: it applies in both phases and to every legal White candidate. Bishop moves preserve White's current king square rather than receiving the Phase 1 sentinel score of `99`.

In the supplied position `3K4/1k1B4/3B4/8/8/8/8/8 w - - 4 3`, `Bc5` preserves the king on d8 for a score of `5`, while `Ke7` produces a score of `9`. Therefore `Bc5` survives `king closer`. It ties with every other candidate bishop move that survives the earlier priorities and leaves White's king on d8; this change does not uniquely select `Bc5`.

## Implementation

Reuse the existing `squaredEuclideanDistance` chess helper. Compute `kingCloserDistance` whenever both kings are present, regardless of the moving piece or phase. Compute `kingCloserMiddleSixteenDistance` whenever the resulting White king exists, also regardless of moving piece or phase.

Do not change rule order, help text, Phase 1/Phase 2 detection, or any earlier tactical and wall priority.

## Verification

Tests will establish:

- the supplied position assigns `Bc5` distance `5` and `Ke7` distance `9`;
- all earlier-surviving bishop moves in that position are preferred over the two king moves;
- Phase 1 bishop moves receive the actual resulting king distance and middle-sixteen value;
- king moves use squared Euclidean rather than Manhattan distance;
- Phase 2 bishop waiting moves continue to score the resulting king square;
- the comparison remains invariant under all D4 board transforms; and
- the visible wording remains unchanged.

Run the focused Two Bishops and presentation tests, lint, TypeScript, and the Phase 1 verifier with Phase 2 treated as terminal. Provide an exact replay-seeded Phase 1 loop on the worktree server at `127.0.0.1:5174`.
