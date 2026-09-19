# Bishop-knight r8

The user approved the geometric r8 proposal on September 19, 2026. Insert it after r6 and before r9, preserving every earlier safety and support priority.

Evaluate the trigger before White moves: the bishop is central, edge-adjacent to Black's king, and diagonally adjacent to White's king; the knight is edge-adjacent to White's king and is not adjacent to the bishop. Prefer a king move whose resulting square is edge-adjacent to the bishop and adjacent to the knight. Edge adjacency means sharing a side; unqualified adjacency means a king step. All rotations and reflections use the same geometry. If the trigger is absent or no qualifying move survives earlier rules, this rule does not filter moves.

This selects Kf4 from White Kf3, Be4, Ng3 against Black Kd4. It changes how the king coordinates the minor pieces; it does not change support eligibility. The modal must describe exactly this rule.

Verify the selected move and rule attribution in every board symmetry, trigger boundaries, a triggered position without a qualifying legal move, and the continuation to support. Reuse the previous exhaustive census only where inputs and policy remain unchanged, recompute changed policies and newly reachable states, and analyze the resulting graph from every original root. Report exact remaining loop reachability and load a minimal representative of the largest remaining family.
