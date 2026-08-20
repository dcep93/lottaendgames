# Two Bishops Rule ZZ Design

## Goal

Add `rule zz` immediately after `rule z`:

> Keep bishops not on a shortest path between the kings.

## Behavior

Evaluate the position after White's candidate move. A bishop is on a shortest path when the king-step distance from White's king to the bishop plus the king-step distance from the bishop to Black's king equals the king-step distance between the kings. The kings' own squares are excluded.

The rule minimizes the number of bishops on any shortest king-step path. Tied candidates continue to later priorities.

## Implementation

Add a `ruleZZPenalty` score field, calculate it from the resulting king and bishop squares, and insert the rendered rule immediately after `rule z`. Add a focused priority-order and scoring regression test.

## Verification

Run the focused two-bishops tests and TypeScript compilation. Then generate and independently verify a local loop before loading it with `cursor=0`.
