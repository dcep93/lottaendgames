# Two Bishops Rule r7 Phase 2 Formation Design

## Goal

Change rule r7 to implement this ordered priority exactly:

> Prefer bishops on enclosing phase 2 diagonals and White's king inside them, then prefer king proximity to squares a knight's move from Black's corner.

The rule must help construct the Phase 2 formation, not merely become active after the full catalog Phase 2 position already exists.

## Selected approach

Score every legal White result with two r7 subpriorities:

1. A formation penalty. It is zero when the bishops occupy the two transformed Phase 2 diagonals, those diagonals enclose Black toward their target corner, and White's king is inside the enclosed area. It is one otherwise.
2. King distance. Among results satisfying the formation, minimize the sum of White's king-step distances to the two squares a knight's move from the matched target corner. Results without the formation receive a neutral distance so this subpriority cannot affect unrelated positions.

The enclosure test uses the existing adjacent-diagonal geometry and the existing convention that either bishop wall and Black's enclosed area count as inside.

## Alternatives rejected

- Keeping r7 conditional on the starting position would not prefer moves that create or preserve the requested formation.
- Reusing the catalog Phase 2 predicate would incorrectly require Black to be on the target edge; the requested enclosing geometry also applies while Black remains elsewhere inside the Phase 2 walls.
- Combining formation and distance into one weighted number would obscure the stated priority and risk distance outweighing formation.

## Rule text

The displayed help text is exactly:

> Prefer bishops on enclosing phase 2 diagonals and White's king inside them, then prefer king proximity to squares a knight's move from Black's corner.

## Verification

Focused tests cover:

- exact help text;
- formation preference as the first r7 subpriority;
- application when Black is enclosed but not yet on the target edge;
- king-distance comparison after formation is satisfied;
- all rotations and reflections;
- neutrality when no Phase 2 enclosure exists.

After focused tests pass, run the cached exhaustive early-exit loop search and load the first genuine non-r4 loop at cursor 0.
