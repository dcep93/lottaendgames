# Two Bishops Prepare Mate Reactivation

## Design

Restore the existing `prepare mate` rule without changing its scoring, search, rendered text, or supporting quality-of-life behavior.

The active White priority order is:

1. mate
2. bishops safe
3. no stalemate
4. prepare mate
5. king closer

All other historical White heuristics remain inactive. Black's policy is unchanged.

## Verification

Run the minimal-policy, prepare-mate, king-closer, and mandatory-correctness tests. Then obtain a production cycle witness, independently verify every selected move, and load it with `cursor=0`.
