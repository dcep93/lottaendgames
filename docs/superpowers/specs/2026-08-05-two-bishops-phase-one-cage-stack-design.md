# Two Bishops Phase One Cage Stack Design

## Goal

Replace the single `restrict area` Phase 1 priority with four visible priorities, in this order:

1. **ideal cage** — Phase 1: Have 2 adjacent bishops, exactly one on the edge, 3 squares from the corner, with Black's king inside the 5-square corner area
2. **restricted area** — Phase 1: Use the bishops to control 2 diagonals adjacent to Black's king, but not checking the king, preferring a smaller area for Black. White's king should not be within the area or those diagonals.
3. **prep restricted area** — Phase 1: Bishop control a square diagonally adjacent to Black's king, preferring squares closer to the center of the board. If a bishop is attacked while maintaining the restricted area, maintain the diagonal and move it as far as possible.
4. **bishops further** — Phase 1: Prefer bishops to be further from Black's king

The priorities remain after `unclutter bishops` and before `king closer`. Universal safety rules, Phase 2 rules, Black policy, `king closer`, and `check` remain unchanged.

## Ideal Cage Geometry

Score the resulting position after White's candidate move. An ideal cage exists when all of these conditions hold:

- the two bishops are orthogonally adjacent;
- exactly one bishop is on a board edge;
- the edge bishop is exactly three Chebyshev king steps from a corner;
- Black's king occupies that corner's five-square area.

For canonical corner `a1`, the bishop pair is `a4/b4` and the five Black squares are `a1`, `b1`, `c1`, `a2`, and `b2`. The other seven cases are its D4 rotations and reflections. This geometry cannot check a Black king inside the five-square area. The comparison is binary: prefer an ideal cage when any survivor creates or preserves one; otherwise retain every move.

## Restricted Area

Reuse the existing adjacent-diagonal confinement geometry. The bishops must occupy adjacent parallel diagonals, Black must lie strictly on one side, White's king must lie strictly beyond the opposite boundary, and the resulting position must not check Black.

Compare the raw number of board squares strictly inside Black's side of the two diagonal boundaries. Prefer the smaller raw area. Remove the old minimum-six clamp so every geometric reduction counts. A non-qualifying result receives the existing sentinel area and loses to any qualifying cage.

## Prep Restricted Area

Move the existing preparation behaviors into a separate visible priority after `restricted area`:

1. When the starting position already has a qualifying restricted area and Black attacks a bishop, prefer a surviving move by that bishop that stays on one of its current cage-boundary diagonals. Among those moves, maximize diagonal travel length.
2. Only when every survivor lacks a qualifying restricted area, prefer a non-checking bishop result that controls a square diagonally adjacent to Black's king. Compare the controlled target's Manhattan distance to the central four squares and prefer the smaller value.

If neither stage has a qualifying move, preserve the tie for later rules.

## Bishops Further

For each resulting position, sum the squared Euclidean distances from both bishops to Black's king and maximize that total. King moves preserve the current bishop score. This metric is stateless, translation-sensitive in the intended geometric way, and D4-symmetric.

## Rule and Score Shape

Replace the old `restrict area` rule ID and help entry. Register the new IDs as four Phase 1-only rules:

`ideal cage → restricted area → prep restricted area → bishops further`

Keep the existing confinement, escape, travel, and fallback calculations where they still serve the split rules. Replace the clamped comparison field with the raw area, and add explicit score fields for ideal-cage penalty and total bishop distance.

No new diagram is required.

## Verification

- Assert exact visible wording and order.
- Cover the canonical ideal cage, near misses, king outside the five-square area, Phase 2 inactivity, and every D4 transform.
- Assert raw restricted-area shrinkage with no minimum-six clamp, checking exclusion, White-king exclusion, and both diagonal orientations.
- Preserve attacked-bishop boundary escape, maximum travel, fallback center preference, and no-op behavior when preparation is unavailable.
- Assert combined squared-Euclidean bishop distance, D4 symmetry, and Phase 2 inactivity.
- Run focused Two Bishops and presentation tests, TypeScript, lint, diagram freshness, and diff checks.
- Find a current-policy exact loop that remains entirely in Phase 1, treating entry into Phase 2 as termination, and open it on port 5174.

## Assumptions

- “3 squares from the corner” means Chebyshev distance three, so the canonical edge bishop is `a4` relative to corner `a1`.
- “5-square corner area” is the canonical set `a1`, `b1`, `c1`, `a2`, and `b2`, transformed by D4 symmetry.
- “bishops further” maximizes the sum of the bishops' squared Euclidean distances from Black's king.
