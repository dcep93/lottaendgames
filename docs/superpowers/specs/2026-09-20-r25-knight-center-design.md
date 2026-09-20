# Final knight-center preference

The user approved the recommendation in `docs/audits/2026-09-20-unsupported-r20.md`.

Add **r25 — Prefer the knight’s Euclidean proximity to the center**, after r20. Score the resulting knight against the board midpoint, using the existing squared-distance metric for identical ordering. This only resolves existing ties; support, Black’s policy, and earlier preferences are unchanged.

Verify the dominant shuttle chooses Ne7 instead of Na7 and Nc6 instead of Nc8+, including all eight symmetries. Verify r20 still wins over r25 and equal distances remain tied. Run the full mate suite, build, scaffold tests, then the exhaustive unsupported-position audit. Compare direct cycle membership and cycle reachability to the r20 baseline, classify remaining cycles, and load a verified minimal unsupported witness.

Self-review: the previous report defines the approved scope and counterfactual; this change implements that exact final comparator. No broader policy changes.
