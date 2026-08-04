# Two Bishops Long Diagonal Off Edge

## Goal

Keep the long-diagonal degenerate repair away from edge destinations.

## Design

- Render: “Move the bishop to any highlighted square. Don't move it to the
  edge.”
- Remove a7 from the reference allowed targets and highlights, leaving e3, d4,
  c5, and b6.
- Apply the same exclusion through all D4 rotations and reflections.
- Keep the repair terminal after any remaining highlighted move.

## Verification

Update the exact and D4-focused long-diagonal assertions, regenerate diagram
data, and run focused Two Bishops rules, presentation, TypeScript, diagrams,
diff, and fail-fast loop checks only.

