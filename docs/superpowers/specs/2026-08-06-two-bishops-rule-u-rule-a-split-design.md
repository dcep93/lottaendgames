# Two Bishops Rule U / Rule A Split

## Goal

Replace rule u's combined distance-and-edge preference with two separate Phase 1 priorities:

> **rule u** — Phase 1: Prefer bishops further from Black's king.
>
> **rule a** — Prefer fewer bishops on a non central edge square.

## Design

Rule u sums the Chebyshev distance from Black's king for both bishops in the resulting position and maximizes that total. Because rule a already removes edge-heavy candidates earlier, rule u can reward either bishop moving farther without reintroducing the unwanted edge preference. Edge bishops contribute their ordinary distance; edge occupancy remains rule a's responsibility.

Rule a counts bishops on non-central board-edge squares in the resulting position and minimizes that count. The two central squares on each edge are exempt: `d1/e1`, `d8/e8`, `a4/a5`, and `h4/h5`. All other edge squares, including corners, count against the candidate.

The Phase 1 order becomes `rule z`, `rule y`, `rule a`, `rule x`, `rule w`, `rule v`, `rule u`. Rule a uses the target-building fallback gate, so it is skipped with z/y/x/w whenever a surviving safe rule-v check exists. Rule u runs after rule v as a normal Phase 1 comparison. Both rules are inactive for Phase 2 result positions.

## Verification

Update the direct rule-u scoring test to assert summed distance. Add the supplied-position regression showing that rule w ties `Ke4` with bishop moves, then rule u keeps `Bc7` and `Bg3` over `Ke4` after rule a has removed `Bb8`. Add D4-symmetric rule-a coverage proving that the two central squares on every edge are exempt while adjacent non-central edge squares remain penalized, including the supplied `Bd8` regression. Preserve the registered-rule order, independent priority pipeline, and rule-shape expectations. Update the rendered guide copy. Run the focused Two Bishops and presentation tests, TypeScript, lint, and diagram validation. Finally, find and open a directly playable Phase 1 loop, treating Phase 2 entry as termination.
