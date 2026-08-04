# Two Bishops Sequester Edge-Target Design

## Goal

Make Sequester drive Black toward the edge square two steps from the corner nearest White's king, rather than toward the corner itself.

## Rendered Rule

> **sequester** — Phase 2: Keep Black on the edge. Drive it to the edge square two steps from the corner nearest White's king, then bring White's king to the knight-support square.

## Geometry

For each resulting legal Black reply:

1. Find the board edge or edges occupied by Black's reply square.
2. Find the corner or tied corners nearest White's resulting king.
3. For each nearest corner that is an endpoint of an occupied edge, construct the square two steps from that corner along that edge.
4. Measure Black's raw Manhattan distance to the nearest compatible target.

If Black replies into a corner, both occupied edges are considered. If no nearest White corner is an endpoint of Black's occupied edge, the reply has no compatible target and receives the sentinel distance `99`.

## Selection

Sequester compares candidates in this order:

1. Keep every legal Black king reply on an edge.
2. Minimize the maximum edge-target distance across all legal Black replies.
3. Minimize White king's existing sum-square distance to the nearest corner's knight-support square.

The policy remains stateless and D4-symmetric. The prior corner-reply score field is renamed to describe its edge-target meaning.

## Verification

- Assert the exact rendered copy and score-field ownership.
- Add direct target-square examples on horizontal and vertical edges, including a corner reply.
- Update Sequester regressions to assert edge-target distances rather than corner distances.
- Check D4 transforms of a decisive fixture.
- Run focused Sequester, displayed-order, and overlapping Unmask tests; targeted TypeScript; and diff hygiene.
- Run the small fail-fast Two Bishops gate and return one verified localhost loop.

## Non-goals

- Do not change edge confinement, king-support distance, rule order relative to other rules, phase classification, Black priorities, diagrams, or other mating rules.
- Do not run the full mate suite, commit, push, deploy, or synchronize the plan archive.
