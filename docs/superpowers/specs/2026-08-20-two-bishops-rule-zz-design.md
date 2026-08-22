# Two Bishops Rule ZZ Design

## Goal

Add `rule zz` immediately after `rule z`:

> Keep bishops not on a shortest path between the kings.

## Behavior

Define the shortest paths from the position after White's candidate move. A bishop is on a shortest path when the king-step distance from the resulting White king to the resulting bishop plus the king-step distance from the resulting bishop to Black's king equals the resulting king-step distance between the kings. The kings' own squares are excluded.

The rule minimizes the number of bishops on any shortest king-step path. Tied candidates continue to later priorities.

## Implementation

Calculate `ruleZZPenalty` from the resulting White king and resulting bishop squares. Keep the rendered rule immediately after `rule z` and add a focused scoring regression test for a White king move that clears the resulting shortest paths.

## Verification

Run the focused two-bishops tests and TypeScript compilation. Then generate and independently verify a local loop before loading it with `cursor=0`.
