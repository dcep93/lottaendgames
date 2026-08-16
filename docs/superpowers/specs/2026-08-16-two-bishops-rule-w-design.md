# Two Bishops Rule W Design

Add a Phase 1 `rule w` immediately before `king closer`:

> When the kings are a knight's move apart or two diagonal squares apart, use bishops to control the flank diagonals.

Rule W scores the resulting bishop placement. A bishop on each of the two calculated parallel flank diagonals is best. Knight-step king geometry identifies one unique pair. Two-diagonal-step geometry is mirror-symmetric, so both reflected pairs are candidates and the better-matched pair is scored.

The help diagram shows White's king on e3 and bishops on c2/c3, with no Black king. It marks a1-h8 and b1-h7 as the flank diagonals and fills g4/g5 pink as the applicable Black-king locations.

Verification covers the supplied `Bc3` and `Bb2` sequence, rotations/reflections, Phase 1 scope, diagram content, focused tests, lint, build, and a strict Phase 1 loop.
