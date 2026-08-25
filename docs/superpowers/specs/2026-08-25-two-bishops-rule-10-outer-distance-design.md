# Two Bishops Rule 10: Outer-Bishop Distance

Add `rule 10` immediately after `rule r9` and before `rule r11`.

Evaluate the resulting board after White's candidate move. In Phase 1, when the bishops form a double-diagonal wall, identify the outer bishop as the bishop whose wall diagonal is farther from Black across the shared diagonal axis. Prefer the greatest squared Euclidean distance between that bishop and Black's king.

The rule is inactive in Phase 2 or without an identifiable double-diagonal wall.

Verify ordering, distance scoring, the focused policy suite, the production build, and a strict loop replay.
