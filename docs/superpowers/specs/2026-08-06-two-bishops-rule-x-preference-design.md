# Two Bishops Rule X Preference

## Goal

Make rule x prefer moving a bishop that Black's king currently attacks. In `8/3Bk3/8/3K4/5B2/8/8/8 w - - 16 9`, `Bh3` must survive later priorities and be uniquely ideal because it moves the attacked bishop as far as possible.

## Design

Keep rule x in its existing Phase 1 position between rules y and w. Replace its conditional tie behavior with a true preference:

- If no surviving candidate moves an attacked bishop, rule x is neutral.
- If one or more surviving candidates move an attacked bishop, discard every candidate that does not move an attacked bishop.
- Among the attacked-bishop moves, retain only those with the greatest diagonal travel length.

This interpretation matches the requested wording, `Phase 1: Prefer moving an attacked bishop as far as possible.` It avoids changing the priority or behavior of `unclutter bishops` in unrelated positions.

Rule-v fallback behavior remains unchanged: when a valid rule-v move survives earlier priorities, rules z through w are skipped as a group.

## Verification

Add a regression for the supplied position asserting that `Bh3` is the unique ideal move and that the current hint is rule x. Expand the direct rule-x ranking test to include a candidate that does not move the attacked bishop and prove that it loses to the longest attacked-bishop move. Run TypeScript, lint, diagram validation, and the Two Bishops tests. Then find and open a fresh Phase 1 loop on the dedicated worktree server, treating Phase 2 entry as termination.
