# Two Bishops: remove the hidden mate/degenerate gate

`mate in 3` is visibly ordered above `degenerate`, so its activation must not depend on whether a degenerate repair also matches. Activate `mate in 3` whenever the board-derived mate-pattern map is nonempty. Let the ordered rule comparison resolve overlap.

Add a regression for the position where the translated bishop-advance template and the mate-in-three pattern both match. Verify focused Two Bishops and presentation tests, TypeScript, diagrams, diff checking, and the fail-fast loop runner. No browser validation.
