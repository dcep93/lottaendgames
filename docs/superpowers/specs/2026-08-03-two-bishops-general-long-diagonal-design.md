# Two Bishops General Long Diagonal

## Goal

Generalize the Phase 2 long-diagonal degenerate repair so it depends only on the
White king, the moving bishop, Black's edge file, and legal non-edge targets.

## Design

In the canonical orientation, the repair applies when the position is Phase 2,
White's king is on f3, a White bishop is on f2, and Black's king is anywhere on
the h-file. The second bishop may be anywhere.

Recommend every legal target among e3, d4, c5, and b6. These squares remain on
the bishop's g1–a7 diagonal and exclude both edge endpoints. If a target is
blocked or otherwise illegal, retain the remaining legal targets. Apply the
same geometry under every D4 rotation and reflection.

## Verification

Cover the supplied loop position, every legal h-file king placement, arbitrary
second-bishop placement, blocked targets, D4 symmetry, and rejection outside
Phase 2. Run focused Two Bishops rules, presentation, TypeScript, diagrams,
diff, and fail-fast loop checks only.

