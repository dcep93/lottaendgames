# Two Bishops Three-Rule Reset

## Goal

Reset two-bishops training to one Phase 1 policy with a fixed Training Wheels position and four White move preferences.

## Training position

Training Wheels starts from `k7/8/8/8/8/8/B7/B6K w - - 0 1`: Black king on a8, White bishops on a2 and a1, and White king on h1.

Every nonterminal position is Phase 1. Phase 2 and its special flows are removed from the active policy and training notes.

## White rule order

1. **rule g** — Prefer a bishop to control a corner-to-corner diagonal. Prefer the bishop itself off the corner.
2. **rule j** — Without checking, control a diagonal adjacent to an already controlled corner diagonal when the pair encloses Black's king.
3. **rule q** — Prefer White's king strictly inside the inner bishop diagonal, on Black's enclosed side.
4. **rule r** — Prefer smaller squared Euclidean distance between the kings.

Normal legality and checkmate handling remain authoritative. No other White tie-breakers participate.

## Geometry

A corner diagonal is `a1–h8` or `a8–h1`. A bishop controls one when it lies on it and the line is not interrupted by another piece.

An adjacent diagonal is the immediately neighboring parallel diagonal. Rule J applies only when the existing corner diagonal and candidate adjacent diagonal put Black's king on the corner side of the pair, and the White move is not check.

The bishop on that adjacent diagonal is the inner bishop. Rule Q is satisfied when White's king is beyond the inner diagonal on the same enclosed side as Black's king.

## Verification

- Assert the exact Training Wheels FEN and Phase 1 label.
- Assert the visible White rule list is exactly G, J, R in that order.
- Test G's corner-diagonal and non-corner preference.
- Test J's adjacency, enclosure, and no-check requirements.
- Test Q against the `a8–h1` outer and `b8–h2` inner diagonals.
- Test R with squared Euclidean king distance.
- Run focused tests, build, lint, and the loop verifier; load the next unresolved loop at cursor 0.
