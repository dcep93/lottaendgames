# Rule Y: Keep Bishop Moves Out from Between the Kings

## Design

Rule Y must reject a bishop move whose destination lies strictly between the two kings along any shortest king-step path. A square is in that corridor when the sum of its Chebyshev distances to the kings equals the kings' Chebyshev distance, excluding the king squares themselves.

The new penalty applies only when White moves a bishop onto such a square. It does not penalize king moves or an unmoved bishop already in the corridor. Within Rule Y, compare non-checking moves first, then corridor avoidance, adjacent-diagonal placement, and diagonal distance.

Render the requested additional sentence unchanged. Verify the supplied position rejects `Bd4`, and cover rotations and reflections through the distance-based geometry.
