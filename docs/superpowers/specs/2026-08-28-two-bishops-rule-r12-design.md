# Two Bishops Rule R12

## Goal

Insert this priority between `r10` and `r15`:

> **rule r12** — Prefer bishops off the edge.

## Behavior

Evaluate each candidate after White's move. Count White bishops on the first or eighth rank or the `a` or `h` file; fewer edge bishops wins. This gives a move with two interior bishops priority over one with one interior bishop, which in turn beats two edge bishops.

A binary "both off the edge" test would leave one-edge and two-edge positions tied, while summing distance from the edge would add an unstated preference for deeper centralization. The edge-bishop count is the direct implementation of the requested rule.

Keep the universal rules, `r10`, `r15`, Black's policy, and all other behavior unchanged. Update focused policy and presentation tests, then run the exact fail-fast cycle search and load the first valid loop at cursor 0.

