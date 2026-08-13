# Two Bishops Flank and Active Diagonals Design

## Replacement

Remove Rules AB, AA, AC, AD, the existing Rules A–C, and the screening Rule D. Replace them with these Phase 1 priorities before `king closer`:

- **rule a** — When the kings are a knight's move apart, use a bishop to control the flank diagonal. This contains the square in opposition to black's king and the square diagonal to black's king and a knight's move from white's king.
- **rule b** — When the kings are in opposition, use a bishop to control the flank diagonal. This contains the square edge adjacent to white's king and a knight's move from black's king, and the square a knight's move from both kings.
- **rule c** — If rule b is satisfied, use the other bishop to control the active diagonal. This contains the white king and is parallel to the flank diagonal.
- **rule d** — If rule c is satisfied, step with the king away from the flank diagonal.
- **rule e** — Force the Black king to either step towards the white king, or else go away from the king moat.

Remove the obsolete Rule A diagram rather than showing the previous flank-square geometry.

## Diagonal geometry

Rules A and B each derive one or more two-square flank-diagonal segments from the stated king geometry. One bishop must have a clear ray to both squares of a segment.

Rule C applies when the starting position satisfies Rule B. It preserves a bishop controlling a qualifying flank segment and requires the other bishop to occupy the parallel diagonal through White's king. A diagonal is represented by its constant file-plus-rank or file-minus-rank index.

Rule D applies when the starting position satisfies Rule C. It accepts only a White-king move that strictly increases the king's perpendicular diagonal-index distance from at least one satisfied flank diagonal.

## King moat and Rule E

A king moat is the rank or file immediately between the kings on an axis where their coordinate separation is exactly two. If both axes qualify, both moat lines are available.

Rule E applies when at least one moat exists. Evaluate every legal Black reply after the candidate White move. A reply qualifies when it either:

1. strictly reduces Black's squared Euclidean distance to White's resulting king square; or
2. strictly increases Black's orthogonal distance from at least one starting moat line.

The White move satisfies Rule E only when every legal Black reply qualifies. This is independent of Black's later policy choice.

For `8/6B1/8/3B1K2/8/3k4/8/8 w - - 12 7`, both `Bc4` and `Bf6` satisfy Rule E.

## Verification

Pin exact rendered wording and priority order. Add direct cases for Rules A–D, Rule E's two supplied moves, rotations and reflections, Phase 2 inactivity, and removal of the obsolete diagram. Run focused tests, lint, build, diagram freshness, and find a strict Phase 1 loop where entering Phase 2 terminates the search branch.
