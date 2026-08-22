# Two Bishops Wall Existence Correction

## Goal

Make Rule O recognize a bishop wall from bishop geometry alone. White's king must affect only whether screening makes the wall escapable.

## Geometry

A wall consists of two controlled, adjacent, parallel diagonals. The diagonal nearer Black's corner must border Black's king. The second diagonal may sit one square beyond that immediate border; it need not independently touch a Black-king-adjacent square.

The corner area is measured from the nearer diagonal. A wall remains valid when White's king is inside that area. It is rejected only when White's king screens required control and Black can legally exploit the screened square.

For `8/4B3/8/8/8/5K2/8/3B2k1 w - - 0 1`, `Bh4` creates the adjacent `file-rank = 4` and `file-rank = 3` wall around the `h1` corner. Rule O should uniquely prefer `Bh4`.

## Scope and verification

- Update wall enumeration and the rendered wall note.
- Preserve Rule N and transformed wall behavior.
- Add a regression proving `Bh4` is the unique production-policy move.
- Run focused geometry and policy tests, rerun the uncached verifier, and load the next validated loop at `cursor=0`.
