# Two Bishops Central Pieces Design

## Rule and order

Replace the existing `central king` priority with:

> **central pieces** — Prefer White's pieces in the middle 32 squares.

Keep the priority in its current position immediately after `prepare mate` and
before `edge flank`. The rule applies in both phases.

## Scoring

Retain the existing middle-32 geometry: the middle six-by-six board area with
the four corners of that area excluded.

Score the resulting position after each White candidate move. Count White's
king and both bishops equally, and minimize the number of those three pieces
outside the middle 32 squares. Candidates with the same count remain tied for
later priorities.

## Naming

Rename the score and square-set helper from king-specific terminology to
piece-neutral terminology. Update the exported helper, rule identifiers,
labels, rendered help, and tests consistently.

## Verification

- Pin the exact visible wording and unchanged priority position.
- Confirm the middle-32 square set is unchanged and symmetry invariant.
- Confirm moves by either the king or a bishop can improve the score.
- Confirm all three White pieces contribute equally in both phases.
- Run focused rules and presentation suites, lint, build, and diagram
  consistency checks.
- Find and open a strict Phase 1 loop, treating entry into Phase 2 as
  termination.
