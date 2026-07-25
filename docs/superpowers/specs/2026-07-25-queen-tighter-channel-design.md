# Queen Tighter-Channel King Approach

## Goal

Allow White's king to cross the wider side of the Queen box when the other
axis already confines Black more tightly. In the `Qb5`, `Ka7` example, the
file side is one square and the rank side is three squares, so `Kc6` may cross
the rank channel.

## Geometry

Retain the existing Queen box dimensions, but also expose their axes:

- `fileSide`: the distance from the Queen's file to the board edge containing
  Black's king;
- `rankSide`: the distance from the Queen's rank to the board edge containing
  Black's king.

The `king closer` channel penalty protects only the tighter side:

- when `fileSide < rankSide`, penalize a king inside the file channel only;
- when `rankSide < fileSide`, penalize a king inside the rank channel only;
- when the sides tie, penalize a king inside either channel.

The existing phase calculation remains unchanged. The existing box comparison
still minimizes the sorted shorter side before the longer side.

## Teaching Rule

Update `king closer` to:

> Move White's king closer without crossing the tighter side of the queen's
> box.

This directly describes the algorithm. It avoids a cage-specific exception.

## Cage-Support Ablation

After implementing tighter-axis geometry, remove `king toward cage support`
from an experimental Queen policy and rank the complete identity-keyed graph.

- If every root ranks with no cycle, terminal failure, or fifty-move risk,
  remove the cage-support rule from production.
- If the ablated policy fails, retain the cage-support rule and record the
  minimal literal witness.

## Verification

Add literal and symmetry tests for rank-tighter, file-tighter, and tied boxes.
Pin the `Qb5`, `Ka7`, `Kc5` position so `Kc6` has no channel penalty and is
recommended. Re-run focused Queen tests, the complete identity-keyed Queen
rank, the full Mate suite, lint, and build.

## Result

The symmetry-reduced graph passed with `king toward cage support` omitted:
17,972 roots and 17,991 White states ranked, with a maximum line of 37 plies.
The identity-keyed graph also passed: all 17,972 roots and 30,506 White states
ranked, again with a maximum line of 37 plies. The rule is therefore redundant
under tighter-axis geometry and is removed from both the evaluator and guide.
