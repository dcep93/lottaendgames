# Two Bishops: Phase 1 activation

Phase 1 rules must activate from the actual board-derived phase, not from whether `sequester` happens to have a target corner.

Add the current phase to the White move score. Gate `conclave step`, `finish wall`, `support wall`, `start wall`, and `king closer` on Phase 1. Keep `sequester` independently inactive when the bishops do not establish a target corner. In a Phase 2 position with no target corner, an inactive `sequester` must not reopen Phase 1 strategy.

Add the supplied split-bishop regression and verify focused Two Bishops and presentation tests, TypeScript, diagrams, diff checking, and the fail-fast loop runner. No browser validation.
