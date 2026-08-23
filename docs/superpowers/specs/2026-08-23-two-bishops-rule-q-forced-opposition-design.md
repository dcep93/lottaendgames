# Two Bishops Rule Q: Forced Opposition

## Goal

Add Rule Q immediately after Rule P:

> **rule q** — With the king a knight's move from the corner, force opposition.

Rule Q recognizes bishop moves that force Black's reply to place the two kings in opposition. In the supplied position, `Bf3` qualifies because Black's only legal reply is `Kh2`, leaving the White king on `f2` and Black king on `h2` in opposition.

## Geometry and selection

- “The king” means White's king.
- The starting White king must be a knight's move from at least one board corner.
- Only legal White bishop moves qualify.
- The resulting position must give Black at least one legal reply.
- Every legal Black reply must leave the kings exactly two orthogonal squares apart: same file with rank distance two, or same rank with file distance two.
- All qualifying bishop moves tie as correct at Rule Q. Rule Q is decisive once it has qualifying moves, so later priorities do not discard a valid forced-opposition move.
- The predicate is coordinate-derived and therefore supports rotations and reflections without special cases.

## Integration

Add Rule Q's applicability and penalty fields to the Two Bishops White score, neutral score, catalog, and active priority list. Its catalog entry and rendered training text appear immediately after Rule P.

## Verification

- Assert that `Bf3` qualifies in `8/8/8/6BB/8/7k/5K2/8 w - - 0 1`.
- Assert that every selected move is a bishop move and forces every legal Black reply into king opposition.
- Repeat the supplied-position assertion under all eight rotations/reflections.
- Run the focused Two Bishops policy tests, build, and lint.
- Find, validate move-by-move, and load the next structural loop at `cursor=0` with a clickable link.
