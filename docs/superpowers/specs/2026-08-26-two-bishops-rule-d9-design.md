# Two Bishops Rule d9 and Conditional Stop Design

## Goal

Preserve an existing controlled long diagonal and add the fallback rule:

> Rule d9 — If no long diagonals are controlled, prefer a bishop on an edge square 2 from the corner, further from Black's king.

## Selector Correction

A conditional rule may stop evaluation only when every surviving candidate both satisfies the rule's `applies` predicate and satisfies `stopWhenBest`. This prevents inactive Phase 2 rules from labeling or terminating Phase 1 selection.

## Rule d9

- Insert d9 after d7 and before d10.
- Apply it only when neither starting bishop occupies a long diagonal.
- First prefer resulting positions with a bishop on an edge square exactly two king steps along that edge from a corner.
- Then prefer the greatest squared Euclidean distance between such a bishop and Black's king.
- Evaluate the resulting position and support every rotation and reflection.

## Verification

Add regressions for inactive conditional stops, the supplied Phase 1 position retaining a long diagonal, and d9's shape and distance tie-break. Run focused tests and load a newly validated exact loop at cursor 0.
