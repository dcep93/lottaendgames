# Staged supported-diagonal loop harness

The user wants to exhaust supported seven-diagonal starts first, then five, then three. Reaching a smaller diagonal is explicitly not a terminal: all tied best White and Black choices continue through support changes until mate, capture, stalemate, or a cycle. Classification is after White moves and Black return history stays part of the graph state.

Extend the existing production-backed exhaustive graph audit, rather than build a second chess evaluator or rely on sampling. Add an optional starting-diagonal filter (7, 5, or 3) to supported scope. Enumerate the entire placement universe to retain exact denominators and classify any boards on downstream cycles. Include the filter in checkpoint identity. Preserve the existing unsupported and all-supported modes.

Report both selected starts that can reach a loop and selected starts directly on cycles. Also report all downstream cyclic boards by their actual supported diagonal and piece-position motif: a seven-start failure may be a three-diagonal cycle. Keep captures/stalemates separate; zero cycles must never be described as guaranteed mate.

Each run provides reproducible fingerprints, production-verified replay links, a comparison with a previous same-stage run, and an optional process-exit gate for zero reachable loops or all branches reaching mate. Run seven first; do not move the active work to five or three while seven-start loops remain. Recheck the full stage after policy changes, since removing an old witness does not prove progress.

Keep the audit read-only with respect to chess preferences. Fix application rules separately and test their board symmetries. Do not override r1.5 or change the support classifier to make a result pass without an explicit user instruction. Prioritize seven-diagonal piece-position motifs in the remaining graph; retain smaller-diagonal blockers in the seven-stage report because the user requires continuation to mate.

Validation: scope/option errors, default-mode compatibility, selected denominators, zero-loop versus mate gates, downstream motif deduplication, production/reference equivalence, all-eight symmetry checks, exhaustive population assertions, and independent cycle reachability checks. Existing application tests and a production build remain required for policy edits.
