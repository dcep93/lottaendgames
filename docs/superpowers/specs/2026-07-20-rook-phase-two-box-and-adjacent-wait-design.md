# Rook phase-two box and adjacent-wait design

## Goal

Make the rendered Rook priorities literally describe the evaluator while
selecting these moves:

- `Ra6` from `8/5k2/7R/6K1/8/8/8/8 w - - 2 2`;
- `Kg5` from `8/7k/1R6/5K2/8/8/8/8 w - - 4 3`.

## White priorities

Replace the establish-box explanation with:

> **establish box** — Use the Rook to make a phase 2 box without placing the
> rook adjacent to the White king.

The corresponding comparator is binary. A candidate survives this priority
when its resulting position is phase 2 and its Rook is not adjacent to White's
King. Box side length is not a hidden tie-break. The earlier `pieces safe`
priority continues to reject an unsafe Rook.

Update the waiting explanation so its exception describes the starting
geometry:

> **waiting move** — If the kings are a knight's move apart, move the rook so
> that it is on the same side of Black's king as White's king, unless the rook
> starts adjacent to White's king.

When a phase-2 box exists and the kings are a knight's move apart, a quiet safe
Rook move qualifies as a waiting move if it preserves the established boundary
and either:

- the Rook started adjacent to White's King; or
- the resulting Rook is on White's side of Black's King along the Rook's
  movement axis.

The establish-box priority runs first, so waiting candidates that finish next
to White's King are rejected there. Among surviving waiting moves, the later
`rook farther` priority selects the most distant Rook. This makes `Ra6` the
first example's unique best move. In the second example, `Rg6` fails establish
box because it finishes adjacent to White's King; `Kg5` preserves phase 2 and
then wins at `king closer`.

## Verification

- Add focused move, reason, score, and D4 symmetry fixtures for both positions.
- Pin the exact human copy and prove that establish box no longer compares box
  size.
- Run the focused Rook tests, complete Mate suite, lint, and production build.
- Run the exhaustive identity-keyed Rook verifier. If it fails, report one
  shortest directly replayable loop or 50-move witness beginning at its failure
  boundary.
