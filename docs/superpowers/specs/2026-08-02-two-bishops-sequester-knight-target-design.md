# Two Bishops Sequester Knight Target

## Goal

Restore sequester's White-king target to the squares a knight's move from Black's nearest corner, without changing `mate in 3` or the mating-position diagram.

## Behavior

For an `h8` corner, sequester's target squares are `f7` and `g6`; rotations and reflections produce the equivalent squares for every corner. If Black is tied between nearest corners, include both corners' knight squares.

The sequester tiebreak remains minimum squared Euclidean distance from White's king to the target set. This gives a progressive preference before the king reaches a target and reaches zero on either knight square.

The priority order remains:

1. Keep Black confined to the edge.
2. Force Black toward White's proximate corner.
3. Bring White's king toward a square a knight's move from the corner.

Render: **sequester** — Phase 2: Ensure Black cannot leave the edge. Prefer forcing Black's king towards White's king's proximate corner, then prefer keeping White's king a knight's move from the corner.

## Scope and Verification

Keep the mating-position helper, diagram, and mate-in-three activation unchanged. Add focused corner-knight and D4 tests, update directly affected sequester expectations and rendered copy, run focused Two Bishops and presentation checks, targeted TypeScript, and diff checks. Do not run the full mate suite. Finish with a refreshable localhost loop.
