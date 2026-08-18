# Rule Y: Exactly Three King Steps

## Design

Re-enable Rule Y and apply it only when the starting kings are exactly three Chebyshev king steps apart. Preserve its diagonal-distance scoring and priority position. Change the rendered text to:

> When the kings are exactly 3 steps from each other, places the bishops on adjacent diagonals, as close as possible to, but not checking Black's king

## Verification

Test applicability at three steps and rejection at two and four steps. Run the focused Two Bishops and presentation tests.

## Assumptions

“Steps” retains the app's existing king-step/Chebyshev definition. The grammar and numeral `3` are preserved exactly as requested.
