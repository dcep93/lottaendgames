# Conditional Rule F priorities

## Goal

Make Rule F completely inactive unless at least one currently surviving White move keeps every legal Black king reply on the edge.

## Design

Keep the existing per-move scores and replace Rule F's combined comparator with three guarded subpriorities:

1. If any candidate keeps Black on the edge, eliminate candidates that do not.
2. Only after every survivor keeps Black on the edge, prefer replies nearer the wall's corner.
3. Under the same condition, prefer checks.

When no candidate keeps Black on the edge, every guard is false and Rule F leaves the candidate group unchanged. This adds no search and preserves the current ranking among qualifying moves.

## Verification

- A qualifying move beats a move that permits Black to leave the edge.
- Checks and corner direction break ties only among qualifying moves.
- Two nonqualifying moves remain tied under Rule F even when their corner and check scores differ.
- Run focused Rule F tests, build, lint, and validate a current loop before loading it at `cursor=0`.
