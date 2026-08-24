# Two Bishops Rule E Opposite-corner Direction Design

## Goal

Require Rule E's second outward edge square to be controlled from the direction
of the corner opposite Black's proximate corner.

For the canonical `h1` corner with Black on `h3`, the target remains `h5`.
Control from `g6`, `f7`, or `e8` is valid because those squares lie on the ray
toward the opposite corner `a8`. Control along `d1-e2-f3-g4-h5` is invalid
because it approaches `h5` from the `h1` side.

## Implementation

- Keep each Rule E target paired with the proximate corner that produced it.
- Derive the opposite corner by reflecting both corner coordinates.
- A bishop qualifies only when it lies strictly on the diagonal ray from the
  target in the opposite corner's file and rank directions and has a clear
  line to the target.
- Preserve the existing White-king non-adjacency requirement.
- Apply the same calculation to every edge and corner without orientation
  branches.

## Verification

- In `8/8/8/8/5K2/7k/8/2BB4 w - - 8 5`, verify `Kf3` is ideal and Rule E
  no longer prefers the `d1-h5` direction.
- Verify canonical Rule E moves controlling from the opposite-corner ray still
  pass.
- Verify rotations and reflections.
- Run the focused policy test, build, lint, and diff checks.
- Load a validated `h1`-oriented loop at `cursor=0` and include its link.
