# Two Bishops Rule Y: Single Bishop Control

## Goal

Make rule y implement the singular wording already shown in the guide:

> Phase 1: Use a bishop to control the two squares adjacent to Black's king and also the target square.

The rendered text must not change.

## Design

Score each resulting White bishop independently. A bishop is eligible only when it controls at least one Phase 1 target square. Its score is the number of squares adjacent to Black's king that the same bishop controls, capped at two. Rule y uses the greatest eligible-bishop score; if neither bishop controls a target square, the score is zero.

This replaces the current union calculation, which lets one bishop control the target and the other bishop supply Black-adjacent control. The target square continues to count among Black-adjacent controlled squares when it is adjacent to Black's king, preserving existing geometry and score range.

Do not change rule order, guide text, target-square selection, rule-v fallback, or later rules.

## Verification

Add a regression where the two bishops collectively satisfy the old union calculation but neither single bishop satisfies the full rule-y condition. Preserve positive coverage where one bishop supplies the target and both adjacent controls, including D4 symmetry. Update the independent pipeline only if its expected scores change. Run the focused Two Bishops and presentation tests, TypeScript, lint, and diagram validation. Finally, find and open a directly playable Phase 1 loop, treating Phase 2 entry as termination.
