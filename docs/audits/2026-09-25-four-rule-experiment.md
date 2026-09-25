# Four-rule experiment

Checkpoint before changes: `fbb453b` (same policy as `f48b7df`).

White priorities, in order:

1. Mate.
2. Pieces safe.
3. No stalemate.
4. r7: king centralization, then opposite bishop color.
5. r8: middle-16 king bishop/knight setup preferences.
6. r10: precage knight, otherwise drift toward king protection.
7. r20: piece distance from Black, then proximity to the center.

The user explicitly retained the first three unnumbered priorities. All other
numbered priorities, their help notes, and their diagrams are removed. The four
retained rule definitions and Black's move policy are unchanged. Underlying
geometry helpers remain independently tested.

Validation: 97 bishop-knight tests pass; focused checks for the final registration
and opposition-metric assertions pass; production build passes.

The full loop audit was stopped at the user's request. There is no new complete
loop count for this experiment. The preceding 41 four-ply loops / 71 D4-distinct
loop positions belong to the checkpoint policy and must not be reported as the
current count. The partial audit directory is marked incomplete.
