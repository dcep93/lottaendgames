# Two Bishops Rule T Design

Add this Phase 1 priority immediately before Rule V:

> **rule t** — When the kings are a knight's move apart and a bishop controls the escape square, use a bishop to control the secondary squeeze diagonal.

For a knight-step king displacement, the signed two-square component supplies the forward axis and the signed one-square component supplies the side axis. The escape square is one more side-axis step beyond Black's king. The secondary squeeze diagonal passes through Black's king and has the combined forward/side vector as its normal.

Rule T applies when a bishop has a clear line to the escape square in the starting position. It scores the result by whether a bishop occupies the secondary squeeze diagonal. In the supplied position this makes g3 the escape square, e4-f3-g2-h1 the secondary diagonal, and `Be4+` uniquely ideal.

Render the exact supplied position, mark g3 distinctly, highlight the secondary diagonal, and arrow f5-e4. Verify the example, all rotations/reflections, Phase 1-only scope, priority order, generated diagram, presentation, lint, build, and a fresh strict Phase 1 loop.
