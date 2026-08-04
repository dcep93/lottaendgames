# Two Bishops King Closer Squared-Distance Design

## Goal

Make `king closer` recommend only the legal White king moves that minimize squared Euclidean distance to Black's king. In the supplied position `8/8/8/4BB2/6K1/8/8/4k3 w - - 34 18`, this makes `Kf3` uniquely correct instead of tying it with `Kf4`.

## Policy

- Score a White king move by `(file difference)² + (rank difference)²` between the resulting White king square and Black's current king square.
- Compare that distance directly across surviving candidates. The minimum distance wins.
- Bishop moves receive a noncompetitive sentinel score for this rule.
- Remove the existing Manhattan-improvement predicate and the separate middle-16 tie-break from `king closer`.
- Render the rule as: `Bring White's king as close as possible to Black's king.`
- Keep rule ordering and every other Two Bishops selector unchanged.

## Verification

- Add a focused regression proving `Kf3` is the only ideal move in the supplied position and has a smaller squared-distance score than `Kf4`.
- Update existing King Closer tests to assert minimum-distance semantics rather than the removed middle-16 preference.
- Run only focused Two Bishops King Closer tests, targeted TypeScript, generated-file consistency if affected, and diff hygiene.
- Re-verify a legal localhost Phase 1 loop for the required handoff link.

## Non-goals

- No changes to `support wall`, `sequester`, Degenerate selectors, phase classification, Black priorities, diagrams, or loop-search architecture.
- No full mate suite, commit, push, or deployment.
