# Two Bishops Rule R11: Adjacent Central Outer Bishop

## Behavior

Keep `rule r11` immediately after `rule r9` and before `rule r`.

Evaluate the resulting position after White's candidate move. In Phase 1, when the two bishops form a double-diagonal wall, identify the outer-wall bishop directly from Black's position: it is the bishop whose controlled wall diagonal is farther from Black across the wall's shared axis.

Prefer the outer bishop adjacent to the other bishop. Among adjacent placements, prefer the square closer to the center. Physical king-distance adjacency is the primary comparison; existing board-center distance breaks ties.

The rule is inactive in Phase 2, when there is no double-diagonal wall, or when no outer-wall bishop can be identified.

## Scoring

- Adjacency is compared first: adjacent is better than non-adjacent.
- Board-center distance is compared second.

## Verification

Add focused score and rule-order coverage, run the Two Bishops minimal-policy test file, build the app, and revalidate the existing short loop.

Regression coverage must include the former `Bf3+/Bg2` loop: with bishops on `a7–g1` and `b7–h1`, the outer bishop should prefer the central adjacent square instead of oscillating.
