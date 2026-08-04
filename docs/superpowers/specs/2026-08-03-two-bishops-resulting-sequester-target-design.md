# Two Bishops: resulting sequester target

`sequester` must derive its target corner from each candidate White move's resulting bishop placement. In Phase 2, candidates that establish a same-side target are preferred over candidates that leave the bishops split. Candidates with a target are then compared by the worst remaining Black-reply distance to that target.

The rule participates for all Phase 2 candidates so targetless candidates can be eliminated when another candidate establishes a target. `take opposition` applies only after a candidate has established a target corner and uses that same resulting target. Phase 1 activation remains tied to the actual board phase.

Add the supplied `Bg4` regression and verify focused Two Bishops and presentation tests, TypeScript, diagrams, diff checking, and the fail-fast loop runner. No browser validation.
