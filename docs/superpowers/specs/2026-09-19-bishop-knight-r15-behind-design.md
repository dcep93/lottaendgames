# R15: knight behind White's king

The user replaced r15's knight-adjacency preference with knight proximity behind White's king, then clarified that the metric is Euclidean distance to the c-file in the example with White Kd4 and Black Kg4. There is no king-adjacency constraint on the destination.

Use the existing directional meaning of “behind”: a board square is behind White's king when the displacement from White to that square has a strictly negative dot product with the displacement from White to Black. Minimize the knight's Euclidean distance to the nearest such square after White moves. In the example the region is files a–c, so Ng1 scores 4 and Ne2 scores 2. Any knight already behind scores zero; an empty region scores 99. This definition respects all eight board symmetries and does not depend on occupancy.

Keep the preference in r15 and preserve its three subsequent tie-breaks. Do not silently move it ahead of r10: a question about doing so remains pending. In the current rule order r10 rejects immediate Ne2 because precage distance increases; the new r15 selects Be4, followed by Ne2+ and Nf4 into support.

Validation covers the entire region rather than adjacent squares, all board symmetries, Euclidean rather than knight-move distance, recomputation after king moves, already-behind positions, and an empty behind region. Existing tail-score tests isolate the unchanged tie-breaks. Probe results in `_codex_output/bn-r15-behind` test one deterministic continuation from each prior family and must not be reported as a new exhaustive census.
