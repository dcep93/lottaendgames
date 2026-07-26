# Rook box and waiting-move design

## Goal

Keep the Rook checkmate lesson terse while making every displayed rule describe the move evaluator exactly.

## Visible rules

- **rook box** — Create, keep and shrink a box around Black.
- **waiting move** — Move the rook, keeping any existing box, as far from Black’s king as possible, but necessarily closer to White’s king than Black’s.

“As far as possible” means the Rook's resulting king-move distance from Black's king, not the number of squares the Rook travels.

## Waiting-move geometry

A waiting move is preferred when the kings are a knight's move apart. It must:

1. Move the Rook without capturing or checking.
2. Leave the Rook safe.
3. Preserve the current box and its strongest wall when a box already exists.
4. End with the Rook strictly closer to White's king than Black's king.
5. Among moves satisfying those conditions, maximize the Rook's distance from Black's king.

The rule is position-only. It does not inspect move history or a move counter. The existing internal convergence proof remains an invisible safety check, not a lesson shown to the user.

## Verification

- Assert the exact visible wording.
- Cover the closer-to-White geometry and maximum-distance-from-Black tie-break directly.
- Re-run the Rook rule fixtures.
- Rebuild the exhaustive symmetry-reduced Rook policy and require every legal state to retain a finite mate rank, ruling out repetition and fifty-move draws under every Black response.
