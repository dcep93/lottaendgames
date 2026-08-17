# Two Bishops central king priority

## Goal

Add a new Two Bishops White priority immediately before Rule S:

> **central king** — Prefer White's king in the middle 32 squares.

## Geometry and scoring

The middle 32 squares are the middle 6×6 box, `b2:g7`, excluding the four corners of that box: `b2`, `b7`, `g2`, and `g7`.

Score White's king square after each candidate move. A resulting king on one of the 32 qualifying squares receives penalty zero; every other square receives penalty one. The comparison is binary: all qualifying squares tie, and all non-qualifying squares tie. Bishop moves retain White's current king square for this calculation.

The priority applies in both phases. It follows the mandatory mate, bishop-safety, and stalemate priorities and precedes Rule S, Rule T, the other geometric rules, and `king closer`.

## Presentation

Render the exact label and help text above in the priority guide. Do not add a diagram or note board.

## Tests

- Assert exact priority order, label, and copy.
- Enumerate every square in `b2:g7` and assert exactly 32 qualify.
- Assert `b2`, `b7`, `g2`, and `g7` do not qualify.
- Assert representative edge and corner squares outside the 6×6 box do not qualify.
- Assert the resulting White king is used for king moves and the unchanged king is used for bishop moves.
- Assert the priority applies in both phases and is rotation/reflection invariant.
- Assert presentation output includes `central king` immediately before Rule S.
- Run focused rule and presentation tests, diagram drift verification, lint, build, and `git diff --check`.
