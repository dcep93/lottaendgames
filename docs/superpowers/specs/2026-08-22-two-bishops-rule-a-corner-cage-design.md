# Two Bishops Rule A Corner Cage Design

## Goal

Add this priority immediately after `mate in 8 ish`:

> **rule a** — With Black's king in the 2 corner edge squares, place the White king a knight's move from that corner. Then, place a bishop on the corner cage diagonal. Then, play a bishop waiting move if necessary, until mate in 2.

In the canonical lower-right orientation, Black's applicable squares are `h1` and `h2`, and the corner cage diagonal is `c8–h3`. Board rotations and reflections provide the equivalent `g1/h1` orientation and all other corners.

## Rule Stages

1. If White's king is not a knight's move from the associated corner, prefer king moves that establish that geometry.
2. Once the king is placed, prefer bishop moves that establish control of the cage diagonal.
3. Once both are established, prefer bishop waiting moves that preserve the king/cage geometry and reach a position with forced mate in two after Black's reply.

A bounded three-ply mate search determines mate in two. It requires a White continuation that answers every legal Black reply and checkmates on White's following move.

## Diagram

Show the canonical orientation with White's king on `f2`, a bishop on `e6`, the full `c8–h3` cage diagonal highlighted, and `h1/h2` marked pink as Black's applicable squares. The diagram represents all rotations and reflections.

## Verification

- Test rule order and rendered text.
- Test all three stages in the canonical orientation.
- Test rotations and reflections.
- Check the generated diagram.
- Run focused Two Bishops tests, the production build, and the fast loop verifier; load its witness at `cursor=0`.
