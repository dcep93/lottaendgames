# Two Bishops Rule O: Four-Diagonal Threshold

## Goal

Update Rule O to:

> **rule o** — Prefer a bishop wall keeping Black's king in a smaller area from at least 4 diagonals from the corner.

## Design

- A wall qualifies for Rule O only when its nearer diagonal is at least four diagonal steps from the relevant corner.
- Use one named threshold for Rule O wall-area scoring and Rule WW wall arrangement scoring. Rule WW must not optimize a wall that Rule O rejects.
- Preserve the existing nearer-diagonal distance calculation, corner-area comparison, rule order, and rotation/reflection behavior.
- Walls exactly three diagonals from the corner no longer activate Rule O or Rule WW.

## Verification

- Pin the exact rendered Rule O text.
- Prove that a distance-three wall is rejected and a distance-four wall qualifies.
- Update affected supplied-position and symmetry expectations.
- Run focused Two Bishops tests, build, lint, and diff checks.
- Validate and load the next structural loop at `cursor=0`.
