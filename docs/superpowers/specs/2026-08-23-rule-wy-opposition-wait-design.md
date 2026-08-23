# Rule WY Opposition Waiting Move

## Rule

**rule wy** — With the Black king on edge opposition with a bishop that is a knight's move from the corner and also in a bishop wall, play a bishop waiting move to the other square in opposition with Black.

Rule WY is evaluated immediately before Rule W.

## Geometry

A Rule WY starting wall qualifies when Black is on an edge and one of that wall's bishops is in opposition with Black with one square between them and is a knight's move from the wall's corner.

A preferred move:

- moves that qualifying bishop to a different square in opposition with Black;
- gives no check and produces neither mate nor stalemate;
- preserves a bishop wall with the same corner, using the moved bishop.

The implementation derives all squares from board geometry, so rotations and reflections work without separate patterns. For `8/8/8/8/8/5K2/4BB1k/8 w - - 0 1`, `f2` is opposed to `h2` and a knight's move from `h1`; `Bh4` is the other opposition waiting move.

## Verification

- Prove `Bh4` is uniquely selected in the supplied position.
- Test rotations and reflections.
- Reject near misses without edge opposition, a matching wall corner, or a preserved wall.
- Run focused tests, diagram validation, build, and the fast loop verifier.
- Replay and load a verifier-produced loop at `cursor=0`.
