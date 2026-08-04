# Two Bishops Degenerate King Lift Design

## Goal

Undo the latest Sequester edge-target experiment and repair a new exact Phase 2 Degenerate family by moving White's king to the canonical `g3` square.

## Sequester Restoration

Restore the preceding forcing-first Sequester policy without further changes:

1. Keep every legal Black reply on the edge.
2. Minimize Black's worst raw reply distance to the corner nearest White's king.
3. Minimize White king's sum-square distance to the corner's knight-support square.

Restore its prior rendered copy and `sequesterMaximumCornerReplyDistance` score field. Remove the two-step edge-target helper and tests.

## Degenerate Geometry

Add the subtype `degenerate — king lift` as the first Phase 2 Degenerate matcher. In the canonical orientation:

- Black's king is on `g1` or `h1`.
- One bishop is on `a5`, `b4`, `c3`, `d2`, or `e1`.
- The other bishop may occupy any legal square.
- White's king may start on any square from which the legal move to `g3` exists.
- Degenerate selects only that king move.

Apply all eight board-wide D4 rotations and reflections. Do not translate the pattern. A transform may swap physical square colors; the bishop occupying the transformed canonical diagonal is the matching bishop.

## Presentation

Add a `degenerate — king lift` diagram using:

`8/8/8/5B2/8/5K2/3B4/6k1 w - - 2 2`

Draw the `f3-g3` arrow. The exact subtype appears in the move-log reason and current hint through the existing Degenerate reason-label mechanism.

## Verification

- Assert `Kg3` is uniquely selected with the exact subtype for both canonical Black king squares, all five diagonal bishop squares, and all eight D4 transforms.
- Prove the second bishop can move among unrelated legal squares without disabling the matcher.
- Reject translated or near-miss geometry and positions where the target king move is illegal.
- Update diagram generation, diagram registration, and presentation expectations.
- Restore focused Sequester expectations, then run focused Degenerate, Sequester, displayed-order, presentation, diagram consistency, targeted TypeScript, and diff checks.
- Run the small fail-fast Two Bishops gate and return one verified localhost loop.

## Non-goals

- Do not change any other Degenerate subtype, phase classification, Black priorities, or other mating rules.
- Do not run the full mate suite, commit, push, deploy, or synchronize the plan archive.
