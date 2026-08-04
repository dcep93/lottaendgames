# Two Bishops White-King Target Corner

## Definition

The target corner is the corner on Black's current edge closest to White's king. If Black is already in a corner, that occupied corner remains the target.

The definition is derived only from the current/resulting board, ignores FEN counters and history, and is D4 symmetric.

## Rule integration

- `phase 2 wall` rejects a candidate wall whose edge square is the target corner.
- `sequester` measures every legal Black reply against the same target corner.
- A White king move may change which corner is proximate; therefore both rules calculate the target from each candidate move's resulting White king square.
- The help note says: “Target corner: The corner along Black's edge closest to White's king.”

## Required examples

- In `4B3/7k/5B2/8/5K2/8/8/8 w - - 0 1`, `h1` is the target and `Bf7` uniquely creates the valid `g8`/`h8` wall.
- In `8/6B1/8/3B4/5K2/8/7k/8 w - - 4 3`, `h1` is the target and `Bd4` must not satisfy `phase 2 wall` because it creates the `g1`/`h1` wall.

## Verification

Add semantic regressions for both examples and their D4 transforms. Update tests that encoded the superseded bishop-derived target. Run only focused Two Bishops rules, directly affected presentation, TypeScript, diagram consistency, diff checks, and the fail-fast Two Bishops loop search.
