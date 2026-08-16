# Two Bishops Rule V Design

Add this Phase 1 priority immediately before Rule W:

> **rule v** — When the kings are in opposition and a bishop can control the secondary squeeze diagonal in one move, control the primary squeeze diagonal.

Direct opposition means that the kings share a rank or file with one square between them. The unit vector from White's king toward Black's king supplies the forward axis. The perpendicular unit vector pointing from their shared rank or file toward the board center supplies the inward axis. Relative to White's king, the secondary squeeze diagonal contains squares whose projection onto the sum of those axes is two; the parallel primary squeeze diagonal has projection three.

Rule V applies only when a bishop has a legal move onto the secondary diagonal. It scores the resulting position by whether a bishop occupies the primary diagonal. In the supplied position this makes f4-g3-h2 primary, e4-f3-g2-h1 secondary, and `Bf4` uniquely ideal.

Render the exact supplied position with distinct highlights for the two squeeze diagonals and an arrow from d2 to f4. Verify the example, all rotations/reflections, Phase 1-only scope, rule order, generated diagram, presentation, lint, build, and a fresh strict Phase 1 loop.
