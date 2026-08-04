# Two Bishops Phase 2 Wall Off-Edge Design

## Goal

Align the `phase 2 wall` selector with the rendered rule:

> **phase 2 wall** — Phase 2: Create or maintain a 2 square wall not on the same side as the white king, without placing a bishop on Black's edge.

## Behavior

- Keep the existing board-derived Phase 2 activation and wall geometry.
- A move satisfies the rule only when its resulting bishops control both squares of one eligible two-square wall.
- Neither resulting bishop may occupy Black's current edge. At a corner, both edges containing Black's king count as Black's edge.
- Remove the independent “fewer bishops on any edge” tie-break. If no legal survivor creates a valid off-edge wall, all moves tie at this rule and selection cascades to the next visible priority.
- Preserve D4 symmetry and current-position-only evaluation.

## Verification

- Retain the existing approved wall examples and D4 transformations.
- Assert that an otherwise valid wall with a bishop on Black's edge is rejected while its off-edge equivalent is accepted.
- Add a regression proving the rule no longer filters moves merely because one leaves a bishop on an unrelated edge when no valid wall is available.
- Run focused Two Bishops rule tests, relevant presentation tests, TypeScript, diagram checks, and the fail-fast Two Bishops loop search.

## Non-goals

- Do not change Phase 2 classification, sequester, degenerate repairs, or any other mating rule.
- Do not run the full mate suite, commit, push, or deploy.
