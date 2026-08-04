# Two Bishops Sequester Raw Reply-Distance Design

## Goal

Make Sequester's “force Black toward White's proximate corner” comparison use Black's raw distance after each legal reply rather than whether a reply improved relative to Black's starting square.

## Metric

For each White candidate:

1. Determine White's proximate corner or tied proximate corners from White's resulting king square.
2. Enumerate every legal Black king reply already used by the production scorer.
3. Measure each reply square's Manhattan distance to the nearest of those corners.
4. Score the candidate by the maximum reply distance. A smaller maximum is better because Black chooses its most resistant legal reply.
5. Use sentinel `99` when there is no Black king reply; mate and stalemate are handled by earlier universal rules.

Keep the comparison as Sequester's second subpriority, after edge confinement and before White's knight-square support distance. The rendered text remains mechanically accurate and unchanged.

## Supplied Position

After `1.Kf5 Kh7` from `8/5B2/7k/4B3/6K1/8/8/8 w - - 0 1`:

- `Kf6` targets `h8`; replies `Kh8` and `Kh6` have raw distances `0` and `2`, so its worst-case score is `2`.
- `Kg4` targets `h1`; forced `Kh6` has raw distance `5`, so its score is `5`.

Therefore `Kf6` beats `Kg4` at Sequester's forcing-toward-corner comparison.

## Verification

- Rename the score field to describe raw worst-case reply distance.
- Add the supplied-position regression with exact reply distances and selection.
- Update existing Sequester tests and manual displayed-order calculations.
- Preserve edge confinement as the first comparison and knight-square support as the third.
- Run focused Sequester, Unmask, and displayed-order tests; targeted TypeScript; and diff hygiene.
- Run the small fail-fast gate and return one verified localhost loop.

## Non-goals

- Do not change Manhattan to Chebyshev, Euclidean, or sum-square distance for this comparison.
- Do not change White king support distance, Unmask, phase classification, Black priorities, or rule order.
- Do not run the full mate suite, commit, push, or deploy.
