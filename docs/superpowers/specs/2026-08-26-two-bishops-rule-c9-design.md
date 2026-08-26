# Two Bishops Rule c9 Design

## Goal

Add rule c9 between rules c08.5 and c10:

> With Black ahead 1 on track and no control of retreat or double retreat squares, control the flank square.

## Geometry

- Reuse the existing rotation/reflection-safe `blackIsOneAheadOfTrack` test.
- The retreat and double-retreat squares come from the existing cage helpers and are evaluated in the starting position.
- A flank square is adjacent to Black's king and a knight's move from White's king.
- A candidate succeeds when a resulting bishop has a clear diagonal line to a flank square.

For `6B1/6B1/8/8/5K2/7k/8/8 w - - 0 1`, the flank square is `g2`; `Bd5` controls it and is the unique rule-c9 move.

## Verification

Add focused applicability and selection assertions for `Bd5`, run the focused policy tests, and replay the next structural loop before loading it at cursor 0.
