# Two Bishops: sequester away from the bishops

## Goal

Make `sequester` identify one stable target corner from the current board: the corner reached by walking along Black's edge away from both bishops.

## Rule

Render:

> **sequester** — Phase 2: Force Black's king towards the target corner - walking along the edge away from the bishops.

For a non-corner Black king on an edge, project both bishop squares onto that edge's axis. The rule applies only when the bishops establish one common side of Black's king:

- both bishops are strictly on the same side; or
- one bishop is aligned with Black and the other establishes a side.

The target is the corner in the opposite direction. If the bishops lie on opposite sides, or both are aligned, `sequester` does not apply. If Black is already in a corner, that corner is the target.

Candidate moves are compared by the worst Manhattan distance of any legal Black reply to that fixed corner. Since Phase 2 keeps Black on the edge, this is the remaining number of edge steps. The target is calculated from the starting board only and does not depend on history.

## Constraints

- Current-position-only and D4 symmetric.
- No hidden fallback target.
- Existing earlier priorities remain unchanged.
- `take opposition` and Phase 1 activation follow whether `sequester` has a valid target, as they do today.

## Verification

- Focused tests cover same-side, one-aligned, split-side, both-aligned, corner, and all D4 transforms.
- Run only Two Bishops focused tests, relevant presentation checks, TypeScript, diagram check, diff check, and the fail-fast local-loop runner.
