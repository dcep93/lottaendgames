# Two Bishops Global King Closer After Wall

## Goal

Use king proximity to resolve remaining choices in both phases, after the
existing Phase 2 wall and sequester priorities have done their work.

## Design

- Keep one visible `king closer` rule in its current final position.
- Render: “Bring White's king as close as possible to Black's king.”
- Remove its Phase 1 activation gate so the same squared-Euclidean proximity
  comparison applies in both phases.
- Do not add a second rule or change earlier Phase 1 or Phase 2 priorities.

## Verification

- Add a Phase 2 regression for the current loop witness.
- Update rendered-copy and rule-activation assertions.
- Run focused Two Bishops rules, presentation, TypeScript, diagrams, diff, and
  fail-fast loop checks only.

