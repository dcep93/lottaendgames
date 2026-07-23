# Mate finish guarantee

## Goal

Improve the human learnability of the Rook and Two Bishops training guides
without weakening their exhaustive no-loop and fifty-move guarantees.

The exact proof filter is not a chess technique a learner can calculate from
the board. It must remain visible for honesty, but it must stop masquerading as
the recommended strategy.

## Considered approaches

### 1. Separate the proof guard from the teaching priorities

Keep the position-only proof filter as the first non-universal evaluator stage,
rename it `finish guarantee`, and mark it as a guard. Present it separately from
the strategy priorities. When the proof guard alone determines the correct
move, derive the current hint from a human priority that positively describes
the recommended move. If a played move fails the guard, its failure reason
remains `finish guarantee`.

This is the selected approach. It preserves exact explanations while ensuring
that successful play is taught with board-visible ideas.

### 2. Reword `no backtracking`

A friendlier label such as `keep progress` would be cheaper, but the rule would
still look like a technique the learner is expected to calculate. The
pedagogical defect would remain.

### 3. Remove the proof filter

The previous geometry-only Rook policy contained exhaustive loops. Removing
the filter would make the guide more superficially human but would violate the
completion requirement.

## Presentation

For Rook and Two Bishops, the modal shows:

1. the three universal priorities;
2. a visually separate `finish guarantee` callout;
3. the ordered human strategy priorities.

The guard copy is:

> **finish guarantee** — The app rejects moves that can loop or reach the
> fifty-move draw. This guarantees the exercise finishes; it is not a technique
> to calculate or memorize.

The human priorities retain their evaluator order after the guard.

## Hint and reason behavior

- An incorrect move eliminated by the guard is labeled `finish guarantee`.
  This is the exact reason it was rejected.
- A correct move and the live reason hint do not use the guard as their teaching
  label.
- When the guard was the last decisive evaluator stage, the app finds the
  human priority that most consistently favors the actual recommended moves
  over the rejected alternatives. Evaluator order breaks attribution ties.
- If no human priority truthfully favors the recommended moves, the app shows
  no live hint instead of inventing one.
- The attribution changes presentation only. It never changes correctness,
  ideal moves, move ordering, or Black resistance.

## Architecture

Add a `guard` presentation role to ordered rules and registered rule
descriptions. The generic registration layer:

- preserves guard metadata in immutable snapshots;
- keeps normal selection and incorrect-move explanations unchanged;
- substitutes a positive non-guard teaching hint only for ideal moves and the
  live hint;
- exposes guard descriptions so a clicked failure reason still highlights the
  exact modal callout.

The modal groups guard descriptions separately rather than relying on a
mate-specific rule ID.

## Verification

- Unit-test guard snapshotting, selection invariance, failure explanations, and
  positive teaching-hint attribution.
- Update Rook and Two Bishops fixtures so live and correct-move reasons use
  human techniques while proof failures use `finish guarantee`.
- Confirm the modal separates the guard from the strategy list and still
  highlights it from a reason button.
- Re-run the exhaustive Rook and Two Bishops certificates, the complete Mate
  suite, lint, build, and `git diff --check`.
