# Two Bishops Rule Z2 Design

## Goal

Add `rule z2` immediately before `king closer`:

> When the kings are 2 diagonal squares apart and bishops control the 2 diagonals parallel and adjacent to the kings' diagonal, maintain those diagonals and don't move the king.

## Behavior

The rule applies when the starting kings differ by exactly two files and two ranks and the bishops occupy both diagonals in either completed adjacent parallel pair already derived for Rule W. The applicable pair is fixed from the starting position.

A candidate satisfies the rule only when it is a bishop move and the resulting bishops still occupy both diagonals in that same pair. The rule is all-or-nothing; king moves and moves that abandon either diagonal receive a penalty.

## Implementation

Reuse the existing Rule W flank-pair geometry. Record the completed starting pairs in the position context, add `ruleZ2Applies` and `ruleZ2Penalty` to the White score, and insert the rendered priority immediately before `king closer`.

## Verification

Add a focused regression using a completed two-diagonal geometry. Verify that a preserving bishop move passes, a king move fails, and the ordered policy exposes `rule z2` before `king closer`.
