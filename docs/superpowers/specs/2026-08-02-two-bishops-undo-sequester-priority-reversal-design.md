# Two Bishops: Undo Sequester Priority Reversal

## Goal

Undo only the immediately preceding reversal of Sequester's two preferences.

## Policy

Restore Sequester's ordered comparisons to:

1. Ensure every legal Black reply remains on the edge.
2. Force Black's king toward the corner proximate to White's king.
3. Keep White's king closer to the square a knight's move from that corner.

Restore the matching rendered sentence. Keep `bishops off edge` immediately after Sequester and preserve every earlier policy change.

## Verification

Restore directly affected focused expectations. Run the focused Two Bishops tests, affected presentation tests, app TypeScript, diff hygiene, and the root-local fail-fast loop finder. Validate its replay in the localhost app. Do not run the full mate suite.

## Constraints

- Targeted undo only.
- Stateless and D4 symmetric.
- No commit, push, deploy, or full mate suite.
