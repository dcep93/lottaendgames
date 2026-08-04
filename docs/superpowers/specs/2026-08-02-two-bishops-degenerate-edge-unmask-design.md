# Two Bishops Degenerate Edge-Unmask Design

## Goal

Add a dedicated cross-phase Degenerate case that repairs the screened edge bishop with the equivalent of `Bd2`.

## Canonical Geometry

Using `h1` as the canonical corner:

- White's king is on `f2`, a knight's move from the corner.
- The repair bishop is on `e1`, behind White's king.
- Black's king is on one of `h1`, `h2`, `h3`, `h4`, or `g4`.
- White must play `e1-d2` when that move is legal.
- The other bishop may occupy any legal square and does not participate in matching the case.

Apply the same relationship under all four rotations and four reflections. Match only current-board geometry; ignore FEN counters and move history. The `h1`, `h2`, and `h3` variants are Phase 2, while the `h4` and `g4` variants intentionally activate in Phase 1.

The supplied FEN `8/8/8/8/8/5K2/2B4k/4B3 w - - 0 1` is the replay start. After `1.Kf2 Kh3`, it reaches the canonical Degenerate fixture `8/8/8/8/8/7k/2B2K2/4B3 w - - 2 2`.

## Rule Integration

- Add this matcher to the existing `degenerate` selector before its phase-specific dispatch without changing the visible rule text or adding another White priority.
- Keep the existing narrower edge-repair matcher unchanged.
- When the new pattern matches, `Bd2` is the unique Degenerate repair and the selector stops at `degenerate` as it does for other exact repairs.

## Diagram

Add `degenerate — unmask edge bishop` alongside the other Degenerate boards, using the move-2 fixture with an `e1-d2` arrow and a concise caption explaining that the bishop is freed from behind White's king.

## Verification

- Assert the canonical fixture uniquely selects `Bd2` for the `degenerate` reason.
- Cover all five permitted Black king squares and assert the intentional `2/2`, `2/2`, `2/2`, `1/2`, `1/2` phase labels.
- Transform the fixture through every D4 symmetry and assert the equivalent unique repair.
- Reject nearby Black king, White king, and screened-bishop geometry.
- Verify the generated diagram FEN, Phase 2 label, arrow, registration order, and rendered board count.
- Run focused Degenerate and diagram tests, the directly affected presentation test, targeted TypeScript, generated-file consistency, and diff hygiene.
- Run the small fail-fast gate and provide one verified localhost loop.

## Non-goals

- Do not generalize every masked bishop into a Degenerate repair.
- Do not alter Sequester, Unmask, phase classification, Black priorities, or other Degenerate families.
- Do not run the full mate suite, commit, push, or deploy.
